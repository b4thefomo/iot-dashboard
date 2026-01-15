"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Map,
  ClipboardList,
  FileBarChart,
  BookOpen,
  AlertOctagon,
  Settings,
  Bell,
  Users,
  Wrench,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  {
    title: "Fleet Overview",
    href: "/freezer",
    icon: Map,
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

export function FreezerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 border-r bg-white/80 backdrop-blur">
      <nav className="p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.disabled ? "#" : item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                item.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{item.title}</span>
              {item.badge && (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-200 text-slate-600"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
