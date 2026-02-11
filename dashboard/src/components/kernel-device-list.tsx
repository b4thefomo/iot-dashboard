"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Thermometer, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  KernelDevice,
  KERNEL_STATE_CONFIG,
  KernelStateName,
} from "@/hooks/use-kernel-data";

interface KernelDeviceListProps {
  devices: KernelDevice[];
  selectedDevice: string | null;
  onSelectDevice: (id: string) => void;
  groundTruth?: Record<string, string>;
  replayRunning?: boolean;
}

export function KernelDeviceList({ devices, selectedDevice, onSelectDevice, groundTruth, replayRunning }: KernelDeviceListProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700">
        <h3 className="font-semibold text-white text-sm">Devices ({devices.length})</h3>
      </div>
      <ScrollArea className="h-[260px]">
        <div className="divide-y divide-slate-700/50">
          {devices.map((device) => {
            const stateConfig = device.current_state?.state_name
              ? KERNEL_STATE_CONFIG[device.current_state.state_name as KernelStateName]
              : null;
            const isSelected = selectedDevice === device.device_id;

            return (
              <button
                key={device.device_id}
                className={cn(
                  "w-full px-4 py-3 flex items-start gap-3 hover:bg-slate-700/50 transition-colors text-left",
                  isSelected && "bg-violet-500/10 border-l-2 border-violet-400"
                )}
                onClick={() => onSelectDevice(device.device_id)}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: stateConfig?.color || "#64748b" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-white">
                      {device.device_id}
                    </span>
                    {stateConfig && (
                      <Badge
                        className={cn("text-xs px-1.5 py-0 border-0", stateConfig.bgColor, stateConfig.textColor)}
                      >
                        {stateConfig.label}
                      </Badge>
                    )}
                    {replayRunning && groundTruth && groundTruth[device.device_id] && (
                      <Badge className="text-[10px] px-1 py-0 border-0 bg-amber-500/20 text-amber-300">
                        GT: {groundTruth[device.device_id]}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {device.location_name || "Unknown"}
                    </span>
                  </div>
                  {device.current_reading && (
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Thermometer className="h-3 w-3" />
                        {device.current_reading.temp_cabinet.toFixed(1)}°C
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {device.current_reading.compressor_power_w.toFixed(0)}W
                      </span>
                      <span className="text-slate-600">
                        {device.markov_maturity}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
          {devices.length === 0 && (
            <div className="p-6 text-center text-slate-500 text-sm">
              No devices. Start the simulator to begin.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
