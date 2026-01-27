"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Snowflake,
  FileText,
  Download,
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
  Moon,
  ThermometerSnowflake,
  Package,
} from "lucide-react";

interface ReportMetrics {
  mkt: { mkt: number; interpretation: string } | null;
  vhi: { index: number; trend: string } | null;
  nightGap: { score: number } | null;
  excursions: Array<{ severity: string }>;
}

interface ReportHistoryItem {
  id: string;
  device_id: string;
  report_month: string;
  mkt_celsius: number | null;
  vibration_health_index: number | null;
  compliance_status: string;
  generated_at: string;
  audit_hash: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function GuardianLedgerReportsPage() {
  const [selectedDevice, setSelectedDevice] = useState("home_freezer_sim");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportFormat, setReportFormat] = useState<"both" | "pdf" | "csv">("both");
  const [options, setOptions] = useState({
    nightGapAnalysis: true,
    vibrationHealth: true,
    aiSummaries: true,
    engineerBrief: true,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [reportHistory, setReportHistory] = useState<ReportHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Load metrics preview when device or date changes
  React.useEffect(() => {
    const loadMetrics = async () => {
      setIsLoadingMetrics(true);
      try {
        const response = await fetch(
          `${apiUrl}/api/home-freezer/${selectedDevice}/monthly?month=${selectedMonth}&year=${selectedYear}`
        );
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        } else {
          setMetrics(null);
        }
      } catch (error) {
        console.error("Failed to load metrics:", error);
        setMetrics(null);
      } finally {
        setIsLoadingMetrics(false);
      }
    };

    loadMetrics();
  }, [selectedDevice, selectedMonth, selectedYear, apiUrl]);

  // Load report history
  React.useEffect(() => {
    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const response = await fetch(`${apiUrl}/api/home-freezer/reports/history?limit=10`);
        if (response.ok) {
          const data = await response.json();
          setReportHistory(data.reports || []);
        }
      } catch (error) {
        console.error("Failed to load history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [apiUrl]);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`${apiUrl}/api/home-freezer/reports/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: selectedDevice,
          month: selectedMonth,
          year: selectedYear,
          format: reportFormat,
          options: {
            includeNightGap: options.nightGapAnalysis,
            includeVibration: options.vibrationHealth,
            includeAISummaries: options.aiSummaries,
            includeEngineerBrief: options.engineerBrief,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to generate report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Determine file extension based on format
      const ext = reportFormat === "pdf" ? "pdf" : reportFormat === "csv" ? "csv" : "zip";
      a.download = `guardian-ledger-${selectedDevice}-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.${ext}`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Refresh history
      const historyResponse = await fetch(`${apiUrl}/api/home-freezer/reports/history?limit=10`);
      if (historyResponse.ok) {
        const data = await historyResponse.json();
        setReportHistory(data.reports || []);
      }
    } catch (error) {
      console.error("Report generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/home-freezer/reports/${reportId}/download`);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `guardian-ledger-report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const getComplianceDisplay = (status: string) => {
    switch (status) {
      case "compliant":
        return { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", label: "Pass" };
      case "warning":
        return { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", label: "Warn" };
      case "non_compliant":
        return { icon: XCircle, color: "text-rose-600", bg: "bg-rose-50", label: "Fail" };
      default:
        return { icon: CheckCircle, color: "text-slate-600", bg: "bg-slate-50", label: "N/A" };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 rounded-xl">
                <Snowflake className="h-6 w-6 text-cyan-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Guardian Ledger</h1>
                <p className="text-sm text-slate-500">Thermal & Mechanical Integrity Reports</p>
              </div>
            </div>
            <Link
              href="/home-freezer"
              className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Home Freezer
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Generate Report Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-cyan-600" />
              Generate New Report
            </CardTitle>
            <CardDescription>
              Create an audit-ready compliance report for your freezer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selection Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Device Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Device</label>
                <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home_freezer_sim">Freezer 1 (Simulator)</SelectItem>
                    <SelectItem value="HOME_FREEZER_01">Freezer 1 (Hardware)</SelectItem>
                    <SelectItem value="FREEZER_MAIN">Freezer 2 (FREEZER_MAIN)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Month Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Period</label>
                <div className="flex gap-2">
                  <Select
                    value={String(selectedMonth)}
                    onValueChange={(v) => setSelectedMonth(parseInt(v))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month, idx) => (
                        <SelectItem key={idx} value={String(idx + 1)}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(selectedYear)}
                    onValueChange={(v) => setSelectedYear(parseInt(v))}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026].map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Format Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Format</label>
                <Select value={reportFormat} onValueChange={(v) => setReportFormat(v as "both" | "pdf" | "csv")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">PDF + CSV (ZIP)</SelectItem>
                    <SelectItem value="pdf">PDF Only</SelectItem>
                    <SelectItem value="csv">CSV Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Report Options */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="nightGap"
                  checked={options.nightGapAnalysis}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({ ...prev, nightGapAnalysis: !!checked }))
                  }
                />
                <label htmlFor="nightGap" className="text-sm text-slate-600">
                  Night Gap Analysis
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vibration"
                  checked={options.vibrationHealth}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({ ...prev, vibrationHealth: !!checked }))
                  }
                />
                <label htmlFor="vibration" className="text-sm text-slate-600">
                  Vibration Health
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="aiSummaries"
                  checked={options.aiSummaries}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({ ...prev, aiSummaries: !!checked }))
                  }
                />
                <label htmlFor="aiSummaries" className="text-sm text-slate-600">
                  AI Summaries
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="engineerBrief"
                  checked={options.engineerBrief}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({ ...prev, engineerBrief: !!checked }))
                  }
                />
                <label htmlFor="engineerBrief" className="text-sm text-slate-600">
                  Engineer Brief
                </label>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Report{reportFormat === "both" ? " Package" : ""}...
                </>
              ) : (
                <>
                  {reportFormat === "both" ? (
                    <Package className="h-4 w-4 mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {reportFormat === "both" ? "Generate Report Package (PDF + CSV)" : reportFormat === "pdf" ? "Generate PDF Report" : "Generate CSV Data Export"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Key Metrics Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key Metrics Preview</CardTitle>
            <CardDescription>
              {MONTHS[selectedMonth - 1]} {selectedYear} - {selectedDevice}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-600" />
              </div>
            ) : metrics ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* MKT */}
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <ThermometerSnowflake className="h-5 w-5 mx-auto mb-2 text-cyan-600" />
                  <div className="text-xs text-slate-500 mb-1">MKT</div>
                  <div className="text-xl font-bold text-slate-900">
                    {metrics.mkt ? `${metrics.mkt.mkt}°C` : "N/A"}
                  </div>
                  {metrics.mkt && (
                    <Badge
                      variant="outline"
                      className={
                        metrics.mkt.interpretation === "PASS"
                          ? "border-emerald-300 text-emerald-700"
                          : metrics.mkt.interpretation === "MARGINAL"
                          ? "border-amber-300 text-amber-700"
                          : "border-rose-300 text-rose-700"
                      }
                    >
                      {metrics.mkt.interpretation}
                    </Badge>
                  )}
                </div>

                {/* Health Index */}
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <Activity className="h-5 w-5 mx-auto mb-2 text-blue-600" />
                  <div className="text-xs text-slate-500 mb-1">Health</div>
                  <div className="text-xl font-bold text-slate-900">
                    {metrics.vhi?.index !== null ? `${metrics.vhi.index}%` : "N/A"}
                  </div>
                  {metrics.vhi && (
                    <Badge
                      variant="outline"
                      className={
                        metrics.vhi.index >= 85
                          ? "border-emerald-300 text-emerald-700"
                          : metrics.vhi.index >= 70
                          ? "border-amber-300 text-amber-700"
                          : "border-rose-300 text-rose-700"
                      }
                    >
                      {metrics.vhi.trend}
                    </Badge>
                  )}
                </div>

                {/* Night Stability */}
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <Moon className="h-5 w-5 mx-auto mb-2 text-indigo-600" />
                  <div className="text-xs text-slate-500 mb-1">Night</div>
                  <div className="text-xl font-bold text-slate-900">
                    {metrics.nightGap?.score !== null ? `${metrics.nightGap.score}%` : "N/A"}
                  </div>
                  {metrics.nightGap && (
                    <Badge
                      variant="outline"
                      className={
                        metrics.nightGap.score >= 90
                          ? "border-emerald-300 text-emerald-700"
                          : metrics.nightGap.score >= 75
                          ? "border-amber-300 text-amber-700"
                          : "border-rose-300 text-rose-700"
                      }
                    >
                      Stable
                    </Badge>
                  )}
                </div>

                {/* Excursions */}
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-amber-600" />
                  <div className="text-xs text-slate-500 mb-1">Excursions</div>
                  <div className="text-xl font-bold text-slate-900">
                    {metrics.excursions?.length || 0}
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      (metrics.excursions?.length || 0) === 0
                        ? "border-emerald-300 text-emerald-700"
                        : "border-amber-300 text-amber-700"
                    }
                  >
                    {(metrics.excursions?.length || 0) === 0 ? "None" : "Minor"}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                No data available for selected period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Report History</CardTitle>
            <CardDescription>Previously generated compliance reports</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-600" />
              </div>
            ) : reportHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-slate-500 border-b">
                      <th className="pb-3 font-medium">Report</th>
                      <th className="pb-3 font-medium">Device</th>
                      <th className="pb-3 font-medium">MKT</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportHistory.map((report) => {
                      const compliance = getComplianceDisplay(report.compliance_status);
                      const ComplianceIcon = compliance.icon;
                      const reportDate = new Date(report.report_month);
                      const monthName = MONTHS[reportDate.getMonth()];
                      const year = reportDate.getFullYear();

                      return (
                        <tr key={report.id} className="border-b last:border-0">
                          <td className="py-3">
                            <div className="font-medium text-slate-900">
                              {monthName} {year}
                            </div>
                            <div className="text-xs text-slate-500">
                              {new Date(report.generated_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-3 text-sm text-slate-600">
                            {report.device_id}
                          </td>
                          <td className="py-3 text-sm font-mono">
                            {report.mkt_celsius ? `${report.mkt_celsius}°C` : "N/A"}
                          </td>
                          <td className="py-3">
                            <Badge
                              variant="outline"
                              className={`${compliance.bg} ${compliance.color} border-0`}
                            >
                              <ComplianceIcon className="h-3 w-3 mr-1" />
                              {compliance.label}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadReport(report.id)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" disabled>
                                <Mail className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                No reports generated yet
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
