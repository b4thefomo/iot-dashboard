"use client";

import * as React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Zap, Gauge, TrendingUp, Activity } from "lucide-react";

interface PowerDataPoint {
  timestamp: string;
  power: number;
  cop: number;
}

interface FleetEfficiencyAnalysisProps {
  powerData: PowerDataPoint[];
  efficiency: {
    score: number;
    avgPower: number;
    avgCOP: number;
    totalEnergy: number;
  } | null;
}

export function FleetEfficiencyAnalysis({ powerData, efficiency }: FleetEfficiencyAnalysisProps) {
  // Process data for chart
  const sampleInterval = Math.max(1, Math.floor(powerData.length / 50));
  const chartData = powerData
    .filter((_, index) => index % sampleInterval === 0)
    .map((point) => ({
      date: new Date(point.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      power: point.power,
      cop: point.cop,
    }));

  const efficiencyScore = efficiency?.score || 0;
  const scoreColor = efficiencyScore >= 85 ? "#10b981" : efficiencyScore >= 70 ? "#f59e0b" : "#ef4444";
  const scoreLabel = efficiencyScore >= 85 ? "EXCELLENT" : efficiencyScore >= 70 ? "GOOD" : "ATTENTION";
  const scoreBg = efficiencyScore >= 85 ? "from-emerald-500 to-teal-600" : efficiencyScore >= 70 ? "from-amber-500 to-orange-600" : "from-rose-500 to-red-600";

  return (
    <div className="report-page px-10 py-8" style={{ minHeight: "277mm", height: "277mm", pageBreakAfter: "always", breakAfter: "page", overflow: "hidden" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-black tracking-tight text-slate-900">
          EFFICIENCY ANALYSIS
        </h2>
        <span className="text-sm font-medium text-slate-400">Page 5 of 7</span>
      </div>
      <div className="w-full h-1 bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 rounded-full mb-10" />

      {/* Hero Efficiency Score */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        {/* Main Score */}
        <div className={`col-span-1 bg-gradient-to-br ${scoreBg} rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Gauge className="w-6 h-6" />
              <span className="text-sm font-bold uppercase tracking-wider opacity-80">Efficiency Score</span>
            </div>
            <div className="text-7xl font-black mb-2">{efficiencyScore}</div>
            <div className="text-3xl font-bold opacity-80">%</div>
            <div className="mt-4 inline-block bg-white/20 rounded-full px-4 py-2">
              <span className="text-sm font-black tracking-wider">{scoreLabel}</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-100 border-2 border-indigo-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Avg Power</span>
            </div>
            <div className="text-5xl font-black text-slate-900">
              {efficiency?.avgPower?.toFixed(0) || "N/A"}
            </div>
            <div className="text-xl font-bold text-indigo-600">Watts</div>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-cyan-100 border-2 border-teal-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Average COP</span>
            </div>
            <div className="text-5xl font-black text-slate-900">
              {efficiency?.avgCOP?.toFixed(2) || "N/A"}
            </div>
            <div className="text-xl font-bold text-teal-600">Coefficient</div>
          </div>

          <div className="col-span-2 bg-gradient-to-br from-amber-50 to-orange-100 border-2 border-amber-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-wider block">Total Energy Consumed</span>
                  <span className="text-xs text-slate-400">This reporting period</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-5xl font-black text-slate-900">
                  {efficiency?.totalEnergy?.toFixed(1) || "N/A"}
                </div>
                <div className="text-xl font-bold text-amber-600">kWh</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Power Consumption Chart */}
      <div className="mb-4">
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-3">
          Power Consumption Trend
        </h3>
        <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 h-52 shadow-inner">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="powerGradientFleet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                tickLine={{ stroke: "#e2e8f0" }}
                axisLine={{ stroke: "#cbd5e1" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                tickLine={{ stroke: "#e2e8f0" }}
                axisLine={{ stroke: "#cbd5e1" }}
                tickFormatter={(value) => `${value}W`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "white",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                }}
                formatter={(value: number) => [`${value.toFixed(0)}W`, "Power"]}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Area
                type="monotone"
                dataKey="power"
                stroke="#6366f1"
                strokeWidth={3}
                fill="url(#powerGradientFleet)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* COP Explanation */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl p-4 text-white shadow-xl">
        <h3 className="text-sm font-black uppercase tracking-wider mb-2 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Coefficient of Performance (COP)
        </h3>
        <p className="text-white/90 text-sm leading-relaxed mb-3">
          COP measures refrigeration efficiency - higher values mean more cooling output per unit of electrical input. Industry standard for commercial freezers is 1.5 - 3.0.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 rounded-lg p-3 text-center backdrop-blur">
            <div className="text-2xl font-black">{efficiency?.avgCOP?.toFixed(2) || "N/A"}</div>
            <div className="text-xs font-semibold opacity-80">Your Average</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3 text-center backdrop-blur">
            <div className="text-2xl font-black">1.5 - 3.0</div>
            <div className="text-xs font-semibold opacity-80">Industry Range</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3 text-center backdrop-blur">
            <div className={`text-2xl font-black ${(efficiency?.avgCOP || 0) >= 2 ? "text-emerald-300" : "text-amber-300"}`}>
              {(efficiency?.avgCOP || 0) >= 2 ? "OPTIMAL" : "MARGINAL"}
            </div>
            <div className="text-xs font-semibold opacity-80">Assessment</div>
          </div>
        </div>
      </div>
    </div>
  );
}
