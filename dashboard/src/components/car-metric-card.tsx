"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CarReading } from "@/hooks/use-car-data";
import { Gauge, Activity, Fuel, Thermometer } from "lucide-react";

interface CarMetricCardProps {
  title: string;
  value: string;
  unit: string;
  icon: "speed" | "rpm" | "throttle" | "temp";
  subtitle?: string;
}

export function CarMetricCard({ title, value, unit, icon, subtitle }: CarMetricCardProps) {
  const icons = {
    speed: Gauge,
    rpm: Activity,
    throttle: Fuel,
    temp: Thermometer,
  };

  const Icon = icons[icon];

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
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface CarMetricCardsProps {
  latestReading: CarReading | null;
  history: CarReading[];
}

export function CarMetricCards({ latestReading, history }: CarMetricCardsProps) {
  // Calculate max values for context
  const maxSpeed = history.length > 0 ? Math.max(...history.map(r => r.speed_kmh)) : 0;
  const maxRpm = history.length > 0 ? Math.max(...history.map(r => r.rpm)) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <CarMetricCard
        title="Speed"
        value={latestReading ? latestReading.speed_kmh.toString() : "--"}
        unit="km/h"
        icon="speed"
        subtitle={maxSpeed > 0 ? `Max: ${maxSpeed} km/h` : undefined}
      />
      <CarMetricCard
        title="RPM"
        value={latestReading ? latestReading.rpm.toLocaleString() : "--"}
        unit=""
        icon="rpm"
        subtitle={maxRpm > 0 ? `Max: ${maxRpm.toLocaleString()}` : undefined}
      />
      <CarMetricCard
        title="Throttle"
        value={latestReading ? latestReading.throttle_pos_pct.toString() : "--"}
        unit="%"
        icon="throttle"
      />
      <CarMetricCard
        title="Coolant Temp"
        value={latestReading ? latestReading.coolant_temp_c.toString() : "--"}
        unit="°C"
        icon="temp"
        subtitle={latestReading && latestReading.coolant_temp_c > 100 ? "Warning: High!" : undefined}
      />
    </div>
  );
}
