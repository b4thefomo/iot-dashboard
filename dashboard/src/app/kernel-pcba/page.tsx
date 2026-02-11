"use client";

import * as React from "react";
import {
  usePcbaKernelData,
  KERNEL_STATE_CONFIG,
  type KernelStateName,
  type PcbaFeatures,
} from "@/hooks/use-pcba-kernel-data";
import { KernelSidebar } from "@/components/kernel-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Thermometer,
  Vibrate,
  Play,
  Square,
  Clock,
} from "lucide-react";

// ---------- StatCard ----------
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
        <Icon className={"h-3.5 w-3.5 " + color} />
        <span className="text-[10px] text-slate-500 uppercase">{label}</span>
      </div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}

// ---------- PCBA Feature Labels ----------
const PCBA_FEATURE_LABELS: Record<keyof PcbaFeatures, string> = {
  temp_mean: "Temp Mean",
  temp_delta: "Temp Delta",
  temp_rate: "Temp Rate",
  temp_volatility: "Temp Volatility",
  vib_rms: "Vib RMS",
  vib_rms_delta: "Vib RMS Delta",
  vib_dom_freq: "Dom Freq",
  vib_spectral_stability: "Spectral Stability",
  vib_spectral_entropy: "Spectral Entropy",
  vib_duty_cycle: "Duty Cycle",
  door_angle_norm: "Door Angle",
  door_open_duration: "Door Duration",
  cooling_efficiency_proxy: "Cooling Eff.",
  temp_rate_vs_vib: "Temp/Vib Ratio",
};

