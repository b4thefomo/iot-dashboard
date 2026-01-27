"use client";

import * as React from "react";
import { CheckCircle, AlertTriangle, XCircle, ThermometerSnowflake, Zap, Gauge, DoorOpen, TrendingUp } from "lucide-react";

interface FleetExecutiveSummaryProps {
  complianceStatus: "compliant" | "warning" | "non_compliant";
  aiNarrative: string;
  mkt: { mkt: number; interpretation: string } | null;
  efficiency: { score: number; avgPower: number; avgCOP: number } | null;
  doorOpenEvents: number;
  faultEvents: number;
  totalReadings: number;
  totalEnergy: number;
}

export function FleetExecutiveSummary({
  complianceStatus,
  aiNarrative,
  mkt,
  efficiency,
  doorOpenEvents,
  faultEvents,
  totalReadings,
  totalEnergy,
}: FleetExecutiveSummaryProps) {
  const statusConfig = {
    compliant: {
      bg: "bg-gradient-to-r from-emerald-500 to-emerald-600",
      border: "border-emerald-400",
      icon: CheckCircle,
      text: "COMPLIANT",
      description: "All thermal and operational parameters within acceptable limits",
    },
    warning: {
      bg: "bg-gradient-to-r from-amber-500 to-orange-500",
      border: "border-amber-400",
      icon: AlertTriangle,
      text: "WARNING",
      description: "Some parameters require attention but remain within tolerance",
    },
    non_compliant: {
      bg: "bg-gradient-to-r from-rose-500 to-red-600",
      border: "border-rose-400",
      icon: XCircle,
      text: "NON-COMPLIANT",
      description: "Critical parameters exceeded acceptable limits",
    },
  };

  const status = statusConfig[complianceStatus];
  const StatusIcon = status.icon;

  return (
    <div className="report-page px-10 py-8" style={{ minHeight: "277mm", height: "277mm", pageBreakAfter: "always", breakAfter: "page", overflow: "hidden" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-black tracking-tight text-slate-900">
          EXECUTIVE SUMMARY
        </h2>
        <span className="text-sm font-medium text-slate-400">Page 3 of 7</span>
      </div>
      <div className="w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 rounded-full mb-10" />

      {/* Compliance Banner - HERO ELEMENT */}
      <div className={`${status.bg} rounded-3xl p-8 mb-10 text-white shadow-2xl relative overflow-hidden`}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10 flex items-center justify-center gap-4">
          <StatusIcon className="w-14 h-14 drop-shadow-lg" strokeWidth={2.5} />
          <span className="text-5xl font-black tracking-wide">{status.text}</span>
        </div>
        <p className="relative z-10 text-center mt-4 text-white/90 text-lg font-medium max-w-xl mx-auto">
          {status.description}
        </p>
      </div>

      {/* KPI Cards - HERO NUMBERS */}
      <div className="grid grid-cols-4 gap-5 mb-10">
        {/* MKT Card */}
        <div className="bg-gradient-to-br from-blue-50 to-sky-100 border-2 border-blue-200 rounded-2xl p-5 text-center shadow-lg">
          <div className="w-12 h-12 mx-auto mb-3 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <ThermometerSnowflake className="w-6 h-6 text-white" />
          </div>
          <div className="text-5xl font-black text-slate-900 mb-1 tracking-tight">
            {mkt ? `${mkt.mkt.toFixed(1)}` : "N/A"}
          </div>
          <div className="text-lg font-bold text-blue-600 mb-2">°C</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Mean Kinetic Temp
          </div>
          <div
            className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold ${
              mkt?.interpretation === "PASS"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                : mkt?.interpretation === "MARGINAL"
                ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                : "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
            }`}
          >
            {mkt?.interpretation || "N/A"}
          </div>
        </div>

        {/* Efficiency Card */}
        <div className="bg-gradient-to-br from-teal-50 to-emerald-100 border-2 border-teal-200 rounded-2xl p-5 text-center shadow-lg">
          <div className="w-12 h-12 mx-auto mb-3 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30">
            <Gauge className="w-6 h-6 text-white" />
          </div>
          <div className="text-5xl font-black text-slate-900 mb-1 tracking-tight">
            {efficiency?.score !== undefined ? efficiency.score : "N/A"}
          </div>
          <div className="text-lg font-bold text-teal-600 mb-2">%</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Efficiency Score
          </div>
          <div className="w-full bg-teal-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-400 to-emerald-500 h-3 rounded-full transition-all"
              style={{ width: `${efficiency?.score || 0}%` }}
            />
          </div>
        </div>

        {/* Power Card */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-100 border-2 border-indigo-200 rounded-2xl p-5 text-center shadow-lg">
          <div className="w-12 h-12 mx-auto mb-3 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div className="text-5xl font-black text-slate-900 mb-1 tracking-tight">
            {efficiency?.avgPower !== undefined ? efficiency.avgPower.toFixed(0) : "N/A"}
          </div>
          <div className="text-lg font-bold text-indigo-600 mb-2">W</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Average Power
          </div>
          <div className="text-sm font-bold text-indigo-600">
            COP: {efficiency?.avgCOP?.toFixed(2) || "N/A"}
          </div>
        </div>

        {/* Operations Card */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-100 border-2 border-amber-200 rounded-2xl p-5 text-center shadow-lg">
          <div className="w-12 h-12 mx-auto mb-3 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
            <DoorOpen className="w-6 h-6 text-white" />
          </div>
          <div className="text-5xl font-black text-slate-900 mb-1 tracking-tight">
            {doorOpenEvents}
          </div>
          <div className="text-lg font-bold text-amber-600 mb-2">events</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Door Opens
          </div>
          <div
            className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold ${
              faultEvents === 0
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                : "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
            }`}
          >
            {faultEvents === 0 ? "No Faults" : `${faultEvents} Faults`}
          </div>
        </div>
      </div>

      {/* AI Narrative */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
          AI-Generated Analysis
        </h3>
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 shadow-xl">
          <div className="flex items-start gap-4">
            {/* AI Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/40 animate-pulse">
                <div className="flex gap-1">
                  <div className="w-1.5 h-2.5 bg-white rounded-full" />
                  <div className="w-1.5 h-2.5 bg-white rounded-full" />
                </div>
              </div>
              <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20" />
            </div>
            <p className="text-slate-200 text-base leading-relaxed flex-1">
              &quot;{aiNarrative}&quot;
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-900 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-white">{totalReadings.toLocaleString()}</div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Readings</div>
        </div>
        <div className="bg-slate-900 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-white">{totalEnergy.toFixed(1)}</div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">kWh Used</div>
        </div>
        <div className="bg-slate-900 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-white">{doorOpenEvents}</div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Door Events</div>
        </div>
        <div className="bg-slate-900 rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-emerald-400">{faultEvents}</div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Faults</div>
        </div>
      </div>
    </div>
  );
}
