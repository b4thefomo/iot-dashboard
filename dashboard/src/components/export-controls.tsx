"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet, Loader2, ChevronDown } from "lucide-react";

interface ExportControlsProps {
  className?: string;
}

export function ExportControls({ className }: ExportControlsProps) {
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const handleCSVExport = async (range: string) => {
    setIsExportingCSV(true);
    try {
      const response = await fetch(`${apiUrl}/api/fleet/export/csv?range=${range}`);
      if (!response.ok) {
        throw new Error("Export failed");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fleet-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("CSV export failed:", error);
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handlePDFExport = async () => {
    setIsExportingPDF(true);
    try {
      const response = await fetch(`${apiUrl}/api/fleet/export/pdf`);
      if (!response.ok) {
        throw new Error("Export failed");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fleet-report-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("PDF export failed:", error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* CSV Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isExportingCSV}>
            {isExportingCSV ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 mr-2" />
            )}
            CSV
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleCSVExport("current")}>
            <Download className="h-4 w-4 mr-2" />
            Current Snapshot
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCSVExport("24h")}>
            <Download className="h-4 w-4 mr-2" />
            Last 24 Hours
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCSVExport("7d")}>
            <Download className="h-4 w-4 mr-2" />
            Last 7 Days
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCSVExport("30d")}>
            <Download className="h-4 w-4 mr-2" />
            Last 30 Days
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* PDF Export Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePDFExport}
        disabled={isExportingPDF}
      >
        {isExportingPDF ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <FileText className="h-4 w-4 mr-2" />
        )}
        PDF Report
      </Button>
    </div>
  );
}
