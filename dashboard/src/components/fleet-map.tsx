"use client";

import * as React from "react";
import { FreezerReading } from "@/hooks/use-fleet-data";

interface FleetMapProps {
  devices: FreezerReading[];
  selectedDevice: string | null;
  onSelectDevice: (deviceId: string | null) => void;
  getDeviceStatus: (device: FreezerReading) => "healthy" | "warning" | "critical";
}

// UK bounding box for positioning
const UK_BOUNDS = {
  minLat: 49.5,  // South
  maxLat: 59.0,  // North
  minLon: -8.0,  // West
  maxLon: 2.0,   // East
};

export function FleetMap({
  devices,
  selectedDevice,
  onSelectDevice,
  getDeviceStatus,
}: FleetMapProps) {
  // Convert lat/lon to percentage position within the map
  const toPosition = (lat: number, lon: number) => {
    const x = ((lon - UK_BOUNDS.minLon) / (UK_BOUNDS.maxLon - UK_BOUNDS.minLon)) * 100;
    const y = ((UK_BOUNDS.maxLat - lat) / (UK_BOUNDS.maxLat - UK_BOUNDS.minLat)) * 100;
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  const statusColors = {
    healthy: "bg-emerald-500",
    warning: "bg-amber-500",
    critical: "bg-red-500",
  };

  const statusRingColors = {
    healthy: "border-emerald-500",
    warning: "border-amber-500",
    critical: "border-red-500",
  };

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden bg-blue-50">
      {/* Grid pattern background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Simple UK outline using CSS */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
      >
        {/* Simplified UK shape */}
        <path
          d="M 45 15
             Q 55 20 58 30
             Q 60 35 55 45
             Q 58 55 55 65
             Q 52 75 48 80
             Q 45 85 40 82
             Q 35 78 38 70
             Q 35 60 38 50
             Q 35 40 40 30
             Q 42 20 45 15
             Z"
          fill="white"
          stroke="#94a3b8"
          strokeWidth="0.5"
        />
        {/* Scotland */}
        <path
          d="M 42 10
             Q 50 8 55 12
             Q 58 18 52 22
             Q 48 20 45 15
             Q 42 12 42 10
             Z"
          fill="white"
          stroke="#94a3b8"
          strokeWidth="0.5"
        />
      </svg>

      {/* Device markers */}
      <div className="absolute inset-0">
        {devices.map((device) => {
          const pos = toPosition(device.lat, device.lon);
          const status = getDeviceStatus(device);
          const isSelected = selectedDevice === device.device_id;

          return (
            <div
              key={device.device_id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              onClick={() => onSelectDevice(isSelected ? null : device.device_id)}
            >
              {/* Pulse animation for critical */}
              {status === "critical" && (
                <div
                  className={`absolute inset-0 rounded-full ${statusRingColors[status]} border-2 animate-ping opacity-75`}
                  style={{ width: "24px", height: "24px", margin: "-6px" }}
                />
              )}

              {/* Marker dot */}
              <div
                className={`
                  relative w-3 h-3 rounded-full border-2 border-white shadow-lg
                  ${statusColors[status]}
                  ${isSelected ? "ring-2 ring-offset-2 ring-blue-500 w-4 h-4" : ""}
                  transition-all duration-200 hover:scale-125
                `}
              />

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                <div className="bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
                  <div className="font-semibold">{device.device_id}</div>
                  <div>{device.location_name}</div>
                  <div className={status === "critical" ? "text-red-400" : status === "warning" ? "text-amber-400" : "text-emerald-400"}>
                    {device.temp_cabinet.toFixed(1)}°C
                  </div>
                  {device.door_open && <div className="text-amber-400">🚪 Door Open</div>}
                  {device.fault !== "NORMAL" && <div className="text-red-400">⚠️ {device.fault}</div>}
                </div>
                {/* Tooltip arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3 shadow-md text-xs">
        <div className="font-semibold mb-2 text-slate-700">Fleet Status</div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-600">Healthy</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-slate-600">Warning</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-slate-600">Critical</span>
        </div>
      </div>

      {/* Stats overlay */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-lg p-3 shadow-md text-xs">
        <div className="font-semibold mb-1 text-slate-700">
          {devices.length} Units
        </div>
        <div className="text-slate-500">
          Click a marker for details
        </div>
      </div>
    </div>
  );
}
