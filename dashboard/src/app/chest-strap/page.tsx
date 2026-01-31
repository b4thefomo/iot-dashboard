"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BleHeartRateConnector } from "@/components/ble-heart-rate-connector";
import { getSocket, API_URL } from "@/lib/socket";
import {
  type BodyTrackerReading,
  type HeartRateZone,
  HR_ZONE_CONFIG,
} from "@/hooks/use-body-tracker-data";
import {
  Heart,
  Activity,
  Timer,
  Battery,
  Bluetooth,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";

// Simple line chart drawn with SVG
function HrChart({ readings }: { readings: number[] }) {
  if (readings.length < 2) return null;

  const width = 600;
  const height = 160;
  const padding = { top: 10, right: 10, bottom: 20, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const min = Math.min(...readings) - 5;
  const max = Math.max(...readings) + 5;
  const range = max - min || 1;

  const points = readings.map((v, i) => {
    const x = padding.left + (i / (readings.length - 1)) * chartW;
    const y = padding.top + chartH - ((v - min) / range) * chartH;
    return `${x},${y}`;
  });

  // Y-axis labels
  const yLabels = [min, min + range / 2, max].map((v) => Math.round(v));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {/* Grid lines */}
      {yLabels.map((v) => {
        const y = padding.top + chartH - ((v - min) / range) * chartH;
        return (
          <g key={v}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#334155"
              strokeWidth={0.5}
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 6}
              y={y + 4}
              textAnchor="end"
              fill="#94a3b8"
              fontSize={11}
            >
              {v}
            </text>
          </g>
        );
      })}

      {/* Line */}
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="#ef4444"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Fill under the line */}
      <polygon
        points={`${padding.left},${padding.top + chartH} ${points.join(" ")} ${width - padding.right},${padding.top + chartH}`}
        fill="url(#hrGradient)"
      />

      <defs>
        <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
        </linearGradient>
      </defs>
    </svg>
  );
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getZoneLabel(zone: HeartRateZone): string {
  return HR_ZONE_CONFIG[zone]?.label ?? "Rest";
}

function getZoneColor(zone: HeartRateZone): string {
  return HR_ZONE_CONFIG[zone]?.color ?? "#6b7280";
}

