"use client";

import * as React from "react";
import { useState } from "react";
import { FreezerSidebar } from "@/components/freezer-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  FileSpreadsheet,
  Download,
  Loader2,
  Clock,
  FileBarChart,
  Snowflake,
} from "lucide-react";
import Link from "next/link";

type ReportType = "summary" | "detailed" | "anomaly";
type TimeRange = "24h" | "7d" | "30d";
type Format = "pdf" | "csv";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("summary");
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [format, setFormat] = useState<Format>("pdf");
  const [isGenerating, setIsGenerating] = useState(false);

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
      a.download = `fleet-${reportType}-report-${new Date().toISOString().split("T")[0]}.${extension}`;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-600 text-white">
                <Snowflake className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Subzero Fleet Command</h1>
                <p className="text-xs text-slate-500">Reporting Suite</p>
              </div>
            </div>
            <Link href="/freezer">
              <Button variant="outline" size="sm">
                ← Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main layout with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <FreezerSidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Page Title */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <FileBarChart className="h-6 w-6" />
                Reporting Suite
              </h2>
              <p className="text-slate-600 mt-1">
                Generate and download fleet status reports in various formats.
              </p>
            </div>

            {/* Report Generator Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Generate Report</CardTitle>
                <CardDescription>
                  Configure your report options and download the generated file.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
              </CardContent>
            </Card>

            {/* Quick Export Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setFormat("csv"); setTimeRange("24h"); handleGenerateReport(); }}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
                      <FileSpreadsheet className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Quick CSV Export</h3>
                      <p className="text-sm text-slate-500">Download current snapshot</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setFormat("pdf"); handleGenerateReport(); }}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Quick PDF Report</h3>
                      <p className="text-sm text-slate-500">Generate status report</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Report Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Report Contents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Summary Report</h4>
                    <ul className="text-slate-600 space-y-1">
                      <li>• Executive summary</li>
                      <li>• Fleet statistics</li>
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
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur flex-shrink-0">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div>Subzero Fleet Command v1.0</div>
            <div>Reporting Suite</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
