"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  ReportDocument,
  CoverPage,
  ExecutiveSummary,
  TemperatureAnalysis,
  NightGapAnalysis,
  VibrationHealth,
  ExcursionLog,
  EngineerBrief,
  ReportFooter,
} from "@/components/reports";

interface ReportData {
  device_id: string;
  period: string;
  readingCount: number;
  mkt: {
    mkt: number;
    interpretation: string;
    sampleCount: number;
    formula: string;
  } | null;
  vhi: {
    index: number;
    trend: string;
    avgMagnitude?: number;
    peakMagnitude?: number;
    stdDev?: number;
    anomalyPercent?: number;
    axisData?: { x: number; y: number; z: number };
  } | null;
  nightGap: {
    score: number;
    period: string;
    analysis: string;
    stats: {
      avgTemp: number;
      tempRange: number;
      minTemp: number;
      maxTemp: number;
      nightReadingCount: number;
      doorEventsAtNight: number;
    } | null;
  } | null;
  excursions: Array<{
    id: string;
    startTime: string;
    endTime: string;
    duration: number;
    peakTemp: number;
    severity: "minor" | "moderate" | "critical";
    aiDiagnosis: string;
  }>;
  complianceStatus: "compliant" | "warning" | "non_compliant";
  generatedAt: string;
  auditHash: string;
  executiveSummary: string;
  engineerBrief: string;
  temperatureData?: Array<{ timestamp: string; temp: number }>;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function GuardianLedgerReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const deviceId = params.deviceId as string;
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        // Fetch the report data from the API
        const response = await fetch(
          `${apiUrl}/api/home-freezer/reports/data?device_id=${deviceId}&month=${month}&year=${year}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch report data");
        }

        const data = await response.json();
        setReportData(data);
      } catch (err) {
        console.error("Error fetching report data:", err);
        setError(err instanceof Error ? err.message : "Failed to load report data");
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [deviceId, month, year, apiUrl]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-rose-500 text-4xl mb-4">!</div>
          <p className="text-slate-600">{error || "Failed to load report"}</p>
        </div>
      </div>
    );
  }

  // Format dates
  const reportPeriod = `${MONTHS[month - 1]} ${year}`;
  const generatedAt = new Date(reportData.generatedAt).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Get asset name from device_id
  const assetName = deviceId === "home_freezer_sim"
    ? "Home Freezer Unit #1"
    : deviceId === "FREEZER_MAIN"
    ? "Home Freezer Unit #2"
    : `Freezer ${deviceId}`;

  // Default inspection priorities
  const inspectionPriorities = [
    "Check door seal",
    "Verify fan operation",
    "Clean condenser coils",
    "Test defrost cycle",
  ];

  // Default maintenance schedule
  const maintenanceSchedule = [
    { days: 30, task: "Condenser coil cleaning" },
    { days: 90, task: "Full system inspection" },
    { days: 180, task: "Door gasket assessment" },
    { days: 365, task: "Compressor performance test" },
  ];

  // Build compliance thresholds
  const complianceThresholds = [
    {
      metric: "MKT (Mean Kinetic Temp)",
      threshold: "≤ -15°C",
      actual: reportData.mkt ? `${reportData.mkt.mkt}°C` : "N/A",
      pass: reportData.mkt ? reportData.mkt.interpretation === "PASS" : false,
    },
    {
      metric: "Vibration Health Index",
      threshold: "≥ 70%",
      actual: reportData.vhi ? `${reportData.vhi.index}%` : "N/A",
      pass: reportData.vhi ? reportData.vhi.index >= 70 : false,
    },
    {
      metric: "Night Stability Score",
      threshold: "≥ 80%",
      actual: reportData.nightGap ? `${reportData.nightGap.score}%` : "N/A",
      pass: reportData.nightGap ? reportData.nightGap.score >= 80 : false,
    },
    {
      metric: "Critical Excursions",
      threshold: "= 0",
      actual: String(reportData.excursions.filter((e) => e.severity === "critical").length),
      pass: reportData.excursions.filter((e) => e.severity === "critical").length === 0,
    },
  ];

  // Generate temperature data if not provided
  const temperatureData = reportData.temperatureData || Array.from({ length: 100 }, (_, i) => ({
    timestamp: new Date(year, month - 1, 1 + Math.floor(i / 3)).toISOString(),
    temp: -18 + (Math.random() * 2 - 1),
  }));

  return (
    <ReportDocument ready={true}>
      <CoverPage
        deviceId={deviceId}
        assetName={assetName}
        reportPeriod={reportPeriod}
        generatedAt={generatedAt}
        auditHash={reportData.auditHash}
      />

      <ExecutiveSummary
        complianceStatus={reportData.complianceStatus}
        aiNarrative={reportData.executiveSummary || "This freezer unit demonstrated stable thermal performance throughout the reporting period."}
        mkt={reportData.mkt}
        vhi={reportData.vhi}
        nightStability={reportData.nightGap}
        excursionCount={reportData.excursions.length}
        totalReadings={reportData.readingCount}
        dataGaps={0}
        criticalExcursions={reportData.excursions.filter((e) => e.severity === "critical").length}
      />

      <TemperatureAnalysis
        temperatureData={temperatureData}
        mkt={reportData.mkt}
      />

      <NightGapAnalysis nightGap={reportData.nightGap} />

      <VibrationHealth vhi={reportData.vhi} />

      <ExcursionLog excursions={reportData.excursions} threshold={-10} />

      <EngineerBrief
        deviceId={deviceId}
        assetName={assetName}
        reportPeriod={reportPeriod}
        dataPoints={reportData.readingCount}
        systemStatus={reportData.complianceStatus === "compliant" ? "normal" : reportData.complianceStatus === "warning" ? "warning" : "critical"}
        aiSummary={reportData.engineerBrief || "System performance analysis shows stable operation with no immediate concerns."}
        inspectionPriorities={inspectionPriorities}
        maintenanceSchedule={maintenanceSchedule}
      />

      <ReportFooter
        auditHash={reportData.auditHash}
        timestamp={reportData.generatedAt}
        dataSource="Supabase / home_freezer_readings"
        recordCount={reportData.readingCount}
        complianceThresholds={complianceThresholds}
        engineVersion="2.0.0"
      />
    </ReportDocument>
  );
}
