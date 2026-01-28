"use client";

import * as React from "react";
import { useState } from "react";
import { FreezerSidebar } from "@/components/freezer-sidebar";
import { FleetHeader } from "@/components/fleet-header";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Code,
  Copy,
  Check,
  Home,
  LayoutGrid,
} from "lucide-react";

interface EndpointDoc {
  method: "GET" | "POST";
  path: string;
  description: string;
  params?: { name: string; type: string; description: string }[];
  response: string;
  example: string;
}

const endpoints: EndpointDoc[] = [
  {
    method: "GET",
    path: "/api/fleet/status",
    description: "Get current status of all asset devices including alerts and summary statistics.",
    response: `{
  "devices": { "SUBZ_001": {...}, ... },
  "alerts": [...],
  "summary": {
    "total": 15,
    "healthy": 12,
    "warning": 2,
    "critical": 1
  },
  "isOnline": true,
  "lastDataReceived": "2024-01-15T10:30:00.000Z"
}`,
    example: `curl http://localhost:4000/api/fleet/status`,
  },
  {
    method: "GET",
    path: "/api/freezer/:device_id/history",
    description: "Get historical readings for a specific freezer unit.",
    params: [
      { name: "device_id", type: "string", description: "The device ID (e.g., SUBZ_001)" },
    ],
    response: `{
  "device_id": "SUBZ_001",
  "history": [
    {
      "device_id": "SUBZ_001",
      "temp_cabinet": -18.5,
      "compressor_power_w": 450,
      "timestamp": "2024-01-15T10:00:00.000Z"
      ...
    }
  ],
  "latest": {...},
  "readingsCount": 100
}`,
    example: `curl http://localhost:4000/api/freezer/SUBZ_001/history`,
  },
  {
    method: "POST",
    path: "/api/freezer/chat",
    description: "Send a message to the AI assistant for asset analysis.",
    params: [
      { name: "message", type: "string", description: "The user's question or command" },
    ],
    response: `{
  "response": "Based on the asset data, 2 units are showing warning...",
  "context": {
    "totalDevices": 15,
    "alertCount": 3
  }
}`,
    example: `curl -X POST http://localhost:4000/api/freezer/chat \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Which freezers need attention?"}'`,
  },
  {
    method: "GET",
    path: "/api/fleet/export/csv",
    description: "Download asset data as a CSV file.",
    params: [
      { name: "range", type: "string", description: "Time range: 'current', '24h', '7d', or '30d'" },
    ],
    response: `CSV file download with columns:
device_id, location_name, lat, lon, temp_cabinet, temp_ambient,
compressor_power_w, compressor_freq_hz, frost_level, cop,
door_open, defrost_on, fault, status, timestamp`,
    example: `curl -O http://localhost:4000/api/fleet/export/csv?range=24h`,
  },
  {
    method: "GET",
    path: "/api/fleet/export/pdf",
    description: "Generate and download a PDF fleet status report.",
    response: `PDF file download containing:
- Cover page
- Executive summary
- Fleet status table
- Active alerts section`,
    example: `curl -O http://localhost:4000/api/fleet/export/pdf`,
  },
  {
    method: "GET",
    path: "/api/fleet/summary",
    description: "Get aggregated asset statistics.",
    response: `{
  "deviceCount": 15,
  "temperature": {
    "average": -18.2,
    "min": -22.5,
    "max": -12.1
  },
  "power": {
    "total": 6750,
    "average": 450
  },
  "alerts": {
    "doorOpen": 1,
    "highTemp": 2,
    "faults": 0,
    "highFrost": 1
  }
}`,
    example: `curl http://localhost:4000/api/fleet/summary`,
  },
];

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-slate-900 text-slate-100 p-4 overflow-x-auto text-sm font-mono">
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 bg-slate-700 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-600"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function DocsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <FreezerSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <FleetHeader
          title="API Documentation"
          isConnected={true}
          isOnline={true}
          alertCount={0}
          pageIcon={Code}
          breadcrumbs={[
            { label: "Home", href: "/", icon: Home },
            { label: "Dashboard", href: "/freezer", icon: LayoutGrid },
          ]}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl">
            {/* Page Title */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-5 w-5 text-slate-600" />
                <h2 className="text-xl font-bold text-slate-900">
                  API Reference
                </h2>
              </div>
              <p className="text-slate-600 text-sm">
                Integrate with the Flux IoT API to access asset data programmatically.
              </p>
            </div>

            {/* Base URL Card */}
            <div className="bg-white border mb-6">
              <div className="px-4 py-3 border-b">
                <h3 className="font-semibold text-slate-900">Base URL</h3>
              </div>
              <div className="p-4">
                <CodeBlock code="http://localhost:4000" />
                <p className="text-sm text-slate-500 mt-2">
                  All API endpoints are relative to this base URL.
                </p>
              </div>
            </div>

            {/* Endpoints Section */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Code className="h-5 w-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-900">Endpoints</h3>
              </div>

              <div className="space-y-4">
                {endpoints.map((endpoint, idx) => (
                  <div key={idx} className="bg-white border">
                    <div className="px-4 py-3 border-b">
                      <div className="flex items-center gap-3">
                        <Badge
                          className={endpoint.method === "GET" ? "bg-emerald-500 text-white border-0" : "bg-blue-500 text-white border-0"}
                        >
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm font-mono text-slate-800">{endpoint.path}</code>
                      </div>
                      <p className="text-sm text-slate-500 mt-2">
                        {endpoint.description}
                      </p>
                    </div>
                    <div className="p-4 space-y-4">
                      {/* Parameters */}
                      {endpoint.params && endpoint.params.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-700 mb-2">Parameters</h4>
                          <div className="bg-slate-50 p-3">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left text-slate-500">
                                  <th className="pb-2">Name</th>
                                  <th className="pb-2">Type</th>
                                  <th className="pb-2">Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                {endpoint.params.map((param, pIdx) => (
                                  <tr key={pIdx} className="border-t border-slate-200">
                                    <td className="py-2 font-mono text-blue-600">{param.name}</td>
                                    <td className="py-2 text-slate-600">{param.type}</td>
                                    <td className="py-2 text-slate-600">{param.description}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Response */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Response</h4>
                        <CodeBlock code={endpoint.response} />
                      </div>

                      {/* Example */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Example</h4>
                        <CodeBlock code={endpoint.example} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* WebSocket Info */}
            <div className="bg-white border">
              <div className="px-4 py-3 border-b">
                <h3 className="font-semibold text-slate-900">WebSocket Connection</h3>
                <p className="text-sm text-slate-500">
                  For real-time updates, connect via Socket.IO.
                </p>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Connection</h4>
                  <CodeBlock
                    code={`import { io } from "socket.io-client";

const socket = io("http://localhost:4000");

// Listen for real-time asset updates
socket.on("fleetUpdate", (data) => {
  console.log("Assets updated:", data);
});

// Listen for individual freezer readings
socket.on("freezerData", (reading) => {
  console.log("New reading:", reading);
});`}
                  />
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Events</h4>
                  <div className="bg-slate-50 p-3">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500">
                          <th className="pb-2">Event</th>
                          <th className="pb-2">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-slate-200">
                          <td className="py-2 font-mono text-blue-600">initialFleetData</td>
                          <td className="py-2 text-slate-600">Sent on connection with current asset state</td>
                        </tr>
                        <tr className="border-t border-slate-200">
                          <td className="py-2 font-mono text-blue-600">fleetUpdate</td>
                          <td className="py-2 text-slate-600">Emitted when any asset data changes</td>
                        </tr>
                        <tr className="border-t border-slate-200">
                          <td className="py-2 font-mono text-blue-600">freezerData</td>
                          <td className="py-2 text-slate-600">Individual freezer reading received</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
