"use client";

import { useState, useEffect, useCallback } from "react";
import { getSocket } from "@/lib/socket";

// 9 Kernel operational states
export const KERNEL_STATES = [
  "STABLE", "DOOR_OPEN", "RECOVERING", "DEFROST",
  "DRIFT_WARM", "DRIFT_COLD", "EXCURSION", "COMP_STRESS", "FAULT",
] as const;

export type KernelStateName = (typeof KERNEL_STATES)[number];

export interface KernelStateConfig {
  name: KernelStateName;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  description: string;
}

export const KERNEL_STATE_CONFIG: Record<KernelStateName, KernelStateConfig> = {
  STABLE: { name: "STABLE", label: "Stable", color: "#22c55e", bgColor: "bg-green-500/20", textColor: "text-green-400", description: "Normal operation" },
  DOOR_OPEN: { name: "DOOR_OPEN", label: "Door Open", color: "#f59e0b", bgColor: "bg-amber-500/20", textColor: "text-amber-400", description: "Door open detected" },
  RECOVERING: { name: "RECOVERING", label: "Recovering", color: "#3b82f6", bgColor: "bg-blue-500/20", textColor: "text-blue-400", description: "Cooling back to target" },
  DEFROST: { name: "DEFROST", label: "Defrost", color: "#8b5cf6", bgColor: "bg-violet-500/20", textColor: "text-violet-400", description: "Defrost cycle active" },
  DRIFT_WARM: { name: "DRIFT_WARM", label: "Drift Warm", color: "#f97316", bgColor: "bg-orange-500/20", textColor: "text-orange-400", description: "Gradual warming trend" },
  DRIFT_COLD: { name: "DRIFT_COLD", label: "Drift Cold", color: "#06b6d4", bgColor: "bg-cyan-500/20", textColor: "text-cyan-400", description: "Overcooling trend" },
  EXCURSION: { name: "EXCURSION", label: "Excursion", color: "#ef4444", bgColor: "bg-red-500/20", textColor: "text-red-400", description: "Temperature outside safe range" },
  COMP_STRESS: { name: "COMP_STRESS", label: "Comp Stress", color: "#ec4899", bgColor: "bg-pink-500/20", textColor: "text-pink-400", description: "Compressor anomaly" },
  FAULT: { name: "FAULT", label: "Fault", color: "#dc2626", bgColor: "bg-red-600/20", textColor: "text-red-500", description: "Equipment fault detected" },
};

export interface KernelClassification {
  state: number;
  state_name: KernelStateName;
  confidence: number;
  method: string;
  sensor_consistency: number;
  consistency_penalties: string[];
  feature_snapshot: KernelFeatures;
  timestamp: string;
}

export interface KernelFeatures {
  temp_mean: number;
  temp_delta: number;
  temp_rate: number;
  temp_volatility: number;
  temp_ambient_gap: number;
  power_mean: number;
  power_delta: number;
  freq_mean: number;
  freq_stability: number;
  cop_mean: number;
  cop_trend: number;
  temp_rate_vs_power: number;
  recovery_efficiency: number;
  door_state: number;
  door_duration: number;
}

