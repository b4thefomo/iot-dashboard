"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { SensorReading } from "@/hooks/use-sensor-data";

const chartConfig = {
  temperature: {
    label: "Temperature",
    color: "hsl(var(--chart-1))",
  },
  pressure: {
    label: "Pressure",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

interface SensorChartProps {
  history: SensorReading[];
}

export function SensorChart({ history }: SensorChartProps) {
  const [activeChart, setActiveChart] = React.useState<"temperature" | "pressure">("temperature");

  const chartData = React.useMemo(() => {
    return history.map((reading) => ({
      timestamp: reading.timestamp,
      temperature: reading.temperature,
      pressure: reading.pressure,
    }));
  }, [history]);

  const stats = React.useMemo(() => {
    if (history.length === 0) {
      return { temperature: { avg: 0, min: 0, max: 0 }, pressure: { avg: 0, min: 0, max: 0 } };
    }

    const temps = history.map((r) => r.temperature);
    const pressures = history.map((r) => r.pressure);

    return {
      temperature: {
        avg: temps.reduce((a, b) => a + b, 0) / temps.length,
        min: Math.min(...temps),
        max: Math.max(...temps),
      },
      pressure: {
        avg: pressures.reduce((a, b) => a + b, 0) / pressures.length,
        min: Math.min(...pressures),
        max: Math.max(...pressures),
      },
    };
  }, [history]);

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0 sm:py-4">
          <CardTitle>Sensor Data</CardTitle>
          <CardDescription>
            Real-time readings from ESP32_001
          </CardDescription>
        </div>
        <div className="flex">
          {(["temperature", "pressure"] as const).map((key) => (
            <button
              key={key}
              data-active={activeChart === key}
              className="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
              onClick={() => setActiveChart(key)}
            >
              <span className="text-muted-foreground text-xs">
                {chartConfig[key].label}
              </span>
              <span className="text-lg leading-none font-bold sm:text-3xl">
                {stats[key].avg.toFixed(1)}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {key === "temperature" ? "°C" : "hPa"}
                </span>
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        {history.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            Waiting for sensor data...
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={
                  activeChart === "temperature"
                    ? [stats.temperature.min - 2, stats.temperature.max + 2]
                    : [stats.pressure.min - 5, stats.pressure.max + 5]
                }
                tickFormatter={(value) => value.toFixed(0)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[180px]"
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      });
                    }}
                  />
                }
              />
              <Line
                dataKey={activeChart}
                type="monotone"
                stroke={`var(--color-${activeChart})`}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
