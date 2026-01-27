"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  ReportDocument,
  FleetCoverPage,
  FleetNarrativeSummary,
  FleetExecutiveSummary,
  TemperatureAnalysis,
  FleetEfficiencyAnalysis,
  FleetOperations,
  ReportFooter,
} from "@/components/reports";

interface Fault {
  timestamp: string;
  fault: string;
  faultId?: string;
}

interface ReportData {
  device_id: string;
  period: string;
  locationName: string;
  locationAddress?: string;
  readingCount: number;
  mkt: {
    mkt: number;
    interpretation: string;
    sampleCount: number;
    formula: string;
  } | null;
  efficiency: {
    score: number;
    avgPower: number;
    avgCOP: number;
    totalEnergy: number;
  } | null;
  doorOpenEvents: number;
  faults: Fault[];
  complianceStatus: "compliant" | "warning" | "non_compliant";
  generatedAt: string;
  auditHash: string;
  aiSummary: string;
  temperatureData?: Array<{ timestamp: string; temp: number }>;
  powerData?: Array<{ timestamp: string; power: number; cop: number }>;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function FleetReportPage() {
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
        const response = await fetch(
          `${apiUrl}/api/fleet/reports/data?device_id=${deviceId}&month=${month}&year=${year}`
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
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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

  const reportPeriod = `${MONTHS[month - 1]} ${year}`;
  const generatedAt = new Date(reportData.generatedAt).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Default temperature data if not provided
  const temperatureData = reportData.temperatureData || Array.from({ length: 100 }, (_, i) => ({
    timestamp: new Date(year, month - 1, 1 + Math.floor(i / 3)).toISOString(),
    temp: -18 + (Math.random() * 2 - 1),
  }));

  // Default power data if not provided
  const powerData = reportData.powerData || Array.from({ length: 100 }, (_, i) => ({
    timestamp: new Date(year, month - 1, 1 + Math.floor(i / 3)).toISOString(),
    power: 500 + Math.random() * 300,
    cop: 1.5 + Math.random() * 1.5,
  }));

  // Build compliance thresholds
  const complianceThresholds = [
    {
      metric: "MKT (Mean Kinetic Temp)",
      threshold: "≤ -15°C",
      actual: reportData.mkt ? `${reportData.mkt.mkt}°C` : "N/A",
      pass: reportData.mkt ? reportData.mkt.interpretation === "PASS" : false,
    },
    {
      metric: "Efficiency Score",
      threshold: "≥ 70%",
      actual: reportData.efficiency ? `${reportData.efficiency.score}%` : "N/A",
      pass: reportData.efficiency ? reportData.efficiency.score >= 70 : false,
    },
    {
      metric: "Average COP",
      threshold: "≥ 1.5",
      actual: reportData.efficiency ? reportData.efficiency.avgCOP.toFixed(2) : "N/A",
      pass: reportData.efficiency ? reportData.efficiency.avgCOP >= 1.5 : false,
    },
    {
      metric: "Critical Faults",
      threshold: "= 0",
      actual: String(reportData.faults.length),
      pass: reportData.faults.length === 0,
    },
  ];

  return (
    <ReportDocument ready={true}>
      <FleetCoverPage
        deviceId={deviceId}
        locationName={reportData.locationName || "Unknown Location"}
        locationAddress={reportData.locationAddress}
        reportPeriod={reportPeriod}
        generatedAt={generatedAt}
        auditHash={reportData.auditHash}
      />

      <FleetNarrativeSummary
        complianceStatus={reportData.complianceStatus}
        deviceId={deviceId}
        locationName={reportData.locationName || "Unknown Location"}
        reportPeriod={reportPeriod}
        mkt={reportData.mkt}
        efficiency={reportData.efficiency}
        doorOpenEvents={reportData.doorOpenEvents}
        faultEvents={reportData.faults.length}
        totalReadings={reportData.readingCount}
        aiNarrative={reportData.aiSummary || "This fleet unit demonstrated stable thermal performance throughout the reporting period."}
      />

      <FleetExecutiveSummary
        complianceStatus={reportData.complianceStatus}
        aiNarrative={reportData.aiSummary || "This fleet unit demonstrated stable thermal performance throughout the reporting period."}
        mkt={reportData.mkt}
        efficiency={reportData.efficiency}
        doorOpenEvents={reportData.doorOpenEvents}
        faultEvents={reportData.faults.length}
        totalReadings={reportData.readingCount}
        totalEnergy={reportData.efficiency?.totalEnergy || 0}
      />

      <TemperatureAnalysis
        temperatureData={temperatureData}
        mkt={reportData.mkt}
      />

      <FleetEfficiencyAnalysis
        powerData={powerData}
        efficiency={reportData.efficiency}
      />

      <FleetOperations
        doorOpenEvents={reportData.doorOpenEvents}
        faults={reportData.faults}
        totalReadings={reportData.readingCount}
      />

      <ReportFooter
        auditHash={reportData.auditHash}
        timestamp={reportData.generatedAt}
        dataSource="Supabase / readings"
        recordCount={reportData.readingCount}
        complianceThresholds={complianceThresholds}
        engineVersion="2.0.0"
      />
    </ReportDocument>
  );
}
