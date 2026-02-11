#!/usr/bin/env python3
"""
generate_kernel_training_data.py — Generate labeled synthetic feature vectors
for all 9 Kernel operational states.

Each sample = 15 features + label string. Features represent derived statistics
from a 120-second rolling window of cold chain sensor data.

Usage:
    python generate_kernel_training_data.py --output kernel_model/kernel_training_data.csv
"""

import argparse
import os

import numpy as np
import pandas as pd

# 9 Kernel operational states
KERNEL_STATES = [
    "STABLE", "DOOR_OPEN", "RECOVERING", "DEFROST",
    "DRIFT_WARM", "DRIFT_COLD", "EXCURSION", "COMP_STRESS", "FAULT"
]

FEATURE_NAMES = [
    "temp_mean", "temp_delta", "temp_rate", "temp_volatility", "temp_ambient_gap",
    "power_mean", "power_delta", "freq_mean", "freq_stability", "cop_mean",
    "cop_trend", "temp_rate_vs_power", "recovery_efficiency", "door_state", "door_duration"
]

# Per-state Gaussian profiles: (mean, std) for each feature
# Physically realistic distributions for cold chain monitoring
STATE_PROFILES = {
    "STABLE": {
        "temp_mean": (-20.0, 1.0),       # Normal operating temp
        "temp_delta": (0.0, 0.3),         # Near-zero change
        "temp_rate": (0.0, 0.02),         # Near-zero rate
        "temp_volatility": (0.1, 0.05),   # Low volatility
        "temp_ambient_gap": (40.0, 3.0),  # Normal ambient gap
        "power_mean": (150.0, 20.0),      # Normal power
        "power_delta": (0.0, 5.0),        # Stable power
        "freq_mean": (50.0, 2.0),         # Normal frequency
        "freq_stability": (0.95, 0.03),   # High stability
        "cop_mean": (2.5, 0.3),           # Good COP
        "cop_trend": (0.0, 0.01),         # Stable COP
        "temp_rate_vs_power": (0.0, 0.1), # No correlation
        "recovery_efficiency": (0.8, 0.1),# Good efficiency
        "door_state": (0.0, 0.0),         # Door closed
        "door_duration": (0.0, 0.0),      # No door events
    },
    "DOOR_OPEN": {
        "temp_mean": (-15.0, 3.0),        # Warming up
        "temp_delta": (3.0, 1.5),         # Positive delta
        "temp_rate": (0.15, 0.05),        # Positive rate (warming)
        "temp_volatility": (1.5, 0.5),    # High volatility
        "temp_ambient_gap": (35.0, 4.0),  # Reducing gap
        "power_mean": (200.0, 30.0),      # Elevated power (compressor working harder)
        "power_delta": (30.0, 15.0),      # Increasing power
        "freq_mean": (55.0, 3.0),         # Higher frequency
        "freq_stability": (0.80, 0.08),   # Reduced stability
        "cop_mean": (1.8, 0.4),           # Reduced COP
        "cop_trend": (-0.02, 0.01),       # Declining COP
        "temp_rate_vs_power": (0.5, 0.2), # Positive correlation
        "recovery_efficiency": (0.5, 0.15),# Reduced efficiency
        "door_state": (1.0, 0.0),         # Door open
        "door_duration": (30.0, 20.0),    # Duration in seconds
    },
    "RECOVERING": {
        "temp_mean": (-16.0, 2.0),        # Cooling back down
        "temp_delta": (-2.5, 1.0),        # Negative delta (cooling)
        "temp_rate": (-0.12, 0.04),       # Negative rate
        "temp_volatility": (0.8, 0.3),    # Moderate volatility
        "temp_ambient_gap": (36.0, 3.0),  # Recovering gap
        "power_mean": (220.0, 25.0),      # High power (max cooling)
        "power_delta": (-10.0, 8.0),      # Power stabilizing
        "freq_mean": (58.0, 3.0),         # High frequency
        "freq_stability": (0.85, 0.06),   # Moderate stability
        "cop_mean": (2.0, 0.3),           # Moderate COP
        "cop_trend": (0.015, 0.008),      # Improving COP
        "temp_rate_vs_power": (-0.4, 0.2),# Negative correlation
        "recovery_efficiency": (0.7, 0.12),# Good recovery
        "door_state": (0.0, 0.0),         # Door closed
        "door_duration": (0.0, 0.0),      # No door events
    },
    "DEFROST": {
        "temp_mean": (-12.0, 3.0),        # Controlled warming
        "temp_delta": (5.0, 2.0),         # Positive delta
        "temp_rate": (0.2, 0.06),         # Controlled positive rate
        "temp_volatility": (0.5, 0.2),    # Low-moderate volatility
        "temp_ambient_gap": (32.0, 4.0),  # Reduced gap
        "power_mean": (30.0, 15.0),       # Low power (compressor off)
        "power_delta": (-100.0, 30.0),    # Large power drop
        "freq_mean": (5.0, 3.0),          # Very low frequency
        "freq_stability": (0.3, 0.15),    # Low stability (off/cycling)
        "cop_mean": (0.5, 0.3),           # Very low COP
        "cop_trend": (-0.05, 0.02),       # Declining COP
        "temp_rate_vs_power": (-0.1, 0.15),# Weak correlation
        "recovery_efficiency": (0.3, 0.15),# Low efficiency during defrost
        "door_state": (0.0, 0.0),         # Door closed
        "door_duration": (0.0, 0.0),      # No door events
    },
    "DRIFT_WARM": {
        "temp_mean": (-17.0, 1.5),        # Slightly warm
        "temp_delta": (1.0, 0.5),         # Slow positive drift
        "temp_rate": (0.03, 0.015),       # Slow positive rate
        "temp_volatility": (0.3, 0.1),    # Low volatility
        "temp_ambient_gap": (37.0, 3.0),  # Normal-ish gap
        "power_mean": (170.0, 20.0),      # Slightly elevated
        "power_delta": (5.0, 3.0),        # Slight increase
        "freq_mean": (52.0, 2.0),         # Slightly high
        "freq_stability": (0.90, 0.04),   # Good stability
        "cop_mean": (2.0, 0.3),           # Degrading COP
        "cop_trend": (-0.01, 0.005),      # Declining COP
        "temp_rate_vs_power": (0.2, 0.1), # Weak positive correlation
        "recovery_efficiency": (0.6, 0.1),# Reduced efficiency
        "door_state": (0.0, 0.0),         # Door closed
        "door_duration": (0.0, 0.0),      # No door events
    },
    "DRIFT_COLD": {
        "temp_mean": (-24.0, 1.5),        # Too cold
        "temp_delta": (-1.0, 0.5),        # Negative drift
        "temp_rate": (-0.03, 0.015),      # Slow negative rate
        "temp_volatility": (0.3, 0.1),    # Low volatility
        "temp_ambient_gap": (44.0, 3.0),  # Large gap
        "power_mean": (200.0, 25.0),      # High power
        "power_delta": (8.0, 4.0),        # Increasing power
        "freq_mean": (56.0, 2.0),         # High frequency
        "freq_stability": (0.90, 0.04),   # Good stability
        "cop_mean": (1.8, 0.3),           # Reduced COP
        "cop_trend": (-0.008, 0.004),     # Declining COP
        "temp_rate_vs_power": (-0.3, 0.1),# Negative correlation
        "recovery_efficiency": (0.9, 0.08),# High efficiency (overcooling)
        "door_state": (0.0, 0.0),         # Door closed
        "door_duration": (0.0, 0.0),      # No door events
    },
    "EXCURSION": {
        "temp_mean": (-5.0, 4.0),         # High temp, outside range
        "temp_delta": (8.0, 3.0),         # Large positive delta
        "temp_rate": (0.3, 0.1),          # Fast warming
        "temp_volatility": (2.0, 0.8),    # High volatility
        "temp_ambient_gap": (25.0, 5.0),  # Small gap (near ambient)
        "power_mean": (250.0, 30.0),      # Max power
        "power_delta": (20.0, 10.0),      # Rising power
        "freq_mean": (60.0, 3.0),         # Max frequency
        "freq_stability": (0.70, 0.10),   # Poor stability
        "cop_mean": (1.0, 0.3),           # Very poor COP
        "cop_trend": (-0.04, 0.02),       # Rapidly declining COP
        "temp_rate_vs_power": (0.7, 0.15),# Strong positive correlation
        "recovery_efficiency": (0.2, 0.1),# Very poor efficiency
        "door_state": (0.0, 0.0),         # Door closed (not door-related)
        "door_duration": (0.0, 0.0),      # No door events
    },
    "COMP_STRESS": {
        "temp_mean": (-18.0, 2.0),        # Temp mostly OK
        "temp_delta": (0.5, 0.5),         # Small drift
        "temp_rate": (0.01, 0.02),        # Near-zero rate
        "temp_volatility": (0.5, 0.2),    # Moderate volatility
        "temp_ambient_gap": (38.0, 3.0),  # Normal gap
        "power_mean": (280.0, 40.0),      # Anomalous high power
        "power_delta": (40.0, 20.0),      # Fluctuating power
        "freq_mean": (62.0, 5.0),         # Anomalous frequency
        "freq_stability": (0.60, 0.12),   # Poor stability
        "cop_mean": (1.2, 0.3),           # Poor COP
        "cop_trend": (-0.02, 0.01),       # Declining COP
        "temp_rate_vs_power": (0.1, 0.15),# Weak correlation
        "recovery_efficiency": (0.4, 0.15),# Reduced efficiency
        "door_state": (0.0, 0.0),         # Door closed
        "door_duration": (0.0, 0.0),      # No door events
    },
    "FAULT": {
        "temp_mean": (-10.0, 8.0),        # Uncontrolled temperature
        "temp_delta": (5.0, 5.0),         # Erratic delta
        "temp_rate": (0.2, 0.15),         # Uncontrolled rate
        "temp_volatility": (3.0, 1.5),    # Very high volatility
        "temp_ambient_gap": (30.0, 8.0),  # Erratic gap
        "power_mean": (50.0, 80.0),       # Erratic/zero power
        "power_delta": (0.0, 50.0),       # Erratic
        "freq_mean": (15.0, 15.0),        # Low/erratic frequency
        "freq_stability": (0.3, 0.2),     # Very poor stability
        "cop_mean": (0.3, 0.3),           # Very poor COP
        "cop_trend": (-0.05, 0.03),       # Rapidly declining
        "temp_rate_vs_power": (0.0, 0.3), # No consistent correlation
        "recovery_efficiency": (0.1, 0.1),# Nearly zero efficiency
        "door_state": (0.0, 0.0),         # Door closed
        "door_duration": (0.0, 0.0),      # No door events
    },
}

