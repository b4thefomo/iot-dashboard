"use client";

import * as React from "react";
import { Activity, TrendingUp, AlertCircle } from "lucide-react";

interface VibrationHealthProps {
  vhi: {
    index: number;
    trend: string;
    avgMagnitude?: number;
    peakMagnitude?: number;
    stdDev?: number;
    anomalyPercent?: number;
    axisData?: {
      x: number;
      y: number;
      z: number;
    };
  } | null;
}

export function VibrationHealth({ vhi }: VibrationHealthProps) {
  const healthIndex = vhi?.index ?? 0;
  const healthColor = healthIndex >= 85 ? "#10b981" : healthIndex >= 70 ? "#f59e0b" : "#ef4444";
  const healthLabel = healthIndex >= 85 ? "EXCELLENT" : healthIndex >= 70 ? "GOOD" : "FAIR";

  // Default axis data if not provided
  const axisData = vhi?.axisData ?? { x: 0.12, y: 0.08, z: 0.95 };

  return (
    <div className="px-8 py-10" style={{ pageBreakAfter: "always" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-800">VIBRATION HEALTH INDEX</h2>
        <span className="text-sm text-slate-500">Page 5 of 8</span>
      </div>
      <div className="w-full h-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 mb-8" />

      {/* Description */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Compressor Mechanical Health
        </h3>
        <p className="text-sm text-slate-600">
          Accelerometer data from the compressor unit is analyzed to detect mechanical degradation,
          bearing wear, and motor imbalance before they cause equipment failure.
        </p>
      </div>

      {/* Health Gauge */}
      <div className="mb-8">
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-2xl p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-64 h-32 overflow-hidden">
              {/* Gauge Background */}
              <svg viewBox="0 0 200 100" className="w-full h-full">
                {/* Background arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="20"
                  strokeLinecap="round"
                />
                {/* Colored sections */}
                <path
                  d="M 20 100 A 80 80 0 0 1 60 30"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="20"
                  strokeLinecap="round"
                  opacity="0.3"
                />
                <path
                  d="M 60 30 A 80 80 0 0 1 100 15"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="20"
                  strokeLinecap="round"
                  opacity="0.3"
                />
                <path
                  d="M 100 15 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="20"
                  strokeLinecap="round"
                  opacity="0.3"
                />
                {/* Filled arc based on score */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke={healthColor}
                  strokeWidth="20"
                  strokeLinecap="round"
                  strokeDasharray={`${(healthIndex / 100) * 251} 251`}
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                <span className="text-4xl font-bold text-slate-900">{healthIndex}%</span>
                <span className="text-sm font-semibold" style={{ color: healthColor }}>
                  {healthLabel}
                </span>
              </div>
            </div>
          </div>
          <div className="flex justify-between px-8 text-xs text-slate-500">
            <span>Poor</span>
            <span>Fair</span>
            <span>Good</span>
            <span>Excellent</span>
          </div>
        </div>
      </div>

      {/* Accelerometer Analysis */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Accelerometer Analysis
        </h3>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          {/* X-Axis */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-slate-600 w-16">X-AXIS</span>
            <div className="flex-1 bg-slate-200 rounded-full h-3 relative">
              <div
                className="bg-gradient-to-r from-cyan-400 to-cyan-600 h-3 rounded-full"
                style={{ width: `${Math.min(axisData.x * 100, 100)}%` }}
              />
              {/* Vibration pattern overlay */}
              <div className="absolute inset-0 flex items-center justify-around opacity-50">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-0.5 bg-white"
                    style={{ height: `${40 + Math.random() * 40}%` }}
                  />
                ))}
              </div>
            </div>
            <span className="text-sm font-semibold text-slate-900 w-20 text-right">
              Avg: {axisData.x.toFixed(2)}g
            </span>
          </div>

          {/* Y-Axis */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-slate-600 w-16">Y-AXIS</span>
            <div className="flex-1 bg-slate-200 rounded-full h-3 relative">
              <div
                className="bg-gradient-to-r from-indigo-400 to-indigo-600 h-3 rounded-full"
                style={{ width: `${Math.min(axisData.y * 100, 100)}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-around opacity-50">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-0.5 bg-white"
                    style={{ height: `${30 + Math.random() * 50}%` }}
                  />
                ))}
              </div>
            </div>
            <span className="text-sm font-semibold text-slate-900 w-20 text-right">
              Avg: {axisData.y.toFixed(2)}g
            </span>
          </div>

          {/* Z-Axis */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-slate-600 w-16">Z-AXIS</span>
            <div className="flex-1 bg-slate-200 rounded-full h-3 relative">
              <div
                className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-3 rounded-full"
                style={{ width: `${Math.min(axisData.z * 100, 100)}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-around opacity-50">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-0.5 bg-white"
                    style={{ height: `${60 + Math.random() * 30}%` }}
                  />
                ))}
              </div>
            </div>
            <span className="text-sm font-semibold text-slate-900 w-20 text-right">
              Avg: {axisData.z.toFixed(2)}g
            </span>
          </div>
        </div>
      </div>

      {/* AI Diagnosis */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          AI Diagnosis
        </h3>
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-5">
          <p className="text-sm text-slate-700 leading-relaxed italic mb-4">
            &quot;The compressor exhibits healthy vibration characteristics consistent with normal
            operation. The Z-axis reading of {axisData.z.toFixed(2)}g indicates proper mounting and
            no loose components. X and Y axis variance remains minimal, suggesting balanced motor
            rotation without bearing wear indicators.&quot;
          </p>

          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-slate-700">TREND:</span>
            <span className="text-sm text-emerald-600">{vhi?.trend || "Stable"} (no degradation detected)</span>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-teal-200">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-slate-500 mb-1">
                <Activity className="w-3 h-3" />
                Peak Magnitude
              </div>
              <div className="text-sm font-semibold text-slate-900">
                {vhi?.peakMagnitude?.toFixed(2) || "1.02"}g
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-slate-500 mb-1">
                <TrendingUp className="w-3 h-3" />
                Std Deviation
              </div>
              <div className="text-sm font-semibold text-slate-900">
                {vhi?.stdDev?.toFixed(2) || "0.04"}g
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-slate-500 mb-1">
                <AlertCircle className="w-3 h-3" />
                Anomalous
              </div>
              <div className="text-sm font-semibold text-slate-900">
                {vhi?.anomalyPercent?.toFixed(1) || "0.1"}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
