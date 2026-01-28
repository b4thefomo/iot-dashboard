import { cn } from "@/lib/utils";

interface FluxLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  className?: string;
}

const sizes = {
  sm: {
    container: "w-6 h-6",
    eyes: "w-1 h-1.5",
    gap: "gap-0.5",
  },
  md: {
    container: "w-8 h-8",
    eyes: "w-1.5 h-2",
    gap: "gap-1",
  },
  lg: {
    container: "w-12 h-12",
    eyes: "w-2 h-3",
    gap: "gap-1.5",
  },
  xl: {
    container: "w-16 h-16",
    eyes: "w-2.5 h-4",
    gap: "gap-2",
  },
};

export function FluxLogo({ size = "md", animate = false, className }: FluxLogoProps) {
  const sizeConfig = sizes[size];

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          sizeConfig.container,
          "rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30",
          animate && "animate-pulse"
        )}
      >
        <div className={cn("flex", sizeConfig.gap)}>
          <div className={cn(sizeConfig.eyes, "bg-white rounded-full")} />
          <div className={cn(sizeConfig.eyes, "bg-white rounded-full")} />
        </div>
      </div>
      {animate && (
        <div className={cn(sizeConfig.container, "absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-20")} />
      )}
    </div>
  );
}

export function FluxLogoWithText({
  size = "md",
  collapsed = false,
  className,
}: {
  size?: "sm" | "md" | "lg";
  collapsed?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <FluxLogo size={size} />
      {!collapsed && (
        <div className="overflow-hidden">
          <h1 className="font-bold text-white text-lg leading-tight">Flux</h1>
          <p className="text-xs text-slate-400">IoT Platform</p>
        </div>
      )}
    </div>
  );
}
