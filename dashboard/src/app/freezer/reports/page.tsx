"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { FreezerSidebar } from "@/components/freezer-sidebar";
import { FleetHeader } from "@/components/fleet-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  FileText,
  FileSpreadsheet,
  Download,
  Loader2,
  Clock,
  Thermometer,
  Zap,
  AlertTriangle,
  Home,
  LayoutGrid,
  Check,
  Grid3X3,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
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

// Chart configurations - Modern cool palette (cyan, teal, blue, purple, indigo)
const tempChartConfig = {
  avg: {
    label: "Average",
    color: "#2dd4bf", // Teal
  },
  min: {
    label: "Min",
    color: "#818cf8", // Indigo
  },
  max: {
    label: "Max",
    color: "#c084fc", // Purple
  },
} satisfies ChartConfig;

const statusChartConfig = {
  value: {
    label: "Assets",
  },
  healthy: {
    label: "Healthy",
    color: "#2dd4bf", // Teal
  },
  warning: {
    label: "Warning",
    color: "#818cf8", // Indigo
  },
  critical: {
    label: "Critical",
    color: "#8b5cf6", // Violet
  },
} satisfies ChartConfig;

const anomalyChartConfig = {
  value: {
    label: "Count",
  },
  tempExcursions: {
    label: "Temp Excursions",
    color: "#8b5cf6", // Violet
  },
  doorEvents: {
    label: "Door Events",
    color: "#a78bfa", // Light violet
  },
  powerSpikes: {
    label: "Power Spikes",
    color: "#60a5fa", // Blue
  },
  frostAlerts: {
    label: "Frost Alerts",
    color: "#5eead4", // Cyan
  },
} satisfies ChartConfig;

