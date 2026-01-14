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
import { Settings, Car, Cpu, LayoutGrid } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CommandSidebarProps {
  weatherOnline: boolean;
  carOnline: boolean;
  isConnected: boolean;
}

const navItems = [
  {
    title: "Command Center",
    url: "/command-center",
    icon: LayoutGrid,
    isActive: true,
  },
  {
    title: "Weather Dashboard",
    url: "/",
    icon: Cpu,
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

export function CommandSidebar({ weatherOnline, carOnline, isConnected }: CommandSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-4">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-6 w-6" />
          <span className="font-semibold">Command Center</span>
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
          <SidebarGroupLabel>System Status</SidebarGroupLabel>
          <SidebarGroupContent className="px-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Weather Station</span>
              <Badge variant={weatherOnline ? "default" : "secondary"} className={weatherOnline ? "bg-green-500" : ""}>
                {weatherOnline ? "Online" : "Offline"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Car Telemetry</span>
              <Badge variant={carOnline ? "default" : "secondary"} className={carOnline ? "bg-green-500" : ""}>
                {carOnline ? "Online" : "Offline"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Server</span>
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <p className="text-xs text-muted-foreground">
          IoT Command Center v1.0
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
