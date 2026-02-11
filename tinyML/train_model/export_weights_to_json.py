#!/usr/bin/env python3
"""
export_weights_to_json.py — Export trained Kernel MLP weights to JSON
for JavaScript inference in the server simulator.

Extracts kernel/bias from each Dense layer, includes normalization params
and class names, and validates that JSON-style inference matches Keras predictions.

Usage:
    python export_weights_to_json.py --model kernel_model/kernel_classifier.keras
"""

import argparse
import json
import os

import numpy as np
import pandas as pd
import tensorflow as tf

KERNEL_STATES = [
    "STABLE", "DOOR_OPEN", "RECOVERING", "DEFROST",
    "DRIFT_WARM", "DRIFT_COLD", "EXCURSION", "COMP_STRESS", "FAULT"
]

FEATURE_NAMES = [
    "temp_mean", "temp_delta", "temp_rate", "temp_volatility", "temp_ambient_gap",
    "power_mean", "power_delta", "freq_mean", "freq_stability", "cop_mean",
    "cop_trend", "temp_rate_vs_power", "recovery_efficiency", "door_state", "door_duration"
]


def relu(x):
    return np.maximum(0, x)


def softmax(x):
    e = np.exp(x - np.max(x))
    return e / e.sum()


def js_style_inference(features, weights):
    """Simulate the JS forward pass: normalize → Dense(32,ReLU) → Dense(16,ReLU) → Dense(9,softmax)"""
    fmin = np.array(weights["feature_min"])
    fmax = np.array(weights["feature_max"])
    x = (features - fmin) / (fmax - fmin + 1e-8)

    # Layer 1: Dense(32, ReLU)
    w1 = np.array(weights["layers"][0]["weights"])
    b1 = np.array(weights["layers"][0]["bias"])
    x = relu(x @ w1 + b1)

    # Layer 2: Dense(16, ReLU)
    w2 = np.array(weights["layers"][1]["weights"])
    b2 = np.array(weights["layers"][1]["bias"])
    x = relu(x @ w2 + b2)

    # Layer 3: Dense(9, softmax)
    w3 = np.array(weights["layers"][2]["weights"])
    b3 = np.array(weights["layers"][2]["bias"])
    x = softmax(x @ w3 + b3)

    return x


def main():
    parser = argparse.ArgumentParser(description="Export Kernel MLP weights to JSON")
    parser.add_argument(
        "--model", type=str,
        default="kernel_model/kernel_classifier.keras",
        help="Path to trained Keras model"
    )
    parser.add_argument(
        "--params", type=str,
        default="kernel_model/kernel_deploy_params.json",
        help="Path to deploy params JSON"
    )
    parser.add_argument(
        "--data", type=str,
        default="kernel_model/kernel_training_data.csv",
        help="Path to training data for validation"
    )
    parser.add_argument(
        "--output", type=str,
        default="kernel_model/kernel_weights.json",
        help="Output JSON weights file"
    )
    parser.add_argument(
        "--server-output", type=str,
        default="kernel/mlp_weights.json",
        help="Copy output to server directory"
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    # Load model
    model = tf.keras.models.load_model(args.model)
    model.summary()

    # Load deploy params
    with open(args.params) as f:
        deploy_params = json.load(f)

    # Extract weights from each Dense layer
    layers_data = []
    for layer in model.layers:
        weights = layer.get_weights()
        if len(weights) == 2:  # Has kernel + bias
            w, b = weights
            layers_data.append({
                "name": layer.name,
                "weights": w.tolist(),
                "bias": b.tolist(),
                "input_shape": w.shape[0],
                "output_shape": w.shape[1],
            })
            print(f"  {layer.name}: weights={w.shape}, bias={b.shape}")

    # Build export JSON
    export = {
        "feature_names": FEATURE_NAMES,
        "class_names": KERNEL_STATES,
        "n_features": len(FEATURE_NAMES),
        "n_classes": len(KERNEL_STATES),
        "feature_min": deploy_params["feature_min"],
        "feature_max": deploy_params["feature_max"],
        "layers": layers_data,
    }

    # Save weights JSON
    os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
    with open(args.output, "w") as f:
        json.dump(export, f)
    size_kb = os.path.getsize(args.output) / 1024
    print(f"\nWeights saved to {args.output} ({size_kb:.1f} KB)")

    # Copy to server directory
    os.makedirs(os.path.dirname(args.server_output) or ".", exist_ok=True)
    with open(args.server_output, "w") as f:
        json.dump(export, f)
    print(f"Copied to {args.server_output}")

    # Validate: JS-style inference vs Keras predictions
    print("\nValidating JSON inference against Keras predictions...")
    df = pd.read_csv(args.data)
    rng = np.random.default_rng(args.seed)
    test_indices = rng.choice(len(df), size=min(100, len(df)), replace=False)
    test_X = df[FEATURE_NAMES].values[test_indices].astype(np.float32)

    fmin = np.array(deploy_params["feature_min"])
    fmax = np.array(deploy_params["feature_max"])
    X_norm = (test_X - fmin) / (fmax - fmin + 1e-8)

    keras_preds = model.predict(X_norm, verbose=0)
    matches = 0
    max_diff = 0.0

    for i in range(len(test_X)):
        js_pred = js_style_inference(test_X[i], export)
        keras_pred = keras_preds[i]

        if np.argmax(js_pred) == np.argmax(keras_pred):
            matches += 1
        diff = np.max(np.abs(js_pred - keras_pred))
        max_diff = max(max_diff, diff)

    match_rate = matches / len(test_X) * 100
    print(f"  Prediction match rate: {match_rate:.1f}% ({matches}/{len(test_X)})")
    print(f"  Max probability difference: {max_diff:.6f}")

    if match_rate >= 98:
        print("  PASS: JSON inference matches Keras")
    else:
        print("  WARNING: Inference mismatch detected")


if __name__ == "__main__":
    main()
