"use client";

import { useState, useEffect } from "react";
import { getSocket } from "@/lib/socket";

export interface SensorReading {
  sensor_id: string;
  temperature: number;
  pressure: number;
  timestamp: string;
}

export interface SensorState {
  history: SensorReading[];
  latestReading: SensorReading | null;
  isConnected: boolean;
  isOnline: boolean;
  lastDataReceived: string | null;
}

export function useSensorData() {
  const [state, setState] = useState<SensorState>({
    history: [],
    latestReading: null,
    isConnected: false,
    isOnline: false,
    lastDataReceived: null,
  });

  useEffect(() => {
    const socket = getSocket();

    socket.on("connect", () => {
      setState((prev) => ({ ...prev, isConnected: true }));
    });

    socket.on("disconnect", () => {
      setState((prev) => ({ ...prev, isConnected: false }));
    });

    socket.on("initialData", (data: { history: SensorReading[]; lastDataReceived: string | null }) => {
      const latestReading = data.history.length > 0 ? data.history[data.history.length - 1] : null;
      const now = new Date();
      const lastData = data.lastDataReceived ? new Date(data.lastDataReceived) : null;
      const isOnline = lastData ? (now.getTime() - lastData.getTime()) < 30000 : false;

      setState((prev) => ({
        ...prev,
        history: data.history,
        latestReading,
        lastDataReceived: data.lastDataReceived,
        isOnline,
      }));
    });

    socket.on("sensorData", (data: SensorReading) => {
      setState((prev) => {
        const newHistory = [...prev.history, data];
        if (newHistory.length > 100) {
          newHistory.shift();
        }
        return {
          ...prev,
          history: newHistory,
          latestReading: data,
          lastDataReceived: data.timestamp,
          isOnline: true,
        };
      });
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("initialData");
      socket.off("sensorData");
    };
  }, []);

  // Check online status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        if (!prev.lastDataReceived) return prev;
        const now = new Date();
        const lastData = new Date(prev.lastDataReceived);
        const isOnline = (now.getTime() - lastData.getTime()) < 30000;
        return { ...prev, isOnline };
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return state;
}
