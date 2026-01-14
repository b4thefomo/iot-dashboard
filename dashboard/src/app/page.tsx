"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { MetricCards } from "@/components/metric-card";
import { SensorChart } from "@/components/sensor-chart";
import { ChatInterface } from "@/components/chat-interface";
import { useSensorData } from "@/hooks/use-sensor-data";
import { Separator } from "@/components/ui/separator";

export default function Dashboard() {
  const { history, latestReading, isConnected, isOnline } = useSensorData();

  return (
    <SidebarProvider>
      <AppSidebar
        isOnline={isOnline}
        isConnected={isConnected}
        sensorId={latestReading?.sensor_id}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="font-semibold">ESP32 Sensor Dashboard</h1>
        </header>
        <main className="flex-1 p-6 space-y-6">
          <MetricCards latestReading={latestReading} history={history} />
          <SensorChart history={history} />
          <div id="chat">
            <ChatInterface />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
