"use client";

import * as React from "react";
import { CheckCircle, AlertTriangle, XCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface FleetNarrativeSummaryProps {
  complianceStatus: "compliant" | "warning" | "non_compliant";
  deviceId: string;
  locationName: string;
  reportPeriod: string;
  mkt: { mkt: number; interpretation: string } | null;
  efficiency: { score: number; avgPower: number; avgCOP: number; totalEnergy: number } | null;
  doorOpenEvents: number;
  faultEvents: number;
  totalReadings: number;
  aiNarrative: string;
}

export function FleetNarrativeSummary({
  complianceStatus,
  deviceId,
  locationName,
  reportPeriod,
  mkt,
  efficiency,
  doorOpenEvents,
  faultEvents,
  totalReadings,
  aiNarrative,
}: FleetNarrativeSummaryProps) {
  const statusConfig = {
    compliant: {
      bg: "bg-gradient-to-r from-emerald-500 to-teal-600",
      lightBg: "bg-emerald-50",
      border: "border-emerald-200",
      icon: CheckCircle,
      text: "COMPLIANT",
      summary: "This unit has met all compliance thresholds during the reporting period.",
    },
    warning: {
      bg: "bg-gradient-to-r from-amber-500 to-orange-500",
      lightBg: "bg-amber-50",
      border: "border-amber-200",
      icon: AlertTriangle,
      text: "WARNING",
      summary: "This unit has minor deviations that require monitoring but remains within acceptable tolerances.",
    },
    non_compliant: {
      bg: "bg-gradient-to-r from-rose-500 to-red-600",
      lightBg: "bg-rose-50",
      border: "border-rose-200",
      icon: XCircle,
      text: "NON-COMPLIANT",
      summary: "This unit has exceeded one or more compliance thresholds and requires immediate attention.",
    },
  };

  const status = statusConfig[complianceStatus];
  const StatusIcon = status.icon;

  // Generate detailed prose based on data
  const tempAssessment = mkt
    ? mkt.interpretation === "PASS"
      ? `maintained excellent thermal stability with a calculated mean temperature of ${mkt.mkt.toFixed(1)}°C*, well within the required range for frozen goods storage`
      : `showed thermal stress with a mean temperature of ${mkt.mkt.toFixed(1)}°C*, which approaches the upper threshold for safe storage`
    : "had insufficient data to calculate thermal metrics";

  const efficiencyAssessment = efficiency
    ? efficiency.score >= 85
      ? `operated at peak efficiency (${efficiency.score}%), demonstrating optimal energy utilization with an average power draw of ${efficiency.avgPower.toFixed(0)}W`
      : efficiency.score >= 70
      ? `maintained acceptable efficiency levels (${efficiency.score}%), with average power consumption of ${efficiency.avgPower.toFixed(0)}W`
      : `showed reduced efficiency (${efficiency.score}%), consuming ${efficiency.avgPower.toFixed(0)}W on average, which may indicate maintenance requirements`
    : "had insufficient data for efficiency analysis";

  const operationalAssessment = faultEvents === 0
    ? `recorded zero fault events across ${totalReadings.toLocaleString()} readings, indicating reliable mechanical operation`
    : `experienced ${faultEvents} fault event${faultEvents > 1 ? 's' : ''}, which should be reviewed for potential maintenance needs`;

  const doorAssessment = doorOpenEvents < 50
    ? `minimal door activity (${doorOpenEvents} events) suggests controlled access patterns`
    : doorOpenEvents < 150
    ? `moderate door activity (${doorOpenEvents} events) is consistent with normal operational use`
    : `elevated door activity (${doorOpenEvents} events) may contribute to thermal fluctuations`;

  return (
    <div
      className="report-page px-12 py-10 bg-white"
      style={{ minHeight: "277mm", height: "277mm", pageBreakAfter: "always", breakAfter: "page", overflow: "hidden" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-black tracking-tight text-slate-900">
          COMPLIANCE SUMMARY
        </h2>
        <span className="text-sm font-medium text-slate-400">Page 2 of 7</span>
      </div>
      <div className="w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 rounded-full mb-8" />

      {/* Status Banner */}
      <div className={`${status.bg} rounded-2xl p-6 mb-8 text-white shadow-xl`}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <StatusIcon className="w-10 h-10" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-4xl font-black tracking-wide">{status.text}</div>
            <p className="text-white/90 text-lg font-medium mt-1">{status.summary}</p>
          </div>
        </div>
      </div>

      {/* Main Narrative */}
      <div className="mb-8">
        <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider mb-4">
          Assessment Overview
        </h3>
        <div className={`${status.lightBg} ${status.border} border-2 rounded-2xl p-6`}>
          <p className="text-slate-800 text-lg leading-relaxed mb-6">
            During <strong>{reportPeriod}</strong>, the freezer unit at <strong>{locationName}</strong> (Device: {deviceId}) {tempAssessment}. The unit {efficiencyAssessment}.
          </p>
          <p className="text-slate-800 text-lg leading-relaxed mb-6">
            From an operational standpoint, the system {operationalAssessment}. Additionally, {doorAssessment}.
          </p>
          <p className="text-slate-800 text-lg leading-relaxed">
            Based on the comprehensive analysis of {totalReadings.toLocaleString()} data points collected throughout the reporting period, this unit is classified as <strong className="uppercase">{status.text}</strong> with respect to regulatory and operational requirements.
          </p>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="mb-8">
        <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider mb-4">
          AI-Generated Insights
        </h3>
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 shadow-xl">
          <div className="flex items-start gap-4">
            {/* AI Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/40 animate-pulse">
                <div className="flex gap-1.5">
                  <div className="w-2 h-3 bg-white rounded-full" />
                  <div className="w-2 h-3 bg-white rounded-full" />
                </div>
              </div>
              <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20" />
            </div>
            <div className="flex-1">
              <p className="text-slate-200 text-lg leading-relaxed">
                &quot;{aiNarrative}&quot;
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Findings */}
      <div>
        <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider mb-4">
          Key Findings
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
            {mkt?.interpretation === "PASS" ? (
              <TrendingUp className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
            ) : (
              <TrendingDown className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-slate-900">Thermal Performance</div>
              <div className="text-sm text-slate-600">
                Mean temperature of {mkt?.mkt.toFixed(1) || "N/A"}°C* {mkt?.interpretation === "PASS" ? "meets" : "approaches"} compliance thresholds
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
            {(efficiency?.score || 0) >= 70 ? (
              <TrendingUp className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
            ) : (
              <TrendingDown className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-slate-900">Energy Efficiency</div>
              <div className="text-sm text-slate-600">
                {efficiency?.score || 0}% efficiency score with {efficiency?.totalEnergy.toFixed(1) || 0} kWh total consumption
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
            {faultEvents === 0 ? (
              <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-slate-900">System Reliability</div>
              <div className="text-sm text-slate-600">
                {faultEvents === 0 ? "Zero faults detected" : `${faultEvents} fault events recorded`} during monitoring period
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
            <Minus className="w-6 h-6 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-900">Operational Activity</div>
              <div className="text-sm text-slate-600">
                {doorOpenEvents} door open events across {totalReadings.toLocaleString()} readings
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footnote */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-500 italic">
          * MKT (Mean Kinetic Temperature) - See Appendix for full definition and calculation methodology.
        </p>
      </div>
    </div>
  );
}
