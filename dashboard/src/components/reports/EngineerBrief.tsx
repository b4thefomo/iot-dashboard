"use client";

import * as React from "react";
import { CheckCircle, Wrench, Calendar } from "lucide-react";

interface EngineerBriefProps {
  deviceId: string;
  assetName: string;
  reportPeriod: string;
  dataPoints: number;
  systemStatus: "normal" | "warning" | "critical";
  aiSummary: string;
  inspectionPriorities: string[];
  maintenanceSchedule: { days: number; task: string }[];
}

export function EngineerBrief({
  deviceId,
  assetName,
  reportPeriod,
  dataPoints,
  systemStatus,
  aiSummary,
  inspectionPriorities,
  maintenanceSchedule,
}: EngineerBriefProps) {
  const statusConfig = {
    normal: { bg: "bg-emerald-500", text: "NORMAL", icon: CheckCircle },
    warning: { bg: "bg-amber-500", text: "ATTENTION NEEDED", icon: Wrench },
    critical: { bg: "bg-rose-500", text: "CRITICAL", icon: Wrench },
  };

  const status = statusConfig[systemStatus];
  const StatusIcon = status.icon;

  return (
    <div className="px-8 py-10" style={{ pageBreakAfter: "always" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-800">ENGINEER&apos;S TECHNICAL BRIEF</h2>
        <span className="text-sm text-slate-500">Page 7 of 8</span>
      </div>
      <div className="w-full h-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 mb-8" />

      {/* Asset Information */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Asset Information
        </h3>
        <div className="w-full h-px bg-slate-300 mb-4" />
        <div className="grid grid-cols-2 gap-y-3 text-sm">
          <div>
            <span className="text-slate-500">Device ID:</span>
          </div>
          <div className="font-mono text-slate-900">{deviceId}</div>
          <div>
            <span className="text-slate-500">Location:</span>
          </div>
          <div className="text-slate-900">{assetName}</div>
          <div>
            <span className="text-slate-500">Report Period:</span>
          </div>
          <div className="text-slate-900">{reportPeriod}</div>
          <div>
            <span className="text-slate-500">Data Points:</span>
          </div>
          <div className="text-slate-900">{dataPoints.toLocaleString()} readings</div>
        </div>
      </div>

      {/* Status and Priorities Grid */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* System Status */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            System Status
          </h3>
          <div className={`${status.bg} rounded-xl p-6 text-white text-center`}>
            <StatusIcon className="w-10 h-10 mx-auto mb-2" />
            <span className="text-xl font-bold">{status.text}</span>
          </div>
        </div>

        {/* Inspection Priorities */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Inspection Priorities
          </h3>
          <ol className="space-y-2">
            {inspectionPriorities.map((priority, index) => (
              <li key={index} className="flex items-center gap-3 text-sm text-slate-700">
                <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-xs font-semibold">
                  {index + 1}
                </span>
                {priority}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* AI Technical Summary */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          AI-Generated Technical Summary
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
            <div className="prose prose-sm prose-invert text-slate-200 leading-relaxed whitespace-pre-line flex-1">
              {aiSummary}
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Schedule */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Maintenance Schedule
        </h3>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <div className="space-y-3">
            {maintenanceSchedule.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300"
                    disabled
                  />
                  <span className="text-sm text-slate-700">
                    <span className="font-semibold">{item.days} days:</span> {item.task}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
