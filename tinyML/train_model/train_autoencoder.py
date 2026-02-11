#!/usr/bin/env python3
"""
train_autoencoder.py — Train a Conv1D autoencoder on baseline cold storage data.

The autoencoder learns to reconstruct "normal" sensor patterns. At inference
time on the ESP32-S3, high reconstruction error indicates an anomaly (door
opening, compressor fault, temperature excursion).

Usage:
    python train_autoencoder.py --data baseline_data.csv --output trained_model/

The CSV should have columns: timestamp_ms, accel_x, accel_y, accel_z, temperature
(as produced by DataCollector.ino)
"""

import argparse
import json
import os

import numpy as np
import pandas as pd
import tensorflow as tf


WINDOW_SIZE = 50       # 50 samples = 5 seconds at 10Hz
NUM_CHANNELS = 4       # accel_x, accel_y, accel_z, temperature
OVERLAP_RATIO = 0.5    # 50% overlap between windows
STRIDE = int(WINDOW_SIZE * (1 - OVERLAP_RATIO))


def load_and_preprocess(csv_path: str):
    """Load CSV data and create normalized sliding windows."""
    df = pd.read_csv(csv_path)

    # Extract sensor columns
    cols = ["accel_x", "accel_y", "accel_z", "temperature"]
    for c in cols:
        if c not in df.columns:
            raise ValueError(f"Missing column '{c}' in CSV. Expected: {cols}")

    data = df[cols].values.astype(np.float32)
    print(f"Loaded {len(data)} samples from {csv_path}")

    # Remove any NaN rows
    mask = ~np.isnan(data).any(axis=1)
    data = data[mask]
    print(f"After NaN removal: {len(data)} samples")

    # Compute normalization parameters (per-channel min/max)
    ch_min = data.min(axis=0)
    ch_max = data.max(axis=0)
    print(f"Channel min: {ch_min}")
    print(f"Channel max: {ch_max}")

    # Normalize to [0, 1]
    data_norm = (data - ch_min) / (ch_max - ch_min + 1e-8)

    # Create sliding windows
    windows = []
    for i in range(0, len(data_norm) - WINDOW_SIZE + 1, STRIDE):
        windows.append(data_norm[i : i + WINDOW_SIZE])

    X = np.array(windows, dtype=np.float32)
    print(f"Created {len(X)} windows of shape {X.shape[1:]}")

    norm_params = {
        "ch_min": ch_min.tolist(),
        "ch_max": ch_max.tolist(),
    }
    return X, norm_params


def build_autoencoder(input_shape=(WINDOW_SIZE, NUM_CHANNELS)):
    """
    Build a small Conv1D autoencoder suitable for INT8 quantization
    and deployment on ESP32-S3 via TFLite Micro.

    Architecture (inspired by MCUNet design principles):
    - Small filter counts (8, 4) to minimize memory
    - 3x1 convolutions for temporal pattern extraction
    - Symmetric encoder/decoder
    - Total params: ~500-1000 (model size ~5-15KB quantized)
    """
    inputs = tf.keras.layers.Input(shape=input_shape)

    # Encoder
    x = tf.keras.layers.Conv1D(8, 3, activation="relu", padding="same")(inputs)
    x = tf.keras.layers.MaxPooling1D(2)(x)  # 50 -> 25
    x = tf.keras.layers.Conv1D(4, 3, activation="relu", padding="same")(x)
    encoded = tf.keras.layers.MaxPooling1D(2)(x)  # 25 -> 12 (bottleneck)

    # Decoder
    x = tf.keras.layers.Conv1D(4, 3, activation="relu", padding="same")(encoded)
    x = tf.keras.layers.UpSampling1D(2)(x)  # 12 -> 24
    x = tf.keras.layers.Conv1D(8, 3, activation="relu", padding="same")(x)
    x = tf.keras.layers.UpSampling1D(2)(x)  # 24 -> 48
    x = tf.keras.layers.Conv1D(NUM_CHANNELS, 1, activation="sigmoid")(x)

    # Pad back to original size: 48 -> 50 (zero-pad 2 timesteps at the end)
    x = tf.keras.layers.ZeroPadding1D(padding=(0, WINDOW_SIZE - 48))(x)

    autoencoder = tf.keras.Model(inputs, x, name="cold_storage_autoencoder")
    return autoencoder


