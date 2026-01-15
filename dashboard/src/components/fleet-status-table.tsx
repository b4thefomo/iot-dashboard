"use client";

import * as React from "react";
import { useMemo } from "react";
import { FreezerReading } from "@/hooks/use-fleet-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DoorOpen, Snowflake, MapPin, AlertTriangle, CheckCircle } from "lucide-react";

interface FleetStatusTableProps {
  devices: FreezerReading[];
  selectedDevice: string | null;
  onSelectDevice: (deviceId: string | null) => void;
  getDeviceStatus: (device: FreezerReading) => "healthy" | "warning" | "critical";
}

interface LocationGroup {
  location: string;
  devices: FreezerReading[];
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
  overallStatus: "healthy" | "warning" | "critical";
}

export function FleetStatusTable({
  devices,
  selectedDevice,
  onSelectDevice,
  getDeviceStatus,
}: FleetStatusTableProps) {
  const statusColors = {
    healthy: "bg-emerald-500",
    warning: "bg-amber-500",
    critical: "bg-red-500",
  };

  const statusBgColors = {
    healthy: "bg-emerald-50",
    warning: "bg-amber-50",
    critical: "bg-red-50",
  };

  const statusBorderColors = {
    healthy: "border-emerald-200",
    warning: "border-amber-200",
    critical: "border-red-200",
  };

  // Group devices by location
  const locationGroups = useMemo(() => {
    const groups: Record<string, LocationGroup> = {};

    devices.forEach((device) => {
      const location = device.location_name;
      if (!groups[location]) {
        groups[location] = {
          location,
          devices: [],
          healthyCount: 0,
          warningCount: 0,
          criticalCount: 0,
          overallStatus: "healthy",
        };
      }

      groups[location].devices.push(device);
      const status = getDeviceStatus(device);

      if (status === "healthy") groups[location].healthyCount++;
      else if (status === "warning") groups[location].warningCount++;
      else if (status === "critical") groups[location].criticalCount++;
    });

    // Calculate overall status for each location
    Object.values(groups).forEach((group) => {
      if (group.criticalCount > 0) {
        group.overallStatus = "critical";
      } else if (group.warningCount > 0) {
        group.overallStatus = "warning";
      } else {
        group.overallStatus = "healthy";
      }
    });

    // Sort: critical first, then warning, then healthy
    return Object.values(groups).sort((a, b) => {
      const priority = { critical: 0, warning: 1, healthy: 2 };
      return priority[a.overallStatus] - priority[b.overallStatus];
    });
  }, [devices, getDeviceStatus]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Snowflake className="h-4 w-4" />
          Fleet Status by Region
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {locationGroups.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No devices connected
          </div>
        ) : (
          <div className="divide-y">
            {locationGroups.map((group) => (
              <div key={group.location}>
                {/* Location Header */}
                <div
                  className={`px-4 py-3 flex items-center justify-between ${statusBgColors[group.overallStatus]} ${statusBorderColors[group.overallStatus]} border-l-4`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-600" />
                    <span className="font-semibold text-slate-800">
                      {group.location}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({group.devices.length} unit{group.devices.length !== 1 ? "s" : ""})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {group.criticalCount > 0 && (
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {group.criticalCount} Critical
                      </Badge>
                    )}
                    {group.warningCount > 0 && (
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {group.warningCount} Warning
                      </Badge>
                    )}
                    {group.healthyCount > 0 && group.criticalCount === 0 && group.warningCount === 0 && (
                      <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        All Healthy
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Devices Table for this location */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50/50">
                        <th className="text-left p-3 font-medium text-slate-500 text-xs">Unit ID</th>
                        <th className="text-right p-3 font-medium text-slate-500 text-xs">Temp</th>
                        <th className="text-right p-3 font-medium text-slate-500 text-xs">Power</th>
                        <th className="text-right p-3 font-medium text-slate-500 text-xs">Frost</th>
                        <th className="text-center p-3 font-medium text-slate-500 text-xs">Door</th>
                        <th className="text-center p-3 font-medium text-slate-500 text-xs">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.devices.map((device) => {
                        const status = getDeviceStatus(device);
                        const isSelected = selectedDevice === device.device_id;

                        return (
                          <tr
                            key={device.device_id}
                            className={`border-b cursor-pointer transition-colors hover:bg-slate-50 ${
                              isSelected ? statusBgColors[status] : ""
                            }`}
                            onClick={() => onSelectDevice(isSelected ? null : device.device_id)}
                          >
                            <td className="p-3 font-medium text-slate-900">
                              {device.device_id}
                            </td>
                            <td
                              className={`p-3 text-right font-mono ${
                                device.temp_cabinet > -10
                                  ? "text-red-600 font-semibold"
                                  : device.temp_cabinet > -15
                                  ? "text-amber-600"
                                  : "text-slate-900"
                              }`}
                            >
                              {device.temp_cabinet.toFixed(1)}°C
                            </td>
                            <td className="p-3 text-right font-mono text-slate-600">
                              {device.compressor_power_w.toFixed(0)}W
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <div className="w-12 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      device.frost_level > 0.5
                                        ? "bg-blue-500"
                                        : "bg-slate-400"
                                    }`}
                                    style={{ width: `${device.frost_level * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs text-slate-500 w-8">
                                  {(device.frost_level * 100).toFixed(0)}%
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              {device.door_open ? (
                                <Badge
                                  variant="outline"
                                  className="bg-amber-50 text-amber-700 border-amber-200"
                                >
                                  <DoorOpen className="h-3 w-3 mr-1" />
                                  Open
                                </Badge>
                              ) : (
                                <span className="text-slate-400 text-xs">Closed</span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex justify-center">
                                <div
                                  className={`w-3 h-3 rounded-full ${statusColors[status]}`}
                                  title={status.charAt(0).toUpperCase() + status.slice(1)}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
