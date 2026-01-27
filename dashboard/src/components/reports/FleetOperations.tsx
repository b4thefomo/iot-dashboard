"use client";

import * as React from "react";
import { DoorOpen, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface Fault {
  timestamp: string;
  fault: string;
  faultId?: string;
}

interface FleetOperationsProps {
  doorOpenEvents: number;
  faults: Fault[];
  totalReadings: number;
}

export function FleetOperations({ doorOpenEvents, faults, totalReadings }: FleetOperationsProps) {
  const hasFaults = faults.length > 0;
  const uniqueFaults = [...new Set(faults.map(f => f.fault))];
  const faultCounts = uniqueFaults.map(fault => ({
    fault,
    count: faults.filter(f => f.fault === fault).length,
  }));

  return (
    <div className="report-page px-10 py-8" style={{ minHeight: "277mm", height: "277mm", pageBreakAfter: "always", breakAfter: "page", overflow: "hidden" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-black tracking-tight text-slate-900">
          OPERATIONS & EVENTS
        </h2>
        <span className="text-sm font-medium text-slate-400">Page 6 of 7</span>
      </div>
      <div className="w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-full mb-10" />

      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-6 mb-10">
        {/* Door Events */}
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
                <DoorOpen className="w-8 h-8" />
              </div>
              <span className="text-lg font-bold uppercase tracking-wider opacity-90">Door Open Events</span>
            </div>
            <div className="text-8xl font-black mb-2">{doorOpenEvents}</div>
            <p className="text-white/80 font-medium">
              Recorded during the reporting period
            </p>
          </div>
        </div>

        {/* Fault Status */}
        <div className={`rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden ${
          hasFaults ? "bg-gradient-to-br from-rose-500 to-red-600" : "bg-gradient-to-br from-emerald-500 to-teal-600"
        }`}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
                {hasFaults ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
              </div>
              <span className="text-lg font-bold uppercase tracking-wider opacity-90">Fault Events</span>
            </div>
            <div className="text-8xl font-black mb-2">{faults.length}</div>
            <p className="text-white/80 font-medium">
              {hasFaults ? "Requires attention" : "No faults detected"}
            </p>
          </div>
        </div>
      </div>

      {/* Door Events Analysis */}
      <div className="mb-8">
        <h3 className="text-lg font-black text-slate-700 uppercase tracking-wider mb-4">
          Door Open Analysis
        </h3>
        <div className="bg-gradient-to-br from-amber-50 to-orange-100 border-2 border-amber-200 rounded-2xl p-6 shadow-lg">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-5xl font-black text-slate-900 mb-2">{doorOpenEvents}</div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Events</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-slate-900 mb-2">
                {totalReadings > 0 ? ((doorOpenEvents / totalReadings) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Of Total Readings</div>
            </div>
            <div className="text-center">
              <div className={`text-5xl font-black mb-2 ${doorOpenEvents < 100 ? "text-emerald-600" : "text-amber-600"}`}>
                {doorOpenEvents < 50 ? "LOW" : doorOpenEvents < 100 ? "NORMAL" : "HIGH"}
              </div>
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Assessment</div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t-2 border-amber-200">
            <p className="text-slate-700 leading-relaxed">
              Door open events represent moments when the freezer door was detected as open.
              Frequent door openings can lead to temperature fluctuations and increased energy consumption.
              {doorOpenEvents < 100
                ? " The frequency of door openings for this unit is within acceptable operational parameters."
                : " Consider reviewing door open procedures to minimize thermal impact."}
            </p>
          </div>
        </div>
      </div>

      {/* Fault Details */}
      <div>
        <h3 className="text-lg font-black text-slate-700 uppercase tracking-wider mb-4">
          Fault Event Details
        </h3>
        {hasFaults ? (
          <div className="bg-gradient-to-br from-rose-50 to-red-100 border-2 border-rose-200 rounded-2xl p-6 shadow-lg">
            <div className="mb-6">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Fault Types Detected</div>
              <div className="flex flex-wrap gap-2">
                {faultCounts.map((item, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    {item.fault} ({item.count})
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white/60 rounded-xl p-4 backdrop-blur">
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Recent Fault Events</h4>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {faults.slice(0, 10).map((fault, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-rose-200 last:border-0">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-rose-500" />
                      <span className="text-sm text-slate-600">
                        {new Date(fault.timestamp).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-rose-700">{fault.fault}</span>
                  </div>
                ))}
                {faults.length > 10 && (
                  <div className="text-sm text-slate-500 text-center py-2">
                    ... and {faults.length - 10} more events
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-100 border-2 border-emerald-200 rounded-2xl p-8 shadow-lg text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h4 className="text-2xl font-black text-slate-900 mb-2">No Faults Detected</h4>
            <p className="text-slate-600 max-w-md mx-auto">
              This unit operated without any fault events during the reporting period.
              All systems functioned within normal parameters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
