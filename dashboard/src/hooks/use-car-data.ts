"use client";

import { useState, useEffect } from "react";
import { getSocket } from "@/lib/socket";

export interface CarReading {
  sensor_id: string;
  speed_kmh: number;
  rpm: number;
  throttle_pos_pct: number;
  coolant_temp_c: number;
  timestamp: string;
}

export interface CarState {
  history: CarReading[];
  latestReading: CarReading | null;
  isConnected: boolean;
  isOnline: boolean;
  lastDataReceived: string | null;
}

export function useCarData() {
  const [state, setState] = useState<CarState>({
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

    socket.on("initialCarData", (data: { history: CarReading[]; lastDataReceived: string | null }) => {
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

    socket.on("carData", (data: CarReading) => {
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
      socket.off("initialCarData");
      socket.off("carData");
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
