"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ReferenceLine } from "recharts";
import { useHomeFreezerData, HomeFreezerReading } from "@/hooks/use-home-freezer-data";
import { useHomeFreezer2Data, HomeFreezer2Reading } from "@/hooks/use-home-freezer-2-data";
import { HomeFreezerChat } from "@/components/home-freezer-chat";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Thermometer,
  Wifi,
  WifiOff,
  Activity,
  TrendingDown,
  TrendingUp,
  Snowflake,
  AlertTriangle,
  CheckCircle,
  Home,
  DoorOpen,
  DoorClosed,
} from "lucide-react";
import { GuardianLedgerButton } from "@/components/guardian-ledger-button";
import Link from "next/link";

const chartConfig1 = {
  temp_c: {
    label: "Temperature",
    color: "hsl(190, 90%, 50%)",
  },
} satisfies ChartConfig;

const chartConfig2 = {
  temp_c: {
    label: "Temperature",
    color: "hsl(260, 90%, 60%)",
  },
} satisfies ChartConfig;

type FreezerStatus = "healthy" | "warning" | "critical" | "unknown";

function getStatusDisplay(status: FreezerStatus) {
  switch (status) {
    case "critical":
      return {
        color: "bg-rose-100 text-rose-700 border-rose-200",
        icon: AlertTriangle,
        label: "Critical",
        description: "Temperature too warm! Food safety at risk.",
      };
    case "warning":
      return {
        color: "bg-amber-100 text-amber-700 border-amber-200",
        icon: AlertTriangle,
        label: "Warning",
        description: "Temperature outside optimal range.",
      };
    case "healthy":
      return {
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: CheckCircle,
        label: "Healthy",
        description: "Freezer operating normally.",
      };
    default:
      return {
        color: "bg-slate-100 text-slate-700 border-slate-200",
        icon: Snowflake,
        label: "Unknown",
        description: "Waiting for data...",
      };
  }
}

