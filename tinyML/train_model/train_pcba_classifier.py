#!/usr/bin/env python3
"""
train_pcba_classifier.py — Train a small MLP to classify PCBA cold chain sensor
feature vectors into 9 Kernel operational states.

Architecture: Input(14) -> Dense(32, ReLU) -> Dense(16, ReLU) -> Dense(9, softmax)
~1,145 parameters total (~3-5KB quantized)

Usage:
    python train_pcba_classifier.py --data pcba_kernel_model/pcba_training_data.csv
"""

import argparse
import json
import os
import sys

import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import classification_report, confusion_matrix

KERNEL_STATES = [
    "STABLE", "DOOR_OPEN", "RECOVERING", "DEFROST",
    "DRIFT_WARM", "DRIFT_COLD", "EXCURSION", "COMP_STRESS", "FAULT"
]

PCBA_FEATURE_NAMES = [
    "temp_mean", "temp_delta", "temp_rate", "temp_volatility",
    "vib_rms", "vib_rms_delta", "vib_dom_freq", "vib_spectral_stability",
    "vib_spectral_entropy", "vib_duty_cycle",
    "door_angle_norm", "door_open_duration",
    "cooling_efficiency_proxy", "temp_rate_vs_vib"
]

CRITICAL_STATES = ["EXCURSION", "COMP_STRESS", "FAULT"]


def build_model(n_features=14, n_classes=9):
    """Build the MLP classifier."""
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(n_features,)),
        tf.keras.layers.Dense(32, activation="relu", name="dense_1"),
        tf.keras.layers.Dense(16, activation="relu", name="dense_2"),
        tf.keras.layers.Dense(n_classes, activation="softmax", name="output"),
    ])
    return model


def main():
    parser = argparse.ArgumentParser(description="Train PCBA Kernel MLP classifier")
    parser.add_argument(
        "--data", type=str,
        default="pcba_kernel_model/pcba_training_data.csv",
        help="Path to training CSV"
    )
    parser.add_argument(
        "--output", type=str,
        default="pcba_kernel_model",
        help="Output directory"
    )
    parser.add_argument("--epochs", type=int, default=200, help="Max epochs")
    parser.add_argument("--batch-size", type=int, default=64, help="Batch size")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    tf.random.set_seed(args.seed)
    np.random.seed(args.seed)
    os.makedirs(args.output, exist_ok=True)

    # Load data
    df = pd.read_csv(args.data)
    X = df[PCBA_FEATURE_NAMES].values.astype(np.float32)
    labels = df["label"].values

    # Encode labels to integers
    label_to_idx = {s: i for i, s in enumerate(KERNEL_STATES)}
    y = np.array([label_to_idx[l] for l in labels], dtype=np.int32)

    # Compute normalization parameters (min-max)
    feature_min = X.min(axis=0)
    feature_max = X.max(axis=0)

    # Normalize
    X_norm = (X - feature_min) / (feature_max - feature_min + 1e-8)

    # Stratified split: 70/15/15
    X_train, X_temp, y_train, y_temp = train_test_split(
        X_norm, y, test_size=0.3, stratify=y, random_state=args.seed
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.5, stratify=y_temp, random_state=args.seed
    )

    print(f"Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")

    # Compute class weights
    cw = compute_class_weight("balanced", classes=np.arange(len(KERNEL_STATES)), y=y_train)
    class_weight = {i: w for i, w in enumerate(cw)}
    print(f"Class weights: {class_weight}")

    # Build model
    model = build_model(n_features=len(PCBA_FEATURE_NAMES), n_classes=len(KERNEL_STATES))
    model.summary()

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    # Callbacks
    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss", patience=15, restore_best_weights=True
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.5, patience=7, min_lr=1e-6
        ),
    ]

    # Train
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=args.epochs,
        batch_size=args.batch_size,
        class_weight=class_weight,
        callbacks=callbacks,
        verbose=1,
    )

    # Evaluate on test set
    test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
    print(f"\nTest accuracy: {test_acc:.4f}")
    print(f"Test loss: {test_loss:.4f}")

    # Predictions
    y_pred = model.predict(X_test, verbose=0).argmax(axis=1)
    report = classification_report(
        y_test, y_pred, target_names=KERNEL_STATES, output_dict=True
    )
    cm = confusion_matrix(y_test, y_pred)

    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=KERNEL_STATES))

    # Check critical class recall (threshold: 0.85 for PCBA pipeline)
    critical_ok = True
    for state in CRITICAL_STATES:
        idx = label_to_idx[state]
        recall = report[state]["recall"]
        status = "PASS" if recall >= 0.85 else "FAIL"
        print(f"  {state} recall: {recall:.3f} [{status}]")
        if recall < 0.85:
            critical_ok = False

    if not critical_ok:
        print("\nERROR: Critical class recall thresholds not met. Aborting model export.")
        sys.exit(1)

    # Save model
    keras_path = os.path.join(args.output, "pcba_classifier.keras")
    model.save(keras_path)
    print(f"\nModel saved to {keras_path}")

    # Save deploy params (normalization + class names)
    deploy_params = {
        "feature_names": PCBA_FEATURE_NAMES,
        "class_names": KERNEL_STATES,
        "n_features": len(PCBA_FEATURE_NAMES),
        "n_classes": len(KERNEL_STATES),
        "feature_min": feature_min.tolist(),
        "feature_max": feature_max.tolist(),
    }
    params_path = os.path.join(args.output, "pcba_deploy_params.json")
    with open(params_path, "w") as f:
        json.dump(deploy_params, f, indent=2)
    print(f"Deploy params saved to {params_path}")

    # Save training history
    hist = {k: [float(v) for v in vals] for k, vals in history.history.items()}
    hist_path = os.path.join(args.output, "pcba_history.json")
    with open(hist_path, "w") as f:
        json.dump(hist, f, indent=2)

    # Save evaluation
    eval_data = {
        "test_accuracy": float(test_acc),
        "test_loss": float(test_loss),
        "classification_report": report,
        "confusion_matrix": cm.tolist(),
        "critical_class_recall_check": {
            state: {
                "recall": float(report[state]["recall"]),
                "passed": report[state]["recall"] >= 0.85
            }
            for state in CRITICAL_STATES
        },
        "all_critical_passed": critical_ok,
    }
    eval_path = os.path.join(args.output, "pcba_evaluation.json")
    with open(eval_path, "w") as f:
        json.dump(eval_data, f, indent=2)
    print(f"Evaluation saved to {eval_path}")

    print(f"\nTotal parameters: {model.count_params()}")


if __name__ == "__main__":
    main()
