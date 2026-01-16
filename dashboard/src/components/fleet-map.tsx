"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import Map, { Marker, NavigationControl, ScaleControl } from "react-map-gl/mapbox";
import { FreezerReading } from "@/hooks/use-fleet-data";
import "mapbox-gl/dist/mapbox-gl.css";

interface FleetMapProps {
  devices: FreezerReading[];
  selectedDevice: string | null;
  onSelectDevice: (deviceId: string | null) => void;
  getDeviceStatus: (device: FreezerReading) => "healthy" | "warning" | "critical";
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export function FleetMap({
  devices,
  selectedDevice,
  onSelectDevice,
  getDeviceStatus,
}: FleetMapProps) {
  const [viewState, setViewState] = useState({
    longitude: -3.5,
    latitude: 54.5,
    zoom: 5.2,
  });

  const statusColors = {
    healthy: "#2dd4bf", // Teal
    warning: "#818cf8", // Indigo
    critical: "#e11d48", // Rose/Crimson
  };

  const handleMarkerClick = useCallback(
    (deviceId: string) => {
      onSelectDevice(selectedDevice === deviceId ? null : deviceId);
    },
    [selectedDevice, onSelectDevice]
  );

  if (!MAPBOX_TOKEN) {
    return (
      <div className="relative w-full h-full min-h-[400px] overflow-hidden bg-slate-100 flex items-center justify-center">
        <div className="text-slate-500 text-center p-4">
          <div className="font-semibold mb-2">Mapbox token not configured</div>
          <div className="text-xs">Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to .env.local</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/gb4de/cma3us4hd001h01slfbvo9ib9"
        minZoom={3}
        maxZoom={12}
      >
        {/* Navigation controls */}
        <NavigationControl position="top-right" />
        <ScaleControl position="bottom-right" />

        {/* Device markers */}
        {devices.map((device) => {
          const status = getDeviceStatus(device);
          const isSelected = selectedDevice === device.device_id;
          const color = statusColors[status];

          return (
            <Marker
              key={device.device_id}
              longitude={device.lon}
              latitude={device.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(device.device_id);
              }}
            >
              <div
                className="relative cursor-pointer group flex items-center justify-center"
                style={{
                  zIndex: status === "critical" ? 30 : status === "warning" ? 20 : 10,
                  width: isSelected ? 20 : 14,
                  height: isSelected ? 20 : 14,
                }}
              >
                {/* Pulse ring for critical/warning */}
                {(status === "critical" || status === "warning") && (
                  <div
                    className="absolute rounded-full animate-ping"
                    style={{
                      width: isSelected ? 28 : 22,
                      height: isSelected ? 28 : 22,
                      border: `2px solid ${color}`,
                      opacity: 0.6,
                    }}
                  />
                )}

                {/* Marker dot */}
                <div
                  className="rounded-full border-2 border-white shadow-lg transition-transform duration-200 hover:scale-150"
                  style={{
                    width: isSelected ? 20 : 14,
                    height: isSelected ? 20 : 14,
                    backgroundColor: color,
                    boxShadow: isSelected
                      ? `0 0 0 4px rgba(59, 130, 246, 0.5), 0 4px 6px rgba(0,0,0,0.2)`
                      : `0 2px 4px rgba(0,0,0,0.2)`,
                  }}
                />

                {/* City label */}
                <div
                  className="absolute whitespace-nowrap text-xs font-medium"
                  style={{
                    top: "100%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    marginTop: 4,
                    color: "#334155",
                    textShadow:
                      "0 1px 2px rgba(255,255,255,0.9), 0 0 4px rgba(255,255,255,0.9)",
                  }}
                >
                  {device.location_name}
                </div>

                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block z-50">
                  <div
                    className="text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl"
                    style={{ backgroundColor: "#1e293b" }}
                  >
                    <div className="font-bold mb-1">{device.device_id}</div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span style={{ color: color }}>
                        {device.temp_cabinet.toFixed(1)}°C
                      </span>
                    </div>
                    {device.door_open && (
                      <div className="text-indigo-300 mt-1">Door Open</div>
                    )}
                    {device.frost_level > 0.5 && (
                      <div className="text-cyan-300 mt-1">
                        High Frost: {(device.frost_level * 100).toFixed(0)}%
                      </div>
                    )}
                    {device.fault !== "NORMAL" && (
                      <div className="text-rose-300 mt-1">{device.fault}</div>
                    )}
                  </div>
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent"
                    style={{ borderTopColor: "#1e293b" }}
                  />
                </div>
              </div>
            </Marker>
          );
        })}
      </Map>

      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur p-3 shadow-lg text-xs border border-slate-200 pointer-events-none">
        <div className="font-semibold mb-2 text-slate-800">Asset Status</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: statusColors.healthy }}
            />
            <span className="text-slate-600">Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: statusColors.warning }}
            />
            <span className="text-slate-600">Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: statusColors.critical }}
            />
            <span className="text-slate-600">Critical</span>
          </div>
        </div>
      </div>

      {/* Stats overlay */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur p-3 shadow-lg text-xs border border-slate-200 pointer-events-none">
        <div className="font-semibold text-slate-800">
          {devices.length} Assets Online
        </div>
        <div className="text-slate-500 mt-1">Click a marker for details</div>
      </div>
    </div>
  );
}
