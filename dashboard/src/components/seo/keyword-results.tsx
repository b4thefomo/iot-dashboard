"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, DollarSign, MousePointer, Globe } from "lucide-react";
import type { KeywordMetrics } from "@/lib/seo-api";

interface KeywordResultsProps {
  keyword: string;
  metrics: KeywordMetrics | null;
  country: string;
}

function getDifficultyColor(difficulty: number): string {
  if (difficulty <= 20) return "bg-green-500";
  if (difficulty <= 40) return "bg-lime-500";
  if (difficulty <= 60) return "bg-yellow-500";
  if (difficulty <= 80) return "bg-orange-500";
  return "bg-red-500";
}

function getDifficultyLabel(difficulty: number): string {
  if (difficulty <= 20) return "Easy";
  if (difficulty <= 40) return "Moderate";
  if (difficulty <= 60) return "Hard";
  if (difficulty <= 80) return "Very Hard";
  return "Super Hard";
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function KeywordResults({ keyword, metrics, country }: KeywordResultsProps) {
  if (!metrics) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No data found for "{keyword}" in {country.toUpperCase()}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            {metrics.keyword}
          </CardTitle>
          <Badge variant="outline">{country.toUpperCase()}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Monthly Volume */}
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Monthly Volume</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(metrics.volume)}</p>
            <p className="text-xs text-muted-foreground">searches/month</p>
          </div>

          {/* Keyword Difficulty */}
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              <span className="text-xs font-medium">Difficulty</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{metrics.difficulty}</p>
              <Badge className={getDifficultyColor(metrics.difficulty)}>
                {getDifficultyLabel(metrics.difficulty)}
              </Badge>
            </div>
          </div>

          {/* CPC */}
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium">CPC</span>
            </div>
            <p className="text-2xl font-bold">${metrics.cpc?.toFixed(2) || '0.00'}</p>
            <p className="text-xs text-muted-foreground">cost per click</p>
          </div>

          {/* Clicks / Global Volume */}
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              {metrics.clicks !== undefined ? (
                <MousePointer className="h-4 w-4" />
              ) : (
                <Globe className="h-4 w-4" />
              )}
              <span className="text-xs font-medium">
                {metrics.clicks !== undefined ? 'Clicks' : 'Global Volume'}
              </span>
            </div>
            <p className="text-2xl font-bold">
              {formatNumber(metrics.clicks ?? metrics.global_volume ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              {metrics.clicks !== undefined ? 'avg clicks/month' : 'worldwide'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
