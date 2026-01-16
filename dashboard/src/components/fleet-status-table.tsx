"use client";

import { useMemo, useState } from "react";
import { FreezerReading } from "@/hooks/use-fleet-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  MapPin,
  Snowflake,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

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
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const statusColors = {
    healthy: "bg-teal-400",
    warning: "bg-indigo-400",
    critical: "bg-rose-500",
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

    // Sort alphabetically
    return Object.values(groups).sort((a, b) => a.location.localeCompare(b.location));
  }, [devices, getDeviceStatus]);


  const toggleLocation = (location: string) => {
    setExpandedLocations((prev) => {
      const next = new Set(prev);
      if (next.has(location)) {
        next.delete(location);
      } else {
        next.add(location);
      }
      return next;
    });
  };

  const getStatusBadge = (group: LocationGroup) => {
    if (group.criticalCount > 0) {
      return (
        <Badge className="bg-rose-100 text-rose-600 border-0">
          {group.criticalCount} Critical
        </Badge>
      );
    }
    if (group.warningCount > 0) {
      return (
        <Badge className="bg-indigo-100 text-indigo-600 border-0">
          {group.warningCount} Warning
        </Badge>
      );
    }
    return (
      <Badge className="bg-teal-100 text-teal-600 border-0">
        All Healthy
      </Badge>
    );
  };

  return (
    <div className="bg-slate-50 border">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Snowflake className="h-4 w-4 text-cyan-500" />
          <h3 className="font-semibold text-slate-900">Asset Status by Region</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => window.open(`${apiUrl}/api/fleet/export/csv`, "_blank")}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => window.open(`${apiUrl}/api/fleet/export/pdf`, "_blank")}
          >
            <FileText className="h-3.5 w-3.5" />
            PDF Report
          </Button>
        </div>
      </div>

      {/* Content */}
      {locationGroups.length === 0 ? (
        <div className="p-8 text-center text-slate-500">No devices connected</div>
      ) : (
        <div className="p-2 space-y-3">
          {locationGroups.map((group) => {
            const isExpanded = expandedLocations.has(group.location);

            return (
              <div key={group.location} className="border bg-white">
                {/* Location Row */}
                <button
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  onClick={() => toggleLocation(group.location)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-900">{group.location}</span>
                    <span className="text-sm text-slate-500">
                      ({group.devices.length} unit{group.devices.length !== 1 ? "s" : ""})
                    </span>
                  </div>
                  {getStatusBadge(group)}
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t bg-slate-50/50">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left px-4 py-2 font-medium text-slate-500 text-xs">
                            Unit ID
                          </th>
                          <th className="text-left px-4 py-2 font-medium text-slate-500 text-xs">
                            Temp
                          </th>
                          <th className="text-left px-4 py-2 font-medium text-slate-500 text-xs">
                            Power
                          </th>
                          <th className="text-left px-4 py-2 font-medium text-slate-500 text-xs">
                            Frost
                          </th>
                          <th className="text-left px-4 py-2 font-medium text-slate-500 text-xs">
                            Door
                          </th>
                          <th className="text-left px-4 py-2 font-medium text-slate-500 text-xs">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.devices.map((device) => {
                          const status = getDeviceStatus(device);
                          const isSelected = selectedDevice === device.device_id;

                          return (
                            <tr
                              key={device.device_id}
                              className={`border-b last:border-b-0 cursor-pointer transition-colors hover:bg-white ${
                                isSelected ? "bg-cyan-50" : ""
                              }`}
                              onClick={() =>
                                onSelectDevice(isSelected ? null : device.device_id)
                              }
                            >
                              <td className="px-4 py-2.5 font-medium text-slate-900">
                                {device.device_id}
                              </td>
                              <td
                                className={`px-4 py-2.5 font-mono ${
                                  device.temp_cabinet > -10
                                    ? "text-rose-600"
                                    : device.temp_cabinet > -15
                                    ? "text-indigo-500"
                                    : "text-teal-600"
                                }`}
                              >
                                {device.temp_cabinet.toFixed(1)}°C
                              </td>
                              <td className="px-4 py-2.5 font-mono text-slate-600">
                                {device.compressor_power_w.toFixed(0)}W
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-2 bg-slate-200 overflow-hidden">
                                    <div
                                      className={`h-full ${
                                        device.frost_level > 0.5
                                          ? "bg-indigo-400"
                                          : "bg-teal-400"
                                      }`}
                                      style={{ width: `${device.frost_level * 100}%` }}
                                    />
                                  </div>
                                  <span
                                    className={`text-xs ${
                                      device.frost_level > 0.5
                                        ? "text-indigo-600"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    {(device.frost_level * 100).toFixed(0)}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-slate-600">
                                {device.door_open ? (
                                  <span className="text-indigo-600">Open</span>
                                ) : (
                                  "Closed"
                                )}
                              </td>
                              <td className="px-4 py-2.5">
                                <div
                                  className={`w-3 h-3 ${statusColors[status]}`}
                                  title={status.charAt(0).toUpperCase() + status.slice(1)}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