export interface KernelReading {
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

export interface KernelDevice {
  device_id: string;
  profile: string;
  location_name: string;
  lat: number;
  lon: number;
  current_reading: KernelReading | null;
  current_state: KernelClassification | null;
  markov_maturity: string;
  total_transitions: number;
}

export interface KernelAlert {
  type: string;
  device_id: string;
  from_state: string;
  to_state: string;
  probability: number;
  time_period: string;
  severity: string;
  message: string;
  timestamp: string;
  classification?: KernelClassification;
}

export interface KernelDeviceSummary {
  device_id: string;
  current_state: string;
  state_breakdown: Record<string, number>;
  temp_avg: number | null;
  temp_min: number | null;
  temp_max: number | null;
  power_avg: number | null;
  anomaly_count: number;
  markov_maturity: string;
  total_transitions: number;
}

export interface KernelSummary {
  timestamp: string;
  tick: number;
  simulator_running: boolean;
  mlpLoaded?: boolean;
  devices: Record<string, KernelDeviceSummary>;
  fleet_summary: {
    total_devices: number;
    healthy: number;
    warning: number;
    critical: number;
  };
}

export interface KernelStateUpdate {
  device_id: string;
  reading: KernelReading;
  classification: KernelClassification | null;
  markov_maturity: string;
  total_transitions: number;
  ground_truth?: string;
}

export interface KernelReplayStatus {
  running: boolean;
  runId: number | null;
  fault: string | null;
  speed: number;
  progress: number;
  total: number;
}

export interface KernelDataState {
  devices: Record<string, KernelDevice>;
  alerts: KernelAlert[];
  summary: KernelSummary | null;
  selectedDevice: string | null;
  simulatorRunning: boolean;
  tick: number;
  isConnected: boolean;
  isOnline: boolean;
  lastDataReceived: string | null;
  // Per-device feature history for sparklines
  featureHistory: Record<string, KernelFeatures[]>;
  // Per-device state timeline
  stateTimeline: Record<string, Array<{ state: KernelStateName; timestamp: string }>>;
  // Replay state
  replayRunning: boolean;
  replayRunId: number | null;
  replayFault: string | null;
  replayProgress: number;
  replayTotal: number;
  replaySpeed: number;
  // Ground truth per device (only during replay)
  groundTruth: Record<string, string>;
  // C2: MLP model status
  mlpLoaded: boolean;
}

const ONLINE_TIMEOUT = 30000;
const FEATURE_HISTORY_MAX = 60;
const STATE_TIMELINE_MAX = 120;

export function useKernelData() {
  const [state, setState] = useState<KernelDataState>({
    devices: {},
    alerts: [],
    summary: null,
    selectedDevice: null,
    simulatorRunning: false,
    tick: 0,
    isConnected: false,
    isOnline: false,
    lastDataReceived: null,
    featureHistory: {},
    stateTimeline: {},
    replayRunning: false,
    replayRunId: null,
    replayFault: null,
    replayProgress: 0,
    replayTotal: 0,
    replaySpeed: 1,
    groundTruth: {},
    mlpLoaded: true,  // assume loaded until server tells us otherwise
  });

  const selectDevice = useCallback((deviceId: string | null) => {
    setState((prev) => ({ ...prev, selectedDevice: deviceId }));
  }, []);

  const startSimulator = useCallback(() => {
    const socket = getSocket();
    socket.emit("startKernelSimulator");
  }, []);

  const stopSimulator = useCallback(() => {
    const socket = getSocket();
    socket.emit("stopKernelSimulator");
  }, []);

  const startReplay = useCallback((runId: number, speed: number) => {
    const socket = getSocket();
    socket.emit("startKernelReplay", { runId, speed });
  }, []);

  const stopReplay = useCallback(() => {
    const socket = getSocket();
    socket.emit("stopKernelReplay");
  }, []);

  const setReplaySpeed = useCallback((speed: number) => {
    const socket = getSocket();
    socket.emit("setKernelReplaySpeed", { speed });
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setState((prev) => ({ ...prev, isConnected: true }));
    };

    const handleDisconnect = () => {
      setState((prev) => ({ ...prev, isConnected: false }));
    };

    const handleInitialKernelData = (data: {
      devices: Record<string, KernelDevice>;
      alerts: Record<string, KernelAlert[]>;
      simulatorRunning: boolean;
      tick: number;
      replayRunning?: boolean;
      replayRunId?: number | null;
      replayFault?: string | null;
      replaySpeed?: number;
      replayProgress?: number;
      replayTotal?: number;
      mlpLoaded?: boolean;
    }) => {
      const allAlerts: KernelAlert[] = [];
      for (const deviceAlerts of Object.values(data.alerts || {})) {
        allAlerts.push(...deviceAlerts);
      }
      allAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setState((prev) => ({
        ...prev,
        devices: data.devices || {},
        alerts: allAlerts.slice(0, 50),
        simulatorRunning: data.simulatorRunning,
        tick: data.tick,
        isOnline: data.simulatorRunning || !!data.replayRunning,
        replayRunning: !!data.replayRunning,
        replayRunId: data.replayRunId ?? null,
        replayFault: data.replayFault ?? null,
        replaySpeed: data.replaySpeed ?? 1,
        replayProgress: data.replayProgress ?? 0,
        replayTotal: data.replayTotal ?? 0,
        mlpLoaded: data.mlpLoaded !== false,
      }));
    };

    const handleStateUpdate = (update: KernelStateUpdate) => {
      setState((prev) => {
        const device = prev.devices[update.device_id] || {} as KernelDevice;
        const updatedDevice: KernelDevice = {
          ...device,
          device_id: update.device_id,
          current_reading: update.reading,
          current_state: update.classification,
          markov_maturity: update.markov_maturity,
          total_transitions: update.total_transitions,
        };

        // Update feature history
        const fh = { ...prev.featureHistory };
        if (update.classification?.feature_snapshot) {
          const hist = [...(fh[update.device_id] || []), update.classification.feature_snapshot];
          fh[update.device_id] = hist.slice(-FEATURE_HISTORY_MAX);
        }

        // Update state timeline
        const st = { ...prev.stateTimeline };
        if (update.classification) {
          const timeline = [...(st[update.device_id] || []), {
            state: update.classification.state_name,
            timestamp: update.classification.timestamp,
          }];
          st[update.device_id] = timeline.slice(-STATE_TIMELINE_MAX);
        }

        // Track ground truth if present
        const gt = { ...prev.groundTruth };
        if (update.ground_truth) {
          gt[update.device_id] = update.ground_truth;
        }

        return {
          ...prev,
          devices: { ...prev.devices, [update.device_id]: updatedDevice },
          lastDataReceived: update.reading?.timestamp || new Date().toISOString(),
          isOnline: true,
          featureHistory: fh,
          stateTimeline: st,
          groundTruth: gt,
        };
      });
    };

    const handleAlert = (alert: KernelAlert) => {
      setState((prev) => {
        const alerts = [alert, ...prev.alerts].slice(0, 50);
        return { ...prev, alerts };
      });
    };

    const handleSummary = (summary: KernelSummary) => {
      setState((prev) => ({
        ...prev,
        summary,
        tick: summary.tick,
        simulatorRunning: summary.simulator_running,
        mlpLoaded: summary.mlpLoaded !== false,
      }));
    };

    const handleSimulatorStatus = (status: { running: boolean; tick: number }) => {
      setState((prev) => ({
        ...prev,
        simulatorRunning: status.running,
        tick: status.tick,
      }));
    };

    const handleReplayStatus = (status: KernelReplayStatus) => {
      setState((prev) => ({
        ...prev,
        replayRunning: status.running,
        replayRunId: status.runId,
        replayFault: status.fault,
        replaySpeed: status.speed,
        replayProgress: status.progress,
        replayTotal: status.total,
        isOnline: status.running || prev.simulatorRunning,
      }));
    };

    const handleReplayComplete = (data: {
      runId: number;
      fault: string;
      stateBreakdown: Record<string, number>;
      totalClassifications: number;
    }) => {
      setState((prev) => ({
        ...prev,
        replayRunning: false,
      }));
      console.log(
        "Replay complete: run", data.runId,
        "fault:", data.fault,
        "classifications:", data.totalClassifications,
        "breakdown:", data.stateBreakdown
      );
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("initialKernelData", handleInitialKernelData);
    socket.on("kernelStateUpdate", handleStateUpdate);
    socket.on("kernelAlert", handleAlert);
    socket.on("kernelSummary", handleSummary);
    socket.on("kernelSimulatorStatus", handleSimulatorStatus);
    socket.on("kernelReplayStatus", handleReplayStatus);
    socket.on("kernelReplayComplete", handleReplayComplete);

    if (socket.connected) {
      setState((prev) => ({ ...prev, isConnected: true }));
    }

    // Online check
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
      socket.off("initialKernelData", handleInitialKernelData);
      socket.off("kernelStateUpdate", handleStateUpdate);
      socket.off("kernelAlert", handleAlert);
      socket.off("kernelSummary", handleSummary);
      socket.off("kernelSimulatorStatus", handleSimulatorStatus);
      socket.off("kernelReplayStatus", handleReplayStatus);
      socket.off("kernelReplayComplete", handleReplayComplete);
      clearInterval(interval);
    };
  }, []);

  const deviceList = Object.values(state.devices);

  const stateCount = (stateName: KernelStateName) =>
    deviceList.filter((d) => d.current_state?.state_name === stateName).length;

  return {
    ...state,
    deviceList,
    selectDevice,
    startSimulator,
    stopSimulator,
    startReplay,
    stopReplay,
    setReplaySpeed,
    stateCount,
  };
}
