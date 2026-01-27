"use client";

import * as React from "react";
import { Snowflake, CheckCircle, XCircle, ShieldCheck, FileCheck } from "lucide-react";

interface ComplianceThreshold {
  metric: string;
  threshold: string;
  actual: string;
  pass: boolean;
}

interface ReportFooterProps {
  auditHash: string;
  timestamp: string;
  dataSource: string;
  recordCount: number;
  complianceThresholds: ComplianceThreshold[];
  engineVersion: string;
}

export function ReportFooter({
  auditHash,
  timestamp,
  dataSource,
  recordCount,
  complianceThresholds,
  engineVersion,
}: ReportFooterProps) {
  const allPassing = complianceThresholds.every(t => t.pass);

  return (
    <div
      className="report-page px-10 py-8 bg-white"
      style={{ minHeight: "277mm", height: "277mm", overflow: "hidden" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-black tracking-tight text-slate-900">
          APPENDIX & CERTIFICATION
        </h2>
        <span className="text-sm font-medium text-slate-400">Final Page</span>
      </div>
      <div className="w-full h-1 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-400 rounded-full mb-6" />

      {/* Audit Trail Section - MOVED HERE */}
      <div className="mb-6">
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-3">
          Audit Trail & Data Integrity
        </h3>
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-base font-bold">Authenticated & Verified</p>
                <p className="text-xs text-slate-400">Data integrity confirmed via cryptographic hash</p>
              </div>
              <div className="ml-auto flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs font-bold">VERIFIED</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-slate-400 font-medium">Audit Hash</span>
                <span className="font-mono font-bold text-cyan-400">{auditHash}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-slate-400 font-medium">Algorithm</span>
                <span className="font-bold text-emerald-400">SHA-256</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-slate-400 font-medium">Generated</span>
                <span className="text-slate-300">{new Date(timestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-slate-400 font-medium">Data Source</span>
                <span className="text-slate-300">{dataSource}</span>
              </div>
              <div className="col-span-2 flex justify-between items-center py-2">
                <span className="text-slate-400 font-medium">Total Records Analyzed</span>
                <span className="text-xl font-black text-white">{recordCount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Thresholds */}
      <div className="mb-6">
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-3">
          Compliance Verification
        </h3>
        <div className={`rounded-xl overflow-hidden shadow-lg border-2 ${allPassing ? "border-emerald-200" : "border-amber-200"}`}>
          <div className={`p-3 ${allPassing ? "bg-emerald-500" : "bg-amber-500"} text-white flex items-center justify-between`}>
            <span className="font-bold uppercase tracking-wider text-sm">Threshold Check</span>
            <span className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
              {allPassing ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {allPassing ? "ALL PASSING" : "ATTENTION"}
            </span>
          </div>
          <table className="w-full text-sm bg-white">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-2 px-4 font-bold text-slate-600 uppercase text-xs">Metric</th>
                <th className="text-left py-2 px-4 font-bold text-slate-600 uppercase text-xs">Threshold</th>
                <th className="text-left py-2 px-4 font-bold text-slate-600 uppercase text-xs">Actual</th>
                <th className="text-center py-2 px-4 font-bold text-slate-600 uppercase text-xs">Status</th>
              </tr>
            </thead>
            <tbody>
              {complianceThresholds.map((item, index) => (
                <tr key={index} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 px-4 text-slate-800 font-medium">{item.metric}</td>
                  <td className="py-2 px-4 text-slate-500">{item.threshold}</td>
                  <td className="py-2 px-4 text-slate-900 font-bold">{item.actual}</td>
                  <td className="py-2 px-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                      item.pass ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                    }`}>
                      {item.pass ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {item.pass ? "PASS" : "FAIL"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Glossary - WITH MKT DEFINITION */}
      <div className="mb-6">
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-3">
          Glossary of Terms
        </h3>
        <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-lg border border-slate-100">
              <span className="text-xs font-black text-blue-600 uppercase tracking-wider">MKT *</span>
              <p className="text-xs text-slate-600 mt-1">
                <strong>Mean Kinetic Temperature</strong> - A calculated single temperature value representing the cumulative thermal stress on stored products. It accounts for the non-linear effect of temperature on degradation rates using the Arrhenius equation: MKT = ΔH/R ÷ ln[Σexp(-ΔH/RT)/n].
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-100">
              <span className="text-xs font-black text-teal-600 uppercase tracking-wider">COP</span>
              <p className="text-xs text-slate-600 mt-1">
                <strong>Coefficient of Performance</strong> - Ratio of cooling capacity to electrical input power, measuring refrigeration efficiency. Higher values indicate better performance.
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-100">
              <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">Thermal Excursion</span>
              <p className="text-xs text-slate-600 mt-1">
                A temperature event where readings exceed the defined safe operating range (-15°C to -21°C for frozen storage).
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-100">
              <span className="text-xs font-black text-amber-600 uppercase tracking-wider">Compliance Status</span>
              <p className="text-xs text-slate-600 mt-1">
                Overall assessment based on all monitored parameters meeting their respective regulatory and operational thresholds.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 rounded-xl p-5 text-center text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-24 h-24 bg-cyan-400 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-blue-500 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
              <Snowflake className="w-6 h-6" />
            </div>
            <div className="text-left">
              <span className="text-2xl font-black tracking-tight">SUBZERO FLEET</span>
              <p className="text-cyan-300 text-xs font-medium">Compliance Monitoring System</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-400 mt-3">
            <span className="flex items-center gap-1">
              <FileCheck className="w-3 h-3" />
              Report Generated: {new Date(timestamp).toLocaleDateString()}
            </span>
            <span>|</span>
            <span>Engine v{engineVersion}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
