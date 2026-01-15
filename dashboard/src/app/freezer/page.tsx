"use client";

import * as React from "react";
import { useState } from "react";
import { useFleetData } from "@/hooks/use-fleet-data";
import { FleetMap } from "@/components/fleet-map";
import { FleetStatusTable } from "@/components/fleet-status-table";
import { AlertPanel } from "@/components/alert-panel";
import { FreezerChat } from "@/components/freezer-chat";
import { FreezerSidebar } from "@/components/freezer-sidebar";
import { FreezerDetailModal } from "@/components/freezer-detail-modal";
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

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailDevice, setDetailDevice] = useState<string | null>(null);

  // Handle device selection - open modal for details
  const handleSelectDevice = (deviceId: string | null) => {
    selectDevice(deviceId);
    if (deviceId) {
      setDetailDevice(deviceId);
      setDetailModalOpen(true);
    }
  };

  const selectedDeviceData = detailDevice ? devices[detailDevice] : null;

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="px-4 py-3">
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

      {/* Main layout with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <FreezerSidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
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
            {/* Left Column - Map and Table */}
            <div className="lg:col-span-2 space-y-4">
              {/* Map */}
              <Card className="h-[500px]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Fleet Location Map</CardTitle>
                </CardHeader>
                <CardContent className="h-[calc(100%-60px)]">
                  <FleetMap
                    devices={deviceList}
                    selectedDevice={selectedDevice}
                    onSelectDevice={handleSelectDevice}
                    getDeviceStatus={getDeviceStatus}
                  />
                </CardContent>
              </Card>

              {/* Fleet Status Table - Under map */}
              <FleetStatusTable
                devices={deviceList}
                selectedDevice={selectedDevice}
                onSelectDevice={handleSelectDevice}
                getDeviceStatus={getDeviceStatus}
              />
            </div>

            {/* Right Sidebar - Alerts and Chat */}
            <div className="flex flex-col gap-4">
              {/* Alert Panel */}
              <AlertPanel alerts={alerts} onSelectDevice={handleSelectDevice} />

              {/* AI Chat - Fills remaining space */}
              <div className="flex-1">
                <FreezerChat fleetStatus={devices} />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur flex-shrink-0">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div>Subzero Fleet Command v1.0</div>
            <div>Monitoring {deviceList.length} units across the UK</div>
          </div>
        </div>
      </footer>

      {/* Detail Modal */}
      <FreezerDetailModal
        device={selectedDeviceData}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          selectDevice(null);
        }}
        getDeviceStatus={getDeviceStatus}
      />
    </div>
  );
}
