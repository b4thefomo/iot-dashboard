"use client";

import * as React from "react";
import { useFleetData } from "@/hooks/use-fleet-data";
import { FleetMap } from "@/components/fleet-map";
import { FreezerDetailPanel } from "@/components/freezer-detail-panel";
import { AlertPanel } from "@/components/alert-panel";
import { FreezerChat } from "@/components/freezer-chat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Thermometer,
  Wifi,
  WifiOff,
  Activity,
  AlertTriangle,
  CheckCircle,
  Snowflake,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FreezerDashboard() {
  const {
    deviceList,
    alerts,
    selectedDevice,
    selectDevice,
    isConnected,
    isOnline,
    healthyCount,
    warningCount,
    criticalCount,
    getDeviceStatus,
    devices,
  } = useFleetData();

  const selectedDeviceData = selectedDevice ? devices[selectedDevice] : null;

  // Calculate fleet averages
  const avgTemp =
    deviceList.length > 0
      ? deviceList.reduce((sum, d) => sum + d.temp_cabinet, 0) / deviceList.length
      : 0;
  const avgPower =
    deviceList.length > 0
      ? deviceList.reduce((sum, d) => sum + d.compressor_power_w, 0) / deviceList.length
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-600 text-white">
                <Snowflake className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Subzero Fleet Command</h1>
                <p className="text-xs text-slate-500">Real-time Freezer Monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    <Wifi className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Disconnected
                  </Badge>
                )}
                {isOnline ? (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    <Activity className="h-3 w-3 mr-1" />
                    Live Data
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    <Activity className="h-3 w-3 mr-1" />
                    Stale
                  </Badge>
                )}
              </div>
              <Link href="/">
                <Button variant="outline" size="sm">
                  ← Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Snowflake className="h-3 w-3" />
                Total Units
              </div>
              <div className="text-2xl font-bold">{deviceList.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-emerald-600 text-xs mb-1">
                <CheckCircle className="h-3 w-3" />
                Healthy
              </div>
              <div className="text-2xl font-bold text-emerald-600">{healthyCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-amber-600 text-xs mb-1">
                <AlertTriangle className="h-3 w-3" />
                Warning
              </div>
              <div className="text-2xl font-bold text-amber-600">{warningCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600 text-xs mb-1">
                <AlertTriangle className="h-3 w-3" />
                Critical
              </div>
              <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
            </CardContent>
          </Card>
          <Card className="hidden md:block">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Thermometer className="h-3 w-3" />
                Avg Temp
              </div>
              <div className={`text-2xl font-bold ${avgTemp > -10 ? "text-red-600" : ""}`}>
                {avgTemp.toFixed(1)}°C
              </div>
            </CardContent>
          </Card>
          <Card className="hidden lg:block">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Activity className="h-3 w-3" />
                Avg Power
              </div>
              <div className="text-2xl font-bold">{avgPower.toFixed(0)}W</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <Card className="h-[500px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Fleet Location Map</CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-60px)]">
                <FleetMap
                  devices={deviceList}
                  selectedDevice={selectedDevice}
                  onSelectDevice={selectDevice}
                  getDeviceStatus={getDeviceStatus}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Alert Panel */}
            <AlertPanel alerts={alerts} onSelectDevice={selectDevice} />

            {/* Device Detail Panel */}
            <FreezerDetailPanel
              device={selectedDeviceData}
              onClose={() => selectDevice(null)}
              getDeviceStatus={getDeviceStatus}
            />
          </div>
        </div>

        {/* Chat Section */}
        <div className="mt-6">
          <FreezerChat fleetStatus={devices} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur mt-8">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div>Subzero Fleet Command v1.0</div>
            <div>Monitoring {deviceList.length} units across the UK</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
