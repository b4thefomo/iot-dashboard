#!/usr/bin/env python3
"""
Subzero Fleet Simulator
Streams virtual freezer data from historical dataset to server.

Each virtual unit has a distinct "personality" based on fault patterns in the data.
"""

import pandas as pd
import requests
import time
import random
import argparse
from datetime import datetime
from pathlib import Path

# Server configuration
SERVER_URL = "http://localhost:4000/api/data"

# Virtual fleet configuration - UK locations
FLEET_CONFIG = [
    {
        "device_id": "FREEZER_001",
        "location_name": "London",
        "lat": 51.5074,
        "lon": -0.1278,
        "personality": "healthy",
        "description": "The Perfect Freezer - Always stable"
    },
    {
        "device_id": "FREEZER_002",
        "location_name": "Manchester",
        "lat": 53.4808,
        "lon": -2.2426,
        "personality": "door_abuser",
        "description": "The Door Abuser - Frequent door open events"
    },
    {
        "device_id": "FREEZER_003",
        "location_name": "Glasgow",
        "lat": 55.8642,
        "lon": -4.2518,
        "personality": "dying_compressor",
        "description": "The Dying Compressor - Rising temp, failing"
    },
    {
        "device_id": "FREEZER_004",
        "location_name": "Birmingham",
        "lat": 52.4862,
        "lon": -1.8904,
        "personality": "frost_builder",
        "description": "The Frost Builder - High frost, needs defrost"
    },
    {
        "device_id": "FREEZER_005",
        "location_name": "Leeds",
        "lat": 53.8008,
        "lon": -1.5491,
        "personality": "energy_hog",
        "description": "The Energy Hog - High power, low efficiency"
    }
]


