"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { KernelAlert, KERNEL_STATE_CONFIG, KernelStateName } from "@/hooks/use-kernel-data";

interface KernelAlertFeedProps {
  alerts: KernelAlert[];
  onSelectDevice: (id: string) => void;
}

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function KernelAlertFeed({ alerts, onSelectDevice }: KernelAlertFeedProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <h3 className="font-semibold text-white text-sm">Alert Feed</h3>
        </div>
        {alerts.length > 0 && (
          <Badge className="bg-amber-500/20 text-amber-400 border-0 text-xs">
            {alerts.length}
          </Badge>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="p-6 text-center text-slate-500">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No alerts</p>
          <p className="text-xs text-slate-600">Markov anomalies will appear here</p>
        </div>
      ) : (
        <ScrollArea className="h-[300px]">
          <div className="divide-y divide-slate-700/50">
            {alerts.map((alert, idx) => {
              const fromConfig = KERNEL_STATE_CONFIG[alert.from_state as KernelStateName];
              const toConfig = KERNEL_STATE_CONFIG[alert.to_state as KernelStateName];

              return (
                <button
                  key={`${alert.timestamp}-${idx}`}
                  className="w-full px-4 py-3 hover:bg-slate-700/50 transition-colors text-left"
                  onClick={() => alert.device_id && onSelectDevice(alert.device_id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-xs text-white">{alert.device_id}</span>
                    <Badge
                      className={cn(
                        "text-[10px] px-1.5 py-0 border-0",
                        alert.severity === "critical"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-amber-500/20 text-amber-400"
                      )}
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs mb-1">
                    <span className={cn("font-mono", fromConfig?.textColor || "text-slate-400")}>
                      {alert.from_state}
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-600" />
                    <span className={cn("font-mono", toConfig?.textColor || "text-slate-400")}>
                      {alert.to_state}
                    </span>
                    <span className="text-slate-600 ml-1">
                      (p={((alert.probability || 0) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {alert.time_period} &middot; {formatTime(alert.timestamp)}
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
