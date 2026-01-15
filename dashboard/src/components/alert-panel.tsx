"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FreezerReading } from "@/hooks/use-fleet-data";
import { AlertTriangle, DoorOpen, Thermometer, Snowflake } from "lucide-react";

interface AlertPanelProps {
  alerts: FreezerReading[];
  onSelectDevice: (deviceId: string) => void;
}

export function AlertPanel({ alerts, onSelectDevice }: AlertPanelProps) {
  const getAlertType = (device: FreezerReading) => {
    if (device.fault !== "NORMAL") return { type: "fault", icon: AlertTriangle, color: "text-red-600" };
    if (device.temp_cabinet > -5) return { type: "temp", icon: Thermometer, color: "text-red-600" };
    if (device.door_open) return { type: "door", icon: DoorOpen, color: "text-amber-600" };
    if (device.frost_level > 0.5) return { type: "frost", icon: Snowflake, color: "text-blue-600" };
    return { type: "unknown", icon: AlertTriangle, color: "text-gray-600" };
  };

  const getAlertMessage = (device: FreezerReading) => {
    if (device.fault !== "NORMAL") return device.fault;
    if (device.temp_cabinet > -5) return `High temp: ${device.temp_cabinet.toFixed(1)}°C`;
    if (device.door_open) return "Door open";
    if (device.frost_level > 0.5) return `High frost: ${(device.frost_level * 100).toFixed(0)}%`;
    return "Unknown alert";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Active Alerts
          {alerts.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active alerts</p>
            <p className="text-xs">All systems operating normally</p>
          </div>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {alerts.map((alert) => {
                const alertInfo = getAlertType(alert);
                const Icon = alertInfo.icon;

                return (
                  <div
                    key={alert.device_id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => onSelectDevice(alert.device_id)}
                  >
                    <Icon className={`h-4 w-4 ${alertInfo.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {alert.device_id}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {alert.location_name}
                      </div>
                    </div>
                    <div className="text-xs text-right">
                      <div className={alertInfo.color}>{getAlertMessage(alert)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