# Sample counts per state
STATE_COUNTS = {
    "STABLE": 5000,
    "DOOR_OPEN": 1500,
    "RECOVERING": 1500,
    "DEFROST": 1000,
    "DRIFT_WARM": 800,
    "DRIFT_COLD": 800,
    "EXCURSION": 500,
    "COMP_STRESS": 500,
    "FAULT": 400,
}

# Adjacent states for boundary/transition samples
ADJACENT_STATES = {
    "STABLE": ["DOOR_OPEN", "DRIFT_WARM", "DRIFT_COLD", "DEFROST"],
    "DOOR_OPEN": ["STABLE", "RECOVERING", "EXCURSION"],
    "RECOVERING": ["DOOR_OPEN", "STABLE"],
    "DEFROST": ["STABLE", "RECOVERING"],
    "DRIFT_WARM": ["STABLE", "EXCURSION"],
    "DRIFT_COLD": ["STABLE", "COMP_STRESS"],
    "EXCURSION": ["DRIFT_WARM", "RECOVERING", "FAULT"],
    "COMP_STRESS": ["STABLE", "FAULT"],
    "FAULT": ["COMP_STRESS", "EXCURSION"],
}


def generate_samples(state, n_samples, rng):
    """Generate n_samples feature vectors for the given state."""
    profile = STATE_PROFILES[state]
    samples = np.zeros((n_samples, len(FEATURE_NAMES)))

    for i, feat in enumerate(FEATURE_NAMES):
        mean, std = profile[feat]
        if feat in ("door_state", "door_duration"):
            # Binary/discrete features
            if feat == "door_state":
                samples[:, i] = mean  # 0 or 1
            elif feat == "door_duration":
                if mean > 0:
                    samples[:, i] = np.maximum(0, rng.normal(mean, std, n_samples))
                else:
                    samples[:, i] = 0.0
        else:
            samples[:, i] = rng.normal(mean, std, n_samples)

    # Clamp physically impossible values
    samples[:, FEATURE_NAMES.index("temp_volatility")] = np.maximum(
        0, samples[:, FEATURE_NAMES.index("temp_volatility")]
    )
    samples[:, FEATURE_NAMES.index("power_mean")] = np.maximum(
        0, samples[:, FEATURE_NAMES.index("power_mean")]
    )
    samples[:, FEATURE_NAMES.index("freq_mean")] = np.maximum(
        0, samples[:, FEATURE_NAMES.index("freq_mean")]
    )
    samples[:, FEATURE_NAMES.index("freq_stability")] = np.clip(
        samples[:, FEATURE_NAMES.index("freq_stability")], 0, 1
    )
    samples[:, FEATURE_NAMES.index("cop_mean")] = np.maximum(
        0, samples[:, FEATURE_NAMES.index("cop_mean")]
    )
    samples[:, FEATURE_NAMES.index("recovery_efficiency")] = np.clip(
        samples[:, FEATURE_NAMES.index("recovery_efficiency")], 0, 1
    )
    samples[:, FEATURE_NAMES.index("door_state")] = np.clip(
        samples[:, FEATURE_NAMES.index("door_state")], 0, 1
    )
    samples[:, FEATURE_NAMES.index("door_duration")] = np.maximum(
        0, samples[:, FEATURE_NAMES.index("door_duration")]
    )

    return samples


