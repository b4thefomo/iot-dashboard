"use client";

import { useState, useEffect, useCallback } from "react";
import { getSocket } from "@/lib/socket";

export type HeartRateZone = 'rest' | 'zone1' | 'zone2' | 'zone3' | 'zone4' | 'zone5';
export type ArrhythmiaFlag = 'normal' | 'warning';

export interface BodyTrackerReading {
  device_id: string;
  timestamp: string;
  raw_timestamp?: number;

  // Real-time vitals
  heart_rate_bpm: number;
  heart_rate_zone: HeartRateZone;
  cadence_spm: number;
  battery_percent: number;

  // Form & Physics
  torso_lean_deg: number;
  vertical_oscillation_cm: number;
  impact_g_force: number;
  torso_rotation_deg: number;

  // Advanced health
  hrv_rmssd_ms: number;
  arrhythmia_flag: ArrhythmiaFlag;
  respiration_rate: number;

  // Raw data
  ecg_waveform: number[];
  accel_x: number;
  accel_y: number;
  accel_z: number;

  // Session metrics
  total_steps: number;
  calories_burned: number;
  session_duration_sec: number;
  avg_heart_rate: number;
  max_heart_rate: number;
}

export interface BodyTrackerState {
  history: BodyTrackerReading[];
  latest: BodyTrackerReading | null;
  isConnected: boolean;
  isOnline: boolean;
  lastDataReceived: string | null;
  simulatorRunning: boolean;
}

// HR Zone colors and labels
export const HR_ZONE_CONFIG = {
  rest: { color: '#6b7280', label: 'Rest', range: '<50%' },
  zone1: { color: '#3b82f6', label: 'Warm Up', range: '50-60%' },
  zone2: { color: '#22c55e', label: 'Fat Burn', range: '60-70%' },
  zone3: { color: '#eab308', label: 'Cardio', range: '70-80%' },
  zone4: { color: '#f97316', label: 'Hard', range: '80-90%' },
  zone5: { color: '#ef4444', label: 'Max', range: '90-100%' },
} as const;

// Form quality thresholds
export const FORM_THRESHOLDS = {
  torsoLean: { good: [2, 10], warning: [0, 15] },
  verticalOscillation: { good: 8, warning: 10 },
  impactGForce: { good: 2, warning: 3 },
  torsoRotation: { good: 15, warning: 20 },
  cadence: { good: 170, warning: 160 },
};

const ONLINE_TIMEOUT = 30000;

export function useBodyTrackerData() {
  const [state, setState] = useState<BodyTrackerState>({
    history: [],
    latest: null,
    isConnected: false,
    isOnline: false,
    lastDataReceived: null,
    simulatorRunning: false,
  });

  // Evaluate form quality
  const evaluateTorsoLean = useCallback((deg: number): 'good' | 'warning' | 'bad' => {
    if (deg >= 2 && deg <= 10) return 'good';
    if (deg > 10 && deg <= 15) return 'warning';
    if (deg < 2) return 'warning';
    return 'bad';
  }, []);

  const evaluateVerticalOscillation = useCallback((cm: number): 'good' | 'warning' | 'bad' => {
    if (cm < 8) return 'good';
    if (cm <= 10) return 'warning';
    return 'bad';
  }, []);

  const evaluateImpactGForce = useCallback((g: number): 'good' | 'warning' | 'bad' => {
    if (g < 2) return 'good';
    if (g <= 3) return 'warning';
    return 'bad';
  }, []);

  const evaluateTorsoRotation = useCallback((deg: number): 'good' | 'warning' | 'bad' => {
    if (deg < 15) return 'good';
    if (deg <= 20) return 'warning';
    return 'bad';
  }, []);

  const evaluateCadence = useCallback((spm: number): 'good' | 'warning' | 'bad' => {
    if (spm >= 170) return 'good';
    if (spm >= 160) return 'warning';
    return 'bad';
  }, []);

  const evaluateHRV = useCallback((ms: number): { status: 'excellent' | 'good' | 'moderate' | 'low'; label: string } => {
    if (ms > 50) return { status: 'excellent', label: 'Excellent recovery' };
    if (ms >= 30) return { status: 'good', label: 'Good recovery' };
    if (ms >= 20) return { status: 'moderate', label: 'Moderate' };
    return { status: 'low', label: 'Low - rest needed' };
  }, []);

  // Format session duration
  const formatDuration = useCallback((seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Start simulator
  const startSimulator = useCallback(() => {
    const socket = getSocket();
    socket.emit('startBodyTrackerSimulator');
  }, []);

  // Stop simulator
  const stopSimulator = useCallback(() => {
    const socket = getSocket();
    socket.emit('stopBodyTrackerSimulator');
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setState((prev) => ({ ...prev, isConnected: true }));
    };

    const handleDisconnect = () => {
      setState((prev) => ({ ...prev, isConnected: false }));
    };

    const handleInitialBodyTrackerData = (data: {
      history: BodyTrackerReading[];
      lastDataReceived: string | null;
      simulatorRunning: boolean;
    }) => {
      const history = data.history || [];
      const latest = history.length > 0 ? history[history.length - 1] : null;

      setState((prev) => ({
        ...prev,
        history,
        latest,
        lastDataReceived: data.lastDataReceived,
        simulatorRunning: data.simulatorRunning,
        isOnline: data.lastDataReceived
          ? Date.now() - new Date(data.lastDataReceived).getTime() < ONLINE_TIMEOUT
          : false,
      }));

      // Auto-start simulator if not already running
      if (!data.simulatorRunning) {
        socket.emit('startBodyTrackerSimulator');
      }
    };

    const handleBodyTrackerData = (reading: BodyTrackerReading) => {
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
          simulatorRunning: true,
        };
      });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("initialBodyTrackerData", handleInitialBodyTrackerData);
    socket.on("bodyTrackerData", handleBodyTrackerData);

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
      socket.off("initialBodyTrackerData", handleInitialBodyTrackerData);
      socket.off("bodyTrackerData", handleBodyTrackerData);
      clearInterval(interval);
    };
  }, []);

  // Computed stats
  const heartRates = state.history.map((r) => r.heart_rate_bpm).filter((v) => v !== undefined);
  const avgHeartRate = heartRates.length > 0 ? heartRates.reduce((a, b) => a + b, 0) / heartRates.length : 0;
  const maxHeartRate = heartRates.length > 0 ? Math.max(...heartRates) : 0;
  const minHeartRate = heartRates.length > 0 ? Math.min(...heartRates) : 0;

  const hrvValues = state.history.map((r) => r.hrv_rmssd_ms).filter((v) => v !== undefined);
  const avgHRV = hrvValues.length > 0 ? hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length : 0;

  return {
    ...state,
    avgHeartRate,
    maxHeartRate,
    minHeartRate,
    avgHRV,
    evaluateTorsoLean,
    evaluateVerticalOscillation,
    evaluateImpactGForce,
    evaluateTorsoRotation,
    evaluateCadence,
    evaluateHRV,
    formatDuration,
    startSimulator,
    stopSimulator,
  };
}
