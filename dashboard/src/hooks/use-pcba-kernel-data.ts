"use client";

import { useState, useEffect, useCallback } from "react";
import { getSocket } from "@/lib/socket";

// Import shared state config from original kernel hook
import { KERNEL_STATES, KERNEL_STATE_CONFIG, type KernelStateName } from "./use-kernel-data";
export { KERNEL_STATES, KERNEL_STATE_CONFIG, type KernelStateName };

// PCBA-specific feature interface (14 features from temp + vibration + door)
export interface PcbaFeatures {
  temp_mean: number;
  temp_delta: number;
  temp_rate: number;
  temp_volatility: number;
  vib_rms: number;
  vib_rms_delta: number;
  vib_dom_freq: number;
  vib_spectral_stability: number;
  vib_spectral_entropy: number;
  vib_duty_cycle: number;
  door_angle_norm: number;
  door_open_duration: number;
  cooling_efficiency_proxy: number;
  temp_rate_vs_vib: number;
}

export interface PcbaClassification {
  state: number;
  state_name: KernelStateName;
  confidence: number;
  method: string;
  sensor_consistency: number;
  consistency_penalties: string[];
  feature_snapshot: PcbaFeatures;
  timestamp: string;
}

export interface PcbaBlock {
  temp: number;
  block_rms: number;
  block_dom_freq: number;
  block_spectral_entropy: number;
  door_angle_deg: number;
  door_open_duration_s: number;
  timestamp: string;
}

export interface PcbaDevice {
  device_id: string;
  profile: string;
  location_name: string;
  lat: number;
  lon: number;
  current_state: PcbaClassification | null;
  markov_maturity: string;
  total_transitions: number;
  temp?: number;
  vib_rms?: number;
  vib_dom_freq?: number;
}

export interface PcbaAlert {
  type: string;
  device_id: string;
  from_state: string;
  to_state: string;
  probability: number;
  time_period: string;
  severity: string;
  message: string;
  timestamp: string;
  classification?: PcbaClassification;
}

export interface PcbaStateUpdate {
  device_id: string;
  block: PcbaBlock;
  classification: PcbaClassification | null;
  markov_maturity: string;
  total_transitions: number;
}

export interface PcbaDataState {
  devices: Record<string, PcbaDevice>;
  alerts: PcbaAlert[];
  selectedDevice: string | null;
  simulatorRunning: boolean;
  tick: number;
  isConnected: boolean;
  isOnline: boolean;
  lastDataReceived: string | null;
  featureHistory: Record<string, PcbaFeatures[]>;
  stateTimeline: Record<string, Array<{ state: KernelStateName; timestamp: string }>>;
  pcbaMlpLoaded: boolean;
}

const ONLINE_TIMEOUT = 30000;
const FEATURE_HISTORY_MAX = 60;
const STATE_TIMELINE_MAX = 120;

