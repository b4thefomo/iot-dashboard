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
            <div className="w-80 flex-shrink-0 space-y-6">
              {/* Report Generator Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Generate Report</CardTitle>
                  <CardDescription>Export the data shown in charts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
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
                </CardContent>
              </Card>

              {/* Quick Export */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Export</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
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
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
