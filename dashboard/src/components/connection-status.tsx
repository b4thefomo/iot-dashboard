"use client";

import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";

interface ConnectionStatusProps {
  isOnline: boolean;
  isConnected: boolean;
  sensorId?: string;
}

export function ConnectionStatus({ isOnline, isConnected, sensorId }: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-2">
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
            {sensorId || "ESP32"} Online
          </Badge>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline" className="text-muted-foreground">
            {sensorId || "ESP32"} Offline
          </Badge>
        </>
      )}
      {!isConnected && (
        <Badge variant="destructive" className="text-xs">
          Disconnected
        </Badge>
      )}
    </div>
  );
}
