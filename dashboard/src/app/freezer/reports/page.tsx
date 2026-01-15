"use client";

import * as React from "react";
import { useState } from "react";
import { FreezerSidebar } from "@/components/freezer-sidebar";
import { FleetHeader } from "@/components/fleet-header";
import { Button } from "@/components/ui/button";
import {
  FileText,
  FileSpreadsheet,
  Download,
  Loader2,
  Clock,
} from "lucide-react";

type ReportType = "summary" | "detailed" | "anomaly";
type TimeRange = "24h" | "7d" | "30d";
type Format = "pdf" | "csv";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("summary");
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [format, setFormat] = useState<Format>("pdf");
  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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
          <div className="max-w-4xl">
            {/* Report Generator Card */}
            <div className="bg-white border mb-6">
              <div className="px-4 py-3 border-b">
                <h3 className="font-semibold text-slate-900">Generate Report</h3>
                <p className="text-sm text-slate-500">Configure your report options and download the generated file.</p>
              </div>
              <div className="p-4 space-y-6">
                {/* Report Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Report Type
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant={reportType === "summary" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setReportType("summary")}
                    >
                      Summary
                    </Button>
                    <Button
                      variant={reportType === "detailed" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setReportType("detailed")}
                    >
                      Detailed
                    </Button>
                    <Button
                      variant={reportType === "anomaly" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setReportType("anomaly")}
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
                  <div className="flex gap-2">
                    <Button
                      variant={timeRange === "24h" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeRange("24h")}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Last 24 Hours
                    </Button>
                    <Button
                      variant={timeRange === "7d" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeRange("7d")}
                    >
                      Last 7 Days
                    </Button>
                    <Button
                      variant={timeRange === "30d" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeRange("30d")}
                    >
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
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                    <Button
                      variant={format === "csv" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormat("csv")}
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
                    className="w-full sm:w-auto"
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

            {/* Quick Export Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                className="bg-white border p-6 hover:bg-slate-50 transition-colors text-left"
                onClick={() => { setFormat("csv"); setTimeRange("24h"); handleGenerateReport(); }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 text-emerald-600">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Quick CSV Export</h3>
                    <p className="text-sm text-slate-500">Download current snapshot</p>
                  </div>
                </div>
              </button>

              <button
                className="bg-white border p-6 hover:bg-slate-50 transition-colors text-left"
                onClick={() => { setFormat("pdf"); handleGenerateReport(); }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 text-blue-600">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Quick PDF Report</h3>
                    <p className="text-sm text-slate-500">Generate status report</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Report Info */}
            <div className="bg-white border">
              <div className="px-4 py-3 border-b">
                <h3 className="font-semibold text-slate-900">Report Contents</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Summary Report</h4>
                    <ul className="text-slate-600 space-y-1">
                      <li>• Executive summary</li>
                      <li>• Asset statistics</li>
                      <li>• Status breakdown</li>
                      <li>• Active alerts</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Detailed Report</h4>
                    <ul className="text-slate-600 space-y-1">
                      <li>• All summary content</li>
                      <li>• Unit-by-unit data</li>
                      <li>• Historical trends</li>
                      <li>• Maintenance notes</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Anomaly Log</h4>
                    <ul className="text-slate-600 space-y-1">
                      <li>• Temperature excursions</li>
                      <li>• Door open events</li>
                      <li>• Fault history</li>
                      <li>• Power anomalies</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