def generate_boundary_samples(state, n_samples, rng):
    """Generate boundary/transition samples by blending adjacent state profiles."""
    adjacent = ADJACENT_STATES[state]
    samples = np.zeros((n_samples, len(FEATURE_NAMES)))

    for idx in range(n_samples):
        # Pick a random adjacent state
        neighbor = rng.choice(adjacent)
        # Random blend factor 0.3-0.7 (true boundary region)
        alpha = rng.uniform(0.3, 0.7)

        for i, feat in enumerate(FEATURE_NAMES):
            mean1, std1 = STATE_PROFILES[state][feat]
            mean2, std2 = STATE_PROFILES[neighbor][feat]
            blended_mean = alpha * mean1 + (1 - alpha) * mean2
            blended_std = alpha * std1 + (1 - alpha) * std2

            if feat == "door_state":
                # Binary: use probability based on blend
                samples[idx, i] = 1.0 if rng.random() < blended_mean else 0.0
            elif feat == "door_duration":
                samples[idx, i] = max(0, rng.normal(blended_mean, max(blended_std, 0.1)))
            else:
                samples[idx, i] = rng.normal(blended_mean, max(blended_std, 0.01))

    # Clamp same as pure samples
    samples[:, FEATURE_NAMES.index("temp_volatility")] = np.maximum(
        0, samples[:, FEATURE_NAMES.index("temp_volatility")]
    )
    samples[:, FEATURE_NAMES.index("power_mean")] = np.maximum(
        0, samples[:, FEATURE_NAMES.index("power_mean")]
    )
    samples[:, FEATURE_NAMES.index("freq_mean")] = np.maximum(
        0, samples[:, FEATURE_NAMES.index("freq_mean")]
    )
    samples[:, FEATURE_NAMES.index("freq_stability")] = np.clip(
        samples[:, FEATURE_NAMES.index("freq_stability")], 0, 1
    )
    samples[:, FEATURE_NAMES.index("cop_mean")] = np.maximum(
        0, samples[:, FEATURE_NAMES.index("cop_mean")]
    )
    samples[:, FEATURE_NAMES.index("recovery_efficiency")] = np.clip(
        samples[:, FEATURE_NAMES.index("recovery_efficiency")], 0, 1
    )
    samples[:, FEATURE_NAMES.index("door_state")] = np.clip(
        samples[:, FEATURE_NAMES.index("door_state")], 0, 1
    )
    samples[:, FEATURE_NAMES.index("door_duration")] = np.maximum(
        0, samples[:, FEATURE_NAMES.index("door_duration")]
    )

    return samples


