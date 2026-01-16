"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FreezerReading } from "@/hooks/use-fleet-data";
import { AlertTriangle, ChevronRight, Snowflake } from "lucide-react";

interface AlertPanelProps {
  alerts: FreezerReading[];
  onSelectDevice: (deviceId: string) => void;
}

export function AlertPanel({ alerts, onSelectDevice }: AlertPanelProps) {
  const getAlertMessage = (device: FreezerReading) => {
    if (device.fault !== "NORMAL") return device.fault;
    if (device.temp_cabinet > -5) return `High temp: ${device.temp_cabinet.toFixed(1)}°C`;
    if (device.door_open) return "Door open";
    if (device.frost_level > 0.5) return `High frost: ${(device.frost_level * 100).toFixed(0)}%`;
    return "Unknown alert";
  };

  const getAlertColor = (device: FreezerReading) => {
    if (device.fault !== "NORMAL" || device.temp_cabinet > -5) return "text-rose-600";
    if (device.door_open) return "text-indigo-500";
    return "text-indigo-500";
  };

  return (
    <div className="bg-white border">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-indigo-500" />
          <h3 className="font-semibold text-slate-900">Active Alerts</h3>
        </div>
        {alerts.length > 0 && (
          <Badge className="bg-indigo-100 text-indigo-600 border-0">
            {alerts.length}
          </Badge>
        )}
      </div>

      {/* Content */}
      {alerts.length === 0 ? (
        <div className="p-6 text-center text-slate-500">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No active alerts</p>
          <p className="text-xs text-slate-400">All systems operating normally</p>
        </div>
      ) : (
        <ScrollArea className="h-[180px]">
          <div className="divide-y">
            {alerts.map((alert) => (
              <button
                key={alert.device_id}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                onClick={() => onSelectDevice(alert.device_id)}
              >
                <Snowflake className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-slate-900">
                      {alert.device_id}
                    </span>
                    <span className="text-xs text-slate-500">
                      {alert.location_name}
                    </span>
                  </div>
                  <div className={`text-xs ${getAlertColor(alert)}`}>
                    {getAlertMessage(alert)}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
