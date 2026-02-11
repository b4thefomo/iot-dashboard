"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Square, Database, Gauge, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface KernelReplayControlsProps {
  replayRunning: boolean;
  replayRunId: number | null;
  replayFault: string | null;
  replayProgress: number;
  replayTotal: number;
  replaySpeed: number;
  onStartReplay: (runId: number, speed: number) => void;
  onStopReplay: () => void;
  onSetSpeed: (speed: number) => void;
  isConnected: boolean;
}

const SPEED_OPTIONS = [1, 10, 50, 100];

export function KernelReplayControls({
  replayRunning,
  replayRunId,
  replayFault,
  replayProgress,
  replayTotal,
  replaySpeed,
  onStartReplay,
  onStopReplay,
  onSetSpeed,
  isConnected,
}: KernelReplayControlsProps) {
  const [faults, setFaults] = React.useState<string[]>([]);
  const [selectedFault, setSelectedFault] = React.useState<string>("");
  const [runs, setRuns] = React.useState<Array<{ run_id: number; fault: string }>>([]);
  const [selectedRunId, setSelectedRunId] = React.useState<string>("");
  const [selectedSpeed, setSelectedSpeed] = React.useState<number>(50);
  const [loading, setLoading] = React.useState(false);

  // Fetch fault types on mount
  React.useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    fetch(apiUrl + "/api/kernel/replay/faults")
      .then((r) => r.json())
      .then((data) => {
        if (data.faults) setFaults(data.faults);
      })
      .catch(() => {});
  }, []);

  // Fetch runs when fault type changes
  React.useEffect(() => {
    if (!selectedFault) { setRuns([]); setSelectedRunId(""); return; }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    fetch(apiUrl + "/api/kernel/replay/runs?fault=" + encodeURIComponent(selectedFault))
      .then((r) => r.json())
      .then((data) => {
        if (data.runs) {
          setRuns(data.runs);
          // Pick a random run
          if (data.runs.length > 0) {
            const rand = data.runs[Math.floor(Math.random() * data.runs.length)];
            setSelectedRunId(String(rand.run_id));
          }
        }
      })
      .catch(() => {});
  }, [selectedFault]);

  const handleStart = () => {
    if (!selectedRunId) return;
    setLoading(true);
    onStartReplay(parseInt(selectedRunId, 10), selectedSpeed);
    setTimeout(() => setLoading(false), 1000);
  };

  const progressPct = replayTotal > 0
    ? Math.round((replayProgress / replayTotal) * 100)
    : 0;

  const elapsedMin = Math.round(replayProgress / 12); // 12 readings per minute
  const totalMin = Math.round(replayTotal / 12);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-cyan-400" />
          <h4 className="text-sm font-medium text-white">Dataset Replay</h4>
        </div>
        <Badge
          className={cn(
            "text-xs border-0",
            replayRunning ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-700 text-slate-400"
          )}
        >
          {replayRunning ? "Replaying" : "Idle"}
        </Badge>
      </div>

      {/* Fault type selector */}
      <div className="space-y-2 mb-3">
        <Select
          value={selectedFault}
          onValueChange={setSelectedFault}
          disabled={replayRunning}
        >
          <SelectTrigger className="h-8 bg-slate-900 border-slate-600 text-xs text-white">
            <SelectValue placeholder="Select fault type..." />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-600">
            {faults.map((f) => (
              <SelectItem key={f} value={f} className="text-xs text-white">
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Run ID */}
        {runs.length > 0 && (
          <Select
            value={selectedRunId}
            onValueChange={setSelectedRunId}
            disabled={replayRunning}
          >
            <SelectTrigger className="h-8 bg-slate-900 border-slate-600 text-xs text-white">
              <SelectValue placeholder="Select run..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-600 max-h-48">
              {runs.map((r) => (
                <SelectItem key={r.run_id} value={String(r.run_id)} className="text-xs text-white">
                  Run #{r.run_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Speed selector */}
      <div className="flex items-center gap-2 mb-3">
        <Gauge className="h-3 w-3 text-slate-400" />
        <span className="text-xs text-slate-400">Speed:</span>
        <div className="flex gap-1">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              className={cn(
                "px-2 py-0.5 text-xs rounded transition-colors",
                (replayRunning ? replaySpeed : selectedSpeed) === s
                  ? "bg-cyan-500/30 text-cyan-300"
                  : "bg-slate-700 text-slate-400 hover:bg-slate-600"
              )}
              onClick={() => {
                setSelectedSpeed(s);
                if (replayRunning) onSetSpeed(s);
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Start/Stop */}
      <div className="flex items-center gap-2 mb-3">
        <Button
          size="sm"
          className={cn(
            "flex-1",
            replayRunning
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              : "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
          )}
          onClick={replayRunning ? onStopReplay : handleStart}
          disabled={!isConnected || (!replayRunning && !selectedRunId) || loading}
        >
          {replayRunning ? (
            <><Square className="h-3 w-3 mr-1" /> Stop</>
          ) : (
            <><Play className="h-3 w-3 mr-1" /> Replay</>
          )}
        </Button>
      </div>

      {/* Progress bar */}
      {replayRunning && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
            <span>{elapsedMin} min</span>
            <span>{progressPct}%</span>
            <span>{totalMin} min</span>
          </div>
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Ground truth badge */}
      {replayRunning && replayFault && (
        <div className="flex items-center gap-1.5 text-xs">
          <Tag className="h-3 w-3 text-amber-400" />
          <span className="text-slate-400">GT:</span>
          <Badge className="text-xs border-0 bg-amber-500/20 text-amber-300">
            {replayFault}
          </Badge>
          {replayRunId != null && (
            <span className="text-slate-600">Run #{replayRunId}</span>
          )}
        </div>
      )}

      {!replayRunning && (
        <div className="text-[10px] text-slate-600">
          1300 runs &middot; 13 fault classes &middot; 24h each
        </div>
      )}
    </div>
  );
}
