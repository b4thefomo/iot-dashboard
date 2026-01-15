"use client";

import { useState, useEffect, useCallback } from "react";
import { getSocket } from "@/lib/socket";

export interface FreezerReading {
  device_id: string;
  lat: number;
  lon: number;
  location_name: string;
  temp_cabinet: number;
  temp_ambient: number;
  door_open: boolean;
  defrost_on: boolean;
  compressor_power_w: number;
  compressor_freq_hz: number;
  frost_level: number;
  cop: number;
  fault: string;
  fault_id: number;
  timestamp: string;
}

export interface FleetState {
  devices: Record<string, FreezerReading>;
  alerts: FreezerReading[];
  selectedDevice: string | null;
  deviceHistory: FreezerReading[];
  isConnected: boolean;
  isOnline: boolean;
  lastDataReceived: string | null;
}

const ONLINE_TIMEOUT = 30000; // 30 seconds

export function useFleetData() {
  const [state, setState] = useState<FleetState>({
    devices: {},
    alerts: [],
    selectedDevice: null,
    deviceHistory: [],
    isConnected: false,
    isOnline: false,
    lastDataReceived: null,
  });

  // Helper to determine if a device has an alert
  const hasAlert = useCallback((device: FreezerReading): boolean => {
    return (
      device.fault !== "NORMAL" ||
      device.door_open ||
      device.temp_cabinet > -5 ||
      device.frost_level > 0.5
    );
  }, []);

  // Helper to get device status
  const getDeviceStatus = useCallback((device: FreezerReading): "healthy" | "warning" | "critical" => {
    if (device.fault !== "NORMAL" || device.temp_cabinet > -5) {
      return "critical";
    }
    if (device.door_open || device.frost_level > 0.5) {
      return "warning";
    }
    return "healthy";
  }, []);

  // Select a device to view details
  const selectDevice = useCallback((deviceId: string | null) => {
    setState((prev) => ({
      ...prev,
      selectedDevice: deviceId,
      deviceHistory: [], // Will be populated via API call if needed
    }));
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setState((prev) => ({ ...prev, isConnected: true }));
    };

    const handleDisconnect = () => {
      setState((prev) => ({ ...prev, isConnected: false }));
    };

    const handleInitialFleetData = (data: {
      devices: Record<string, FreezerReading>;
      history: Record<string, FreezerReading[]>;
      lastDataReceived: string | null;
    }) => {
      const devices = data.devices || {};
      const alerts = Object.values(devices).filter(hasAlert);

      setState((prev) => ({
        ...prev,
        devices,
        alerts,
        lastDataReceived: data.lastDataReceived,
        isOnline: data.lastDataReceived
          ? Date.now() - new Date(data.lastDataReceived).getTime() < ONLINE_TIMEOUT
          : false,
      }));
    };

    const handleFreezerData = (reading: FreezerReading) => {
      setState((prev) => {
        const newDevices = {
          ...prev.devices,
          [reading.device_id]: reading,
        };
        const alerts = Object.values(newDevices).filter(hasAlert);

        return {
          ...prev,
          devices: newDevices,
          alerts,
          lastDataReceived: reading.timestamp,
          isOnline: true,
        };
      });
    };

    const handleFleetUpdate = (fleetStatus: Record<string, FreezerReading>) => {
      const alerts = Object.values(fleetStatus).filter(hasAlert);

      setState((prev) => ({
        ...prev,
        devices: fleetStatus,
        alerts,
        isOnline: true,
        lastDataReceived: new Date().toISOString(),
      }));
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("initialFleetData", handleInitialFleetData);
    socket.on("freezerData", handleFreezerData);
    socket.on("fleetUpdate", handleFleetUpdate);

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
      socket.off("initialFleetData", handleInitialFleetData);
      socket.off("freezerData", handleFreezerData);
      socket.off("fleetUpdate", handleFleetUpdate);
      clearInterval(interval);
    };
  }, [hasAlert]);

  // Computed values
  const deviceList = Object.values(state.devices);
  const healthyCount = deviceList.filter((d) => getDeviceStatus(d) === "healthy").length;
  const warningCount = deviceList.filter((d) => getDeviceStatus(d) === "warning").length;
  const criticalCount = deviceList.filter((d) => getDeviceStatus(d) === "critical").length;

  return {
    ...state,
    deviceList,
    healthyCount,
    warningCount,
    criticalCount,
    selectDevice,
    getDeviceStatus,
    hasAlert,
  };
}
