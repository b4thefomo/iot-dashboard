"use client";

import * as React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { CheckCircle, XCircle, ThermometerSnowflake, TrendingUp, TrendingDown } from "lucide-react";

interface TempDataPoint {
  timestamp: string;
  temp: number;
}

interface TemperatureAnalysisProps {
  temperatureData: TempDataPoint[];
  mkt: {
    mkt: number;
    interpretation: string;
    sampleCount: number;
    formula: string;
  } | null;
}

export function TemperatureAnalysis({ temperatureData, mkt }: TemperatureAnalysisProps) {
  // Process data for chart
  const sampleInterval = Math.max(1, Math.floor(temperatureData.length / 50));
  const chartData = temperatureData
    .filter((_, index) => index % sampleInterval === 0)
    .map((point) => ({
      date: new Date(point.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      temp: point.temp,
    }));

  // Calculate statistics
  const temps = temperatureData.map(t => t.temp);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
  const tempVariance = maxTemp - minTemp;

  const isPass = mkt?.interpretation === "PASS";
  const statusColor = isPass ? "from-emerald-500 to-teal-600" : "from-rose-500 to-red-600";

  // Generate analysis prose
  const stabilityAssessment = tempVariance < 3
    ? "exhibited excellent thermal stability with minimal fluctuation"
    : tempVariance < 6
    ? "maintained acceptable temperature stability throughout the period"
    : "showed notable temperature variations that warrant monitoring";

  const complianceAssessment = isPass
    ? "remained consistently within the safe operating range of -15°C to -21°C, ensuring optimal conditions for frozen goods storage"
    : "approached or exceeded safe operating thresholds during portions of the monitoring period";

  return (
    <div
      className="report-page px-10 py-8 bg-white"
      style={{ minHeight: "277mm", height: "277mm", pageBreakAfter: "always", breakAfter: "page", overflow: "hidden" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-black tracking-tight text-slate-900">
          THERMAL ANALYSIS
        </h2>
        <span className="text-sm font-medium text-slate-400">Page 4 of 7</span>
      </div>
      <div className="w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 rounded-full mb-6" />

      {/* Analysis Narrative */}
      <div className="mb-6">
        <p className="text-slate-700 text-base leading-relaxed">
          Throughout the reporting period, this unit {stabilityAssessment}. Temperature readings {complianceAssessment}. The calculated MKT* of <strong>{mkt?.mkt.toFixed(1) || "N/A"}°C</strong> provides a single-value representation of the cumulative thermal exposure experienced by stored products.
        </p>
      </div>

      {/* Hero Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* MKT Card */}
        <div className={`bg-gradient-to-br ${statusColor} rounded-2xl p-4 text-white shadow-xl relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <ThermometerSnowflake className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">MKT*</span>
            </div>
            <div className="text-4xl font-black">{mkt?.mkt.toFixed(1) || "N/A"}</div>
            <div className="text-lg font-bold opacity-80">°C</div>
            <div className="mt-2 inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
              {isPass ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span className="text-xs font-bold">{mkt?.interpretation || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Min Temp */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-100 border-2 border-blue-200 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Minimum</span>
          </div>
          <div className="text-4xl font-black text-slate-900">{minTemp.toFixed(1)}</div>
          <div className="text-lg font-bold text-blue-600">°C</div>
        </div>

        {/* Max Temp */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-100 border-2 border-amber-200 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Maximum</span>
          </div>
          <div className="text-4xl font-black text-slate-900">{maxTemp.toFixed(1)}</div>
          <div className="text-lg font-bold text-amber-600">°C</div>
        </div>

        {/* Variance */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Variance</span>
          </div>
          <div className="text-4xl font-black text-slate-900">{tempVariance.toFixed(1)}</div>
          <div className="text-lg font-bold text-slate-500">°C range</div>
          <div className={`text-xs font-bold ${tempVariance < 3 ? "text-emerald-600" : tempVariance < 6 ? "text-amber-600" : "text-rose-600"}`}>
            {tempVariance < 3 ? "Excellent" : tempVariance < 6 ? "Acceptable" : "Monitor"}
          </div>
        </div>
      </div>

      {/* Temperature Chart */}
      <div className="mb-6">
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-3">
          Temperature Trend
        </h3>
        <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 h-56 shadow-inner">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="tempGradientReport" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0891b2" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }}
                tickLine={{ stroke: "#e2e8f0" }}
                axisLine={{ stroke: "#cbd5e1" }}
              />
              <YAxis
                domain={[-25, -10]}
                tick={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }}
                tickLine={{ stroke: "#e2e8f0" }}
                axisLine={{ stroke: "#cbd5e1" }}
                tickFormatter={(value) => `${value}°`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "white",
                }}
                formatter={(value: number) => [`${value.toFixed(1)}°C`, "Temp"]}
              />
              <ReferenceLine y={-15} stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 3" />
              <ReferenceLine y={-21} stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 3" />
              <Area
                type="monotone"
                dataKey="temp"
                stroke="#0891b2"
                strokeWidth={2}
                fill="url(#tempGradientReport)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-cyan-600 rounded" />
            <span>Recorded Temperature</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 border-t-2 border-dashed border-amber-500" />
            <span>Safe Range (-15°C to -21°C)</span>
          </div>
        </div>
      </div>

      {/* Interpretation */}
      <div className={`${isPass ? "bg-emerald-500" : "bg-rose-500"} rounded-2xl p-5 text-white shadow-xl`}>
        <h3 className="text-sm font-black uppercase tracking-wider mb-2">
          Thermal Compliance Assessment
        </h3>
        <p className="text-base leading-relaxed text-white/95">
          {isPass ? (
            <>
              This unit <strong>PASSES</strong> thermal compliance requirements. The MKT* of {mkt?.mkt.toFixed(1)}°C confirms that cumulative thermal exposure remained well within acceptable limits throughout the reporting period, ensuring product integrity and regulatory compliance.
            </>
          ) : (
            <>
              This unit <strong>REQUIRES ATTENTION</strong> regarding thermal compliance. The MKT* of {mkt?.mkt.toFixed(1)}°C indicates that thermal exposure approached or exceeded safe thresholds. Review operational procedures and consider equipment inspection to prevent product quality issues.
            </>
          )}
        </p>
      </div>

      {/* Footnote */}
      <div className="mt-4 pt-3 border-t border-slate-200">
        <p className="text-xs text-slate-500 italic">
          * MKT (Mean Kinetic Temperature) - See Appendix for definition and calculation methodology.
        </p>
      </div>
    </div>
  );
}
