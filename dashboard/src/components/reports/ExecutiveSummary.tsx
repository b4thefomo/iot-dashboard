"use client";

import * as React from "react";
import { CheckCircle, AlertTriangle, XCircle, ThermometerSnowflake, Activity, Moon, Zap } from "lucide-react";

interface ExecutiveSummaryProps {
  complianceStatus: "compliant" | "warning" | "non_compliant";
  aiNarrative: string;
  mkt: { mkt: number; interpretation: string } | null;
  vhi: { index: number; trend: string } | null;
  nightStability: { score: number } | null;
  excursionCount: number;
  totalReadings: number;
  dataGaps: number;
  criticalExcursions: number;
}

export function ExecutiveSummary({
  complianceStatus,
  aiNarrative,
  mkt,
  vhi,
  nightStability,
  excursionCount,
  totalReadings,
  dataGaps,
  criticalExcursions,
}: ExecutiveSummaryProps) {
  const statusConfig = {
    compliant: {
      bg: "bg-emerald-500",
      icon: CheckCircle,
      text: "COMPLIANT",
      description: "All thermal and mechanical parameters within acceptable operational limits",
    },
    warning: {
      bg: "bg-amber-500",
      icon: AlertTriangle,
      text: "WARNING",
      description: "Some parameters require attention but remain within operational tolerance",
    },
    non_compliant: {
      bg: "bg-rose-500",
      icon: XCircle,
      text: "NON-COMPLIANT",
      description: "Critical parameters exceeded acceptable limits during the reporting period",
    },
  };

  const status = statusConfig[complianceStatus];
  const StatusIcon = status.icon;

  return (
    <div className="px-8 py-10" style={{ pageBreakAfter: "always" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-800">EXECUTIVE SUMMARY</h2>
        <span className="text-sm text-slate-500">Page 2 of 8</span>
      </div>
      <div className="w-full h-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 mb-8" />

      {/* Compliance Banner */}
      <div className={`${status.bg} rounded-2xl p-6 mb-8 text-white`}>
        <div className="flex items-center justify-center gap-3">
          <StatusIcon className="w-8 h-8" />
          <span className="text-2xl font-bold">{status.text}</span>
        </div>
        <p className="text-center mt-2 text-white/90 text-sm">{status.description}</p>
      </div>

      {/* AI Narrative */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          AI-Generated Narrative
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

      {/* KPI Cards */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Key Performance Indicators
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {/* MKT Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <ThermometerSnowflake className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-slate-900 mb-1">
              {mkt ? `${mkt.mkt}°C` : "N/A"}
            </div>
            <div className="text-xs text-slate-500 mb-2">MKT</div>
            <div
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                mkt?.interpretation === "PASS"
                  ? "bg-emerald-100 text-emerald-700"
                  : mkt?.interpretation === "MARGINAL"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-rose-100 text-rose-700"
              }`}
            >
              {mkt?.interpretation || "N/A"}
            </div>
          </div>

          {/* Health Index Card */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-center">
            <Activity className="w-6 h-6 mx-auto mb-2 text-teal-600" />
            <div className="text-2xl font-bold text-slate-900 mb-1">
              {vhi?.index !== null && vhi?.index !== undefined ? `${vhi.index}%` : "N/A"}
            </div>
            <div className="text-xs text-slate-500 mb-2">Health Index</div>
            <div className="w-full bg-teal-200 rounded-full h-2 mb-1">
              <div
                className="bg-teal-600 h-2 rounded-full"
                style={{ width: `${vhi?.index || 0}%` }}
              />
            </div>
            <div className="text-xs text-teal-700">{vhi?.trend || "N/A"}</div>
          </div>

          {/* Night Stability Card */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-center">
            <Moon className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
            <div className="text-2xl font-bold text-slate-900 mb-1">
              {nightStability?.score !== null && nightStability?.score !== undefined
                ? `${nightStability.score}%`
                : "N/A"}
            </div>
            <div className="text-xs text-slate-500 mb-2">Night Stability</div>
            <div className="w-full bg-indigo-200 rounded-full h-2 mb-1">
              <div
                className="bg-indigo-600 h-2 rounded-full"
                style={{ width: `${nightStability?.score || 0}%` }}
              />
            </div>
            <div className="text-xs text-indigo-700">Stable</div>
          </div>

          {/* Excursions Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <Zap className="w-6 h-6 mx-auto mb-2 text-amber-600" />
            <div className="text-2xl font-bold text-slate-900 mb-1">{excursionCount}</div>
            <div className="text-xs text-slate-500 mb-2">Excursions</div>
            <div
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                excursionCount === 0
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {excursionCount === 0 ? "None" : "Minor"}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Facts */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Quick Facts
        </h3>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <ul className="space-y-2">
            <li className="flex items-center text-sm text-slate-700">
              <span className="w-2 h-2 rounded-full bg-cyan-500 mr-3" />
              Total readings analyzed: <span className="font-semibold ml-1">{totalReadings.toLocaleString()}</span>
            </li>
            <li className="flex items-center text-sm text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-3" />
              Monitoring coverage: <span className="font-semibold ml-1">{dataGaps === 0 ? "100%" : `${((1 - dataGaps / totalReadings) * 100).toFixed(1)}%`}</span>
              {dataGaps === 0 && " (no data gaps)"}
            </li>
            <li className="flex items-center text-sm text-slate-700">
              <span className="w-2 h-2 rounded-full bg-rose-500 mr-3" />
              Critical excursions: <span className="font-semibold ml-1">{criticalExcursions}</span>
            </li>
            <li className="flex items-center text-sm text-slate-700">
              <span className="w-2 h-2 rounded-full bg-indigo-500 mr-3" />
              Recommended actions: <span className="font-semibold ml-1">{criticalExcursions === 0 ? "None required" : "Review excursion log"}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
