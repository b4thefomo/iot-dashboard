"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FreezerReading } from "@/hooks/use-fleet-data";
import {
  Thermometer,
  Gauge,
  Zap,
  Snowflake,
  DoorOpen,
  X,
  MapPin,
  Activity,
} from "lucide-react";

interface FreezerDetailPanelProps {
  device: FreezerReading | null;
  onClose: () => void;
  getDeviceStatus: (device: FreezerReading) => "healthy" | "warning" | "critical";
}

export function FreezerDetailPanel({
  device,
  onClose,
  getDeviceStatus,
}: FreezerDetailPanelProps) {
  if (!device) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <Snowflake className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Select a freezer on the map to view details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = getDeviceStatus(device);
  const statusColors = {
    healthy: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    critical: "bg-red-100 text-red-700",
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Snowflake className="h-4 w-4" />
            {device.device_id}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={statusColors[status]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {device.location_name}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Temperature */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Thermometer className="h-3 w-3" />
              Cabinet Temp
            </div>
            <div className={`text-2xl font-bold ${device.temp_cabinet > -10 ? "text-red-600" : ""}`}>
              {device.temp_cabinet.toFixed(1)}°C
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Thermometer className="h-3 w-3" />
              Ambient Temp
            </div>
            <div className="text-2xl font-bold">
              {device.temp_ambient.toFixed(1)}°C
            </div>
          </div>
        </div>

        {/* Power and Efficiency */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Zap className="h-3 w-3" />
              Power Draw
            </div>
            <div className="text-xl font-bold">
              {device.compressor_power_w.toFixed(0)}W
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Activity className="h-3 w-3" />
              COP
            </div>
            <div className={`text-xl font-bold ${device.cop < 2 ? "text-amber-600" : ""}`}>
              {device.cop.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Compressor */}
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Gauge className="h-3 w-3" />
            Compressor Frequency
          </div>
          <div className="text-xl font-bold">
            {device.compressor_freq_hz.toFixed(1)} Hz
          </div>
        </div>

        {/* Frost Level */}
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <Snowflake className="h-3 w-3" />
            Frost Level
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${device.frost_level > 0.5 ? "bg-amber-500" : "bg-blue-500"}`}
              style={{ width: `${device.frost_level * 100}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {(device.frost_level * 100).toFixed(0)}%
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex flex-wrap gap-2">
          {device.door_open && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <DoorOpen className="h-3 w-3" />
              Door Open
            </Badge>
          )}
          {device.defrost_on && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Snowflake className="h-3 w-3" />
              Defrost Active
            </Badge>
          )}
          {device.fault !== "NORMAL" && (
            <Badge variant="destructive">
              Fault: {device.fault}
            </Badge>
          )}
        </div>

        {/* Last Update */}
        <div className="text-xs text-muted-foreground">
          Last update: {new Date(device.timestamp).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}
