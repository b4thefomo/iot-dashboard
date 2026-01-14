"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Package, Upload } from "lucide-react";
import { API_URL } from "@/lib/socket";

interface FirmwareInfo {
  version: string;
  size: number;
  uploadedAt: string;
}

interface FirmwareStatus {
  [deviceType: string]: FirmwareInfo;
}

export function FirmwareStatus() {
  const [status, setStatus] = React.useState<FirmwareStatus>({});
  const [loading, setLoading] = React.useState(false);
  const [lastCheck, setLastCheck] = React.useState<Date | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/firmware/status`);
      const data = await response.json();
      setStatus(data);
      setLastCheck(new Date());
    } catch (error) {
      console.error("Failed to fetch firmware status:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStatus();
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const deviceTypes = Object.keys(status);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Firmware Status
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchStatus}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        {lastCheck && (
          <p className="text-xs text-muted-foreground">
            Last checked: {lastCheck.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {deviceTypes.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No firmware uploaded yet</p>
            <p className="text-xs mt-1">
              Push to the firmware/ folder to trigger a build
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {deviceTypes.map((deviceType) => {
              const firmware = status[deviceType];
              return (
                <div
                  key={deviceType}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium text-sm">{deviceType}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(firmware.size)} • {formatDate(firmware.uploadedAt)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    v{firmware.version.slice(0, 7)}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
