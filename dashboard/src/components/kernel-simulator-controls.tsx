"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Cpu, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface KernelSimulatorControlsProps {
  running: boolean;
  tick: number;
  onStart: () => void;
  onStop: () => void;
  isConnected: boolean;
}

export function KernelSimulatorControls({
  running,
  tick,
  onStart,
  onStop,
  isConnected,
}: KernelSimulatorControlsProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-violet-400" />
          <h4 className="text-sm font-medium text-white">Simulator</h4>
        </div>
        <Badge
          className={cn(
            "text-xs border-0",
            running ? "bg-green-500/20 text-green-400" : "bg-slate-700 text-slate-400"
          )}
        >
          {running ? "Running" : "Stopped"}
        </Badge>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Button
          size="sm"
          className={cn(
            "flex-1",
            running
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              : "bg-violet-500/20 text-violet-400 hover:bg-violet-500/30"
          )}
          onClick={running ? onStop : onStart}
          disabled={!isConnected}
        >
          {running ? (
            <>
              <Square className="h-3 w-3 mr-1" /> Stop
            </>
          ) : (
            <>
              <Play className="h-3 w-3 mr-1" /> Start
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Tick: {tick}
        </span>
        <span className="flex items-center gap-1">
          <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-400" : "bg-red-400")} />
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>

      <div className="mt-2 text-[10px] text-slate-600">
        3 devices &middot; 5s interval &middot; 10x Markov acceleration
      </div>
    </div>
  );
}
