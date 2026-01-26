"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Download, Loader2, ChevronDown, ExternalLink } from "lucide-react";

interface GuardianLedgerButtonProps {
  deviceId: string;
  className?: string;
}

export function GuardianLedgerButton({ deviceId, className }: GuardianLedgerButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const handleQuickExport = async () => {
    setIsGenerating(true);
    try {
      const now = new Date();
      const response = await fetch(`${apiUrl}/api/home-freezer/reports/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: deviceId,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        }),
      });

      if (!response.ok) throw new Error("Failed to generate report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `guardian-ledger-${deviceId}-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Quick export failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isGenerating}
          className={className}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileText className="h-4 w-4 mr-2" />
          )}
          Audit Report
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleQuickExport}>
          <Download className="h-4 w-4 mr-2" />
          Quick Export (This Month)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/home-freezer/reports" className="flex items-center">
            <ExternalLink className="h-4 w-4 mr-2" />
            Full Reports Page
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
