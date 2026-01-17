"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Bell, Search, Wifi, WifiOff, Activity, Home, LayoutGrid } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ElementType;
}

interface FleetHeaderProps {
  title: string;
  isConnected: boolean;
  isOnline: boolean;
  alertCount?: number;
  breadcrumbs?: BreadcrumbItem[];
  pageIcon?: React.ElementType;
  onSearchClick?: () => void;
}

export function FleetHeader({
  title,
  isConnected,
  isOnline,
  alertCount = 0,
  breadcrumbs = [
    { label: "Home", href: "/", icon: Home },
    { label: "Dashboard", href: "/freezer" },
  ],
  pageIcon: PageIcon = LayoutGrid,
  onSearchClick,
}: FleetHeaderProps) {
  return (
    <header className="border-b bg-white flex-shrink-0">
      {/* Breadcrumb Row */}
      <div className="h-12 flex items-center px-6 border-b">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={item.label}>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={item.href || "#"} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700">
                      {item.icon && <item.icon className="h-4 w-4" />}
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-slate-400" />
              </React.Fragment>
            ))}
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-1.5 bg-cyan-50 text-cyan-700 px-3 py-1.5 rounded-md font-medium">
                <PageIcon className="h-4 w-4" />
                {title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Main Header Row */}
      <div className="h-14 flex items-center justify-between px-6">
        {/* Page Title */}
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>

        {/* Center - Search */}
        <div className="flex-1 max-w-md mx-8">
          <button
            onClick={onSearchClick}
            className="w-full flex items-center gap-3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-left hover:bg-slate-100 hover:border-slate-300 transition-colors"
          >
            <Search className="h-4 w-4 text-slate-400" />
            <span className="flex-1 text-sm text-slate-500">Search units...</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs text-slate-400 bg-white border border-slate-200 rounded">
              \
            </kbd>
          </button>
        </div>

        {/* Right Side - Notifications & Status */}
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-slate-600" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-rose-500 text-white text-xs font-medium flex items-center justify-center">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            )}
          </Button>

          {/* Status Badges */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="outline" className="bg-teal-50 text-teal-600 border-teal-200 gap-1.5">
                <Wifi className="h-3 w-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 gap-1.5">
                <WifiOff className="h-3 w-3" />
                Disconnected
              </Badge>
            )}
            {isOnline ? (
              <Badge variant="outline" className="bg-teal-50 text-teal-600 border-teal-200 gap-1.5">
                <Activity className="h-3 w-3" />
                Live Data
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200 gap-1.5">
                <Activity className="h-3 w-3" />
                Stale
              </Badge>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
