"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { FreezerSidebar } from "@/components/freezer-sidebar";
import { FleetHeader } from "@/components/fleet-header";
import { Button } from "@/components/ui/button";
import {
  FileText,
  FileSpreadsheet,
  Download,
  Loader2,
  Clock,
  Thermometer,
  Zap,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

type ReportType = "summary" | "detailed" | "anomaly";
type TimeRange = "24h" | "7d" | "30d";
type Format = "pdf" | "csv";

interface AssetSummary {
  total: number;
  healthy: number;
  warning: number;
  critical: number;
  avgTemp: number;
  avgPower: number;
  anomalyCount: number;
}

// Generate mock chart data based on time range
function generateTempTrendData(timeRange: TimeRange) {
  const points = timeRange === "24h" ? 24 : timeRange === "7d" ? 7 : 30;
  const labels = timeRange === "24h"
    ? Array.from({ length: points }, (_, i) => `${i}:00`)
    : Array.from({ length: points }, (_, i) => `Day ${i + 1}`);

  return labels.map((label, i) => ({
    name: label,
    avg: -18 + Math.sin(i * 0.5) * 2 + (Math.random() - 0.5) * 1,
    min: -22 + Math.sin(i * 0.5) * 1.5 + (Math.random() - 0.5) * 0.5,
    max: -14 + Math.sin(i * 0.5) * 2.5 + (Math.random() - 0.5) * 1.5,
  }));
}

function generatePowerData(timeRange: TimeRange) {
  const points = timeRange === "24h" ? 24 : timeRange === "7d" ? 7 : 30;
  const labels = timeRange === "24h"
    ? Array.from({ length: points }, (_, i) => `${i}:00`)
    : Array.from({ length: points }, (_, i) => `Day ${i + 1}`);

  return labels.map((label) => ({
    name: label,
    power: 400 + Math.random() * 200,
  }));
}

function generateAnomalyData(timeRange: TimeRange) {
  const multiplier = timeRange === "24h" ? 1 : timeRange === "7d" ? 3 : 10;
  return [
    { name: "Temp Excursions", value: Math.floor(2 * multiplier + Math.random() * 3), color: "#ef4444" },
    { name: "Door Events", value: Math.floor(5 * multiplier + Math.random() * 5), color: "#f59e0b" },
    { name: "Power Spikes", value: Math.floor(1 * multiplier + Math.random() * 2), color: "#3b82f6" },
    { name: "Frost Alerts", value: Math.floor(3 * multiplier + Math.random() * 4), color: "#06b6d4" },
  ];
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("summary");
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [format, setFormat] = useState<Format>("pdf");
  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [summary, setSummary] = useState<AssetSummary>({
    total: 5,
    healthy: 3,
    warning: 1,
    critical: 1,
    avgTemp: -18.2,
    avgPower: 520,
    anomalyCount: 12,
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Fetch summary data
  useEffect(() => {
    fetch(`${apiUrl}/api/fleet/status`)
      .then(res => res.json())
      .then(data => {
        if (data.summary) {
          const devices = Object.values(data.devices || {}) as Array<{ temp_cabinet: number; compressor_power_w: number }>;
          setSummary({
            total: data.summary.total || 0,
            healthy: data.summary.healthy || 0,
            warning: data.summary.warning || 0,
            critical: data.summary.critical || 0,
            avgTemp: devices.length > 0
              ? devices.reduce((sum, d) => sum + d.temp_cabinet, 0) / devices.length
              : -18,
            avgPower: devices.length > 0
              ? devices.reduce((sum, d) => sum + d.compressor_power_w, 0) / devices.length
              : 500,
            anomalyCount: (data.alerts?.length || 0) * (timeRange === "24h" ? 1 : timeRange === "7d" ? 3 : 10),
          });
        }
      })
      .catch(() => {});
  }, [apiUrl, timeRange]);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const endpoint = format === "pdf"
        ? `${apiUrl}/api/fleet/export/pdf`
        : `${apiUrl}/api/fleet/export/csv?range=${timeRange}`;

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error("Report generation failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const extension = format === "pdf" ? "pdf" : "csv";
      a.download = `asset-${reportType}-report-${new Date().toISOString().split("T")[0]}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Report generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Chart data
  const tempTrendData = generateTempTrendData(timeRange);
  const powerData = generatePowerData(timeRange);
  const anomalyData = generateAnomalyData(timeRange);

  const statusData = [
    { name: "Healthy", value: summary.healthy, color: "#10b981" },
    { name: "Warning", value: summary.warning, color: "#f59e0b" },
    { name: "Critical", value: summary.critical, color: "#ef4444" },
  ];

  const timeRangeLabel = timeRange === "24h" ? "Last 24 Hours" : timeRange === "7d" ? "Last 7 Days" : "Last 30 Days";

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <FreezerSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <FleetHeader
          title="Reporting Suite"
          isConnected={true}
          isOnline={true}
          alertCount={0}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <div className="flex gap-6">
            {/* Left Column - Charts */}
            <div className="flex-1 space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white border p-4">
                  <div className="text-xs text-slate-500 mb-1">Total Assets</div>
                  <div className="text-2xl font-bold text-slate-900">{summary.total}</div>
                </div>
                <div className="bg-white border p-4">
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <Thermometer className="h-3 w-3" /> Avg Temp
                  </div>
                  <div className="text-2xl font-bold text-cyan-600">{summary.avgTemp.toFixed(1)}°C</div>
                </div>
                <div className="bg-white border p-4">
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Avg Power
                  </div>
                  <div className="text-2xl font-bold text-emerald-600">{summary.avgPower.toFixed(0)}W</div>
                </div>
                <div className="bg-white border p-4">
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Anomalies
                  </div>
                  <div className="text-2xl font-bold text-amber-600">{summary.anomalyCount}</div>
                </div>
              </div>

              {/* Temperature Trend Chart */}
              <div className="bg-white border">
                <div className="px-4 py-3 border-b">
                  <h3 className="font-semibold text-slate-900">Temperature Trend</h3>
                  <p className="text-xs text-slate-500">{timeRangeLabel}</p>
                </div>
                <div className="p-4 h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tempTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" domain={[-25, -10]} />
                      <Tooltip
                        contentStyle={{ fontSize: 12, border: "1px solid #e2e8f0" }}
                        formatter={(value: number) => [`${value.toFixed(1)}°C`]}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="avg" name="Average" stroke="#06b6d4" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="min" name="Min" stroke="#3b82f6" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                      <Line type="monotone" dataKey="max" name="Max" stroke="#ef4444" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Two Column Charts */}
              <div className="grid grid-cols-2 gap-6">
                {/* Status Distribution */}
                <div className="bg-white border">
                  <div className="px-4 py-3 border-b">
                    <h3 className="font-semibold text-slate-900">Status Distribution</h3>
                  </div>
                  <div className="p-4 h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [value, "Assets"]} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Anomaly Breakdown */}
                <div className="bg-white border">
                  <div className="px-4 py-3 border-b">
                    <h3 className="font-semibold text-slate-900">Anomaly Breakdown</h3>
                    <p className="text-xs text-slate-500">{timeRangeLabel}</p>
                  </div>
                  <div className="p-4 h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={anomalyData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="#94a3b8" width={90} />
                        <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #e2e8f0" }} />
                        <Bar dataKey="value" name="Count">
                          {anomalyData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Power Consumption Chart */}
              <div className="bg-white border">
                <div className="px-4 py-3 border-b">
                  <h3 className="font-semibold text-slate-900">Power Consumption</h3>
                  <p className="text-xs text-slate-500">{timeRangeLabel}</p>
                </div>
                <div className="p-4 h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={powerData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ fontSize: 12, border: "1px solid #e2e8f0" }}
                        formatter={(value: number) => [`${value.toFixed(0)}W`, "Power"]}
                      />
                      <Bar dataKey="power" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right Column - Report Generator */}
            <div className="w-80 flex-shrink-0 space-y-6">
              {/* Report Generator Card */}
              <div className="bg-white border">
                <div className="px-4 py-3 border-b">
                  <h3 className="font-semibold text-slate-900">Generate Report</h3>
                  <p className="text-sm text-slate-500">Export the data shown in charts</p>
                </div>
                <div className="p-4 space-y-5">
                  {/* Report Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Report Type
                    </label>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant={reportType === "summary" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setReportType("summary")}
                        className="justify-start"
                      >
                        Summary
                      </Button>
                      <Button
                        variant={reportType === "detailed" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setReportType("detailed")}
                        className="justify-start"
                      >
                        Detailed
                      </Button>
                      <Button
                        variant={reportType === "anomaly" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setReportType("anomaly")}
                        className="justify-start"
                      >
                        Anomaly Log
                      </Button>
                    </div>
                  </div>

                  {/* Time Range */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Time Range
                    </label>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant={timeRange === "24h" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTimeRange("24h")}
                        className="justify-start"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Last 24 Hours
                      </Button>
                      <Button
                        variant={timeRange === "7d" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTimeRange("7d")}
                        className="justify-start"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Last 7 Days
                      </Button>
                      <Button
                        variant={timeRange === "30d" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTimeRange("30d")}
                        className="justify-start"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Last 30 Days
                      </Button>
                    </div>
                  </div>

                  {/* Format */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Format
                    </label>
                    <div className="flex gap-2">
                      <Button
                        variant={format === "pdf" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormat("pdf")}
                        className="flex-1"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                      <Button
                        variant={format === "csv" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormat("csv")}
                        className="flex-1"
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-1" />
                        CSV
                      </Button>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <div className="pt-4 border-t">
                    <Button
                      size="lg"
                      onClick={handleGenerateReport}
                      disabled={isGenerating}
                      className="w-full"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Generate Report
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Quick Export */}
              <div className="bg-white border">
                <div className="px-4 py-3 border-b">
                  <h3 className="font-semibold text-slate-900">Quick Export</h3>
                </div>
                <div className="p-4 space-y-3">
                  <button
                    className="w-full p-3 border hover:bg-slate-50 transition-colors text-left flex items-center gap-3"
                    onClick={() => { setFormat("csv"); setTimeRange("24h"); handleGenerateReport(); }}
                  >
                    <div className="p-2 bg-emerald-100 text-emerald-600">
                      <FileSpreadsheet className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 text-sm">CSV Export</div>
                      <div className="text-xs text-slate-500">Current snapshot</div>
                    </div>
                  </button>

                  <button
                    className="w-full p-3 border hover:bg-slate-50 transition-colors text-left flex items-center gap-3"
                    onClick={() => { setFormat("pdf"); handleGenerateReport(); }}
                  >
                    <div className="p-2 bg-blue-100 text-blue-600">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 text-sm">PDF Report</div>
                      <div className="text-xs text-slate-500">Full status report</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
