"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { KernelClassification } from "@/hooks/use-kernel-data";
import { ShieldCheck, Brain, Activity, TrendingUp, AlertTriangle } from "lucide-react";

interface KernelHealthPanelProps {
  classification: KernelClassification | null;
  markovMaturity: string;
  totalTransitions: number;
  groundTruth?: string | null;
  replayRunning?: boolean;
  mlpLoaded?: boolean;
}

function ProgressBar({ value, max = 1, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all", color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function KernelHealthPanel({ classification, markovMaturity, totalTransitions, groundTruth, replayRunning, mlpLoaded }: KernelHealthPanelProps) {
  const confidence = classification?.confidence ?? 0;
  const consistency = classification?.sensor_consistency ?? 0;
  const method = classification?.method ?? "none";

  const maturityLevel =
    markovMaturity === "Established" ? 1.0 :
    markovMaturity === "Mature" ? 0.75 :
    markovMaturity === "Developing" ? 0.5 : 0.25;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <h4 className="text-xs font-medium text-slate-400 mb-3">Health & Confidence</h4>

      {/* C2: MLP offline warning */}
      {mlpLoaded === false && (
        <div className="flex items-center gap-1.5 mb-3 px-2 py-1.5 rounded bg-amber-500/10 border border-amber-500/30">
          <AlertTriangle className="h-3 w-3 text-amber-400 flex-shrink-0" />
          <span className="text-[10px] text-amber-300">MLP Offline — using heuristics only</span>
        </div>
      )}

      <div className="space-y-3">
        {/* Classification Confidence */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <ShieldCheck className="h-3 w-3" />
              Confidence
            </span>
            <span className="text-xs font-mono text-white">{(confidence * 100).toFixed(0)}%</span>
          </div>
          <ProgressBar
            value={confidence}
            color={confidence > 0.8 ? "bg-green-500" : confidence > 0.6 ? "bg-amber-500" : "bg-red-500"}
          />
        </div>

        {/* Sensor Consistency */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Activity className="h-3 w-3" />
              Sensor Consistency
            </span>
            <span className="text-xs font-mono text-white">{(consistency * 100).toFixed(0)}%</span>
          </div>
          <ProgressBar
            value={consistency}
            color={consistency > 0.8 ? "bg-green-500" : consistency > 0.6 ? "bg-amber-500" : "bg-red-500"}
          />
        </div>

        {/* Markov Maturity */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Brain className="h-3 w-3" />
              Markov Maturity
            </span>
            <span className="text-xs font-mono text-white">{markovMaturity}</span>
          </div>
          <ProgressBar value={maturityLevel} color="bg-violet-500" />
          <div className="text-[10px] text-slate-600 mt-0.5">{totalTransitions} transitions</div>
        </div>

        {/* Classification Method */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <TrendingUp className="h-3 w-3" />
            Method
          </span>
          <span className={cn(
            "text-xs font-mono px-1.5 py-0.5 rounded",
            method === "rule" ? "bg-green-500/20 text-green-400" :
            method === "mlp" ? "bg-violet-500/20 text-violet-400" :
            "bg-slate-700 text-slate-400"
          )}>
            {method}
          </span>
        </div>

        {/* Consistency Penalties */}
        {classification?.consistency_penalties && classification.consistency_penalties.length > 0 && (
          <div className="pt-1 border-t border-slate-700/50">
            <span className="text-[10px] text-amber-400">
              Penalties: {classification.consistency_penalties.join(", ")}
            </span>
          </div>
        )}

        {/* Ground Truth (replay only) */}
        {replayRunning && groundTruth && (
          <div className="pt-1 border-t border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Ground Truth</span>
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                {groundTruth}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
