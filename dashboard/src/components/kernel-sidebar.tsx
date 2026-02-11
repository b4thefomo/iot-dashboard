"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Brain,
  AlertTriangle,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  Car,
  Cpu,
  LayoutGrid,
  Heart,
  Snowflake,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FluxLogo } from "@/components/flux-logo";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const switchDashboards: NavItem[] = [
  { title: "Command Center", href: "/command-center", icon: LayoutGrid },
  { title: "Weather", href: "/", icon: Cpu },
  { title: "Car", href: "/car", icon: Car },
  { title: "Home Freezers", href: "/home-freezer", icon: Home },
  { title: "Body Tracker", href: "/body-tracker", icon: Heart },
  { title: "Fleet Monitor", href: "/freezer", icon: Snowflake },
];

const navItems: NavItem[] = [
  { title: "Signal Intelligence", href: "/kernel", icon: LayoutDashboard },
  { title: "PCBA Devices", href: "/kernel-pcba", icon: Cpu },
  { title: "Markov Engine", href: "/kernel", icon: Brain },
  { title: "Alerts", href: "/kernel", icon: AlertTriangle },
  { title: "Analytics", href: "/kernel", icon: BarChart3 },
  { title: "Settings", href: "/kernel", icon: Settings },
];

interface KernelSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function KernelSidebar({ collapsed = false, onToggleCollapse }: KernelSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col flex-shrink-0 bg-slate-900 text-white transition-all duration-300",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <FluxLogo size="md" />
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-white text-lg leading-tight">Kernel</h1>
              <p className="text-xs text-slate-400">Signal Intelligence</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-2 border-b border-slate-700">
        {!collapsed && (
          <p className="px-3 py-1 text-xs font-medium text-slate-500 uppercase">Switch Dashboard</p>
        )}
        <div className="flex flex-wrap gap-1">
          {switchDashboards.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors rounded",
                  collapsed && "justify-center px-2"
                )}
                title={item.title}
              >
                <Icon className="h-3.5 w-3.5" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-violet-500/20 text-violet-400 border-l-2 border-violet-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white border-l-2 border-transparent"
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="flex-1">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-slate-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className={cn(
            "w-full text-slate-400 hover:text-white hover:bg-slate-800",
            collapsed && "px-2"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