const powerChartConfig = {
  power: {
    label: "Power (W)",
    color: "#2dd4bf", // Teal
  },
} satisfies ChartConfig;

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
    { name: "Temp Excursions", value: Math.floor(2 * multiplier + Math.random() * 3), fill: "#8b5cf6" },
    { name: "Door Events", value: Math.floor(5 * multiplier + Math.random() * 5), fill: "#a78bfa" },
    { name: "Power Spikes", value: Math.floor(1 * multiplier + Math.random() * 2), fill: "#60a5fa" },
    { name: "Frost Alerts", value: Math.floor(3 * multiplier + Math.random() * 4), fill: "#5eead4" },
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
    { name: "healthy", value: summary.healthy, fill: "#2dd4bf" },
    { name: "warning", value: summary.warning, fill: "#818cf8" },
    { name: "critical", value: summary.critical, fill: "#8b5cf6" },
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
          pageIcon={FileText}
          breadcrumbs={[
            { label: "Home", href: "/", icon: Home },
            { label: "Dashboard", href: "/freezer", icon: LayoutGrid },
          ]}
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
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Temperature Trend</CardTitle>
                  <CardDescription>{timeRangeLabel}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={tempChartConfig} className="h-[250px] w-full">
                    <LineChart
                      data={tempTrendData}
                      margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => value.slice(0, 5)}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        domain={[-25, -10]}
                        tickFormatter={(value) => `${value}°`}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line
                        dataKey="avg"
                        type="monotone"
                        stroke="var(--color-avg)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        dataKey="min"
                        type="monotone"
                        stroke="var(--color-min)"
                        strokeWidth={1}
                        dot={false}
                        strokeDasharray="4 4"
                      />
                      <Line
                        dataKey="max"
                        type="monotone"
                        stroke="var(--color-max)"
                        strokeWidth={1}
                        dot={false}
                        strokeDasharray="4 4"
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Two Column Charts */}
              <div className="grid grid-cols-2 gap-6">
                {/* Status Distribution */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={statusChartConfig} className="h-[200px] w-full">
                      <PieChart>
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                          data={statusData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                        />
                        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                      </PieChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Anomaly Breakdown */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Anomaly Breakdown</CardTitle>
                    <CardDescription>{timeRangeLabel}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={anomalyChartConfig} className="h-[200px] w-full">
                      <BarChart
                        data={anomalyData}
                        layout="vertical"
                        margin={{ left: 0, right: 12 }}
                      >
                        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                        <XAxis type="number" tickLine={false} axisLine={false} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          width={100}
                          tick={{ fontSize: 11 }}
                        />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent hideLabel />}
                        />
                        <Bar dataKey="value" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Power Consumption Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Power Consumption</CardTitle>
                  <CardDescription>{timeRangeLabel}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={powerChartConfig} className="h-[200px] w-full">
                    <BarChart
                      data={powerData}
                      margin={{ left: 12, right: 12 }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => value.slice(0, 5)}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => `${value}W`}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <Bar dataKey="power" fill="var(--color-power)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Report Generator */}
            <div className="w-96 flex-shrink-0 space-y-6">
              {/* Report Generator Card */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold">Generate Report</CardTitle>
                  <CardDescription>Export the data shown in charts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Report Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-3">
                      Report Type
                    </label>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => setReportType("summary")}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center justify-between ${
                          reportType === "summary"
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div>
                          <div className="font-semibold">Summary</div>
                          <div className={`text-sm ${reportType === "summary" ? "text-slate-300" : "text-slate-500"}`}>
                            High-level overview
                          </div>
                        </div>
                        {reportType === "summary" && (
                          <div className="h-6 w-6 bg-teal-500 rounded-full flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </button>
                      <button
                        onClick={() => setReportType("detailed")}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center justify-between ${
                          reportType === "detailed"
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div>
                          <div className="font-semibold">Detailed</div>
                          <div className={`text-sm ${reportType === "detailed" ? "text-slate-300" : "text-slate-500"}`}>
                            Full analysis report
                          </div>
                        </div>
                        {reportType === "detailed" && (
                          <div className="h-6 w-6 bg-teal-500 rounded-full flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </button>
                      <button
                        onClick={() => setReportType("anomaly")}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center justify-between ${
                          reportType === "anomaly"
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div>
                          <div className="font-semibold">Anomaly Log</div>
                          <div className={`text-sm ${reportType === "anomaly" ? "text-slate-300" : "text-slate-500"}`}>
                            All detected issues
                          </div>
                        </div>
                        {reportType === "anomaly" && (
                          <div className="h-6 w-6 bg-teal-500 rounded-full flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Time Range */}
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-3">
                      Time Range
                    </label>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => setTimeRange("24h")}
                        className={`w-full px-4 py-3 rounded-lg border-2 text-left transition-all flex items-center justify-between ${
                          timeRange === "24h"
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Clock className={`h-5 w-5 ${timeRange === "24h" ? "text-slate-400" : "text-slate-400"}`} />
                          <span className="font-medium">Last 24 Hours</span>
                        </div>
                        {timeRange === "24h" && (
                          <Check className="h-5 w-5 text-teal-400" />
                        )}
                      </button>
                      <button
                        onClick={() => setTimeRange("7d")}
                        className={`w-full px-4 py-3 rounded-lg border-2 text-left transition-all flex items-center justify-between ${
                          timeRange === "7d"
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Clock className={`h-5 w-5 ${timeRange === "7d" ? "text-slate-400" : "text-slate-400"}`} />
                          <span className="font-medium">Last 7 Days</span>
                        </div>
                        {timeRange === "7d" && (
                          <Check className="h-5 w-5 text-teal-400" />
                        )}
                      </button>
                      <button
                        onClick={() => setTimeRange("30d")}
                        className={`w-full px-4 py-3 rounded-lg border-2 text-left transition-all flex items-center justify-between ${
                          timeRange === "30d"
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Clock className={`h-5 w-5 ${timeRange === "30d" ? "text-slate-400" : "text-slate-400"}`} />
                          <span className="font-medium">Last 30 Days</span>
                        </div>
                        {timeRange === "30d" && (
                          <Check className="h-5 w-5 text-teal-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Format */}
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-3">
                      Format
                    </label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setFormat("pdf")}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 font-medium ${
                          format === "pdf"
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                        }`}
                      >
                        <FileText className="h-5 w-5" />
                        PDF
                      </button>
                      <button
                        onClick={() => setFormat("csv")}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 font-medium ${
                          format === "csv"
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                        }`}
                      >
                        <Grid3X3 className="h-5 w-5" />
                        CSV
                      </button>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                    className="w-full py-4 rounded-lg bg-slate-900 text-white font-semibold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5" />
                        Generate Report
                      </>
                    )}
                  </button>
                </CardContent>
              </Card>

              {/* Quick Export */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Quick Export</h3>
                  <div className="space-y-3 border-l-2 border-slate-200 pl-4">
                    <button
                      className="w-full flex items-center gap-3 hover:bg-slate-50 transition-colors py-2 text-left"
                      onClick={() => { setFormat("csv"); setTimeRange("24h"); handleGenerateReport(); }}
                    >
                      <div className="p-2 bg-teal-100 text-teal-600 rounded-lg">
                        <Grid3X3 className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">CSV Export</div>
                        <div className="text-sm text-slate-500">Current snapshot</div>
                      </div>
                    </button>

                    <button
                      className="w-full flex items-center gap-3 hover:bg-slate-50 transition-colors py-2 text-left"
                      onClick={() => { setFormat("pdf"); handleGenerateReport(); }}
                    >
                      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">PDF Report</div>
                        <div className="text-sm text-slate-500">Full status report</div>
                      </div>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