// ---------- Page ----------
export default function KernelPcbaPage() {
  const {
    devices,
    deviceList,
    alerts,
    selectedDevice,
    simulatorRunning,
    tick,
    isConnected,
    isOnline,
    pcbaMlpLoaded,
    featureHistory,
    stateTimeline,
    selectDevice,
    startSimulator,
    stopSimulator,
  } = usePcbaKernelData();

  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const selected = selectedDevice ? devices[selectedDevice] : null;
  const selectedFeatures = selected?.current_state?.feature_snapshot || null;
  const selectedTimeline = selectedDevice ? stateTimeline[selectedDevice] || [] : [];

  // Fleet stats
  const totalDevices = deviceList.length;
  const stableCount = deviceList.filter(
    (d) => d.current_state?.state_name === "STABLE"
  ).length;
  const warningStates = ["DOOR_OPEN", "DRIFT_WARM", "DRIFT_COLD", "DEFROST"];
  const warningCount = deviceList.filter((d) =>
    warningStates.includes(d.current_state?.state_name || "")
  ).length;
  const criticalStates = ["EXCURSION", "COMP_STRESS", "FAULT"];
  const criticalCount = deviceList.filter((d) =>
    criticalStates.includes(d.current_state?.state_name || "")
  ).length;

  const avgTemp =
    deviceList.length > 0
      ? (
          deviceList.reduce((s, d) => s + (d.temp || 0), 0) / deviceList.length
        ).toFixed(1)
      : "--";

  const avgVibRms =
    deviceList.length > 0
      ? (
          deviceList.reduce((s, d) => s + (d.vib_rms || 0), 0) /
          deviceList.length
        ).toFixed(3)
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
            <h1 className="text-lg font-bold">PCBA Kernel Intelligence</h1>
            <Badge
              className={
                isOnline
                  ? "bg-green-500/20 text-green-400 border-0"
                  : "bg-slate-700 text-slate-400 border-0"
              }
            >
              {isOnline ? "Live" : "Offline"}
            </Badge>
            <Badge
              className={
                pcbaMlpLoaded
                  ? "bg-green-500/20 text-green-400 border-0"
                  : "bg-amber-500/20 text-amber-400 border-0"
              }
            >
              {pcbaMlpLoaded ? "MLP Active" : "Rules Only"}
            </Badge>
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
                <StatCard
                  label="Devices"
                  value={totalDevices}
                  icon={Activity}
                  color="text-violet-400"
                />
                <StatCard
                  label="Stable"
                  value={stableCount}
                  icon={ShieldCheck}
                  color="text-green-400"
                />
                <StatCard
                  label="Warning"
                  value={warningCount}
                  icon={AlertTriangle}
                  color="text-amber-400"
                />
                <StatCard
                  label="Critical"
                  value={criticalCount}
                  icon={AlertTriangle}
                  color="text-red-400"
                />
                <StatCard
                  label="Avg Temp"
                  value={avgTemp + "\u00B0C"}
                  icon={Thermometer}
                  color="text-blue-400"
                />
                <StatCard
                  label="Avg Vib RMS"
                  value={avgVibRms}
                  icon={Vibrate}
                  color="text-green-400"
                />
              </div>

              {/* Device list */}
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-300">
                    PCBA Devices
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {deviceList.length === 0 && (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      No PCBA devices connected. Start the simulator below.
                    </p>
                  )}
                  {deviceList.map((device) => {
                    const stateName =
                      device.current_state?.state_name || "STABLE";
                    const config =
                      KERNEL_STATE_CONFIG[stateName as KernelStateName] ||
                      KERNEL_STATE_CONFIG.STABLE;
                    const isSelected = selectedDevice === device.device_id;

                    return (
                      <button
                        key={device.device_id}
                        onClick={() => selectDevice(device.device_id)}
                        className={
                          "w-full text-left p-3 rounded-lg border transition-colors " +
                          (isSelected
                            ? "bg-violet-500/10 border-violet-500/50"
                            : "bg-slate-800/50 border-slate-700 hover:bg-slate-800")
                        }
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-white">
                            {device.device_id}
                          </span>
                          <Badge className={config.bgColor + " " + config.textColor + " border-0 text-[10px]"}>
                            {config.label}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-slate-400 mb-1.5">
                          {device.location_name || "Unknown location"}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[10px]">
                          <div>
                            <span className="text-slate-500">Temp: </span>
                            <span className="text-white">
                              {device.temp != null
                                ? device.temp.toFixed(1) + "\u00B0C"
                                : "--"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Vib RMS: </span>
                            <span className="text-white">
                              {device.vib_rms != null
                                ? device.vib_rms.toFixed(3)
                                : "--"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Dom Freq: </span>
                            <span className="text-white">
                              {device.vib_dom_freq != null
                                ? device.vib_dom_freq.toFixed(1) + " Hz"
                                : "--"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
                          <span>
                            Confidence:{" "}
                            {device.current_state
                              ? (device.current_state.confidence * 100).toFixed(
                                  0
                                ) + "%"
                              : "--"}
                          </span>
                          <span>
                            Method: {device.current_state?.method || "--"}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] border-slate-600 text-slate-400 h-4"
                          >
                            {device.markov_maturity}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              {/* State Timeline (selected device) */}
              {selectedDevice && selectedTimeline.length > 0 && (
                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-300">
                      State Timeline - {selectedDevice}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-[1px] h-6 rounded overflow-hidden">
                      {selectedTimeline.map((entry, i) => {
                        const cfg =
                          KERNEL_STATE_CONFIG[entry.state] ||
                          KERNEL_STATE_CONFIG.STABLE;
                        return (
                          <div
                            key={i}
                            className="flex-1"
                            style={{ backgroundColor: cfg.color }}
                            title={cfg.label + " - " + entry.timestamp}
                          />
                        );
                      })}
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {Array.from(
                        new Set(selectedTimeline.map((e) => e.state))
                      ).map((state) => {
                        const cfg =
                          KERNEL_STATE_CONFIG[state] ||
                          KERNEL_STATE_CONFIG.STABLE;
                        return (
                          <div
                            key={state}
                            className="flex items-center gap-1 text-[10px] text-slate-400"
                          >
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: cfg.color }}
                            />
                            {cfg.label}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Feature snapshot (selected device) */}
              {selected && selectedFeatures && (
                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-300">
                      Feature Snapshot - {selectedDevice}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {(
                        Object.keys(PCBA_FEATURE_LABELS) as Array<
                          keyof PcbaFeatures
                        >
                      ).map((key) => (
                        <div
                          key={key}
                          className="bg-slate-800 rounded p-2 border border-slate-700"
                        >
                          <div className="text-[10px] text-slate-500 mb-0.5">
                            {PCBA_FEATURE_LABELS[key]}
                          </div>
                          <div className="text-sm font-mono text-white">
                            {typeof selectedFeatures[key] === "number"
                              ? selectedFeatures[key].toFixed(4)
                              : String(selectedFeatures[key])}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Consistency */}
                    {selected.current_state && (
                      <div className="mt-3 pt-3 border-t border-slate-700">
                        <div className="flex items-center gap-4 text-xs">
                          <div>
                            <span className="text-slate-500">
                              Sensor Consistency:{" "}
                            </span>
                            <span
                              className={
                                selected.current_state.sensor_consistency >= 0.8
                                  ? "text-green-400"
                                  : selected.current_state
                                      .sensor_consistency >= 0.5
                                  ? "text-amber-400"
                                  : "text-red-400"
                              }
                            >
                              {(
                                selected.current_state.sensor_consistency * 100
                              ).toFixed(0)}
                              %
                            </span>
                          </div>
                          {selected.current_state.consistency_penalties.length >
                            0 && (
                            <div className="flex gap-1 flex-wrap">
                              {selected.current_state.consistency_penalties.map(
                                (p, i) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="text-[9px] border-amber-500/30 text-amber-400 h-4"
                                  >
                                    {p}
                                  </Badge>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Simulator controls */}
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-300">
                    PCBA Simulator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    {!simulatorRunning ? (
                      <Button
                        size="sm"
                        onClick={startSimulator}
                        disabled={!isConnected}
                        className="bg-violet-600 hover:bg-violet-700 text-white"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={stopSimulator}
                      >
                        <Square className="h-3 w-3 mr-1" />
                        Stop
                      </Button>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      <span>Tick #{tick}</span>
                    </div>
                    <Badge
                      className={
                        simulatorRunning
                          ? "bg-green-500/20 text-green-400 border-0"
                          : "bg-slate-700 text-slate-400 border-0"
                      }
                    >
                      {simulatorRunning ? "Running" : "Stopped"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column */}
            <div className="w-[340px] flex-shrink-0 space-y-4">
              {/* Alert feed */}
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    Markov Anomaly Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {alerts.length === 0 && (
                      <p className="text-xs text-slate-500 py-4 text-center">
                        No alerts yet
                      </p>
                    )}
                    {alerts
                      .slice()
                      .reverse()
                      .slice(0, 20)
                      .map((alert, i) => {
                        const severity = alert.severity || "info";
                        const severityColor =
                          severity === "critical"
                            ? "text-red-400 bg-red-500/10 border-red-500/20"
                            : severity === "warning"
                            ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                            : "text-blue-400 bg-blue-500/10 border-blue-500/20";

                        return (
                          <button
                            key={i}
                            onClick={() => selectDevice(alert.device_id)}
                            className={
                              "w-full text-left p-2 rounded border text-xs transition-colors hover:opacity-90 " +
                              severityColor
                            }
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-medium">
                                {alert.device_id}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[9px] h-4 border-current"
                              >
                                {severity}
                              </Badge>
                            </div>
                            <p className="text-[11px] opacity-80">
                              {alert.message}
                            </p>
                            <div className="text-[9px] opacity-50 mt-0.5">
                              {alert.from_state} → {alert.to_state} (p=
                              {alert.probability?.toFixed(3)})
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>

              {/* Selected device health panel */}
              {selected && selected.current_state && (
                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-300">
                      Device Health - {selectedDevice}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">State:</span>
                      {(() => {
                        const cfg =
                          KERNEL_STATE_CONFIG[
                            selected.current_state!
                              .state_name as KernelStateName
                          ] || KERNEL_STATE_CONFIG.STABLE;
                        return (
                          <Badge
                            className={
                              cfg.bgColor +
                              " " +
                              cfg.textColor +
                              " border-0"
                            }
                          >
                            {cfg.label}
                          </Badge>
                        );
                      })()}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">Confidence</span>
                        <div className="text-white font-mono">
                          {(
                            selected.current_state!.confidence * 100
                          ).toFixed(1)}
                          %
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Method</span>
                        <div className="text-white font-mono">
                          {selected.current_state!.method}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Markov Maturity</span>
                        <div className="text-white">
                          {selected.markov_maturity}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Transitions</span>
                        <div className="text-white font-mono">
                          {selected.total_transitions}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
