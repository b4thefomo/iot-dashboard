"use client";

import * as React from "react";
import { useKernelData } from "@/hooks/use-kernel-data";
import { KernelSidebar } from "@/components/kernel-sidebar";
import { KernelDeviceList } from "@/components/kernel-device-list";
import { KernelStateTimeline } from "@/components/kernel-state-timeline";
import { KernelFeatureDashboard } from "@/components/kernel-feature-dashboard";
import { KernelMarkovHeatmap } from "@/components/kernel-markov-heatmap";
import { KernelAlertFeed } from "@/components/kernel-alert-feed";
import { KernelHealthPanel } from "@/components/kernel-health-panel";
import { KernelSimulatorControls } from "@/components/kernel-simulator-controls";
import { KernelReplayControls } from "@/components/kernel-replay-controls";
import { KernelExplainerModal } from "@/components/kernel-explainer-modal";
import { Badge } from "@/components/ui/badge";
import {
  Thermometer,
  Zap,
  Activity,
  Brain,
  ShieldCheck,
  AlertTriangle,
  Info,
} from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        <span className="text-[10px] text-slate-500 uppercase">{label}</span>
      </div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}

export default function KernelPage() {
  const {
    devices,
    deviceList,
    alerts,
    selectedDevice,
    simulatorRunning,
    tick,
    isConnected,
    isOnline,
    featureHistory,
    stateTimeline,
    selectDevice,
    startSimulator,
    stopSimulator,
    replayRunning,
    replayRunId,
    replayFault,
    replayProgress,
    replayTotal,
    replaySpeed,
    groundTruth,
    startReplay,
    stopReplay,
    setReplaySpeed,
    mlpLoaded,
  } = useKernelData();

  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [explainerOpen, setExplainerOpen] = React.useState(false);

  const selected = selectedDevice ? devices[selectedDevice] : null;
  const selectedFeatures = selected?.current_state?.feature_snapshot || null;
  const selectedFeatHistory = selectedDevice ? featureHistory[selectedDevice] || [] : [];
  const selectedTimeline = selectedDevice ? stateTimeline[selectedDevice] || [] : [];

  // Fleet stats
  const totalDevices = deviceList.length;
  const stableCount = deviceList.filter((d) => d.current_state?.state_name === "STABLE").length;
  const warningStates = ["DOOR_OPEN", "DRIFT_WARM", "DRIFT_COLD", "RECOVERING", "DEFROST"];
  const warningCount = deviceList.filter((d) => warningStates.includes(d.current_state?.state_name || "")).length;
  const criticalStates = ["EXCURSION", "COMP_STRESS", "FAULT"];
  const criticalCount = deviceList.filter((d) => criticalStates.includes(d.current_state?.state_name || "")).length;

  const avgTemp = deviceList.length > 0
    ? (deviceList.reduce((s, d) => s + (d.current_reading?.temp_cabinet || 0), 0) / deviceList.length).toFixed(1)
    : "--";
  const avgPower = deviceList.length > 0
    ? Math.round(deviceList.reduce((s, d) => s + (d.current_reading?.compressor_power_w || 0), 0) / deviceList.length)
    : "--";

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      <KernelSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-violet-400" />
            <h1 className="text-lg font-bold">Kernel Signal Intelligence</h1>
            <Badge
              className={isOnline ? "bg-green-500/20 text-green-400 border-0" : "bg-slate-700 text-slate-400 border-0"}
            >
              {isOnline ? "Live" : "Offline"}
            </Badge>
            <button
              onClick={() => setExplainerOpen(true)}
              className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="How it works"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {alerts.length > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                {alerts.length} alerts
              </span>
            )}
            <span>Tick #{tick}</span>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex gap-4">
            {/* Left column */}
            <div className="flex-1 space-y-4 min-w-0">
              {/* Stats row */}
              <div className="grid grid-cols-6 gap-2">
                <StatCard label="Devices" value={totalDevices} icon={Activity} color="text-violet-400" />
                <StatCard label="Stable" value={stableCount} icon={ShieldCheck} color="text-green-400" />
                <StatCard label="Warning" value={warningCount} icon={AlertTriangle} color="text-amber-400" />
                <StatCard label="Critical" value={criticalCount} icon={AlertTriangle} color="text-red-400" />
                <StatCard label="Avg Temp" value={`${avgTemp}°C`} icon={Thermometer} color="text-blue-400" />
                <StatCard label="Avg Power" value={`${avgPower}W`} icon={Zap} color="text-green-400" />
              </div>

              {/* Device list */}
              <KernelDeviceList
                devices={deviceList}
                selectedDevice={selectedDevice}
                onSelectDevice={selectDevice}
                groundTruth={groundTruth}
                replayRunning={replayRunning}
              />

              {/* State timeline (selected device) */}
              <KernelStateTimeline timeline={selectedTimeline} />

              {/* Feature dashboard (selected device) */}
              <KernelFeatureDashboard
                features={selectedFeatures}
                history={selectedFeatHistory}
              />

              {/* Simulator controls */}
              <KernelSimulatorControls
                running={simulatorRunning}
                tick={tick}
                onStart={startSimulator}
                onStop={stopSimulator}
                isConnected={isConnected}
              />

              <KernelReplayControls
                replayRunning={replayRunning}
                replayRunId={replayRunId}
                replayFault={replayFault}
                replayProgress={replayProgress}
                replayTotal={replayTotal}
                replaySpeed={replaySpeed}
                onStartReplay={startReplay}
                onStopReplay={stopReplay}
                onSetSpeed={setReplaySpeed}
                isConnected={isConnected}
              />
            </div>

            {/* Right column */}
            <div className="w-[340px] flex-shrink-0 space-y-4">
              {/* Alert feed */}
              <KernelAlertFeed alerts={alerts} onSelectDevice={selectDevice} />

              {/* Health panel */}
              <KernelHealthPanel
                classification={selected?.current_state || null}
                markovMaturity={selected?.markov_maturity || "Learning"}
                totalTransitions={selected?.total_transitions || 0}
                groundTruth={selectedDevice ? groundTruth[selectedDevice] || null : null}
                replayRunning={replayRunning}
                mlpLoaded={mlpLoaded}
              />

              {/* Markov heatmap */}
              <KernelMarkovHeatmap deviceId={selectedDevice} />
            </div>
          </div>
        </div>
      </div>

      <KernelExplainerModal open={explainerOpen} onOpenChange={setExplainerOpen} />
    </div>
  );
}
