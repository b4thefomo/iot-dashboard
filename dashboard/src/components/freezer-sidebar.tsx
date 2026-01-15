"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  FileBarChart,
  AlertOctagon,
  Wrench,
  Calendar,
  Users,
  Bell,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Snowflake,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  {
    title: "Asset Overview",
    href: "/freezer",
    icon: LayoutDashboard,
  },
  {
    title: "Action Points",
    href: "/freezer/actions",
    icon: ClipboardList,
    badge: 3,
  },
  {
    title: "Reporting Suite",
    href: "/freezer/reports",
    icon: FileBarChart,
  },
  {
    title: "Escalations",
    href: "/freezer/escalations",
    icon: AlertOctagon,
    badge: 2,
  },
  {
    title: "Maintenance",
    href: "/freezer/maintenance",
    icon: Wrench,
  },
  {
    title: "Schedules",
    href: "/freezer/schedules",
    icon: Calendar,
  },
  {
    title: "Team",
    href: "/freezer/team",
    icon: Users,
  },
  {
    title: "Notifications",
    href: "/freezer/notifications",
    icon: Bell,
  },
  {
    title: "Documentation",
    href: "/freezer/docs",
    icon: BookOpen,
  },
  {
    title: "Settings",
    href: "/freezer/settings",
    icon: Settings,
  },
];

interface FreezerSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function FreezerSidebar({ collapsed = false, onToggleCollapse }: FreezerSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col flex-shrink-0 bg-slate-900 text-white transition-all duration-300",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500 text-white flex-shrink-0">
            <Snowflake className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-white text-lg leading-tight">Subzero</h1>
              <p className="text-xs text-slate-400">Asset Command</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.disabled ? "#" : item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white border-l-2 border-transparent",
                item.disabled && "opacity-50 cursor-not-allowed",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.title}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "px-2 py-0.5 text-xs font-medium",
                        isActive
                          ? "bg-cyan-500/30 text-cyan-300"
                          : "bg-slate-700 text-slate-300"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {collapsed && item.badge && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer with Collapse Button */}
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
