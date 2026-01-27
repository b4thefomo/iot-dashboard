"use client";

import * as React from "react";

interface ReportDocumentProps {
  children: React.ReactNode;
  ready?: boolean;
}

export function ReportDocument({ children, ready = false }: ReportDocumentProps) {
  return (
    <div
      data-report-ready={ready ? "true" : "false"}
      className="bg-white"
      style={{
        width: "210mm",
        margin: "0 auto",
      }}
    >
      {children}
    </div>
  );
}

interface ReportPageProps {
  children: React.ReactNode;
  className?: string;
}

export function ReportPage({ children, className = "" }: ReportPageProps) {
  return (
    <div
      className={`report-page bg-white ${className}`}
      style={{
        width: "210mm",
        minHeight: "277mm",
        maxHeight: "277mm",
        padding: "0",
        margin: "0 auto",
        overflow: "hidden",
        position: "relative",
        pageBreakAfter: "always",
        breakAfter: "page",
      }}
    >
      {children}
    </div>
  );
}

interface ReportSectionProps {
  children: React.ReactNode;
  className?: string;
  noBreak?: boolean;
}

export function ReportSection({ children, className = "", noBreak = true }: ReportSectionProps) {
  return (
    <div
      className={`report-card ${className}`}
      style={{
        pageBreakInside: noBreak ? "avoid" : "auto",
        breakInside: noBreak ? "avoid" : "auto",
      }}
    >
      {children}
    </div>
  );
}