def compute_threshold(model, X, sigma=3.0):
    """
    Compute anomaly threshold as mean + sigma * std of reconstruction error
    on the training (baseline) data.
    """
    reconstructions = model.predict(X, batch_size=64, verbose=0)
    # Per-window MSE
    mse_per_window = np.mean((X - reconstructions) ** 2, axis=(1, 2))
    mean_mse = np.mean(mse_per_window)
    std_mse = np.std(mse_per_window)
    threshold = mean_mse + sigma * std_mse

    print(f"\nReconstruction error stats (baseline):")
    print(f"  Mean MSE:  {mean_mse:.6f}")
    print(f"  Std MSE:   {std_mse:.6f}")
    print(f"  Threshold ({sigma}-sigma): {threshold:.6f}")
    print(f"  Max MSE:   {np.max(mse_per_window):.6f}")

    return float(threshold), float(mean_mse), float(std_mse)


def main():
    parser = argparse.ArgumentParser(description="Train cold storage autoencoder")
    parser.add_argument("--data", type=str, required=True,
                        help="Path to baseline CSV (from DataCollector.ino)")
    parser.add_argument("--output", type=str, default="trained_model",
                        help="Output directory for model and params")
    parser.add_argument("--epochs", type=int, default=100,
                        help="Training epochs")
    parser.add_argument("--batch-size", type=int, default=32,
                        help="Batch size")
    parser.add_argument("--sigma", type=float, default=3.0,
                        help="Sigma multiplier for anomaly threshold")
    args = parser.parse_args()

    os.makedirs(args.output, exist_ok=True)

    # Load and preprocess
    X, norm_params = load_and_preprocess(args.data)

    # Build model
    model = build_autoencoder()
    model.summary()
    model.compile(optimizer="adam", loss="mse")

    # Train
    print(f"\nTraining for {args.epochs} epochs...")
    history = model.fit(
        X, X,
        epochs=args.epochs,
        batch_size=args.batch_size,
        validation_split=0.1,
        callbacks=[
            tf.keras.callbacks.EarlyStopping(
                monitor="val_loss", patience=10, restore_best_weights=True
            ),
            tf.keras.callbacks.ReduceLROnPlateau(
                monitor="val_loss", factor=0.5, patience=5, min_lr=1e-6
            ),
        ],
        verbose=1,
    )

    # Compute anomaly threshold
    threshold, mean_mse, std_mse = compute_threshold(model, X, sigma=args.sigma)

    # Save Keras model
    keras_path = os.path.join(args.output, "autoencoder.keras")
    model.save(keras_path)
    print(f"Keras model saved to {keras_path}")

    # Save normalization params and threshold
    deploy_params = {
        "window_size": WINDOW_SIZE,
        "num_channels": NUM_CHANNELS,
        "norm": norm_params,
        "anomaly_threshold": threshold,
        "baseline_mean_mse": mean_mse,
        "baseline_std_mse": std_mse,
        "sigma": args.sigma,
    }
    params_path = os.path.join(args.output, "deploy_params.json")
    with open(params_path, "w") as f:
        json.dump(deploy_params, f, indent=2)
    print(f"Deploy params saved to {params_path}")

    # Save training history
    hist_path = os.path.join(args.output, "history.json")
    with open(hist_path, "w") as f:
        json.dump({k: [float(v) for v in vals] for k, vals in history.history.items()}, f)
    print(f"Training history saved to {hist_path}")

    print("\nNext step: run convert_to_tflite.py to quantize and generate C header")


if __name__ == "__main__":
    main()