export default function ChestStrapPage() {
  const [_bleConnected, setBleConnected] = React.useState(false);
  const [history, setHistory] = React.useState<BodyTrackerReading[]>([]);
  const [latest, setLatest] = React.useState<BodyTrackerReading | null>(null);
  const [socketConnected, setSocketConnected] = React.useState(false);
  const [heartBeat, setHeartBeat] = React.useState(false);

  // Animate heart on each reading
  React.useEffect(() => {
    if (!latest) return;
    setHeartBeat(true);
    const t = setTimeout(() => setHeartBeat(false), 300);
    return () => clearTimeout(t);
  }, [latest]);

  // Listen for bodyTrackerData via Socket.IO
  React.useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);

    const handleData = (reading: BodyTrackerReading) => {
      setLatest(reading);
      setHistory((prev) => {
        const next = [...prev, reading];
        if (next.length > 120) next.shift();
        return next;
      });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("bodyTrackerData", handleData);

    if (socket.connected) setSocketConnected(true);

    // Stop the simulator so we only show real BLE data
    socket.emit("stopBodyTrackerSimulator");

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("bodyTrackerData", handleData);
    };
  }, []);

  const handleConnectionChange = React.useCallback((connected: boolean) => {
    setBleConnected(connected);
    if (!connected) {
      // Don't clear history — keep session data visible
    }
  }, []);

  // Computed stats
  const hrValues = history.map((r) => r.heart_rate_bpm);
  const avgHr =
    hrValues.length > 0
      ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length)
      : 0;
  const maxHr = hrValues.length > 0 ? Math.max(...hrValues) : 0;
  const minHr = hrValues.length > 0 ? Math.min(...hrValues) : 0;

  const zone = (latest?.heart_rate_zone ?? "rest") as HeartRateZone;
  const zoneColor = getZoneColor(zone);

  const hasData = latest !== null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" />
            <h1 className="text-lg font-semibold">Chest Strap</h1>
            {socketConnected && (
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            )}
          </div>
          <BleHeartRateConnector
            apiUrl={API_URL}
            onConnectionChange={handleConnectionChange}
          />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Empty state */}
        {!hasData && (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="p-4 rounded-full bg-slate-800">
              <Bluetooth className="h-10 w-10 text-slate-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-300">
                No Heart Rate Data
              </h2>
              <p className="text-slate-500 mt-1 text-sm max-w-xs mx-auto">
                Connect a Bluetooth chest strap using the button above to start
                monitoring your heart rate in real time.
              </p>
            </div>
          </div>
        )}

        {/* Connected data view */}
        {hasData && (
          <>
            {/* Large HR display */}
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-6 pb-4 flex flex-col items-center">
                <div className="flex items-center gap-3">
                  <Heart
                    className="h-10 w-10 transition-transform"
                    style={{
                      color: zoneColor,
                      transform: heartBeat ? "scale(1.3)" : "scale(1)",
                    }}
                    fill={zoneColor}
                  />
                  <span className="text-7xl font-bold tabular-nums tracking-tight">
                    {latest.heart_rate_bpm}
                  </span>
                  <span className="text-2xl text-slate-400 self-end mb-2">
                    BPM
                  </span>
                </div>
                <Badge
                  className="mt-3 text-sm font-medium"
                  style={{
                    backgroundColor: zoneColor + "22",
                    color: zoneColor,
                    borderColor: zoneColor + "44",
                  }}
                  variant="outline"
                >
                  {getZoneLabel(zone)}
                </Badge>
              </CardContent>
            </Card>

            {/* HRV, Session timer, Battery row */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-4 pb-3 text-center">
                  <Activity className="h-4 w-4 text-violet-400 mx-auto mb-1" />
                  <div className="text-2xl font-bold tabular-nums">
                    {latest.hrv_rmssd_ms > 0
                      ? Math.round(latest.hrv_rmssd_ms)
                      : "--"}
                  </div>
                  <div className="text-xs text-slate-500">HRV (ms)</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-4 pb-3 text-center">
                  <Timer className="h-4 w-4 text-sky-400 mx-auto mb-1" />
                  <div className="text-2xl font-bold tabular-nums">
                    {formatDuration(latest.session_duration_sec)}
                  </div>
                  <div className="text-xs text-slate-500">Session</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-4 pb-3 text-center">
                  <Battery className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
                  <div className="text-2xl font-bold tabular-nums">
                    {latest.battery_percent}%
                  </div>
                  <div className="text-xs text-slate-500">Battery</div>
                </CardContent>
              </Card>
            </div>

            {/* HR History Chart */}
            {hrValues.length >= 2 && (
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4" />
                    Heart Rate History
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <HrChart readings={hrValues.slice(-60)} />
                </CardContent>
              </Card>
            )}

            {/* Session stats row */}
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-4 pb-3">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                      <Heart className="h-3 w-3" />
                      <span className="text-xs">Avg</span>
                    </div>
                    <div className="text-xl font-bold tabular-nums">
                      {avgHr}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-rose-400 mb-1">
                      <TrendingUp className="h-3 w-3" />
                      <span className="text-xs">Max</span>
                    </div>
                    <div className="text-xl font-bold tabular-nums">
                      {maxHr}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-sky-400 mb-1">
                      <TrendingDown className="h-3 w-3" />
                      <span className="text-xs">Min</span>
                    </div>
                    <div className="text-xl font-bold tabular-nums">
                      {minHr}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                      <BarChart3 className="h-3 w-3" />
                      <span className="text-xs">Count</span>
                    </div>
                    <div className="text-xl font-bold tabular-nums">
                      {history.length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
