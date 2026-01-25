"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Move3D } from "lucide-react";

interface AccelDataPoint {
  x: number;
  y: number;
  z: number;
}

interface AccelChartProps {
  accelX: number;
  accelY: number;
  accelZ: number;
  isOnline: boolean;
}

export function AccelChart({ accelX, accelY, accelZ, isOnline }: AccelChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [buffer, setBuffer] = useState<AccelDataPoint[]>([]);
  const maxPoints = 200;

  // Accumulate accelerometer data into a rolling buffer
  useEffect(() => {
    if (accelX === undefined || accelY === undefined || accelZ === undefined) return;

    setBuffer((prev) => {
      const newBuffer = [...prev, { x: accelX, y: accelY, z: accelZ }];
      if (newBuffer.length > maxPoints) {
        return newBuffer.slice(-maxPoints);
      }
      return newBuffer;
    });
  }, [accelX, accelY, accelZ]);

  // Draw the acceleration waveforms
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear canvas with subtle gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#f8fafc");
    gradient.addColorStop(1, "#f1f5f9");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw subtle grid
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 0.5;
    const gridSize = 20;
    ctx.beginPath();
    for (let x = 0; x <= width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Draw center line
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw acceleration lines
    if (buffer.length > 1) {
      const xStep = width / maxPoints;
      const yCenter = height / 2;
      const yScale = height * 0.25; // Scale to fit in view

      const drawLine = (data: number[], color: string, lineWidth: number = 2) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();

        for (let i = 0; i < data.length; i++) {
          const x = i * xStep;
          const y = yCenter - data[i] * yScale;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      };

      // Draw X (rose), Y (emerald), Z (blue)
      drawLine(buffer.map((p) => p.x), "#f43f5e"); // Rose-500
      drawLine(buffer.map((p) => p.y), "#10b981"); // Emerald-500
      drawLine(buffer.map((p) => p.z), "#3b82f6"); // Blue-500
    }

    // Draw legend
    const legendY = height - 12;
    ctx.font = "10px system-ui";

    ctx.fillStyle = "#f43f5e";
    ctx.fillRect(width - 120, legendY - 8, 10, 10);
    ctx.fillStyle = "#64748b";
    ctx.fillText(`X: ${accelX?.toFixed(2) || '0.00'}`, width - 106, legendY);

    ctx.fillStyle = "#10b981";
    ctx.fillRect(width - 75, legendY - 8, 10, 10);
    ctx.fillStyle = "#64748b";
    ctx.fillText(`Y: ${accelY?.toFixed(2) || '0.00'}`, width - 61, legendY);

    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(width - 30, legendY - 8, 10, 10);
    ctx.fillStyle = "#64748b";
    ctx.fillText(`Z: ${accelZ?.toFixed(2) || '0.00'}`, width - 16, legendY);

    // Draw "no signal" message if offline
    if (!isOnline && buffer.length === 0) {
      ctx.fillStyle = "#6b7280";
      ctx.font = "14px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Waiting for accelerometer data...", width / 2, height / 2);
    }
  }, [buffer, isOnline, accelX, accelY, accelZ]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Move3D className="h-4 w-4 text-blue-500" />
          3-Axis Acceleration
          <span className="ml-auto flex items-center gap-2 text-xs font-normal">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-rose-500 rounded-full" />
              X
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              Y
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
              Z
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <canvas
          ref={canvasRef}
          className="w-full h-[150px]"
          style={{ display: "block" }}
        />
      </CardContent>
    </Card>
  );
}
