"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { FreezerReading } from "@/hooks/use-fleet-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Thermometer,
  Zap,
  Snowflake,
  MapPin,
  Clock,
  AlertTriangle,
  DoorOpen,
} from "lucide-react";

interface FreezerDetailModalProps {
  device: FreezerReading | null;
  isOpen: boolean;
  onClose: () => void;
  getDeviceStatus: (device: FreezerReading) => "healthy" | "warning" | "critical";
}

interface HistoryPoint {
  timestamp: string;
  time: string;
  temp_cabinet: number;
  compressor_power_w: number;
  frost_level: number;
  door_open: boolean;
}

export function FreezerDetailModal({
  device,
  isOpen,
  onClose,
  getDeviceStatus,
}: FreezerDetailModalProps) {
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch history when device changes
  useEffect(() => {
    if (!device || !isOpen) return;

    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const response = await fetch(
          `${apiUrl}/api/freezer/${device.device_id}/history`
        );
        if (response.ok) {
          const data = await response.json();
          // Format history for charts
          const formattedHistory = data.history.map((point: FreezerReading) => ({
            ...point,
            time: new Date(point.timestamp).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }));
          setHistory(formattedHistory);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [device, isOpen]);

  if (!device) return null;

  const status = getDeviceStatus(device);
  const statusColors = {
    healthy: "bg-emerald-100 text-emerald-700 border-emerald-300",
    warning: "bg-amber-100 text-amber-700 border-amber-300",
    critical: "bg-red-100 text-red-700 border-red-300",
  };

  // Find anomalies in history
  const anomalies = history.filter(
    (point) => point.temp_cabinet > -10 || point.door_open || point.frost_level > 0.5
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Snowflake className="h-5 w-5 text-blue-600" />
            {device.device_id}
            <Badge variant="outline" className={statusColors[status]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Current Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <MapPin className="h-3 w-3" />
                Location
              </div>
              <div className="font-semibold">{device.location_name}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Thermometer className="h-3 w-3" />
                Temperature
              </div>
              <div
                className={`font-semibold text-lg ${
                  device.temp_cabinet > -10
                    ? "text-red-600"
                    : device.temp_cabinet > -15
                    ? "text-amber-600"
                    : "text-slate-900"
                }`}
              >
                {device.temp_cabinet.toFixed(1)}°C
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Zap className="h-3 w-3" />
                Power Draw
              </div>
              <div className="font-semibold text-lg">
                {device.compressor_power_w.toFixed(0)}W
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Snowflake className="h-3 w-3" />
                Frost Level
              </div>
              <div className="font-semibold text-lg">
                {(device.frost_level * 100).toFixed(0)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Alerts */}
        {(device.door_open || device.frost_level > 0.5 || device.fault !== "NORMAL") && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 ">
            <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
              <AlertTriangle className="h-4 w-4" />
              Active Issues
            </div>
            <div className="space-y-1 text-sm text-amber-600">
              {device.door_open && (
                <div className="flex items-center gap-2">
                  <DoorOpen className="h-4 w-4" />
                  Door is currently open
                </div>
              )}
              {device.frost_level > 0.5 && (
                <div className="flex items-center gap-2">
                  <Snowflake className="h-4 w-4" />
                  High frost buildup ({(device.frost_level * 100).toFixed(0)}%) - defrost recommended
                </div>
              )}
              {device.fault !== "NORMAL" && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Fault detected: {device.fault}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Temperature History Chart */}
        <div className="mt-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Temperature History
          </h3>
          {isLoading ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Loading history...
            </div>
          ) : history.length > 0 ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 11 }}
                    stroke="#94a3b8"
                  />
                  <YAxis
                    domain={[-25, 0]}
                    tick={{ fontSize: 11 }}
                    stroke="#94a3b8"
                    tickFormatter={(value) => `${value}°C`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(1)}°C`, "Temperature"]}
                    labelStyle={{ color: "#334155" }}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <ReferenceLine
                    y={-10}
                    stroke="#ef4444"
                    strokeDasharray="5 5"
                    label={{ value: "Critical", fill: "#ef4444", fontSize: 10 }}
                  />
                  <ReferenceLine
                    y={-15}
                    stroke="#f59e0b"
                    strokeDasharray="5 5"
                    label={{ value: "Warning", fill: "#f59e0b", fontSize: 10 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="temp_cabinet"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#3b82f6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No history available yet
            </div>
          )}
        </div>

        {/* Power History Chart */}
        <div className="mt-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Power Consumption History
          </h3>
          {history.length > 0 ? (
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 11 }}
                    stroke="#94a3b8"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="#94a3b8"
                    tickFormatter={(value) => `${value}W`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(0)}W`, "Power"]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="compressor_power_w"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#10b981" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </div>

        {/* Anomaly Timeline */}
        {anomalies.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Recent Anomalies ({anomalies.length})
            </h3>
            <div className="space-y-2 max-h-[150px] overflow-y-auto">
              {anomalies.slice(-10).reverse().map((point, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-slate-50 text-sm"
                >
                  <span className="text-slate-600">{point.time}</span>
                  <div className="flex items-center gap-3">
                    {point.temp_cabinet > -10 && (
                      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                        Temp: {point.temp_cabinet.toFixed(1)}°C
                      </Badge>
                    )}
                    {point.door_open && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                        Door Open
                      </Badge>
                    )}
                    {point.frost_level > 0.5 && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                        Frost: {(point.frost_level * 100).toFixed(0)}%
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="mt-4 text-xs text-muted-foreground text-right">
          Last updated: {new Date(device.timestamp).toLocaleString()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
