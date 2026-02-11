"use client";

import * as React from "react";
import { KERNEL_STATE_CONFIG, KernelStateName } from "@/hooks/use-kernel-data";

interface KernelStateTimelineProps {
  timeline: Array<{ state: KernelStateName; timestamp: string }>;
}

export function KernelStateTimeline({ timeline }: KernelStateTimelineProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || timeline.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Draw segmented bar
    const segmentWidth = w / timeline.length;

    timeline.forEach((entry, i) => {
      const config = KERNEL_STATE_CONFIG[entry.state];
      ctx.fillStyle = config?.color || "#64748b";
      ctx.fillRect(i * segmentWidth, 4, segmentWidth + 0.5, h - 8);
    });

    // Draw tick marks every 10 entries
    ctx.fillStyle = "#334155";
    for (let i = 0; i < timeline.length; i += 10) {
      ctx.fillRect(i * segmentWidth, 0, 1, h);
    }
  }, [timeline]);

  if (timeline.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h4 className="text-xs font-medium text-slate-400 mb-2">State Timeline</h4>
        <div className="text-xs text-slate-500 text-center py-2">No data yet</div>
      </div>
    );
  }

  // State legend
  const uniqueStates = Array.from(new Set(timeline.map((t) => t.state)));

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <h4 className="text-xs font-medium text-slate-400 mb-2">State Timeline ({timeline.length} samples)</h4>
      <canvas
        ref={canvasRef}
        className="w-full h-8 rounded"
        style={{ imageRendering: "pixelated" }}
      />
      <div className="flex flex-wrap gap-2 mt-2">
        {uniqueStates.map((state) => {
          const config = KERNEL_STATE_CONFIG[state];
          return (
            <div key={state} className="flex items-center gap-1 text-xs">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: config?.color || "#64748b" }}
              />
              <span className="text-slate-400">{config?.label || state}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
