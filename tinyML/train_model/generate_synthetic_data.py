#!/usr/bin/env python3
"""
generate_synthetic_data.py — Generate realistic synthetic baseline data
for a cold storage unit to test the training pipeline.

Simulates:
- Steady-state temperature around -18°C (freezer) or 4°C (fridge) with noise
- Periodic compressor cycles (vibration patterns)
- Gravity vector on accelerometer (mostly on Z-axis)
- Small random vibration noise
- Natural temperature drift during compressor off-cycles

Usage:
    python generate_synthetic_data.py --output baseline_data.csv --hours 48
"""

import argparse

import numpy as np
import pandas as pd


def generate_baseline(
    hours: float = 48.0,
    sample_rate_hz: float = 10.0,
    target_temp: float = 4.0,
    mode: str = "fridge",
):
    """
    Generate synthetic sensor data for normal cold storage operation.

    Returns a DataFrame with columns:
        timestamp_ms, accel_x, accel_y, accel_z, temperature
    """
    n_samples = int(hours * 3600 * sample_rate_hz)
    dt = 1.0 / sample_rate_hz
    print(f"Generating {n_samples} samples ({hours} hours at {sample_rate_hz} Hz)")

    rng = np.random.default_rng(42)

    timestamps = np.arange(n_samples) * (1000.0 / sample_rate_hz)  # ms

    # ── Temperature Simulation ──────────────────────────────
    # Compressor cycles: on for ~15 min, off for ~15 min
    compressor_cycle_period = 30 * 60 * sample_rate_hz  # 30 min in samples
    compressor_duty_cycle = 0.5

    temperature = np.zeros(n_samples)
    temp = target_temp
    for i in range(n_samples):
        cycle_pos = (i % compressor_cycle_period) / compressor_cycle_period
        compressor_on = cycle_pos < compressor_duty_cycle

        if compressor_on:
            # Cooling: temperature drifts down slowly
            temp += (-0.002 + rng.normal(0, 0.005)) * dt
        else:
            # Warming: temperature drifts up slowly
            temp += (0.003 + rng.normal(0, 0.005)) * dt

        # Keep within realistic bounds
        temp = np.clip(temp, target_temp - 2.0, target_temp + 2.0)
        temperature[i] = temp + rng.normal(0, 0.05)  # sensor noise

    # ── Accelerometer Simulation ────────────────────────────
    # Gravity vector: unit sits flat, so Z ≈ 1g, X/Y ≈ 0g
    accel_x = rng.normal(0.02, 0.01, n_samples)   # slight offset + noise
    accel_y = rng.normal(-0.01, 0.01, n_samples)
    accel_z = rng.normal(1.0, 0.01, n_samples)     # gravity

    # Add compressor vibration when on
    for i in range(n_samples):
        cycle_pos = (i % compressor_cycle_period) / compressor_cycle_period
        compressor_on = cycle_pos < compressor_duty_cycle

        if compressor_on:
            # Compressor adds ~0.02-0.05g vibration at ~50Hz (aliased at 10Hz)
            vib = 0.03 * np.sin(2 * np.pi * 4.7 * i * dt) + rng.normal(0, 0.015)
            accel_x[i] += vib * 0.5
            accel_y[i] += vib * 0.3
            accel_z[i] += vib * 0.2

    # ── Build DataFrame ─────────────────────────────────────
    df = pd.DataFrame({
        "timestamp_ms": timestamps.astype(int),
        "accel_x": np.round(accel_x, 4),
        "accel_y": np.round(accel_y, 4),
        "accel_z": np.round(accel_z, 4),
        "temperature": np.round(temperature, 2),
    })

    return df


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic cold storage data")
    parser.add_argument("--output", type=str, default="baseline_data.csv",
                        help="Output CSV path")
    parser.add_argument("--hours", type=float, default=48.0,
                        help="Hours of data to generate")
    parser.add_argument("--temp", type=float, default=4.0,
                        help="Target temperature in °C (4=fridge, -18=freezer)")
    args = parser.parse_args()

    df = generate_baseline(hours=args.hours, target_temp=args.temp)
    df.to_csv(args.output, index=False)
    print(f"Saved {len(df)} samples to {args.output}")
    print(f"File size: {os.path.getsize(args.output) / 1024:.1f} KB")

    # Print summary stats
    print(f"\nSummary:")
    for col in ["accel_x", "accel_y", "accel_z", "temperature"]:
        print(f"  {col}: min={df[col].min():.4f} max={df[col].max():.4f} "
              f"mean={df[col].mean():.4f} std={df[col].std():.4f}")


import os

if __name__ == "__main__":
    main()
