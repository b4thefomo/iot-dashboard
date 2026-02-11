"""Tests for generate_kernel_training_data.py"""

import os
import subprocess
import sys

import numpy as np
import pandas as pd
import pytest

KERNEL_STATES = [
    "STABLE", "DOOR_OPEN", "RECOVERING", "DEFROST",
    "DRIFT_WARM", "DRIFT_COLD", "EXCURSION", "COMP_STRESS", "FAULT"
]

FEATURE_NAMES = [
    "temp_mean", "temp_delta", "temp_rate", "temp_volatility", "temp_ambient_gap",
    "power_mean", "power_delta", "freq_mean", "freq_stability", "cop_mean",
    "cop_trend", "temp_rate_vs_power", "recovery_efficiency", "door_state", "door_duration"
]

OUTPUT_PATH = "kernel_model/kernel_training_data.csv"


@pytest.fixture(scope="module")
def training_data():
    """Generate training data if not already present."""
    if not os.path.exists(OUTPUT_PATH):
        script = os.path.join(os.path.dirname(__file__), "..", "generate_kernel_training_data.py")
        result = subprocess.run(
            [sys.executable, script, "--output", OUTPUT_PATH],
            capture_output=True, text=True, cwd=os.path.join(os.path.dirname(__file__), "..")
        )
        assert result.returncode == 0, f"Data generation failed: {result.stderr}"
    return pd.read_csv(os.path.join(os.path.dirname(__file__), "..", OUTPUT_PATH))


def test_csv_exists(training_data):
    assert len(training_data) > 0


def test_correct_columns(training_data):
    expected = FEATURE_NAMES + ["label"]
    assert list(training_data.columns) == expected


def test_correct_shape(training_data):
    assert training_data.shape[1] == 16  # 15 features + label
    assert training_data.shape[0] >= 10000  # At least 10K samples


def test_all_9_classes_present(training_data):
    labels = set(training_data["label"].unique())
    expected = set(KERNEL_STATES)
    assert labels == expected, f"Missing: {expected - labels}, Extra: {labels - expected}"


def test_no_nan_values(training_data):
    assert not training_data[FEATURE_NAMES].isna().any().any()


def test_no_inf_values(training_data):
    assert not np.isinf(training_data[FEATURE_NAMES].values).any()


def test_feature_ranges(training_data):
    """Check features are within physically reasonable ranges."""
    df = training_data
    # Temperature mean should be between -40 and +30
    assert df["temp_mean"].min() > -50
    assert df["temp_mean"].max() < 40
    # Power should be non-negative
    assert df["power_mean"].min() >= 0
    # Frequency should be non-negative
    assert df["freq_mean"].min() >= 0
    # Stability should be [0, 1]
    assert df["freq_stability"].min() >= 0
    assert df["freq_stability"].max() <= 1
    # Door state should be 0 or 1
    assert set(df["door_state"].unique()).issubset({0.0, 1.0})
    # Recovery efficiency should be [0, 1]
    assert df["recovery_efficiency"].min() >= 0
    assert df["recovery_efficiency"].max() <= 1


def test_class_distribution(training_data):
    """Check approximate class distribution matches expected counts."""
    counts = training_data["label"].value_counts()
    # STABLE should be the largest class
    assert counts["STABLE"] > counts["FAULT"]
    assert counts["STABLE"] >= 4000
    # FAULT should be the smallest
    assert counts["FAULT"] >= 300


def test_door_state_consistency(training_data):
    """Door state should be 1 only for DOOR_OPEN class (mostly)."""
    door_open_samples = training_data[training_data["label"] == "DOOR_OPEN"]
    other_samples = training_data[training_data["label"] != "DOOR_OPEN"]
    # Most DOOR_OPEN samples should have door_state=1
    assert door_open_samples["door_state"].mean() > 0.8
    # Most other samples should have door_state=0
    assert other_samples["door_state"].mean() < 0.2
