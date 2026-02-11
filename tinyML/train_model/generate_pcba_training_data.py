#!/usr/bin/env python3
"""
generate_pcba_training_data.py — Generate labeled synthetic feature vectors
for all 9 Kernel operational states using the PCBA 14-feature pipeline.

Each sample = 14 features + label string. Features represent derived statistics
from a 120-second rolling window of PCBA sensor data (temperature + vibration).

Usage:
    python generate_pcba_training_data.py --output pcba_kernel_model/pcba_training_data.csv
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

PCBA_FEATURE_NAMES = [
    "temp_mean", "temp_delta", "temp_rate", "temp_volatility",
    "vib_rms", "vib_rms_delta", "vib_dom_freq", "vib_spectral_stability",
    "vib_spectral_entropy", "vib_duty_cycle",
    "door_angle_norm", "door_open_duration",
    "cooling_efficiency_proxy", "temp_rate_vs_vib"
]

# Per-state Gaussian profiles: (mean, std) for each feature
# Physically realistic distributions for PCBA cold chain monitoring
STATE_PROFILES = {
    "STABLE": {
        "temp_mean": (-20.0, 1.0),                # Normal operating temp
        "temp_delta": (0.0, 0.3),                  # Near-zero change
        "temp_rate": (0.0, 0.02),                  # Near-zero rate
        "temp_volatility": (0.1, 0.05),            # Low volatility
        "vib_rms": (0.30, 0.04),                   # Door-mounted: ~30% lower than body-mounted
        "vib_rms_delta": (0.0, 0.02),              # Stable vibration
        "vib_dom_freq": (50.0, 2.0),               # 50Hz mains frequency (preserved)
        "vib_spectral_stability": (0.92, 0.04),    # Slightly lower (weaker signal)
        "vib_spectral_entropy": (2.3, 0.3),        # Slightly higher (lower SNR)
        "vib_duty_cycle": (0.95, 0.03),            # Compressor almost always on
        "door_angle_norm": (0.01, 0.01),           # Door closed (~1.8° angle)
        "door_open_duration": (0.0, 0.0),          # No door events
        "cooling_efficiency_proxy": (0.8, 0.1),    # Good efficiency
        "temp_rate_vs_vib": (0.0, 0.1),            # No correlation
    },
    "DOOR_OPEN": {
        "temp_mean": (-15.0, 3.0),                 # Warming up
        "temp_delta": (3.0, 1.5),                  # Positive delta
        "temp_rate": (0.15, 0.05),                 # Positive rate (warming)
        "temp_volatility": (1.5, 0.5),             # High volatility
        "vib_rms": (0.40, 0.06),                   # Door-mounted: attenuated
        "vib_rms_delta": (0.06, 0.03),             # Increasing vibration
        "vib_dom_freq": (55.0, 3.0),               # Higher frequency
        "vib_spectral_stability": (0.75, 0.08),    # Reduced stability
        "vib_spectral_entropy": (3.0, 0.4),        # Higher entropy (lower SNR)
        "vib_duty_cycle": (0.98, 0.02),            # Compressor always on
        "door_angle_norm": (0.5, 0.2),             # Door open (~90° angle, continuous)
        "door_open_duration": (30.0, 20.0),        # Duration in seconds
        "cooling_efficiency_proxy": (0.3, 0.1),    # Poor efficiency (losing cold)
        "temp_rate_vs_vib": (0.5, 0.2),            # Positive correlation
    },
    "RECOVERING": {
        "temp_mean": (-16.0, 2.0),                 # Cooling back down
        "temp_delta": (-2.5, 1.0),                 # Negative delta (cooling)
        "temp_rate": (-0.12, 0.04),                # Negative rate
        "temp_volatility": (0.8, 0.3),             # Moderate volatility
        "vib_rms": (0.43, 0.06),                   # Door-mounted: attenuated
        "vib_rms_delta": (-0.02, 0.02),            # Stabilizing
        "vib_dom_freq": (58.0, 3.0),               # High frequency
        "vib_spectral_stability": (0.82, 0.06),    # Slightly lower
        "vib_spectral_entropy": (2.7, 0.3),        # Slightly higher
        "vib_duty_cycle": (1.0, 0.01),             # Always on
        "door_angle_norm": (0.01, 0.01),           # Door closed
        "door_open_duration": (0.0, 0.0),          # No door events
        "cooling_efficiency_proxy": (0.7, 0.12),   # Good recovery efficiency
        "temp_rate_vs_vib": (-0.4, 0.2),           # Negative correlation (cooling)
    },
    "DEFROST": {
        "temp_mean": (-12.0, 3.0),                 # Controlled warming
        "temp_delta": (5.0, 2.0),                  # Positive delta
        "temp_rate": (0.2, 0.06),                  # Controlled positive rate
        "temp_volatility": (0.5, 0.2),             # Low-moderate volatility
        "vib_rms": (0.04, 0.02),                   # Near-zero (compressor OFF, door-mounted)
        "vib_rms_delta": (-0.22, 0.08),            # Large drop from running state
        "vib_dom_freq": (5.0, 3.0),                # Very low (ambient noise only)
        "vib_spectral_stability": (0.28, 0.15),    # Low stability
        "vib_spectral_entropy": (3.7, 0.4),        # Higher entropy
        "vib_duty_cycle": (0.05, 0.03),            # Compressor almost never on
        "door_angle_norm": (0.01, 0.01),           # Door closed
        "door_open_duration": (0.0, 0.0),          # No door events
        "cooling_efficiency_proxy": (0.0, 0.05),   # N/A during defrost
        "temp_rate_vs_vib": (-0.1, 0.15),          # Weak correlation
    },
    "DRIFT_WARM": {
        "temp_mean": (-17.0, 1.5),                 # Slightly warm
        "temp_delta": (1.0, 0.5),                  # Slow positive drift
        "temp_rate": (0.03, 0.015),                # Slow positive rate
        "temp_volatility": (0.3, 0.1),             # Low volatility
        "vib_rms": (0.32, 0.04),                   # Door-mounted: attenuated
        "vib_rms_delta": (0.015, 0.01),            # Slight increase
        "vib_dom_freq": (52.0, 2.0),               # Slightly high
        "vib_spectral_stability": (0.88, 0.04),    # Slightly lower
        "vib_spectral_entropy": (2.5, 0.3),        # Slightly higher
        "vib_duty_cycle": (0.95, 0.03),            # Mostly on
        "door_angle_norm": (0.01, 0.01),           # Door closed
        "door_open_duration": (0.0, 0.0),          # No door events
        "cooling_efficiency_proxy": (0.5, 0.1),    # Reduced efficiency
        "temp_rate_vs_vib": (0.2, 0.1),            # Weak positive correlation
    },
    "DRIFT_COLD": {
        "temp_mean": (-24.0, 1.5),                 # Too cold
        "temp_delta": (-1.0, 0.5),                 # Negative drift
        "temp_rate": (-0.03, 0.015),               # Slow negative rate
        "temp_volatility": (0.3, 0.1),             # Low volatility
        "vib_rms": (0.39, 0.05),                   # Door-mounted: attenuated
        "vib_rms_delta": (0.015, 0.012),           # Slight increase
        "vib_dom_freq": (56.0, 2.0),               # High frequency
        "vib_spectral_stability": (0.88, 0.04),    # Slightly lower
        "vib_spectral_entropy": (2.5, 0.3),        # Slightly higher
        "vib_duty_cycle": (0.98, 0.02),            # Almost always on
        "door_angle_norm": (0.01, 0.01),           # Door closed
        "door_open_duration": (0.0, 0.0),          # No door events
        "cooling_efficiency_proxy": (0.9, 0.08),   # High (overcooling = "efficient")
        "temp_rate_vs_vib": (-0.3, 0.1),           # Negative correlation
    },
    "EXCURSION": {
        "temp_mean": (-5.0, 4.0),                  # High temp, outside range
        "temp_delta": (8.0, 3.0),                  # Large positive delta
        "temp_rate": (0.3, 0.1),                   # Fast warming
        "temp_volatility": (2.0, 0.8),             # High volatility
        "vib_rms": (0.46, 0.08),                   # Door-mounted: attenuated
        "vib_rms_delta": (0.07, 0.04),             # Increasing
        "vib_dom_freq": (60.0, 4.0),               # Max frequency
        "vib_spectral_stability": (0.65, 0.10),    # Poor stability
        "vib_spectral_entropy": (3.2, 0.4),        # Higher entropy
        "vib_duty_cycle": (0.98, 0.02),            # Almost always on
        "door_angle_norm": (0.01, 0.01),           # Door closed (not door-related)
        "door_open_duration": (0.0, 0.0),          # No door events
        "cooling_efficiency_proxy": (0.15, 0.08),  # Very poor
        "temp_rate_vs_vib": (0.7, 0.15),           # Strong positive
    },
    "COMP_STRESS": {
        "temp_mean": (-18.0, 2.0),                 # Temp mostly OK
        "temp_delta": (0.5, 0.5),                  # Small drift
        "temp_rate": (0.01, 0.02),                 # Near-zero rate
        "temp_volatility": (0.5, 0.2),             # Moderate volatility
        "vib_rms": (0.53, 0.08),                   # Door-mounted: attenuated
        "vib_rms_delta": (0.11, 0.06),             # Fluctuating
        "vib_dom_freq": (62.0, 5.0),               # Anomalous frequency
        "vib_spectral_stability": (0.50, 0.12),    # Poor stability
        "vib_spectral_entropy": (4.0, 0.3),        # Higher entropy (lower SNR)
        "vib_duty_cycle": (0.92, 0.05),            # Mostly on but cycling
        "door_angle_norm": (0.01, 0.01),           # Door closed
        "door_open_duration": (0.0, 0.0),          # No door events
        "cooling_efficiency_proxy": (0.35, 0.12),  # Reduced efficiency
        "temp_rate_vs_vib": (0.1, 0.15),           # Weak correlation
    },
    "FAULT": {
        "temp_mean": (-10.0, 8.0),                 # Uncontrolled temperature
        "temp_delta": (5.0, 5.0),                  # Erratic delta
        "temp_rate": (0.2, 0.15),                  # Uncontrolled rate
        "temp_volatility": (3.0, 1.5),             # Very high volatility
        "vib_rms": (0.10, 0.15),                   # Door-mounted: attenuated
        "vib_rms_delta": (0.0, 0.12),              # Erratic
        "vib_dom_freq": (15.0, 15.0),              # Low/erratic
        "vib_spectral_stability": (0.22, 0.15),    # Very poor
        "vib_spectral_entropy": (3.7, 0.5),        # Higher entropy
        "vib_duty_cycle": (0.3, 0.25),             # Erratic cycling
        "door_angle_norm": (0.01, 0.01),           # Door closed
        "door_open_duration": (0.0, 0.0),          # No door events
        "cooling_efficiency_proxy": (0.05, 0.05),  # Near zero
        "temp_rate_vs_vib": (0.0, 0.3),            # No consistent correlation
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
    samples = np.zeros((n_samples, len(PCBA_FEATURE_NAMES)))

    for i, feat in enumerate(PCBA_FEATURE_NAMES):
        mean, std = profile[feat]
        if feat == "door_open_duration":
            if mean > 0:
                samples[:, i] = np.maximum(0, rng.normal(mean, std, n_samples))
            else:
                samples[:, i] = 0.0
        else:
            samples[:, i] = rng.normal(mean, std, n_samples)

    # Clamp physically impossible values
    samples[:, PCBA_FEATURE_NAMES.index("temp_volatility")] = np.maximum(
        0, samples[:, PCBA_FEATURE_NAMES.index("temp_volatility")]
    )
    samples[:, PCBA_FEATURE_NAMES.index("vib_rms")] = np.maximum(
        0, samples[:, PCBA_FEATURE_NAMES.index("vib_rms")]
    )
    samples[:, PCBA_FEATURE_NAMES.index("vib_dom_freq")] = np.maximum(
        0, samples[:, PCBA_FEATURE_NAMES.index("vib_dom_freq")]
    )
    samples[:, PCBA_FEATURE_NAMES.index("vib_spectral_stability")] = np.clip(
        samples[:, PCBA_FEATURE_NAMES.index("vib_spectral_stability")], 0, 1
    )
    samples[:, PCBA_FEATURE_NAMES.index("vib_spectral_entropy")] = np.maximum(
        0, samples[:, PCBA_FEATURE_NAMES.index("vib_spectral_entropy")]
    )
    samples[:, PCBA_FEATURE_NAMES.index("vib_duty_cycle")] = np.clip(
        samples[:, PCBA_FEATURE_NAMES.index("vib_duty_cycle")], 0, 1
    )
    samples[:, PCBA_FEATURE_NAMES.index("cooling_efficiency_proxy")] = np.clip(
        samples[:, PCBA_FEATURE_NAMES.index("cooling_efficiency_proxy")], 0, 1
    )
    samples[:, PCBA_FEATURE_NAMES.index("door_angle_norm")] = np.clip(
        samples[:, PCBA_FEATURE_NAMES.index("door_angle_norm")], 0, 1
    )
    samples[:, PCBA_FEATURE_NAMES.index("door_open_duration")] = np.maximum(
        0, samples[:, PCBA_FEATURE_NAMES.index("door_open_duration")]
    )

    return samples


def generate_boundary_samples(state, n_samples, rng):
    """Generate boundary/transition samples by blending adjacent state profiles."""
    adjacent = ADJACENT_STATES[state]
    samples = np.zeros((n_samples, len(PCBA_FEATURE_NAMES)))

    for idx in range(n_samples):
        # Pick a random adjacent state
        neighbor = rng.choice(adjacent)
        # Random blend factor 0.3-0.7 (true boundary region)
        alpha = rng.uniform(0.3, 0.7)

        for i, feat in enumerate(PCBA_FEATURE_NAMES):
            mean1, std1 = STATE_PROFILES[state][feat]
            mean2, std2 = STATE_PROFILES[neighbor][feat]
            blended_mean = alpha * mean1 + (1 - alpha) * mean2
            blended_std = alpha * std1 + (1 - alpha) * std2

            if feat == "door_open_duration":
                samples[idx, i] = max(0, rng.normal(blended_mean, max(blended_std, 0.1)))
            else:
                samples[idx, i] = rng.normal(blended_mean, max(blended_std, 0.01))

    # Clamp same as pure samples
    samples[:, PCBA_FEATURE_NAMES.index("temp_volatility")] = np.maximum(
        0, samples[:, PCBA_FEATURE_NAMES.index("temp_volatility")]
    )
    samples[:, PCBA_FEATURE_NAMES.index("vib_rms")] = np.maximum(
        0, samples[:, PCBA_FEATURE_NAMES.index("vib_rms")]
    )
    samples[:, PCBA_FEATURE_NAMES.index("vib_dom_freq")] = np.maximum(
        0, samples[:, PCBA_FEATURE_NAMES.index("vib_dom_freq")]
    )
    samples[:, PCBA_FEATURE_NAMES.index("vib_spectral_stability")] = np.clip(
        samples[:, PCBA_FEATURE_NAMES.index("vib_spectral_stability")], 0, 1
    )
    samples[:, PCBA_FEATURE_NAMES.index("vib_spectral_entropy")] = np.maximum(
        0, samples[:, PCBA_FEATURE_NAMES.index("vib_spectral_entropy")]
    )
    samples[:, PCBA_FEATURE_NAMES.index("vib_duty_cycle")] = np.clip(
        samples[:, PCBA_FEATURE_NAMES.index("vib_duty_cycle")], 0, 1
    )
    samples[:, PCBA_FEATURE_NAMES.index("cooling_efficiency_proxy")] = np.clip(
        samples[:, PCBA_FEATURE_NAMES.index("cooling_efficiency_proxy")], 0, 1
    )
    samples[:, PCBA_FEATURE_NAMES.index("door_angle_norm")] = np.clip(
        samples[:, PCBA_FEATURE_NAMES.index("door_angle_norm")], 0, 1
    )
    samples[:, PCBA_FEATURE_NAMES.index("door_open_duration")] = np.maximum(
        0, samples[:, PCBA_FEATURE_NAMES.index("door_open_duration")]
    )

    return samples


def main():
    parser = argparse.ArgumentParser(description="Generate PCBA Kernel training data")
    parser.add_argument(
        "--output", type=str,
        default="pcba_kernel_model/pcba_training_data.csv",
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
    df = pd.DataFrame(X, columns=PCBA_FEATURE_NAMES)
    df["label"] = labels

    # Save
    os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
    df.to_csv(args.output, index=False)

    print(f"\nGenerated {len(df)} total samples")
    print(f"Class distribution:\n{df['label'].value_counts().to_string()}")
    print(f"\nSaved to {args.output}")

    # Verify no NaN/inf
    assert not df[PCBA_FEATURE_NAMES].isna().any().any(), "NaN values found!"
    assert not np.isinf(df[PCBA_FEATURE_NAMES].values).any(), "Inf values found!"
    print("Data validation passed (no NaN/Inf)")


if __name__ == "__main__":
    main()
