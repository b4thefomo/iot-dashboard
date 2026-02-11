"use client";

import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { KERNEL_STATES, KERNEL_STATE_CONFIG, KernelStateName } from "@/hooks/use-kernel-data";
import { API_URL } from "@/lib/socket";

interface MarkovData {
  aggregated_probabilities: number[][];
  total_transitions: number;
  maturity: string;
  state_history: Array<{ from_name: string; to_name: string; timestamp: string }>;
}

interface KernelMarkovHeatmapProps {
  deviceId: string | null;
}

function interpolateBlue(value: number): string {
  // 0 = transparent, 1 = full blue
  if (value === 0) return "rgba(30, 41, 59, 0.5)";
  const intensity = Math.min(1, value);
  const r = Math.round(30 + (59 - 30) * (1 - intensity));
  const g = Math.round(41 + (130 - 41) * intensity);
  const b = Math.round(59 + (246 - 59) * intensity);
  return `rgb(${r}, ${g}, ${b})`;
}

export function KernelMarkovHeatmap({ deviceId }: KernelMarkovHeatmapProps) {
  const [data, setData] = React.useState<MarkovData | null>(null);
  const [recentTransitions, setRecentTransitions] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (!deviceId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/kernel/device/${deviceId}/markov`);
        if (res.ok) {
          const json = await res.json();
          setData(json);

          // Mark recent transitions (last 5)
          const recent = new Set<string>();
          (json.state_history || []).slice(-5).forEach((t: { from_name: string; to_name: string }) => {
            const fromIdx = KERNEL_STATES.indexOf(t.from_name as KernelStateName);
            const toIdx = KERNEL_STATES.indexOf(t.to_name as KernelStateName);
            if (fromIdx >= 0 && toIdx >= 0) recent.add(`${fromIdx}-${toIdx}`);
          });
          setRecentTransitions(recent);
        }
      } catch {
        // Silently fail
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [deviceId]);

  if (!deviceId) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h4 className="text-xs font-medium text-slate-400 mb-2">Markov Transition Heatmap</h4>
        <div className="text-xs text-slate-500 text-center py-4">Select a device</div>
      </div>
    );
  }

  const matrix = data?.aggregated_probabilities || Array(9).fill(null).map(() => Array(9).fill(0));
  const shortLabels = KERNEL_STATES.map((s) => KERNEL_STATE_CONFIG[s as KernelStateName]?.label?.slice(0, 5) || s.slice(0, 5));

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-medium text-slate-400">Markov Transition Heatmap</h4>
        {data && (
          <span className="text-[10px] text-slate-500">
            {data.maturity} ({data.total_transitions} transitions)
          </span>
        )}
      </div>

      <TooltipProvider>
        <div className="overflow-x-auto">
          <div className="grid" style={{ gridTemplateColumns: `40px repeat(9, 1fr)`, gap: "1px" }}>
            {/* Header row */}
            <div />
            {shortLabels.map((label, i) => (
              <div key={`h-${i}`} className="text-[8px] text-slate-500 text-center truncate px-0.5">
                {label}
              </div>
            ))}

            {/* Data rows */}
            {matrix.map((row, i) => (
              <React.Fragment key={`r-${i}`}>
                <div className="text-[8px] text-slate-500 text-right pr-1 flex items-center justify-end">
                  {shortLabels[i]}
                </div>
                {row.map((value: number, j: number) => {
                  const isRecent = recentTransitions.has(`${i}-${j}`);
                  return (
                    <Tooltip key={`c-${i}-${j}`}>
                      <TooltipTrigger asChild>
                        <div
                          className={`w-full aspect-square rounded-sm cursor-pointer transition-all ${
                            isRecent ? "ring-2 ring-amber-400 animate-pulse" : ""
                          }`}
                          style={{ backgroundColor: interpolateBlue(value), minWidth: "16px" }}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p>
                          {KERNEL_STATES[i]} → {KERNEL_STATES[j]}
                        </p>
                        <p className="font-mono">{(value * 100).toFixed(1)}%</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
