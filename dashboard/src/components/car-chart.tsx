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
import { CarReading } from "@/hooks/use-car-data";

const chartConfig = {
  speed_kmh: {
    label: "Speed",
    color: "hsl(var(--chart-1))",
  },
  rpm: {
    label: "RPM",
    color: "hsl(var(--chart-2))",
  },
  throttle_pos_pct: {
    label: "Throttle",
    color: "hsl(var(--chart-3))",
  },
  coolant_temp_c: {
    label: "Coolant",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

type ChartKey = keyof typeof chartConfig;

interface CarChartProps {
  history: CarReading[];
}

export function CarChart({ history }: CarChartProps) {
  const [activeChart, setActiveChart] = React.useState<ChartKey>("speed_kmh");

  const chartData = React.useMemo(() => {
    return history.map((reading) => ({
      timestamp: reading.timestamp,
      speed_kmh: reading.speed_kmh,
      rpm: reading.rpm,
      throttle_pos_pct: reading.throttle_pos_pct,
      coolant_temp_c: reading.coolant_temp_c,
    }));
  }, [history]);

  const stats = React.useMemo(() => {
    if (history.length === 0) {
      return {
        speed_kmh: { avg: 0 },
        rpm: { avg: 0 },
        throttle_pos_pct: { avg: 0 },
        coolant_temp_c: { avg: 0 },
      };
    }

    return {
      speed_kmh: {
        avg: history.reduce((a, b) => a + b.speed_kmh, 0) / history.length,
      },
      rpm: {
        avg: history.reduce((a, b) => a + b.rpm, 0) / history.length,
      },
      throttle_pos_pct: {
        avg: history.reduce((a, b) => a + b.throttle_pos_pct, 0) / history.length,
      },
      coolant_temp_c: {
        avg: history.reduce((a, b) => a + b.coolant_temp_c, 0) / history.length,
      },
    };
  }, [history]);

  const getUnit = (key: ChartKey) => {
    switch (key) {
      case "speed_kmh": return "km/h";
      case "rpm": return "";
      case "throttle_pos_pct": return "%";
      case "coolant_temp_c": return "°C";
    }
  };

  const getDomain = (key: ChartKey): [number, number] => {
    if (history.length === 0) return [0, 100];
    const values = history.map(r => r[key]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1 || 10;
    return [Math.max(0, min - padding), max + padding];
  };

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0 sm:py-4">
          <CardTitle>Vehicle Data</CardTitle>
          <CardDescription>
            Real-time OBD-II readings from CAR_OBD_01
          </CardDescription>
        </div>
        <div className="flex flex-wrap">
          {(Object.keys(chartConfig) as ChartKey[]).map((key) => (
            <button
              key={key}
              data-active={activeChart === key}
              className="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-4 py-3 text-left even:border-l sm:border-t-0 sm:border-l sm:px-6 sm:py-4"
              onClick={() => setActiveChart(key)}
            >
              <span className="text-muted-foreground text-xs">
                {chartConfig[key].label}
              </span>
              <span className="text-lg leading-none font-bold">
                {stats[key].avg.toFixed(key === "rpm" ? 0 : 1)}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {getUnit(key)}
                </span>
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        {history.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            Waiting for car OBD data...
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
                domain={getDomain(activeChart)}
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