export function usePcbaKernelData() {
  const [state, setState] = useState<PcbaDataState>({
    devices: {},
    alerts: [],
    selectedDevice: null,
    simulatorRunning: false,
    tick: 0,
    isConnected: false,
    isOnline: false,
    lastDataReceived: null,
    featureHistory: {},
    stateTimeline: {},
    pcbaMlpLoaded: false,
  });

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setState(prev => ({ ...prev, isConnected: true }));
    const onDisconnect = () => setState(prev => ({ ...prev, isConnected: false, isOnline: false }));

    const onInitialData = (data: any) => {
      const devices: Record<string, PcbaDevice> = {};
      if (data.devices) {
        Object.entries(data.devices).forEach(([id, d]: [string, any]) => {
          devices[id] = {
            device_id: id,
            profile: d.profile || '',
            location_name: d.location_name || '',
            lat: d.lat || 0,
            lon: d.lon || 0,
            current_state: d.current_state || null,
            markov_maturity: d.markov_maturity || 'Learning',
            total_transitions: d.total_transitions || 0,
          };
        });
      }

      const alerts: PcbaAlert[] = [];
      if (data.alerts) {
        Object.values(data.alerts).forEach((deviceAlerts: any) => {
          if (Array.isArray(deviceAlerts)) alerts.push.apply(alerts, deviceAlerts);
        });
      }

      setState(prev => ({
        ...prev,
        devices,
        alerts: alerts.slice(-50),
        simulatorRunning: data.simulatorRunning || false,
        tick: data.tick || 0,
        pcbaMlpLoaded: data.pcbaMlpLoaded || false,
        isOnline: true,
        lastDataReceived: new Date().toISOString(),
      }));
    };

    const onStateUpdate = (update: PcbaStateUpdate) => {
      setState(prev => {
        const devices = { ...prev.devices };
        const deviceId = update.device_id;

        if (!devices[deviceId]) {
          devices[deviceId] = {
            device_id: deviceId,
            profile: '',
            location_name: '',
            lat: 0, lon: 0,
            current_state: null,
            markov_maturity: 'Learning',
            total_transitions: 0,
          };
        }

        devices[deviceId] = {
          ...devices[deviceId],
          current_state: update.classification,
          markov_maturity: update.markov_maturity,
          total_transitions: update.total_transitions,
          temp: update.block?.temp,
          vib_rms: update.block?.block_rms,
          vib_dom_freq: update.block?.block_dom_freq,
        };

        // Feature history
        const featureHistory = { ...prev.featureHistory };
        if (update.classification?.feature_snapshot) {
          const hist = (featureHistory[deviceId] || []).concat([update.classification.feature_snapshot]);
          if (hist.length > FEATURE_HISTORY_MAX) hist.shift();
          featureHistory[deviceId] = hist;
        }

        // State timeline
        const stateTimeline = { ...prev.stateTimeline };
        if (update.classification) {
          const timeline = (stateTimeline[deviceId] || []).concat([{
            state: update.classification.state_name as KernelStateName,
            timestamp: update.classification.timestamp,
          }]);
          if (timeline.length > STATE_TIMELINE_MAX) timeline.shift();
          stateTimeline[deviceId] = timeline;
        }

        return {
          ...prev,
          devices,
          featureHistory,
          stateTimeline,
          isOnline: true,
          lastDataReceived: new Date().toISOString(),
        };
      });
    };

    const onAlert = (alert: PcbaAlert) => {
      setState(prev => {
        const alerts = prev.alerts.concat([alert]);
        if (alerts.length > 50) alerts.shift();
        return { ...prev, alerts };
      });
    };

    const onSimulatorStatus = (status: { running: boolean; tick: number }) => {
      setState(prev => ({
        ...prev,
        simulatorRunning: status.running,
        tick: status.tick,
      }));
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("initialPcbaKernelData", onInitialData);
    socket.on("pcbaKernelStateUpdate", onStateUpdate);
    socket.on("pcbaKernelAlert", onAlert);
    socket.on("pcbaKernelSimulatorStatus", onSimulatorStatus);

    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("initialPcbaKernelData", onInitialData);
      socket.off("pcbaKernelStateUpdate", onStateUpdate);
      socket.off("pcbaKernelAlert", onAlert);
      socket.off("pcbaKernelSimulatorStatus", onSimulatorStatus);
    };
  }, []);

  // Online check (30s timeout)
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        if (!prev.lastDataReceived) return prev;
        const isOnline = Date.now() - new Date(prev.lastDataReceived).getTime() < ONLINE_TIMEOUT;
        return isOnline !== prev.isOnline ? { ...prev, isOnline } : prev;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const selectDevice = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selectedDevice: id }));
  }, []);

  const startSimulator = useCallback(() => {
    getSocket().emit("startPcbaSimulator");
  }, []);

  const stopSimulator = useCallback(() => {
    getSocket().emit("stopPcbaSimulator");
  }, []);

  const deviceList = Object.values(state.devices);

  const stateCount = deviceList.reduce(
    (acc, d) => {
      const stateName = d.current_state?.state_name || "UNKNOWN";
      acc[stateName] = (acc[stateName] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    ...state,
    deviceList,
    selectDevice,
    startSimulator,
    stopSimulator,
    stateCount,
  };
}
