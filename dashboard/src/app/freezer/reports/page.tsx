"use client";

import * as React from "react";
import { useState, useEffect } from "react";
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
import {
  Snowflake,
  FileText,
  Download,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Zap,
  ThermometerSnowflake,
  DoorOpen,
  Package,
  Image,
} from "lucide-react";

interface FleetDevice {
  device_id: string;
  location_name: string;
}

interface ReportMetrics {
  mkt: { mkt: number; interpretation: string } | null;
  efficiency: { score: number; avgPower: number; avgCOP: number; interpretation: string } | null;
  operations: { doorOpenEvents: number; faultEvents: number } | null;
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

export default function FleetReportsPage() {
  const [devices, setDevices] = useState<FleetDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportFormat, setReportFormat] = useState<"both" | "pdf" | "csv">("both");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingInfographic, setIsGeneratingInfographic] = useState(false);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [reportHistory, setReportHistory] = useState<ReportHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Load available devices
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/fleet/status`);
        if (response.ok) {
          const data = await response.json();
          const deviceList = Object.values(data.devices || {}) as FleetDevice[];
          setDevices(deviceList);
          if (deviceList.length > 0 && !selectedDevice) {
            setSelectedDevice(deviceList[0].device_id);
          }
        }
      } catch (error) {
        console.error("Failed to load devices:", error);
      }
    };
    loadDevices();
  }, [apiUrl, selectedDevice]);

  // Load metrics when device/date changes
  useEffect(() => {
    if (!selectedDevice) return;

    const loadMetrics = async () => {
      setIsLoadingMetrics(true);
      try {
        const response = await fetch(
          `${apiUrl}/api/fleet/${selectedDevice}/monthly?month=${selectedMonth}&year=${selectedYear}`
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
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const response = await fetch(`${apiUrl}/api/fleet/reports/history?limit=10`);
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
    if (!selectedDevice) return;

    setIsGenerating(true);
    try {
      const response = await fetch(`${apiUrl}/api/fleet/reports/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: selectedDevice,
          month: selectedMonth,
          year: selectedYear,
          format: reportFormat,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Determine file extension based on format
      const deviceLabel = selectedDevice === "all" ? "all-assets" : selectedDevice;
      const ext = reportFormat === "pdf" ? "pdf" : reportFormat === "csv" ? "csv" : "zip";
      a.download = `fleet-report-${deviceLabel}-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.${ext}`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Refresh history
      const historyResponse = await fetch(`${apiUrl}/api/fleet/reports/history?limit=10`);
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

  const handleDownloadInfographic = async () => {
    if (!selectedDevice || selectedDevice === "all") return;

    setIsGeneratingInfographic(true);
    try {
      const response = await fetch(`${apiUrl}/api/fleet/reports/infographic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: selectedDevice,
          month: selectedMonth,
          year: selectedYear,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate infographic");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fleet-infographic-${selectedDevice}-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Infographic generation failed:", error);
    } finally {
      setIsGeneratingInfographic(false);
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
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Snowflake className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Fleet Compliance Reports</h1>
                <p className="text-sm text-slate-500">Audit-Ready Asset Reports</p>
              </div>
            </div>
            <Link
              href="/freezer"
              className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Fleet Dashboard
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
              <FileText className="h-5 w-5 text-blue-600" />
              Generate Compliance Report
            </CardTitle>
            <CardDescription>
              Create an audit-ready compliance report for a fleet asset
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selection Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Device Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Asset</label>
                <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select device..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assets</SelectItem>
                    {devices.map((device) => (
                      <SelectItem key={device.device_id} value={device.device_id}>
                        {device.device_id} - {device.location_name}
                      </SelectItem>
                    ))}
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

            {/* Generate Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleGenerateReport}
                disabled={isGenerating || !selectedDevice}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating {selectedDevice === "all" ? "All Assets " : ""}Report{reportFormat === "both" ? " Package" : ""}...
                  </>
                ) : (
                  <>
                    {reportFormat === "both" ? (
                      <Package className="h-4 w-4 mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Generate {selectedDevice === "all" ? "All Assets " : ""}{reportFormat === "both" ? "Report Package" : reportFormat === "pdf" ? "PDF Report" : "CSV Data"}
                  </>
                )}
              </Button>

              {/* Infographic Button */}
              <Button
                onClick={handleDownloadInfographic}
                disabled={isGeneratingInfographic || !selectedDevice || selectedDevice === "all"}
                variant="outline"
                size="lg"
                className="border-cyan-300 text-cyan-700 hover:bg-cyan-50"
              >
                {isGeneratingInfographic ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Image className="h-4 w-4 mr-2" />
                    Infographic
                  </>
                )}
              </Button>
            </div>

            {selectedDevice === "all" && (
              <p className="text-xs text-slate-500 text-center">
                Infographic is available for individual assets only
              </p>
            )}
          </CardContent>
        </Card>

        {/* Key Metrics Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key Metrics Preview</CardTitle>
            <CardDescription>
              {selectedDevice ? `${MONTHS[selectedMonth - 1]} ${selectedYear} - ${selectedDevice}` : "Select a device"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : metrics ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* MKT */}
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <ThermometerSnowflake className="h-5 w-5 mx-auto mb-2 text-blue-600" />
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

                {/* Efficiency */}
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <Zap className="h-5 w-5 mx-auto mb-2 text-teal-600" />
                  <div className="text-xs text-slate-500 mb-1">Efficiency</div>
                  <div className="text-xl font-bold text-slate-900">
                    {metrics.efficiency?.score !== undefined ? `${metrics.efficiency.score}%` : "N/A"}
                  </div>
                  {metrics.efficiency && (
                    <Badge
                      variant="outline"
                      className={
                        metrics.efficiency.score >= 85
                          ? "border-emerald-300 text-emerald-700"
                          : metrics.efficiency.score >= 70
                          ? "border-amber-300 text-amber-700"
                          : "border-rose-300 text-rose-700"
                      }
                    >
                      {metrics.efficiency.interpretation}
                    </Badge>
                  )}
                </div>

                {/* Door Events */}
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <DoorOpen className="h-5 w-5 mx-auto mb-2 text-indigo-600" />
                  <div className="text-xs text-slate-500 mb-1">Door Events</div>
                  <div className="text-xl font-bold text-slate-900">
                    {metrics.operations?.doorOpenEvents ?? "N/A"}
                  </div>
                </div>

                {/* Faults */}
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-amber-600" />
                  <div className="text-xs text-slate-500 mb-1">Faults</div>
                  <div className="text-xl font-bold text-slate-900">
                    {metrics.operations?.faultEvents ?? "N/A"}
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      (metrics.operations?.faultEvents || 0) === 0
                        ? "border-emerald-300 text-emerald-700"
                        : "border-rose-300 text-rose-700"
                    }
                  >
                    {(metrics.operations?.faultEvents || 0) === 0 ? "None" : "Action Required"}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                {selectedDevice ? "No data available for selected period" : "Select a device to preview metrics"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Report History</CardTitle>
            <CardDescription>Previously generated fleet compliance reports</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
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
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                No fleet reports generated yet
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
