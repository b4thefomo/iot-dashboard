"use client";

import * as React from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { KernelFeatures } from "@/hooks/use-kernel-data";

interface KernelFeatureDashboardProps {
  features: KernelFeatures | null;
  history: KernelFeatures[];
}

const FEATURE_LABELS: Record<keyof KernelFeatures, { label: string; unit: string; color: string }> = {
  temp_mean: { label: "Temp Mean", unit: "°C", color: "#3b82f6" },
  temp_delta: { label: "Temp Delta", unit: "°C", color: "#60a5fa" },
  temp_rate: { label: "Temp Rate", unit: "°C/s", color: "#93c5fd" },
  temp_volatility: { label: "Volatility", unit: "σ", color: "#f59e0b" },
  temp_ambient_gap: { label: "Ambient Gap", unit: "°C", color: "#fbbf24" },
  power_mean: { label: "Power", unit: "W", color: "#22c55e" },
  power_delta: { label: "Power Δ", unit: "W", color: "#4ade80" },
  freq_mean: { label: "Frequency", unit: "Hz", color: "#8b5cf6" },
  freq_stability: { label: "Freq Stability", unit: "", color: "#a78bfa" },
  cop_mean: { label: "COP", unit: "", color: "#06b6d4" },
  cop_trend: { label: "COP Trend", unit: "", color: "#22d3ee" },
  temp_rate_vs_power: { label: "Temp/Power Corr", unit: "ρ", color: "#ec4899" },
  recovery_efficiency: { label: "Recovery Eff", unit: "", color: "#f97316" },
  door_state: { label: "Door State", unit: "", color: "#ef4444" },
  door_duration: { label: "Door Duration", unit: "s", color: "#f87171" },
};

export function KernelFeatureDashboard({ features, history }: KernelFeatureDashboardProps) {
  if (!features) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h4 className="text-xs font-medium text-slate-400 mb-2">Feature Dashboard</h4>
        <div className="text-xs text-slate-500 text-center py-4">Select a device to view features</div>
      </div>
    );
  }

  const featureKeys = Object.keys(FEATURE_LABELS) as (keyof KernelFeatures)[];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <h4 className="text-xs font-medium text-slate-400 mb-3">Feature Dashboard (15 derived features)</h4>
      <div className="grid grid-cols-3 gap-2">
        {featureKeys.map((key) => {
          const config = FEATURE_LABELS[key];
          const value = features[key];
          const chartData = history.map((h) => ({ v: h[key] }));

          return (
            <div key={key} className="bg-slate-900/50 rounded p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-500">{config.label}</span>
                <span className="text-xs font-mono text-white">
                  {typeof value === "number" ? value.toFixed(2) : value}
                  {config.unit && <span className="text-slate-500 ml-0.5">{config.unit}</span>}
                </span>
              </div>
              {chartData.length > 1 && (
                <ResponsiveContainer width="100%" height={24}>
                  <LineChart data={chartData}>
                    <Line
                      type="monotone"
                      dataKey="v"
                      stroke={config.color}
                      strokeWidth={1}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
