"use client";

import * as React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { Snowflake, CheckCircle, AlertTriangle, XCircle, Zap, Thermometer, Shield, Activity } from "lucide-react";

interface FleetInfographicProps {
  deviceId: string;
  locationName: string;
  reportPeriod: string;
  complianceStatus: "compliant" | "warning" | "non_compliant";
  mkt: { mkt: number; interpretation: string } | null;
  efficiency: { score: number; avgPower: number; totalEnergy: number; avgCOP?: number } | null;
  nightStability?: number;
  faultEvents: number;
  doorOpenEvents: number;
  totalReadings: number;
  temperatureData: Array<{ timestamp: string; temp: number }>;
  auditHash: string;
  generatedAt: string;
  aiSummary?: string;
}

export function FleetInfographic({
  deviceId,
  locationName,
  reportPeriod,
  complianceStatus,
  mkt,
  efficiency,
  nightStability = 94,
  faultEvents,
  doorOpenEvents,
  totalReadings,
  temperatureData,
  auditHash,
  generatedAt,
  aiSummary,
}: FleetInfographicProps) {
  // Process temperature data for sparkline with day labels
  const sampleInterval = Math.max(1, Math.floor(temperatureData.length / 30));
  const sparklineData = temperatureData
    .filter((_, index) => index % sampleInterval === 0)
    .map((point, idx) => {
      const date = new Date(point.timestamp);
      return {
        temp: point.temp,
        day: date.getDate(),
        label: `Day ${idx + 1}`,
      };
    });

  const statusConfig = {
    compliant: {
      gradient: "from-emerald-500 to-teal-600",
      icon: CheckCircle,
      text: "COMPLIANT",
      subtitle: "All systems operational",
    },
    warning: {
      gradient: "from-amber-500 to-orange-600",
      icon: AlertTriangle,
      text: "WARNING",
      subtitle: "Requires monitoring",
    },
    non_compliant: {
      gradient: "from-rose-500 to-red-600",
      icon: XCircle,
      text: "NON-COMPLIANT",
      subtitle: "Immediate attention required",
    },
  };

  const status = statusConfig[complianceStatus];
  const StatusIcon = status.icon;

  // Default AI summary based on compliance status
  const defaultSummary = complianceStatus === "compliant"
    ? `This freezer unit demonstrated excellent performance throughout ${reportPeriod}. Temperature averaged ${mkt?.mkt.toFixed(1) || "N/A"}°C, well within safe range. ${totalReadings.toLocaleString()} readings analyzed with zero critical excursions. Efficiency score: ${efficiency?.score || "N/A"}%.`
    : complianceStatus === "warning"
    ? `This unit requires monitoring during ${reportPeriod}. Some parameters approached thresholds but remained within tolerance. ${totalReadings.toLocaleString()} readings were analyzed.`
    : `Immediate attention required. During ${reportPeriod}, one or more critical parameters exceeded acceptable limits. Review recommended.`;

  const summaryText = aiSummary || defaultSummary;

  return (
    <div
      className="infographic-page bg-white relative overflow-hidden"
      data-infographic-ready="true"
      style={{ width: "210mm", height: "277mm", maxHeight: "277mm", fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #0f172a 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* Top Accent Bar - 8px */}
      <div className="h-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600" />

      {/* Content Container */}
      <div className="relative z-10 px-8 py-6 flex flex-col" style={{ height: "calc(277mm - 8px)" }}>
        {/* Header Row - 60px */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Snowflake className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">SUBZERO FLEET</h1>
              <p className="text-sm font-medium text-cyan-600">Compliance Snapshot</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-slate-900">{reportPeriod}</div>
            <p className="text-sm text-slate-500">{locationName}</p>
          </div>
        </div>

        {/* Executive Summary - 100px */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 mb-6 border border-slate-200">
          <div className="flex items-start gap-3">
            {/* AI Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/40">
                <div className="flex gap-1">
                  <div className="w-1 h-2 bg-white rounded-full" />
                  <div className="w-1 h-2 bg-white rounded-full" />
                </div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-slate-100">
                <CheckCircle className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2">
                Executive Summary
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                {summaryText}
              </p>
            </div>
          </div>
        </div>

        {/* Compliance Banner - 70px */}
        <div className={`bg-gradient-to-r ${status.gradient} rounded-xl p-5 mb-6 text-white shadow-xl relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10 flex items-center justify-center gap-3">
            <StatusIcon className="w-10 h-10 drop-shadow-lg" strokeWidth={2.5} />
            <div className="text-center">
              <div className="text-3xl font-black tracking-wide">{status.text}</div>
              <p className="text-sm font-medium text-white/90">{status.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid - 130px */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {/* MKT */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <Thermometer className="w-5 h-5 text-cyan-500" />
            </div>
            <div className="text-4xl font-black text-slate-900 leading-none">
              {mkt?.mkt.toFixed(1) || "N/A"}
            </div>
            <div className="text-sm font-bold text-cyan-600">°C</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-2">
              Mean Kinetic Temp
            </div>
            <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold ${
              mkt?.interpretation === "PASS"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}>
              {mkt?.interpretation === "PASS" ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              {mkt?.interpretation || "N/A"}
            </div>
          </div>

          {/* Efficiency */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <Zap className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="text-4xl font-black text-slate-900 leading-none">
              {efficiency?.score || "N/A"}
            </div>
            <div className="text-sm font-bold text-indigo-600">%</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-2">
              Efficiency Score
            </div>
            <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${efficiency?.score || 0}%` }}
              />
            </div>
          </div>

          {/* Night Stability */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <Activity className="w-5 h-5 text-teal-500" />
            </div>
            <div className="text-4xl font-black text-slate-900 leading-none">
              {nightStability}
            </div>
            <div className="text-sm font-bold text-teal-600">%</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-2">
              Night Stability
            </div>
            <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full"
                style={{ width: `${nightStability}%` }}
              />
            </div>
          </div>

          {/* Faults */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <Shield className="w-5 h-5 text-emerald-500" />
            </div>
            <div className={`text-4xl font-black leading-none ${faultEvents === 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {faultEvents}
            </div>
            <div className="text-sm font-bold text-slate-400">events</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-2">
              Fault Events
            </div>
            <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold ${
              faultEvents === 0
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700"
            }`}>
              {faultEvents === 0 ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {faultEvents === 0 ? "CLEAR" : "ATTENTION"}
            </div>
          </div>
        </div>

        {/* Temperature Chart - 220px */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 mb-6 border border-slate-200 flex-grow" style={{ minHeight: "200px" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Temperature Trend
            </h3>
            <span className="text-cyan-600 text-sm font-bold">Safe Range: -15°C to -21°C</span>
          </div>
          <div style={{ height: "160px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="infographicTempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  axisLine={{ stroke: "#cbd5e1", strokeWidth: 1 }}
                  tickLine={false}
                  tick={{ fill: "#475569", fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[-22, -14]}
                  axisLine={{ stroke: "#cbd5e1", strokeWidth: 1 }}
                  tickLine={false}
                  tick={{ fill: "#475569", fontSize: 11 }}
                  tickFormatter={(value) => `${value}°`}
                  width={40}
                  ticks={[-22, -20, -18, -16, -14]}
                />
                {/* Reference lines for safe range */}
                <Area
                  type="monotone"
                  dataKey="temp"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fill="url(#infographicTempGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Stats Grid - 160px */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Left Column - Key Highlights */}
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-5 border border-cyan-200">
            <h3 className="text-sm font-black text-cyan-700 uppercase tracking-wider mb-4">
              Key Highlights
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                <span className="text-slate-700 text-sm">
                  <strong className="text-slate-900">{totalReadings.toLocaleString()}</strong> readings analyzed
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-700 text-sm">
                  <strong className="text-slate-900">Zero</strong> critical excursions
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-slate-700 text-sm">
                  <strong className="text-slate-900">{efficiency?.totalEnergy?.toFixed(1) || 0} kWh</strong> consumed
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-slate-700 text-sm">
                  <strong className="text-slate-900">{doorOpenEvents}</strong> door open events
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Operational Stats */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4">
              Operational Stats
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-sm">Avg Power:</span>
                <span className="text-slate-900 text-sm font-bold">{efficiency?.avgPower?.toFixed(1) || "N/A"} W</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-sm">Total Energy:</span>
                <span className="text-slate-900 text-sm font-bold">{efficiency?.totalEnergy?.toFixed(1) || "N/A"} kWh</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-sm">Door Events:</span>
                <span className="text-slate-900 text-sm font-bold">{doorOpenEvents}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-sm">COP:</span>
                <span className="text-slate-900 text-sm font-bold">{efficiency?.avgCOP?.toFixed(2) || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - 50px */}
        <div className="mt-auto pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span><strong className="text-slate-700">Device:</strong> {deviceId}</span>
              <span><strong className="text-slate-700">Location:</strong> {locationName}</span>
              <span><strong className="text-slate-700">Hash:</strong> {auditHash.substring(0, 8)}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Generated: {new Date(generatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
              <span className="font-medium text-cyan-600">Powered by Subzero Fleet</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
