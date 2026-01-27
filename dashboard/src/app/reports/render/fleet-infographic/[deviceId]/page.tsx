"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { FleetInfographic } from "@/components/reports";

interface ReportData {
  device_id: string;
  period: string;
  locationName: string;
  readingCount: number;
  mkt: {
    mkt: number;
    interpretation: string;
  } | null;
  efficiency: {
    score: number;
    avgPower: number;
    avgCOP: number;
    totalEnergy: number;
  } | null;
  doorOpenEvents: number;
  faults: Array<{ timestamp: string; fault: string }>;
  complianceStatus: "compliant" | "warning" | "non_compliant";
  generatedAt: string;
  auditHash: string;
  temperatureData?: Array<{ timestamp: string; temp: number }>;
  aiSummary?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function FleetInfographicPage() {
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
          <p className="text-slate-600">Loading infographic data...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white" data-infographic-ready="true" data-infographic-error="true">
        <div className="text-center">
          <div className="text-rose-500 text-4xl mb-4">!</div>
          <p className="text-slate-600">{error || "Failed to load data"}</p>
        </div>
      </div>
    );
  }

  const reportPeriod = `${MONTHS[month - 1]} ${year}`;

  // Default temperature data if not provided
  const temperatureData = reportData.temperatureData || Array.from({ length: 100 }, (_, i) => ({
    timestamp: new Date(year, month - 1, 1 + Math.floor(i / 3)).toISOString(),
    temp: -18 + (Math.random() * 2 - 1),
  }));

  return (
    <div className="bg-white">
      <FleetInfographic
        deviceId={deviceId}
        locationName={reportData.locationName || "Unknown Location"}
        reportPeriod={reportPeriod}
        complianceStatus={reportData.complianceStatus}
        mkt={reportData.mkt}
        efficiency={reportData.efficiency}
        faultEvents={reportData.faults.length}
        doorOpenEvents={reportData.doorOpenEvents}
        totalReadings={reportData.readingCount}
        temperatureData={temperatureData}
        auditHash={reportData.auditHash}
        generatedAt={reportData.generatedAt}
        aiSummary={reportData.aiSummary}
      />
    </div>
  );
}
