import type { Metadata } from "next";
import "../../globals.css";

export const metadata: Metadata = {
  title: "Guardian Ledger Report",
  description: "Thermal & Mechanical Integrity Compliance Report",
};

export default function ReportLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* A4 page setup */
            @page {
              size: A4;
              margin: 10mm;
            }

            /* Print-specific styles */
            @media print {
              html, body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }

              /* Force page break before element */
              .page-break-before {
                page-break-before: always !important;
                break-before: page !important;
              }

              /* Force page break after element */
              .page-break-after {
                page-break-after: always !important;
                break-after: page !important;
              }

              /* Prevent element from being split across pages */
              .no-break {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }

              /* Keep header with following content */
              h1, h2, h3, h4, h5, h6 {
                page-break-after: avoid !important;
                break-after: avoid !important;
              }

              /* Prevent orphans and widows */
              p {
                orphans: 3;
                widows: 3;
              }

              /* Keep tables together */
              table, thead, tbody, tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }

              /* Keep charts/figures together */
              figure, .chart-container {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
            }

            /* Report page wrapper - ensures consistent sizing */
            .report-page {
              width: 210mm;
              min-height: 277mm; /* A4 height minus margins */
              max-height: 277mm;
              padding: 0;
              margin: 0 auto;
              background: white;
              overflow: hidden;
              page-break-after: always;
              break-after: page;
              position: relative;
            }

            /* Last page shouldn't force a break after */
            .report-page:last-child {
              page-break-after: auto;
              break-after: auto;
            }

            /* Content sections that should never split */
            .report-card {
              page-break-inside: avoid;
              break-inside: avoid;
            }

            /* For sections that must stay together */
            .keep-together {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            /* Screen preview styles */
            @media screen {
              .report-page {
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
                margin-bottom: 20px;
                border: 1px solid #e2e8f0;
              }
            }
          `,
        }}
      />
      <div className="antialiased bg-slate-100 min-h-screen py-4">
        {children}
      </div>
    </>
  );
}
