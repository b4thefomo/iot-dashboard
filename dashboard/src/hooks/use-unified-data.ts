"use client";

import { useState, useEffect } from "react";
import { getSocket } from "@/lib/socket";
import { SensorReading } from "./use-sensor-data";
import { CarReading } from "./use-car-data";

export interface UnifiedState {
  weather: {
    history: SensorReading[];
    latestReading: SensorReading | null;
    isOnline: boolean;
  };
  car: {
    history: CarReading[];
    latestReading: CarReading | null;
    isOnline: boolean;
  };
  isConnected: boolean;
}

export function useUnifiedData() {
  const [state, setState] = useState<UnifiedState>({
    weather: {
      history: [],
      latestReading: null,
      isOnline: false,
    },
    car: {
      history: [],
      latestReading: null,
      isOnline: false,
    },
    isConnected: false,
  });

  useEffect(() => {
    const socket = getSocket();

    socket.on("connect", () => {
      setState((prev) => ({ ...prev, isConnected: true }));
    });

    socket.on("disconnect", () => {
      setState((prev) => ({ ...prev, isConnected: false }));
    });

    // Weather data
    socket.on("initialData", (data: { history: SensorReading[]; lastDataReceived: string | null }) => {
      const latestReading = data.history.length > 0 ? data.history[data.history.length - 1] : null;
      const now = new Date();
      const lastData = data.lastDataReceived ? new Date(data.lastDataReceived) : null;
      const isOnline = lastData ? (now.getTime() - lastData.getTime()) < 30000 : false;

      setState((prev) => ({
        ...prev,
        weather: {
          history: data.history,
          latestReading,
          isOnline,
        },
      }));
    });

    socket.on("sensorData", (data: SensorReading) => {
      setState((prev) => {
        const newHistory = [...prev.weather.history, data];
        if (newHistory.length > 100) newHistory.shift();
        return {
          ...prev,
          weather: {
            history: newHistory,
            latestReading: data,
            isOnline: true,
          },
        };
      });
    });

    // Car data
    socket.on("initialCarData", (data: { history: CarReading[]; lastDataReceived: string | null }) => {
      const latestReading = data.history.length > 0 ? data.history[data.history.length - 1] : null;
      const now = new Date();
      const lastData = data.lastDataReceived ? new Date(data.lastDataReceived) : null;
      const isOnline = lastData ? (now.getTime() - lastData.getTime()) < 30000 : false;

      setState((prev) => ({
        ...prev,
        car: {
          history: data.history,
          latestReading,
          isOnline,
        },
      }));
    });

    socket.on("carData", (data: CarReading) => {
      setState((prev) => {
        const newHistory = [...prev.car.history, data];
        if (newHistory.length > 100) newHistory.shift();
        return {
          ...prev,
          car: {
            history: newHistory,
            latestReading: data,
            isOnline: true,
          },
        };
      });
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("initialData");
      socket.off("sensorData");
      socket.off("initialCarData");
      socket.off("carData");
    };
  }, []);

  // Check online status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        const now = new Date();
        return {
          ...prev,
          weather: {
            ...prev.weather,
            isOnline: prev.weather.latestReading
              ? (now.getTime() - new Date(prev.weather.latestReading.timestamp).getTime()) < 30000
              : false,
          },
          car: {
            ...prev.car,
            isOnline: prev.car.latestReading
              ? (now.getTime() - new Date(prev.car.latestReading.timestamp).getTime()) < 30000
              : false,
          },
        };
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return state;
}
