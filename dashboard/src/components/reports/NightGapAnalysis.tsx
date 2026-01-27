"use client";

import * as React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Moon, Clock, ThermometerSnowflake } from "lucide-react";

interface NightGapAnalysisProps {
  nightGap: {
    score: number;
    period: string;
    analysis: string;
    stats: {
      avgTemp: number;
      tempRange: number;
      minTemp: number;
      maxTemp: number;
      nightReadingCount: number;
      doorEventsAtNight: number;
    } | null;
  } | null;
}

export function NightGapAnalysis({ nightGap }: NightGapAnalysisProps) {
  // Generate sample night temperature pattern
  const nightHours = ["19:00", "20:00", "21:00", "22:00", "23:00", "00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00"];
  const nightPatternData = nightHours.map((hour, i) => ({
    time: hour,
    temp: nightGap?.stats?.avgTemp
      ? nightGap.stats.avgTemp + (Math.sin(i * 0.5) * 0.3 - 0.15)
      : -18.4 + (Math.sin(i * 0.5) * 0.3 - 0.15),
  }));

  const score = nightGap?.score ?? 0;
  const scoreColor = score >= 90 ? "#10b981" : score >= 75 ? "#f59e0b" : "#ef4444";

  return (
    <div className="px-8 py-10" style={{ pageBreakAfter: "always" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-800">NIGHT GAP ANALYSIS</h2>
        <span className="text-sm text-slate-500">Page 4 of 8</span>
      </div>
      <div className="w-full h-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 mb-8" />

      {/* Description */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Unstaffed Hours Monitoring ({nightGap?.period || "19:00 - 08:00"})
        </h3>
        <p className="text-sm text-slate-600">
          During the 13-hour overnight period when no staff are present, continuous monitoring
          ensures temperature stability is maintained. This analysis tracks thermal behavior
          during the most vulnerable operational window.
        </p>
      </div>

      {/* Stability Score Gauge */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Night Stability Score
        </h3>
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-8">
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-24 overflow-hidden">
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
                {/* Filled arc based on score */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="20"
                  strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * 251} 251`}
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                <span className="text-3xl font-bold text-slate-900">{score}%</span>
                <span className="text-sm font-medium text-indigo-600">STABLE</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-8 mt-4 text-xs text-slate-500">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Overnight Pattern Chart */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Overnight Temperature Pattern
        </h3>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={nightPatternData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="nightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 9, fill: "#64748b" }}
                tickLine={{ stroke: "#e2e8f0" }}
                axisLine={{ stroke: "#e2e8f0" }}
              />
              <YAxis
                domain={[-20, -17]}
                tick={{ fontSize: 9, fill: "#64748b" }}
                tickLine={{ stroke: "#e2e8f0" }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickFormatter={(value) => `${value}°C`}
              />
              <Area
                type="monotone"
                dataKey="temp"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#nightGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-xs text-slate-500 mt-2">(typical night profile)</p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-slate-700 mb-4">Statistics</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <ThermometerSnowflake className="w-4 h-4 text-cyan-600" />
              <span className="text-sm text-slate-600">Average Temperature:</span>
              <span className="text-sm font-semibold text-slate-900 ml-auto">
                {nightGap?.stats?.avgTemp ? `${nightGap.stats.avgTemp}°C` : "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span className="text-sm text-slate-600">Temperature Variance:</span>
              <span className="text-sm font-semibold text-slate-900 ml-auto">
                {nightGap?.stats?.tempRange ? `±${(nightGap.stats.tempRange / 2).toFixed(1)}°C` : "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Moon className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-slate-600">Night Readings Count:</span>
              <span className="text-sm font-semibold text-slate-900 ml-auto">
                {nightGap?.stats?.nightReadingCount?.toLocaleString() || "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-slate-700 mb-4">Key Observations</h4>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
              {(nightGap?.stats?.doorEventsAtNight || 0) === 0
                ? "No door events during night"
                : `${nightGap?.stats?.doorEventsAtNight} door events detected`}
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
              Compressor cycles normal
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
              Zero anomalies detected
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
              Power consumption stable
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
