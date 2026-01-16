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
import { FleetHeader } from "@/components/fleet-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Thermometer,
  Activity,
  AlertTriangle,
  CheckCircle,
  Snowflake,
  Zap,
  ZoomIn,
  ZoomOut,
  Maximize2,
  LayoutGrid,
  Home,
} from "lucide-react";

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
          title="Asset Overview"
          isConnected={isConnected}
          isOnline={isOnline}
          alertCount={alerts.length}
          pageIcon={LayoutGrid}
          breadcrumbs={[
            { label: "Home", href: "/", icon: Home },
            { label: "Dashboard", href: "/freezer" },
          ]}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <div className="flex gap-6">
            {/* Left Column - Main Content */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard
                  icon={Snowflake}
                  iconColor="text-cyan-500"
                  iconBg="bg-cyan-50"
                  label="Total Units"
                  value={deviceList.length}
                />
                <StatCard
                  icon={CheckCircle}
                  iconColor="text-emerald-500"
                  iconBg="bg-emerald-50"
                  label="Healthy"
                  value={healthyCount}
                  valueColor="text-emerald-600"
                />
                <StatCard
                  icon={AlertTriangle}
                  iconColor="text-amber-500"
                  iconBg="bg-amber-50"
                  label="Warning"
                  value={warningCount}
                  valueColor="text-amber-600"
                />
                <StatCard
                  icon={AlertTriangle}
                  iconColor="text-red-500"
                  iconBg="bg-red-50"
                  label="Critical"
                  value={criticalCount}
                  valueColor="text-red-600"
                />
                <StatCard
                  icon={Thermometer}
                  iconColor="text-blue-500"
                  iconBg="bg-blue-50"
                  label="Avg Temp"
                  value={`${avgTemp.toFixed(1)}°C`}
                  valueColor={avgTemp > -10 ? "text-red-600" : "text-slate-900"}
                />
                <StatCard
                  icon={Zap}
                  iconColor="text-emerald-500"
                  iconBg="bg-emerald-50"
                  label="Avg Power"
                  value={`${avgPower.toFixed(0)}W`}
                />
              </div>

              {/* Map Card */}
              <div className="bg-white border">
                {/* Map Header */}
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-900">Asset Location Map</h3>
                    <Badge className="bg-cyan-100 text-cyan-600 border-0">
                      {deviceList.length} Assets Online
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {/* Map Content */}
                <div className="h-[400px]">
                  <FleetMap
                    devices={deviceList}
                    selectedDevice={selectedDevice}
                    onSelectDevice={handleSelectDevice}
                    getDeviceStatus={getDeviceStatus}
                  />
                </div>
              </div>

              {/* Fleet Status Table */}
              <FleetStatusTable
                devices={deviceList}
                selectedDevice={selectedDevice}
                onSelectDevice={handleSelectDevice}
                getDeviceStatus={getDeviceStatus}
              />
            </div>

            {/* Right Column - Alerts & Chat */}
            <div className="w-80 flex-shrink-0 space-y-6">
              {/* Alert Panel */}
              <AlertPanel alerts={alerts} onSelectDevice={handleSelectDevice} />

              {/* AI Chat */}
              <FreezerChat fleetStatus={devices} />
            </div>
          </div>
        </main>
      </div>

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

// Stat Card Component
interface StatCardProps {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string | number;
  valueColor?: string;
}

function StatCard({ icon: Icon, iconColor, iconBg, label, value, valueColor = "text-slate-900" }: StatCardProps) {
  return (
    <div className="bg-white border p-4 flex items-center gap-3">
      <div className={`p-2.5 ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className={`text-xl font-bold ${valueColor}`}>{value}</div>
      </div>
    </div>
  );
}
