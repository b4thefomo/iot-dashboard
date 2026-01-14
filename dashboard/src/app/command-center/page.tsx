"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { CommandSidebar } from "@/components/command-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnifiedChat } from "@/components/unified-chat";
import { useUnifiedData } from "@/hooks/use-unified-data";
import { Separator } from "@/components/ui/separator";
import { Thermometer, Gauge, Car, Activity } from "lucide-react";

function MiniMetric({
  icon: Icon,
  label,
  value,
  unit,
  online
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  online: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <Icon className={`h-8 w-8 ${online ? "text-primary" : "text-muted-foreground"}`} />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">
          {value}
          <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
        </p>
      </div>
    </div>
  );
}

export default function CommandCenter() {
  const { weather, car, isConnected } = useUnifiedData();

  return (
    <SidebarProvider>
      <CommandSidebar
        weatherOnline={weather.isOnline}
        carOnline={car.isOnline}
        isConnected={isConnected}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="font-semibold">Command Center - All Systems</h1>
        </header>
        <main className="flex-1 p-6 space-y-6">
          {/* Two-column layout for sensor panels */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Weather Station Panel */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Thermometer className="h-4 w-4" />
                  Weather Station
                  <span className={`ml-auto text-xs px-2 py-1 rounded ${weather.isOnline ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {weather.isOnline ? "Online" : "Offline"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <MiniMetric
                  icon={Thermometer}
                  label="Temperature"
                  value={weather.latestReading?.temperature?.toFixed(1) ?? "--"}
                  unit="°C"
                  online={weather.isOnline}
                />
                <MiniMetric
                  icon={Gauge}
                  label="Pressure"
                  value={weather.latestReading?.pressure?.toFixed(0) ?? "--"}
                  unit="hPa"
                  online={weather.isOnline}
                />
              </CardContent>
            </Card>

            {/* Car Telemetry Panel */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Car Telemetry
                  <span className={`ml-auto text-xs px-2 py-1 rounded ${car.isOnline ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {car.isOnline ? "Online" : "Offline"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <MiniMetric
                  icon={Gauge}
                  label="Speed"
                  value={car.latestReading?.speed_kmh?.toFixed(0) ?? "--"}
                  unit="km/h"
                  online={car.isOnline}
                />
                <MiniMetric
                  icon={Activity}
                  label="RPM"
                  value={car.latestReading?.rpm?.toLocaleString() ?? "--"}
                  unit=""
                  online={car.isOnline}
                />
              </CardContent>
            </Card>
          </div>

          {/* Unified Chat */}
          <UnifiedChat />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
