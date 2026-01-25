"use client";

import { useState, useEffect, useCallback } from "react";
import { getSocket } from "@/lib/socket";

export interface HomeFreezer2Reading {
  device_id: string;
  temp_c: number;
  // Door sensor data
  door_status: 'OPEN' | 'CLOSED';
  is_door_open: boolean;
  // Accelerometer/compressor vibration data
  accel_x: number;
  accel_y: number;
  accel_z: number;
  firmware_version: string;
  timestamp: string;
  raw_timestamp: number;
}

export interface HomeFreezer2State {
  history: HomeFreezer2Reading[];
  latest: HomeFreezer2Reading | null;
  isConnected: boolean;
  isOnline: boolean;
  lastDataReceived: string | null;
  status: "healthy" | "warning" | "critical" | "unknown";
}

const ONLINE_TIMEOUT = 30000; // 30 seconds

export function useHomeFreezer2Data() {
  const [state, setState] = useState<HomeFreezer2State>({
    history: [],
    latest: null,
    isConnected: false,
    isOnline: false,
    lastDataReceived: null,
    status: "unknown",
  });

  // Helper to get status from temperature
  const getStatus = useCallback((temp: number): "healthy" | "warning" | "critical" => {
    if (temp > -10) return "critical";
    if (temp > -15 || temp < -25) return "warning";
    return "healthy";
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setState((prev) => ({ ...prev, isConnected: true }));
    };

    const handleDisconnect = () => {
      setState((prev) => ({ ...prev, isConnected: false }));
    };

    const handleInitialHomeFreezer2Data = (data: {
      history: HomeFreezer2Reading[];
      lastDataReceived: string | null;
    }) => {
      const history = data.history || [];
      const latest = history.length > 0 ? history[history.length - 1] : null;

      setState((prev) => ({
        ...prev,
        history,
        latest,
        lastDataReceived: data.lastDataReceived,
        isOnline: data.lastDataReceived
          ? Date.now() - new Date(data.lastDataReceived).getTime() < ONLINE_TIMEOUT
          : false,
        status: latest ? getStatus(latest.temp_c) : "unknown",
      }));
    };

    const handleHomeFreezer2Data = (reading: HomeFreezer2Reading) => {
      setState((prev) => {
        const newHistory = [...prev.history, reading];
        // Keep max 100 readings
        if (newHistory.length > 100) newHistory.shift();

        return {
          ...prev,
          history: newHistory,
          latest: reading,
          lastDataReceived: reading.timestamp,
          isOnline: true,
          status: getStatus(reading.temp_c),
        };
      });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("initialHomeFreezer2Data", handleInitialHomeFreezer2Data);
    socket.on("homeFreezer2Data", handleHomeFreezer2Data);

    // Set initial connection state
    if (socket.connected) {
      setState((prev) => ({ ...prev, isConnected: true }));
    }

    // Check online status periodically
    const interval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        isOnline: prev.lastDataReceived
          ? Date.now() - new Date(prev.lastDataReceived).getTime() < ONLINE_TIMEOUT
          : false,
      }));
    }, 5000);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("initialHomeFreezer2Data", handleInitialHomeFreezer2Data);
      socket.off("homeFreezer2Data", handleHomeFreezer2Data);
      clearInterval(interval);
    };
  }, [getStatus]);

  // Computed values
  const temps = state.history.map((r) => r.temp_c).filter((t) => t !== undefined && t !== -127);
  const avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 0;
  const minTemp = temps.length > 0 ? Math.min(...temps) : 0;
  const maxTemp = temps.length > 0 ? Math.max(...temps) : 0;

  return {
    ...state,
    avgTemp,
    minTemp,
    maxTemp,
    getStatus,
  };
}
