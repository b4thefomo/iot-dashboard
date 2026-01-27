"use client";

import * as React from "react";
import { Snowflake, Shield } from "lucide-react";

interface FleetCoverPageProps {
  deviceId: string;
  locationName: string;
  locationAddress?: string;
  reportPeriod: string;
  generatedAt: string;
  auditHash: string;
}

export function FleetCoverPage({
  deviceId,
  locationName,
  locationAddress,
  reportPeriod,
  generatedAt,
  auditHash,
}: FleetCoverPageProps) {
  return (
    <div
      className="report-page relative flex flex-col items-center justify-center px-8 py-8 overflow-hidden"
      style={{ minHeight: "277mm", height: "277mm", pageBreakAfter: "always", breakAfter: "page" }}
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900" />

      {/* Animated Frost Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-400 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-500 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-400 rounded-full blur-3xl opacity-30" />
      </div>

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Logo Section */}
        <div className="mb-10 relative">
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/50 border-4 border-white/20">
            <Snowflake className="w-20 h-20 text-white drop-shadow-lg" strokeWidth={1.5} />
          </div>
          <div className="absolute -bottom-2 -right-2 w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center">
            <Shield className="w-7 h-7 text-blue-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-7xl font-black text-white mb-2 tracking-tight drop-shadow-lg">
          SUBZERO
        </h1>
        <h2 className="text-5xl font-bold text-cyan-300 mb-6 tracking-wide">
          FLEET
        </h2>

        <div className="w-32 h-1.5 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 rounded-full mb-8" />

        <p className="text-2xl text-blue-100 font-light mb-16 tracking-wide">
          Fleet Compliance Analysis Report
        </p>

        {/* Asset Info Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl px-12 py-10 shadow-2xl mb-12 w-full max-w-lg">
          <div className="space-y-5 text-left">
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-sm font-bold text-cyan-300 uppercase tracking-wider">Device ID</span>
              <span className="text-lg font-mono font-bold text-white">{deviceId}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-sm font-bold text-cyan-300 uppercase tracking-wider">Location</span>
              <span className="text-lg font-bold text-white">{locationName}</span>
            </div>
            {locationAddress && (
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-sm font-bold text-cyan-300 uppercase tracking-wider">Address</span>
                <span className="text-base text-blue-100">{locationAddress}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-sm font-bold text-cyan-300 uppercase tracking-wider">Report Period</span>
              <span className="text-xl font-black text-white">{reportPeriod}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-sm font-bold text-cyan-300 uppercase tracking-wider">Generated</span>
              <span className="text-base text-blue-100">{generatedAt}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-sm text-blue-300/60 font-medium">
          Powered by Subzero Fleet Command v2.0
        </p>
      </div>
    </div>
  );
}
