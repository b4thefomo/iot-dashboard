"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Settings, Cpu, Car, LayoutGrid } from "lucide-react";
import { ConnectionStatus } from "./connection-status";

interface AppSidebarProps {
  isOnline: boolean;
  isConnected: boolean;
  sensorId?: string;
}

const navItems = [
  {
    title: "Command Center",
    url: "/command-center",
    icon: LayoutGrid,
  },
  {
    title: "Weather Dashboard",
    url: "/",
    icon: Cpu,
    isActive: true,
  },
  {
    title: "Car Dashboard",
    url: "/car",
    icon: Car,
  },
  {
    title: "Settings",
    url: "#settings",
    icon: Settings,
  },
];

export function AppSidebar({ isOnline, isConnected, sensorId }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-4">
        <div className="flex items-center gap-2">
          <Cpu className="h-6 w-6" />
          <span className="font-semibold">IoT Dashboard</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={item.isActive}>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Device Status</SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <ConnectionStatus
              isOnline={isOnline}
              isConnected={isConnected}
              sensorId={sensorId}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <p className="text-xs text-muted-foreground">
          ESP32 Sensor Monitor v1.0
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