def main():
    parser = argparse.ArgumentParser(description="Generate Kernel training data")
    parser.add_argument(
        "--output", type=str,
        default="kernel_model/kernel_training_data.csv",
        help="Output CSV file path"
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    rng = np.random.default_rng(args.seed)

    all_samples = []
    all_labels = []

    for state in KERNEL_STATES:
        n_pure = STATE_COUNTS[state]
        n_boundary = max(1, int(n_pure * 0.1))  # 10% boundary samples
        n_core = n_pure - n_boundary

        # Generate core samples
        core = generate_samples(state, n_core, rng)
        all_samples.append(core)
        all_labels.extend([state] * n_core)

        # Generate boundary samples
        boundary = generate_boundary_samples(state, n_boundary, rng)
        all_samples.append(boundary)
        all_labels.extend([state] * n_boundary)

        print(f"  {state}: {n_core} core + {n_boundary} boundary = {n_core + n_boundary} samples")

    # Concatenate and shuffle
    X = np.concatenate(all_samples, axis=0)
    labels = np.array(all_labels)

    # Shuffle
    indices = rng.permutation(len(X))
    X = X[indices]
    labels = labels[indices]

    # Create DataFrame
    df = pd.DataFrame(X, columns=FEATURE_NAMES)
    df["label"] = labels

    # Save
    os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
    df.to_csv(args.output, index=False)

    print(f"\nGenerated {len(df)} total samples")
    print(f"Class distribution:\n{df['label'].value_counts().to_string()}")
    print(f"\nSaved to {args.output}")

    # Verify no NaN/inf
    assert not df[FEATURE_NAMES].isna().any().any(), "NaN values found!"
    assert not np.isinf(df[FEATURE_NAMES].values).any(), "Inf values found!"
    print("Data validation passed (no NaN/Inf)")


if __name__ == "__main__":
    main()