class FreezerSimulator:
    def __init__(self, csv_path: str, server_url: str = SERVER_URL):
        self.server_url = server_url
        self.csv_path = csv_path
        self.df = None
        self.unit_indices = {}  # Track position in data for each unit
        self.unit_data = {}     # Filtered data per unit

    def load_data(self):
        """Load and preprocess the CSV dataset."""
        print(f"Loading dataset from {self.csv_path}...")
        self.df = pd.read_csv(self.csv_path)
        print(f"Loaded {len(self.df):,} rows")

        # Prepare data slices for each personality type
        self._prepare_unit_data()

    def _prepare_unit_data(self):
        """Prepare filtered data for each unit based on personality."""
        for unit in FLEET_CONFIG:
            device_id = unit["device_id"]
            personality = unit["personality"]

            if personality == "healthy":
                # Normal operation, no faults, door closed
                mask = (self.df["fault"] == "NORMAL") & (self.df["door_open"] == 0)
                data = self.df[mask].copy()

            elif personality == "door_abuser":
                # Mix of normal with door open events
                normal_data = self.df[self.df["fault"] == "NORMAL"].copy()
                # Artificially set door_open for ~30% of readings
                data = normal_data.copy()

            elif personality == "dying_compressor":
                # Look for high temperature readings or faults
                # Simulate by taking normal data and adjusting temps upward
                data = self.df[self.df["fault"] == "NORMAL"].copy()

            elif personality == "frost_builder":
                # High frost level readings
                data = self.df[self.df["frost_level"] > 0.1].copy() if len(self.df[self.df["frost_level"] > 0.1]) > 100 else self.df.copy()

            elif personality == "energy_hog":
                # High power consumption
                median_power = self.df["P_comp_W"].median()
                data = self.df[self.df["P_comp_W"] > median_power].copy() if len(self.df[self.df["P_comp_W"] > median_power]) > 100 else self.df.copy()

            else:
                data = self.df.copy()

            # Reset index and store
            data = data.reset_index(drop=True)
            self.unit_data[device_id] = data
            self.unit_indices[device_id] = 0

            print(f"  {device_id} ({personality}): {len(data):,} rows available")

    def _add_jitter(self, value: float, jitter_pct: float = 0.02) -> float:
        """Add random noise to a value for realism."""
        jitter = value * jitter_pct * random.uniform(-1, 1)
        return value + jitter

    def _get_reading(self, unit: dict) -> dict:
        """Get the next reading for a unit, applying personality modifications."""
        device_id = unit["device_id"]
        personality = unit["personality"]

        # Get data slice for this unit
        data = self.unit_data[device_id]
        idx = self.unit_indices[device_id]

        # Loop back to start if we've exhausted data
        if idx >= len(data):
            idx = 0
            self.unit_indices[device_id] = 0

        row = data.iloc[idx]
        self.unit_indices[device_id] = idx + 1

        # Base reading from CSV data
        temp_cabinet = float(row["T_cab_meas"])
        temp_ambient = float(row["T_amb"])
        door_open = bool(row["door_open"])
        defrost_on = bool(row["defrost_on"])
        compressor_power = float(row["P_comp_W"])
        compressor_freq = float(row["N_comp_Hz"])
        frost_level = float(row["frost_level"])
        cop = float(row["COP"])
        fault = str(row["fault"])
        fault_id = int(row["fault_id"])

        # Apply personality-specific modifications
        if personality == "healthy":
            # Stable, slightly cold freezer
            temp_cabinet = self._add_jitter(-18.0, 0.05)
            door_open = False
            fault = "NORMAL"
            fault_id = 0
            frost_level = self._add_jitter(0.05, 0.1)

        elif personality == "door_abuser":
            # 30% chance door is open
            door_open = random.random() < 0.3
            if door_open:
                # Temperature rises when door is open
                temp_cabinet = self._add_jitter(-12.0, 0.1)
            else:
                temp_cabinet = self._add_jitter(-17.0, 0.05)
            fault = "NORMAL"
            fault_id = 0

        elif personality == "dying_compressor":
            # Temperature slowly rising, high power
            base_temp = -10.0 + (idx / 1000.0)  # Slowly rising
            temp_cabinet = self._add_jitter(min(base_temp, 5.0), 0.1)
            compressor_power = self._add_jitter(700.0, 0.1)
            compressor_freq = self._add_jitter(95.0, 0.05)
            # Fault when temp gets too high
            if temp_cabinet > -5:
                fault = "COMPRESSOR_FAIL"
                fault_id = 3
            else:
                fault = "NORMAL"
                fault_id = 0

        elif personality == "frost_builder":
            # High frost buildup
            temp_cabinet = self._add_jitter(-16.0, 0.05)
            frost_level = self._add_jitter(0.6, 0.1)
            frost_level = min(frost_level, 1.0)  # Cap at 1.0
            fault = "NORMAL"
            fault_id = 0

        elif personality == "energy_hog":
            # High power, low efficiency
            temp_cabinet = self._add_jitter(-17.0, 0.05)
            compressor_power = self._add_jitter(650.0, 0.1)
            cop = self._add_jitter(1.5, 0.1)  # Low efficiency
            fault = "NORMAL"
            fault_id = 0

        # Add jitter to all values for realism
        temp_cabinet = self._add_jitter(temp_cabinet, 0.01)
        temp_ambient = self._add_jitter(temp_ambient, 0.02)

        return {
            "sensor_type": "freezer",
            "device_id": device_id,
            "lat": unit["lat"],
            "lon": unit["lon"],
            "location_name": unit["location_name"],
            "temp_cabinet": round(temp_cabinet, 2),
            "temp_ambient": round(temp_ambient, 2),
            "door_open": door_open,
            "defrost_on": defrost_on,
            "compressor_power_w": round(compressor_power, 1),
            "compressor_freq_hz": round(compressor_freq, 1),
            "frost_level": round(frost_level, 3),
            "cop": round(cop, 2),
            "fault": fault,
            "fault_id": fault_id,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

    def send_reading(self, reading: dict) -> bool:
        """Send a reading to the server."""
        try:
            response = requests.post(
                self.server_url,
                json=reading,
                headers={"Content-Type": "application/json"},
                timeout=5
            )
            return response.status_code == 200
        except requests.exceptions.RequestException as e:
            print(f"Error sending data: {e}")
            return False

    def run(self, interval: float = 5.0, test_mode: bool = False):
        """Run the simulator, streaming data at the specified interval."""
        print(f"\nStarting Subzero Fleet Simulator")
        print(f"Server: {self.server_url}")
        print(f"Interval: {interval} seconds")
        print(f"Units: {len(FLEET_CONFIG)}")
        print("-" * 50)

        iteration = 0
        while True:
            iteration += 1
            print(f"\n[Iteration {iteration}]")

            for unit in FLEET_CONFIG:
                reading = self._get_reading(unit)
                success = self.send_reading(reading)

                status_icon = "✓" if success else "✗"
                temp = reading["temp_cabinet"]
                fault = reading["fault"]
                door = "🚪" if reading["door_open"] else ""

                print(f"  {status_icon} {reading['device_id']} ({reading['location_name']}): {temp:.1f}°C {fault} {door}")

            if test_mode:
                print("\nTest mode - exiting after one iteration")
                break

            time.sleep(interval)


def main():
    parser = argparse.ArgumentParser(description="Subzero Fleet Simulator")
    parser.add_argument(
        "--csv",
        default="../datasets/fridge_fault_timeseries_dataset.csv",
        help="Path to the CSV dataset"
    )
    parser.add_argument(
        "--server",
        default=SERVER_URL,
        help="Server URL for POST requests"
    )
    parser.add_argument(
        "--interval",
        type=float,
        default=5.0,
        help="Interval between readings in seconds"
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="Test mode - run one iteration and exit"
    )

    args = parser.parse_args()

    # Resolve CSV path
    csv_path = Path(args.csv)
    if not csv_path.is_absolute():
        csv_path = Path(__file__).parent / args.csv

    if not csv_path.exists():
        print(f"Error: CSV file not found at {csv_path}")
        return 1

    simulator = FreezerSimulator(str(csv_path), args.server)
    simulator.load_data()
    simulator.run(interval=args.interval, test_mode=args.test)

    return 0


if __name__ == "__main__":
    exit(main())
