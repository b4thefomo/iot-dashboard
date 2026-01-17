"use client";

import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { FreezerReading } from "@/hooks/use-fleet-data";
import {
  Search,
  Snowflake,
  FileText,
  LayoutGrid,
  Code,
  Download,
  Thermometer,
  AlertTriangle,
  MapPin,
  Zap,
  Settings,
  HelpCircle,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
  category: string;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  devices: FreezerReading[];
  onSelectDevice: (deviceId: string) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  devices,
  onSelectDevice,
}: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Build command items
  const commands: CommandItem[] = React.useMemo(() => {
    const items: CommandItem[] = [];

    // Navigation commands
    items.push({
      id: "nav-dashboard",
      label: "Go to Dashboard",
      icon: LayoutGrid,
      action: () => {
        router.push("/freezer");
        onClose();
      },
      category: "NAVIGATION",
      keywords: ["home", "overview", "main"],
    });
    items.push({
      id: "nav-reports",
      label: "Go to Reports",
      icon: FileText,
      action: () => {
        router.push("/freezer/reports");
        onClose();
      },
      category: "NAVIGATION",
      keywords: ["export", "pdf", "csv"],
    });
    items.push({
      id: "nav-docs",
      label: "Go to API Documentation",
      icon: Code,
      action: () => {
        router.push("/freezer/docs");
        onClose();
      },
      category: "NAVIGATION",
      keywords: ["api", "developer", "endpoints"],
    });

    // Actions
    items.push({
      id: "action-export-csv",
      label: "Export Fleet Data (CSV)",
      icon: Download,
      action: () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        window.open(`${apiUrl}/api/fleet/export/csv`, "_blank");
        onClose();
      },
      category: "ACTIONS",
      keywords: ["download", "spreadsheet", "data"],
    });
    items.push({
      id: "action-export-pdf",
      label: "Generate PDF Report",
      icon: FileText,
      action: () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        window.open(`${apiUrl}/api/fleet/export/pdf`, "_blank");
        onClose();
      },
      category: "ACTIONS",
      keywords: ["download", "report", "print"],
    });

    // Device commands
    devices.forEach((device) => {
      const status =
        device.fault !== "NORMAL" || device.temp_cabinet > -10
          ? "critical"
          : device.temp_cabinet > -15 || device.door_open
          ? "warning"
          : "healthy";

      items.push({
        id: `device-${device.device_id}`,
        label: `${device.device_id} - ${device.location_name}`,
        icon: Snowflake,
        action: () => {
          onSelectDevice(device.device_id);
          onClose();
        },
        category: "UNITS",
        keywords: [
          device.location_name.toLowerCase(),
          status,
          `${device.temp_cabinet}`,
        ],
      });
    });

    // Quick filters
    items.push({
      id: "filter-critical",
      label: "Show Critical Units",
      icon: AlertTriangle,
      action: () => {
        const critical = devices.find(
          (d) => d.fault !== "NORMAL" || d.temp_cabinet > -10
        );
        if (critical) {
          onSelectDevice(critical.device_id);
        }
        onClose();
      },
      category: "FILTERS",
      keywords: ["alert", "error", "problem"],
    });
    items.push({
      id: "filter-warning",
      label: "Show Warning Units",
      icon: Thermometer,
      action: () => {
        const warning = devices.find(
          (d) =>
            d.temp_cabinet > -15 &&
            d.temp_cabinet <= -10 &&
            d.fault === "NORMAL"
        );
        if (warning) {
          onSelectDevice(warning.device_id);
        }
        onClose();
      },
      category: "FILTERS",
      keywords: ["temperature", "attention"],
    });

    return items;
  }, [devices, onClose, onSelectDevice, router]);

  // Filter commands based on search
  const filteredCommands = React.useMemo(() => {
    if (!search.trim()) return commands;

    const searchLower = search.toLowerCase();
    return commands.filter((cmd) => {
      if (cmd.label.toLowerCase().includes(searchLower)) return true;
      if (cmd.category.toLowerCase().includes(searchLower)) return true;
      if (cmd.keywords?.some((k) => k.includes(searchLower))) return true;
      return false;
    });
  }, [commands, search]);

  // Group by category
  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    const categoryOrder = ["UNITS", "ACTIONS", "NAVIGATION", "FILTERS"];

    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });

    // Sort by category order
    const sorted: Record<string, CommandItem[]> = {};
    categoryOrder.forEach((cat) => {
      if (groups[cat]) {
        sorted[cat] = groups[cat];
      }
    });

    return sorted;
  }, [filteredCommands]);

  // Flatten for keyboard navigation
  const flatCommands = React.useMemo(() => {
    return Object.values(groupedCommands).flat();
  }, [groupedCommands]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearch("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, flatCommands.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (flatCommands[selectedIndex]) {
            flatCommands[selectedIndex].action();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [flatCommands, selectedIndex, onClose]
  );

  if (!isOpen || !mounted) return null;

  let currentIndex = 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-xl bg-slate-900 rounded-xl shadow-2xl border border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-700">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search units or run a command..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-base"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-500 bg-slate-800 rounded border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {Object.entries(groupedCommands).map(([category, items]) => (
            <div key={category} className="mb-2">
              {/* Category Header */}
              <div className="px-4 py-2 text-xs font-semibold text-slate-500 tracking-wider">
                {category}
              </div>

              {/* Items */}
              {items.map((item) => {
                const itemIndex = currentIndex++;
                const isSelected = itemIndex === selectedIndex;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isSelected
                        ? "bg-slate-800 text-white"
                        : "text-slate-300 hover:bg-slate-800/50"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        isSelected ? "text-cyan-400" : "text-slate-500"
                      }`}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.category === "UNITS" && (
                      <span className="text-xs text-slate-500">
                        {devices.find((d) => d.device_id === item.id.replace("device-", ""))
                          ?.temp_cabinet.toFixed(1)}
                        °C
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {flatCommands.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-500">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No results found for &quot;{search}&quot;</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">↵</kbd>
              to select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">\</kbd>
            to open
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Hook for global hotkey
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with backslash
      if (e.key === "\\" && !e.ctrlKey && !e.metaKey) {
        // Don't trigger if typing in an input
        if (
          document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA"
        ) {
          return;
        }
        e.preventDefault();
        setIsOpen(true);
      }

      // Also support Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}
