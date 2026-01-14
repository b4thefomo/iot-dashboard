"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SensorReading } from "@/hooks/use-sensor-data";
import { ArrowUp, ArrowDown, Minus, Thermometer, Gauge } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  unit: string;
  icon: "temperature" | "pressure";
  trend?: "up" | "down" | "stable";
}

export function MetricCard({ title, value, unit, icon, trend }: MetricCardProps) {
  const Icon = icon === "temperature" ? Thermometer : Gauge;

  const TrendIcon = trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : Minus;
  const trendColor = trend === "up" ? "text-red-500" : trend === "down" ? "text-blue-500" : "text-muted-foreground";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          <span className="text-lg font-normal text-muted-foreground ml-1">{unit}</span>
        </div>
        {trend && (
          <div className={`flex items-center text-xs ${trendColor} mt-1`}>
            <TrendIcon className="h-3 w-3 mr-1" />
            <span>{trend === "stable" ? "Stable" : trend === "up" ? "Rising" : "Falling"}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MetricCardsProps {
  latestReading: SensorReading | null;
  history: SensorReading[];
}

export function MetricCards({ latestReading, history }: MetricCardsProps) {
  const calculateTrend = (current: number, previous: number | undefined, threshold: number): "up" | "down" | "stable" => {
    if (!previous) return "stable";
    const diff = current - previous;
    if (diff > threshold) return "up";
    if (diff < -threshold) return "down";
    return "stable";
  };

  const previousReading = history.length > 1 ? history[history.length - 2] : undefined;

  const hasValidData = latestReading && latestReading.temperature !== undefined && latestReading.pressure !== undefined;

  const tempTrend = hasValidData && previousReading?.temperature !== undefined
    ? calculateTrend(latestReading.temperature, previousReading.temperature, 0.5)
    : "stable";

  const pressureTrend = hasValidData && previousReading?.pressure !== undefined
    ? calculateTrend(latestReading.pressure, previousReading.pressure, 1)
    : "stable";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <MetricCard
        title="Temperature"
        value={hasValidData ? latestReading.temperature.toFixed(1) : "--"}
        unit="°C"
        icon="temperature"
        trend={tempTrend}
      />
      <MetricCard
        title="Pressure"
        value={hasValidData ? latestReading.pressure.toFixed(1) : "--"}
        unit="hPa"
        icon="pressure"
        trend={pressureTrend}
      />
    </div>
  );
}
