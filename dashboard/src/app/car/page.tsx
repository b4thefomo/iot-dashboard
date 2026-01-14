"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { CarSidebar } from "@/components/car-sidebar";
import { CarMetricCards } from "@/components/car-metric-card";
import { CarChart } from "@/components/car-chart";
import { CarChatInterface } from "@/components/car-chat-interface";
import { useCarData } from "@/hooks/use-car-data";
import { Separator } from "@/components/ui/separator";

export default function CarDashboard() {
  const { history, latestReading, isConnected, isOnline } = useCarData();

  return (
    <SidebarProvider>
      <CarSidebar
        isOnline={isOnline}
        isConnected={isConnected}
        sensorId={latestReading?.sensor_id}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="font-semibold">Car OBD Dashboard</h1>
        </header>
        <main className="flex-1 p-6 space-y-6">
          <CarMetricCards latestReading={latestReading} history={history} />
          <CarChart history={history} />
          <div id="chat">
            <CarChatInterface />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
