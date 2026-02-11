#!/usr/bin/env python3
"""
summarize.py — Send cold storage event logs to an LLM API for narrative generation.

Reads JSONL event logs from the ESP32-S3 (via file, serial, or HTTP) and sends
them to an LLM to produce a human-readable narrative of what happened.

Usage:
    # From a file (downloaded from ESP32-S3 SPIFFS):
    python summarize.py --input events.jsonl

    # From serial port:
    python summarize.py --serial /dev/cu.usbmodem14101

    # From ESP32-S3 HTTP endpoint:
    python summarize.py --url http://192.168.1.100/events

Environment:
    ANTHROPIC_API_KEY — API key for Claude (default LLM)
    OPENAI_API_KEY   — API key for OpenAI (alternative)
"""

import argparse
import json
import os
import sys
from datetime import datetime

# LLM provider imports are deferred to avoid hard dependency


SYSTEM_PROMPT = """\
You are analyzing cold storage monitoring data from an ESP32-S3 device equipped \
with an accelerometer and temperature sensor. An on-device autoencoder-based \
anomaly detection model flags events that deviate from the learned baseline of \
normal refrigeration operation.

Each event includes:
- ts: Unix timestamp
- event: Detection type (usually "anomaly")
- score: Reconstruction error / anomaly score (higher = more unusual)
- temp: Temperature in Celsius at time of detection
- accel_mag: Accelerometer magnitude in g-force

Interpret these events and write a concise narrative (3-8 sentences) that:
1. Groups related events into incidents (e.g., a door opening followed by temp rise)
2. Identifies likely causes based on sensor patterns:
   - High accel + temp rise → door opening
   - Sustained high accel → compressor vibration anomaly
   - Gradual temp rise with low accel → cooling system degradation
   - Sudden temp spike → possible seal failure or power issue
3. Highlights any concerning trends or urgent issues
4. Suggests actionable next steps if warranted

Use specific times and measurements. Be direct and practical."""


def load_events_from_file(path: str) -> list[dict]:
    """Load JSONL events from a file."""
    events = []
    with open(path, "r") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    events.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    return events


def load_events_from_serial(port: str, timeout: float = 5.0) -> list[dict]:
    """Read events from ESP32-S3 via serial port."""
    try:
        import serial
    except ImportError:
        print("Install pyserial: pip install pyserial", file=sys.stderr)
        sys.exit(1)

    events = []
    ser = serial.Serial(port, 115200, timeout=timeout)

    # Send dump command
    ser.write(b"DUMP_EVENTS\n")

    reading = False
    while True:
        line = ser.readline().decode("utf-8", errors="ignore").strip()
        if not line:
            if reading:
                break
            continue
        if line == "=== BEGIN EVENTS ===":
            reading = True
            continue
        if line == "=== END EVENTS ===":
            break
        if reading:
            try:
                events.append(json.loads(line))
            except json.JSONDecodeError:
                continue

    ser.close()
    return events


def load_events_from_url(url: str) -> list[dict]:
    """Fetch events from ESP32-S3 HTTP endpoint."""
    import urllib.request

    with urllib.request.urlopen(url, timeout=10) as resp:
        content = resp.read().decode("utf-8")

    events = []
    for line in content.strip().split("\n"):
        line = line.strip()
        if line:
            try:
                events.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return events


def format_events_for_llm(events: list[dict]) -> str:
    """Format events into a readable block for the LLM prompt."""
    lines = []
    for e in events:
        ts = e.get("ts", 0)
        time_str = datetime.fromtimestamp(ts).strftime("%Y-%m-%d %H:%M:%S") if ts > 0 else "unknown"
        lines.append(
            f"[{time_str}] event={e.get('event', '?')} "
            f"score={e.get('score', 0):.4f} "
            f"temp={e.get('temp', 0):.1f}°C "
            f"accel={e.get('accel_mag', 0):.2f}g"
        )
    return "\n".join(lines)


def summarize_with_anthropic(events_text: str, api_key: str) -> str:
    """Send events to Claude API for narrative generation."""
    try:
        import anthropic
    except ImportError:
        print("Install anthropic SDK: pip install anthropic", file=sys.stderr)
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"Here are the anomaly events detected in the last monitoring period:\n\n{events_text}\n\nPlease provide a narrative summary.",
            }
        ],
    )
    return message.content[0].text


def summarize_with_openai(events_text: str, api_key: str) -> str:
    """Send events to OpenAI API for narrative generation."""
    try:
        import openai
    except ImportError:
        print("Install openai SDK: pip install openai", file=sys.stderr)
        sys.exit(1)

    client = openai.OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        max_tokens=1024,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Here are the anomaly events detected in the last monitoring period:\n\n{events_text}\n\nPlease provide a narrative summary.",
            },
        ],
    )
    return response.choices[0].message.content


def main():
    parser = argparse.ArgumentParser(
        description="Generate LLM narrative from cold storage anomaly events"
    )
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--input", type=str, help="Path to events.jsonl file")
    source.add_argument("--serial", type=str, help="Serial port (e.g., /dev/cu.usbmodem14101)")
    source.add_argument("--url", type=str, help="ESP32-S3 HTTP endpoint URL")

    parser.add_argument("--provider", choices=["anthropic", "openai"], default="anthropic",
                        help="LLM provider (default: anthropic)")
    parser.add_argument("--output", type=str, help="Save narrative to file")
    args = parser.parse_args()

    # Load events
    if args.input:
        events = load_events_from_file(args.input)
    elif args.serial:
        events = load_events_from_serial(args.serial)
    else:
        events = load_events_from_url(args.url)

    if not events:
        print("No events found. Nothing to summarize.")
        return

    print(f"Loaded {len(events)} events")

    # Format for LLM
    events_text = format_events_for_llm(events)
    print(f"\n--- Events ---\n{events_text}\n--------------\n")

    # Get API key
    if args.provider == "anthropic":
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            print("Set ANTHROPIC_API_KEY environment variable", file=sys.stderr)
            sys.exit(1)
        narrative = summarize_with_anthropic(events_text, api_key)
    else:
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            print("Set OPENAI_API_KEY environment variable", file=sys.stderr)
            sys.exit(1)
        narrative = summarize_with_openai(events_text, api_key)

    # Output
    print("\n=== Cold Storage Narrative ===\n")
    print(narrative)
    print("\n==============================")

    if args.output:
        with open(args.output, "w") as f:
            f.write(narrative)
        print(f"\nNarrative saved to {args.output}")


if __name__ == "__main__":
    main()
