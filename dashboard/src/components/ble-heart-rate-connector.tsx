"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bluetooth, BluetoothOff, Battery, Heart, Loader2 } from "lucide-react";

interface BleHeartRateConnectorProps {
  apiUrl: string;
  onConnectionChange?: (connected: boolean) => void;
}

type ConnectionState = "disconnected" | "connecting" | "connected";

export function BleHeartRateConnector({ apiUrl, onConnectionChange }: BleHeartRateConnectorProps) {
  const [connectionState, setConnectionState] = React.useState<ConnectionState>("disconnected");
  const [deviceName, setDeviceName] = React.useState<string | null>(null);
  const [batteryLevel, setBatteryLevel] = React.useState<number | null>(null);
  const [lastHr, setLastHr] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [bleSupported] = React.useState(() =>
    typeof navigator !== "undefined" && "bluetooth" in navigator
  );

  const deviceRef = React.useRef<BluetoothDevice | null>(null);
  const rrBufferRef = React.useRef<number[]>([]);
  const sessionStartRef = React.useRef<number>(Date.now());
  const readingCountRef = React.useRef<number>(0);
  const hrSumRef = React.useRef<number>(0);
  const maxHrRef = React.useRef<number>(0);

  const getHeartRateZone = (bpm: number): string => {
    if (bpm < 100) return "rest";
    if (bpm < 120) return "zone1";
    if (bpm < 140) return "zone2";
    if (bpm < 160) return "zone3";
    if (bpm < 180) return "zone4";
    return "zone5";
  };

  const computeRmssd = (rrIntervals: number[]): number => {
    if (rrIntervals.length < 2) return 0;
    let sumSquaredDiffs = 0;
    for (let i = 1; i < rrIntervals.length; i++) {
      const diff = rrIntervals[i] - rrIntervals[i - 1];
      sumSquaredDiffs += diff * diff;
    }
    return Math.sqrt(sumSquaredDiffs / (rrIntervals.length - 1));
  };

  const postReading = React.useCallback(
    async (heartRate: number, rrIntervals: number[], contactDetected: boolean) => {
      readingCountRef.current++;
      hrSumRef.current += heartRate;
      maxHrRef.current = Math.max(maxHrRef.current, heartRate);

      // Keep a rolling buffer of RR intervals for HRV computation
      rrBufferRef.current.push(...rrIntervals);
      if (rrBufferRef.current.length > 64) {
        rrBufferRef.current = rrBufferRef.current.slice(-64);
      }

      const hrv = computeRmssd(rrBufferRef.current);
      const sessionDuration = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      const avgHr = readingCountRef.current > 0 ? hrSumRef.current / readingCountRef.current : heartRate;

      const payload = {
        sensor_type: "chest_strap",
        device_id: deviceName || "BLE_CHEST_STRAP",
        timestamp: Date.now(),
        heart_rate_bpm: heartRate,
        heart_rate_zone: getHeartRateZone(heartRate),
        hrv_rmssd_ms: Math.round(hrv * 10) / 10,
        rr_intervals: rrIntervals,
        contact_detected: contactDetected,
        battery_percent: batteryLevel ?? 100,
        session_duration_sec: sessionDuration,
        avg_heart_rate: Math.round(avgHr),
        max_heart_rate: maxHrRef.current,
      };

      try {
        await fetch(`${apiUrl}/api/data`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error("Failed to post chest strap data:", err);
      }
    },
    [apiUrl, deviceName, batteryLevel]
  );

  const handleHeartRateMeasurement = React.useCallback(
    (event: Event) => {
      const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
      const value = characteristic.value;
      if (!value) return;

      // Parse Heart Rate Measurement per Bluetooth spec
      const flags = value.getUint8(0);
      const is16Bit = (flags & 0x01) !== 0;
      const hasContact = (flags & 0x04) !== 0;
      const contactDetected = hasContact ? (flags & 0x02) !== 0 : true;
      const hasRR = (flags & 0x10) !== 0;

      let offset = 1;
      let heartRate: number;
      if (is16Bit) {
        heartRate = value.getUint16(offset, true);
        offset += 2;
      } else {
        heartRate = value.getUint8(offset);
        offset += 1;
      }

      // Skip Energy Expended if present
      if (flags & 0x08) {
        offset += 2;
      }

      // Parse RR intervals
      const rrIntervals: number[] = [];
      if (hasRR) {
        while (offset + 1 < value.byteLength) {
          const rr = value.getUint16(offset, true);
          // RR value is in 1/1024 seconds, convert to ms
          rrIntervals.push((rr / 1024) * 1000);
          offset += 2;
        }
      }

      setLastHr(heartRate);
      postReading(heartRate, rrIntervals, contactDetected);
    },
    [postReading]
  );

  const connect = React.useCallback(async () => {
    if (!bleSupported) {
      setError("Web Bluetooth is not supported in this browser. Use Chrome on Android or Desktop.");
      return;
    }

    setError(null);
    setConnectionState("connecting");

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [0x180d] }],
        optionalServices: [0x180f],
      });

      deviceRef.current = device;
      setDeviceName(device.name || "Chest Strap");

      device.addEventListener("gattserverdisconnected", () => {
        setConnectionState("disconnected");
        setLastHr(null);
        onConnectionChange?.(false);
      });

      const server = await device.gatt!.connect();

      // Heart Rate Service
      const hrService = await server.getPrimaryService(0x180d);
      const hrCharacteristic = await hrService.getCharacteristic(0x2a37);
      await hrCharacteristic.startNotifications();
      hrCharacteristic.addEventListener("characteristicvaluechanged", handleHeartRateMeasurement);

      // Battery Service (optional)
      try {
        const batteryService = await server.getPrimaryService(0x180f);
        const batteryCharacteristic = await batteryService.getCharacteristic(0x2a19);
        const batteryValue = await batteryCharacteristic.readValue();
        setBatteryLevel(batteryValue.getUint8(0));
      } catch {
        // Battery service not available on all devices
      }

      // Reset session tracking
      sessionStartRef.current = Date.now();
      readingCountRef.current = 0;
      hrSumRef.current = 0;
      maxHrRef.current = 0;
      rrBufferRef.current = [];

      setConnectionState("connected");
      onConnectionChange?.(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to connect";
      if (message.includes("cancelled") || message.includes("canceled")) {
        // User cancelled the picker
        setConnectionState("disconnected");
      } else {
        setError(message);
        setConnectionState("disconnected");
      }
    }
  }, [bleSupported, handleHeartRateMeasurement, onConnectionChange]);

  const disconnect = React.useCallback(() => {
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }
    setConnectionState("disconnected");
    setLastHr(null);
    onConnectionChange?.(false);
  }, [onConnectionChange]);

  if (!bleSupported) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {connectionState === "disconnected" && (
        <Button variant="outline" size="sm" onClick={connect}>
          <Bluetooth className="h-4 w-4 mr-1" />
          Connect Chest Strap
        </Button>
      )}

      {connectionState === "connecting" && (
        <Button variant="outline" size="sm" disabled>
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          Connecting...
        </Button>
      )}

      {connectionState === "connected" && (
        <>
          <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700 gap-1">
            <Bluetooth className="h-3 w-3" />
            {deviceName}
          </Badge>
          {lastHr !== null && (
            <Badge variant="outline" className="border-rose-300 bg-rose-50 text-rose-700 gap-1">
              <Heart className="h-3 w-3" />
              {lastHr} BPM
            </Badge>
          )}
          {batteryLevel !== null && (
            <Badge variant="outline" className="gap-1">
              <Battery className="h-3 w-3" />
              {batteryLevel}%
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={disconnect} className="text-slate-500">
            <BluetoothOff className="h-4 w-4" />
          </Button>
        </>
      )}

      {error && (
        <span className="text-xs text-rose-500">{error}</span>
      )}
    </div>
  );
}
