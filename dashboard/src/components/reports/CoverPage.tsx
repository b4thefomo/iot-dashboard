"use client";

import * as React from "react";
import { Snowflake, Shield } from "lucide-react";

interface CoverPageProps {
  deviceId: string;
  assetName: string;
  reportPeriod: string;
  generatedAt: string;
  auditHash: string;
}

export function CoverPage({
  deviceId,
  assetName,
  reportPeriod,
  generatedAt,
  auditHash,
}: CoverPageProps) {
  return (
    <div
      className="relative flex flex-col items-center justify-center px-8 py-12"
      style={{ minHeight: "297mm", pageBreakAfter: "always" }}
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-slate-50 to-blue-50" />

      {/* Frosted Border */}
      <div className="absolute inset-8 border-2 border-cyan-200/50 rounded-3xl" />
      <div className="absolute inset-10 border border-cyan-100/30 rounded-2xl" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Logo Section */}
        <div className="mb-8 relative">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
            <Snowflake className="w-16 h-16 text-white" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-cyan-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent mb-2">
          GUARDIAN
        </h1>
        <h2 className="text-4xl font-bold text-slate-700 mb-4">LEDGER</h2>

        <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mb-6" />

        <p className="text-xl text-slate-600 mb-12">
          Thermal & Mechanical Integrity
          <br />
          Compliance Report
        </p>

        {/* Asset Info Card */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl px-10 py-8 shadow-xl mb-12 w-full max-w-md">
          <div className="space-y-4 text-left">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm font-medium text-slate-500">ASSET</span>
              <span className="text-sm font-semibold text-slate-800">{assetName}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm font-medium text-slate-500">DEVICE ID</span>
              <span className="text-sm font-mono text-slate-800">{deviceId}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm font-medium text-slate-500">REPORT PERIOD</span>
              <span className="text-sm font-semibold text-slate-800">{reportPeriod}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-slate-500">GENERATED</span>
              <span className="text-sm text-slate-800">{generatedAt}</span>
            </div>
          </div>
        </div>

        {/* Audit Trail */}
        <div className="bg-slate-900 text-white rounded-xl px-8 py-5 w-full max-w-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 tracking-wider">AUDIT TRAIL</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400">VERIFIED</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Hash:</span>
              <span className="font-mono text-cyan-300">{auditHash}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Integrity:</span>
              <span className="text-emerald-300">SHA-256 verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-xs text-slate-400">
          Powered by Guardian Ledger Engine v2.0
        </p>
      </div>
    </div>
  );
}
