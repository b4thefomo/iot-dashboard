"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { AlertTriangle, Clock, Thermometer, ArrowUp } from "lucide-react";

interface Excursion {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  peakTemp: number;
  severity: "minor" | "moderate" | "critical";
  aiDiagnosis: string;
}

interface ExcursionLogProps {
  excursions: Excursion[];
  threshold: number;
}

export function ExcursionLog({ excursions, threshold = -10 }: ExcursionLogProps) {
  // Generate timeline data for the month
  const timelineData = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    const dayExcursions = excursions.filter((e) => {
      const excDate = new Date(e.startTime);
      return excDate.getDate() === day;
    });
    const maxTemp = dayExcursions.length > 0
      ? Math.max(...dayExcursions.map((e) => e.peakTemp))
      : null;
    return {
      day: `Jan ${day}`,
      temp: maxTemp,
      hasExcursion: dayExcursions.length > 0,
    };
  }).filter((d) => d.temp !== null || (d as { day: string }).day.includes("1") || (d as { day: string }).day.includes("5") || (d as { day: string }).day.includes("10") || (d as { day: string }).day.includes("15") || (d as { day: string }).day.includes("20") || (d as { day: string }).day.includes("25") || (d as { day: string }).day.includes("31"));

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200", bar: "#ef4444" };
      case "moderate":
        return { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", bar: "#f59e0b" };
      default:
        return { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200", bar: "#eab308" };
    }
  };

  const getRiskLevel = (severity: string) => {
    switch (severity) {
      case "critical":
        return { level: "HIGH", width: "80%", color: "bg-rose-500" };
      case "moderate":
        return { level: "MEDIUM", width: "50%", color: "bg-amber-500" };
      default:
        return { level: "LOW", width: "30%", color: "bg-yellow-500" };
    }
  };

  return (
    <div className="px-8 py-10" style={{ pageBreakAfter: "always" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-800">TEMPERATURE EXCURSION LOG</h2>
        <span className="text-sm text-slate-500">Page 6 of 8</span>
      </div>
      <div className="w-full h-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 mb-8" />

      {/* Description */}
      <p className="text-sm text-slate-600 mb-8">
        An excursion occurs when temperature rises above the {threshold}°C threshold, potentially
        compromising product integrity.
      </p>

      {/* Timeline Chart */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Monthly Excursion Timeline
        </h3>
        {excursions.length > 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData.filter((d) => d.temp !== null)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 9, fill: "#64748b" }}
                  tickLine={{ stroke: "#e2e8f0" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  domain={[-15, -5]}
                  tick={{ fontSize: 9, fill: "#64748b" }}
                  tickLine={{ stroke: "#e2e8f0" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickFormatter={(value) => `${value}°C`}
                />
                <ReferenceLine
                  y={threshold}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  label={{ value: `Threshold ${threshold}°C`, position: "right", fontSize: 9, fill: "#ef4444" }}
                />
                <Bar dataKey="temp" radius={[4, 4, 0, 0]}>
                  {timelineData.filter((d) => d.temp !== null).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.hasExcursion ? "#ef4444" : "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Thermometer className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-emerald-700 font-semibold">No Excursions Recorded</p>
            <p className="text-sm text-emerald-600 mt-1">Temperature remained within safe limits throughout the period</p>
          </div>
        )}
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-rose-500" />
            <span>Excursion Event</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 border-t-2 border-dashed border-rose-500" />
            <span>Threshold ({threshold}°C)</span>
          </div>
        </div>
      </div>

      {/* Excursion Details */}
      {excursions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Excursion Details
          </h3>
          <div className="space-y-4">
            {excursions.slice(0, 3).map((excursion, index) => {
              const colors = getSeverityColor(excursion.severity);
              const risk = getRiskLevel(excursion.severity);
              const startDate = new Date(excursion.startTime);
              const endDate = new Date(excursion.endTime);

              return (
                <div
                  key={excursion.id || index}
                  className={`${colors.bg} border ${colors.border} rounded-xl p-5`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`w-5 h-5 ${colors.text}`} />
                      <span className="font-semibold text-slate-800">EVENT #{index + 1}</span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}
                    >
                      {excursion.severity.charAt(0).toUpperCase() + excursion.severity.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="text-xs text-slate-500">DATE/TIME</div>
                        <div className="text-sm font-medium text-slate-800">
                          {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          <br />
                          {startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} -{" "}
                          {endDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">DURATION</div>
                      <div className="text-sm font-medium text-slate-800">{excursion.duration} minutes</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowUp className="w-4 h-4 text-rose-500" />
                      <div>
                        <div className="text-xs text-slate-500">PEAK TEMP</div>
                        <div className="text-sm font-medium text-slate-800">
                          {excursion.peakTemp}°C
                          <span className="text-xs text-rose-600 ml-1">
                            (+{Math.abs(excursion.peakTemp - (-18)).toFixed(1)}°C above baseline)
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">SEVERITY</div>
                      <div className="text-sm font-medium text-slate-800 capitalize">{excursion.severity}</div>
                    </div>
                  </div>

                  <div className="bg-white/50 rounded-lg p-3 mb-3">
                    <div className="text-xs font-semibold text-slate-500 uppercase mb-1">AI Diagnosis</div>
                    <p className="text-sm text-slate-700 italic">&quot;{excursion.aiDiagnosis}&quot;</p>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 mb-1">RISK LEVEL</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div className={`${risk.color} h-2 rounded-full`} style={{ width: risk.width }} />
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{risk.level}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
