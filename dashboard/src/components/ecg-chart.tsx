"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface EcgChartProps {
  waveformData: number[];
  heartRate: number;
  isOnline: boolean;
}

export function EcgChart({ waveformData, heartRate, isOnline }: EcgChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [buffer, setBuffer] = useState<number[]>([]);
  const maxPoints = 500; // Number of points to display

  // Accumulate waveform data into a rolling buffer
  useEffect(() => {
    if (!waveformData || waveformData.length === 0) return;

    setBuffer((prev) => {
      const newBuffer = [...prev, ...waveformData];
      // Keep only the last maxPoints
      if (newBuffer.length > maxPoints) {
        return newBuffer.slice(-maxPoints);
      }
      return newBuffer;
    });
  }, [waveformData]);

  // Draw the ECG waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get display dimensions
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear canvas
    ctx.fillStyle = "#fdf2f4"; // Light rose background
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = "#fecdd3"; // Rose-200
    ctx.lineWidth = 0.5;

    // Vertical grid lines (small)
    const smallGridSize = 10;
    ctx.beginPath();
    for (let x = 0; x <= width; x += smallGridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += smallGridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Larger grid lines
    ctx.strokeStyle = "#fda4af"; // Rose-300
    ctx.lineWidth = 1;
    const largeGridSize = 50;
    ctx.beginPath();
    for (let x = 0; x <= width; x += largeGridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += largeGridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Draw ECG waveform
    if (buffer.length > 1) {
      ctx.strokeStyle = "#f43f5e"; // Rose-500
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const xStep = width / maxPoints;
      const yCenter = height / 2;
      const yScale = height * 0.4; // Scale to use 80% of height

      ctx.beginPath();
      for (let i = 0; i < buffer.length; i++) {
        const x = i * xStep;
        const y = yCenter - buffer[i] * yScale;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Draw glow effect for the leading edge
      if (buffer.length > 10) {
        ctx.strokeStyle = "rgba(244, 63, 94, 0.5)"; // Rose-500 with alpha
        ctx.lineWidth = 4;
        ctx.beginPath();
        const startIdx = Math.max(0, buffer.length - 20);
        for (let i = startIdx; i < buffer.length; i++) {
          const x = i * xStep;
          const y = yCenter - buffer[i] * yScale;
          if (i === startIdx) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }
    }

    // Draw "no signal" message if offline
    if (!isOnline && buffer.length === 0) {
      ctx.fillStyle = "#6b7280";
      ctx.font = "14px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Waiting for ECG signal...", width / 2, height / 2);
    }
  }, [buffer, isOnline]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Activity className="h-4 w-4 text-rose-500" />
          Live ECG Trace
          {heartRate > 0 && (
            <span className="ml-auto text-rose-500 font-bold">
              {heartRate} BPM
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <canvas
          ref={canvasRef}
          className="w-full h-[180px]"
          style={{ display: "block" }}
        />
      </CardContent>
    </Card>
  );
}
