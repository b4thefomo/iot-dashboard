"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ReferenceLine } from "recharts";
import { useHomeFreezerData } from "@/hooks/use-home-freezer-data";
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
} from "lucide-react";
import Link from "next/link";

const chartConfig = {
  temp_c: {
    label: "Temperature",
    color: "hsl(190, 90%, 50%)",
  },
} satisfies ChartConfig;

export default function HomeFreezerDashboard() {
  const {
    history,
    latest,
    isConnected,
    isOnline,
    status,
    avgTemp,
    minTemp,
    maxTemp,
  } = useHomeFreezerData();

  const chartData = React.useMemo(() => {
    return history.map((reading) => ({
      timestamp: reading.timestamp,
      temp_c: reading.temp_c,
    }));
  }, [history]);

  // Get status color and icon
  const getStatusDisplay = () => {
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
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

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
                <p className="text-sm text-slate-500">ESP32 Temperature Sensor</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <Badge
                variant="outline"
                className={isOnline ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-slate-50 text-slate-500"}
              >
                {isOnline ? (
                  <>
                    <Wifi className="h-3 w-3 mr-1" />
                    Online
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 mr-1" />
                    Offline
                  </>
                )}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Stats & Chart */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Banner */}
            <Card className={`border-2 ${statusDisplay.color}`}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className={`p-3 rounded-xl ${status === 'critical' ? 'bg-rose-200' : status === 'warning' ? 'bg-amber-200' : status === 'healthy' ? 'bg-emerald-200' : 'bg-slate-200'}`}>
                  <StatusIcon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{statusDisplay.label}</span>
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

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                icon={Thermometer}
                iconColor="text-cyan-500"
                iconBg="bg-cyan-50"
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
                  <Thermometer className="h-5 w-5 text-cyan-500" />
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
                      <p>Waiting for freezer data...</p>
                      <p className="text-sm mt-1">Make sure your ESP32 is connected</p>
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
                      {/* Reference lines for optimal range */}
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
                        stroke="hsl(190, 90%, 50%)"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: "hsl(190, 90%, 50%)" }}
                      />
                    </LineChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Motion Sensor Data */}
            {latest && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Motion Sensor
                  </CardTitle>
                  <CardDescription>
                    Accelerometer data - detects vibrations and movement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-500 mb-1">X-Axis</div>
                      <div className="text-xl font-mono font-bold text-slate-700">
                        {latest.accel_x.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-500 mb-1">Y-Axis</div>
                      <div className="text-xl font-mono font-bold text-slate-700">
                        {latest.accel_y.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-xs text-slate-500 mb-1">Z-Axis</div>
                      <div className="text-xl font-mono font-bold text-slate-700">
                        {latest.accel_z.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Chat */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 h-[calc(100vh-120px)]">
              <HomeFreezerChat latest={latest} history={history} />
            </div>
          </div>
        </div>
      </main>
    </div>
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