export default function HomeFreezerDashboard() {
  const freezer1 = useHomeFreezerData();
  const freezer2 = useHomeFreezer2Data();
  const [activeTab, setActiveTab] = React.useState("freezer1");

  // Determine overall status for header badge
  const anyOnline = freezer1.isOnline || freezer2.isOnline;
  const bothOnline = freezer1.isOnline && freezer2.isOnline;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 rounded-xl">
                <Snowflake className="h-6 w-6 text-cyan-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Home Freezer Monitor</h1>
                <p className="text-sm text-slate-500">2 Devices • ESP32 Temperature Sensors</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <GuardianLedgerButton
                deviceId={activeTab === "freezer1" ? "home_freezer_sim" : "FREEZER_MAIN"}
              />
              <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className={freezer1.isOnline ? "border-cyan-300 bg-cyan-50 text-cyan-700" : "border-slate-300 bg-slate-50 text-slate-500"}
                >
                  F1 {freezer1.isOnline ? <Wifi className="h-3 w-3 ml-1" /> : <WifiOff className="h-3 w-3 ml-1" />}
                </Badge>
                <Badge
                  variant="outline"
                  className={freezer2.isOnline ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-300 bg-slate-50 text-slate-500"}
                >
                  F2 {freezer2.isOnline ? <Wifi className="h-3 w-3 ml-1" /> : <WifiOff className="h-3 w-3 ml-1" />}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Tabbed Content */}
          <div className="lg:col-span-3 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="freezer1" className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${freezer1.isOnline ? 'bg-cyan-500' : 'bg-slate-300'}`} />
                  Freezer 1
                  {freezer1.latest && (
                    <span className="text-xs font-normal opacity-70">
                      {freezer1.latest.temp_c.toFixed(1)}°C
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="freezer2" className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${freezer2.isOnline ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                  Freezer 2
                  {freezer2.latest && (
                    <span className="text-xs font-normal opacity-70">
                      {freezer2.latest.temp_c.toFixed(1)}°C
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="freezer1" className="space-y-6">
                <FreezerPanel
                  data={freezer1}
                  name="Freezer 1"
                  deviceId={freezer1.latest?.device_id || "HOME_FREEZER_01"}
                  chartConfig={chartConfig1}
                  accentColor="cyan"
                />
              </TabsContent>

              <TabsContent value="freezer2" className="space-y-6">
                <FreezerPanel
                  data={freezer2}
                  name="Freezer 2"
                  deviceId="FREEZER_MAIN"
                  chartConfig={chartConfig2}
                  accentColor="indigo"
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Chat (sees both freezers) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 h-[calc(100vh-120px)]">
              <HomeFreezerChat
                freezer1Latest={freezer1.latest}
                freezer1History={freezer1.history}
                freezer2Latest={freezer2.latest}
                freezer2History={freezer2.history}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Freezer Panel Component
interface FreezerPanelProps {
  data: {
    history: (HomeFreezerReading | HomeFreezer2Reading)[];
    latest: HomeFreezerReading | HomeFreezer2Reading | null;
    isOnline: boolean;
    status: FreezerStatus;
    avgTemp: number;
    minTemp: number;
    maxTemp: number;
  };
  name: string;
  deviceId: string;
  chartConfig: ChartConfig;
  accentColor: "cyan" | "indigo";
}

function FreezerPanel({ data, name, deviceId, chartConfig, accentColor }: FreezerPanelProps) {
  const { history, latest, status, avgTemp, minTemp, maxTemp } = data;

  const chartData = React.useMemo(() => {
    return history.map((reading) => ({
      timestamp: reading.timestamp,
      temp_c: reading.temp_c,
    }));
  }, [history]);

  const statusDisplay = getStatusDisplay(status);
  const StatusIcon = statusDisplay.icon;

  const colorClasses = {
    cyan: {
      iconBg: "bg-cyan-100",
      iconText: "text-cyan-600",
      chartStroke: "hsl(190, 90%, 50%)",
      statIcon: "text-cyan-500",
      statBg: "bg-cyan-50",
    },
    indigo: {
      iconBg: "bg-indigo-100",
      iconText: "text-indigo-600",
      chartStroke: "hsl(260, 90%, 60%)",
      statIcon: "text-indigo-500",
      statBg: "bg-indigo-50",
    },
  }[accentColor];

  return (
    <>
      {/* Status Banner */}
      <Card className={`border-2 ${statusDisplay.color}`}>
        <CardContent className="flex items-center gap-4 py-4">
          <div className={`p-3 rounded-xl ${status === 'critical' ? 'bg-rose-200' : status === 'warning' ? 'bg-amber-200' : status === 'healthy' ? 'bg-emerald-200' : 'bg-slate-200'}`}>
            <StatusIcon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{statusDisplay.label}</span>
              <span className="text-xs text-slate-500">({deviceId})</span>
              {latest && (
                <span className="text-2xl font-bold ml-2">
                  {latest.temp_c.toFixed(1)}°C
                </span>
              )}
            </div>
            <p className="text-sm opacity-80">{statusDisplay.description}</p>
          </div>
          {latest?.firmware_version && (
            <div className="text-xs opacity-60">
              v{latest.firmware_version}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Door Alert Banner */}
      {latest?.is_door_open && (
        <Card className="border-2 border-orange-300 bg-orange-50">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 rounded-xl bg-orange-200 animate-pulse">
              <DoorOpen className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <span className="font-semibold text-orange-700">Door Open</span>
              <p className="text-sm text-orange-600">Freezer door is currently open - temperature may rise</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard
          icon={latest?.is_door_open ? DoorOpen : DoorClosed}
          iconColor={latest?.is_door_open ? "text-orange-500" : "text-emerald-500"}
          iconBg={latest?.is_door_open ? "bg-orange-50" : "bg-emerald-50"}
          label="Door"
          value={latest?.door_status || "--"}
        />
        <StatCard
          icon={Thermometer}
          iconColor={colorClasses.statIcon}
          iconBg={colorClasses.statBg}
          label="Current"
          value={latest ? `${latest.temp_c.toFixed(1)}°C` : "--"}
        />
        <StatCard
          icon={Activity}
          iconColor="text-blue-500"
          iconBg="bg-blue-50"
          label="Average"
          value={history.length > 0 ? `${avgTemp.toFixed(1)}°C` : "--"}
        />
        <StatCard
          icon={TrendingDown}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-50"
          label="Coldest"
          value={history.length > 0 ? `${minTemp.toFixed(1)}°C` : "--"}
        />
        <StatCard
          icon={TrendingUp}
          iconColor="text-amber-500"
          iconBg="bg-amber-50"
          label="Warmest"
          value={history.length > 0 ? `${maxTemp.toFixed(1)}°C` : "--"}
        />
      </div>

      {/* Temperature Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className={`h-5 w-5 ${colorClasses.statIcon}`} />
            Temperature History
          </CardTitle>
          <CardDescription>
            {history.length} readings • Optimal range: -18°C to -22°C
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Snowflake className="h-12 w-12 mx-auto mb-3 text-slate-300 animate-pulse" />
                <p>Waiting for {name} data...</p>
                <p className="text-sm mt-1">Make sure ESP32 ({deviceId}) is connected</p>
              </div>
            </div>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[300px] w-full"
            >
              <LineChart
                accessibilityLayer
                data={chartData}
                margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  domain={[Math.min(minTemp - 5, -30), Math.max(maxTemp + 5, 0)]}
                  tickFormatter={(value) => `${value}°`}
                />
                <ReferenceLine y={-18} stroke="#10b981" strokeDasharray="5 5" label={{ value: "Optimal Max", position: "right", fill: "#10b981", fontSize: 10 }} />
                <ReferenceLine y={-22} stroke="#10b981" strokeDasharray="5 5" label={{ value: "Optimal Min", position: "right", fill: "#10b981", fontSize: 10 }} />
                <ReferenceLine y={-15} stroke="#f59e0b" strokeDasharray="3 3" />
                <ReferenceLine y={-10} stroke="#ef4444" strokeDasharray="3 3" />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="w-[180px]"
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        });
                      }}
                      formatter={(value) => [`${Number(value).toFixed(1)}°C`, "Temperature"]}
                    />
                  }
                />
                <Line
                  dataKey="temp_c"
                  type="monotone"
                  stroke={colorClasses.chartStroke}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: colorClasses.chartStroke }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Compressor Monitor */}
      {latest && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Compressor Monitor
            </CardTitle>
            <CardDescription>
              MPU6050 accelerometer - monitors compressor vibrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">Vib X</div>
                <div className="text-xl font-mono font-bold text-slate-700">
                  {latest.accel_x?.toFixed(3) || '0.000'}
                </div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">Vib Y</div>
                <div className="text-xl font-mono font-bold text-slate-700">
                  {latest.accel_y?.toFixed(3) || '0.000'}
                </div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">Vib Z</div>
                <div className="text-xl font-mono font-bold text-slate-700">
                  {latest.accel_z?.toFixed(3) || '0.000'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// Stat Card Component
interface StatCardProps {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
}

function StatCard({ icon: Icon, iconColor, iconBg, label, value }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <div className="text-xs text-slate-500">{label}</div>
          <div className="text-xl font-bold text-slate-900">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
