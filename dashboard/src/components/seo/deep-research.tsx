"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Target,
  Users,
  Trophy,
  FileText,
  Hash,
  Code,
  Rocket,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle,
  Clock,
  Lightbulb,
  HelpCircle,
} from "lucide-react";
import type { DeepResearch } from "@/lib/seo-api";

interface DeepResearchResultsProps {
  research: DeepResearch | null;
  keyword: string;
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "growing") return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === "declining") return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-yellow-500" />;
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    high: "bg-red-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
  };
  return (
    <Badge className={colors[priority] || "bg-gray-500"}>
      {priority} priority
    </Badge>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: number }) {
  let color = "bg-green-500";
  let label = "Easy";
  if (difficulty > 80) { color = "bg-red-600"; label = "Super Hard"; }
  else if (difficulty > 60) { color = "bg-red-500"; label = "Very Hard"; }
  else if (difficulty > 40) { color = "bg-orange-500"; label = "Hard"; }
  else if (difficulty > 20) { color = "bg-yellow-500"; label = "Moderate"; }
  return <Badge className={color}>{difficulty} - {label}</Badge>;
}

export function DeepResearchResults({ research, keyword }: DeepResearchResultsProps) {
  if (!research) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Deep research results will appear here</p>
          <p className="text-sm mt-1">Click "Deep Research" on a keyword to get comprehensive analysis</p>
        </CardContent>
      </Card>
    );
  }

  const { keywordAnalysis, audienceInsights, competitorLandscape, contentStrategy, keywordCluster, technicalSEO, actionPlan } = research;

  return (
    <ScrollArea className="h-[700px]">
      <div className="space-y-4 pr-4">
        {/* Keyword Analysis */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              Keyword Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded bg-muted/50">
                <p className="text-xs text-muted-foreground">Volume</p>
                <p className="text-lg font-bold">{keywordAnalysis.estimatedMonthlyVolume?.toLocaleString()}/mo</p>
              </div>
              <div className="p-3 rounded bg-muted/50">
                <p className="text-xs text-muted-foreground">Difficulty</p>
                <DifficultyBadge difficulty={keywordAnalysis.difficulty} />
              </div>
              <div className="p-3 rounded bg-muted/50">
                <p className="text-xs text-muted-foreground">CPC</p>
                <p className="text-lg font-bold">${keywordAnalysis.cpc?.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded bg-muted/50">
                <p className="text-xs text-muted-foreground">Trend</p>
                <div className="flex items-center gap-1">
                  <TrendIcon trend={keywordAnalysis.trendDirection} />
                  <span className="capitalize">{keywordAnalysis.trendDirection}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline">Intent: {keywordAnalysis.searchIntent}</Badge>
              <Badge variant="outline">Stage: {keywordAnalysis.buyerJourneyStage}</Badge>
              <Badge variant="outline">{keywordAnalysis.seasonality}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Audience Insights */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              Audience Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Who searches this</p>
              <p className="text-sm font-medium">{audienceInsights.primaryAudience}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Pain Points
                </p>
                <ul className="text-sm space-y-1">
                  {audienceInsights.painPoints?.map((p, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-red-500">-</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Goals
                </p>
                <ul className="text-sm space-y-1">
                  {audienceInsights.goals?.map((g, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-green-500">+</span> {g}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Competitor Landscape */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Competitor Landscape
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant={competitorLandscape.competitionLevel === "high" || competitorLandscape.competitionLevel === "very high" ? "destructive" : "secondary"}>
                {competitorLandscape.competitionLevel} competition
              </Badge>
              <Badge variant="outline">~{competitorLandscape.averageContentLength} words avg</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Content formats that rank</p>
              <div className="flex flex-wrap gap-1">
                {competitorLandscape.contentFormats?.map((f, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Lightbulb className="h-3 w-3 text-yellow-500" /> Gaps & Opportunities
              </p>
              <ul className="text-sm space-y-1">
                {competitorLandscape.gaps?.map((g, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-green-500">*</span> {g}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Content Strategy */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-500" />
              Content Strategy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground mb-1">Recommended Angle</p>
              <p className="text-sm font-medium">{contentStrategy.recommendedAngle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>{contentStrategy.contentType}</Badge>
              <Badge variant="outline">CTA: {contentStrategy.ctaRecommendation}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Key Topics to Cover</p>
              <ul className="text-sm space-y-1">
                {contentStrategy.keyTopicsTocover?.map((t, i) => (
                  <li key={i}>• {t}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <HelpCircle className="h-3 w-3" /> Questions to Answer
              </p>
              <ul className="text-sm space-y-1">
                {contentStrategy.questionsToAnswer?.map((q, i) => (
                  <li key={i} className="text-muted-foreground">? {q}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Keyword Cluster */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Hash className="h-4 w-4 text-indigo-500" />
              Keyword Cluster
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Supporting Keywords</p>
              <div className="space-y-1">
                {keywordCluster.supportingKeywords?.map((kw, i) => (
                  <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-muted/30">
                    <span>{kw.keyword}</span>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">{kw.volume}</Badge>
                      <Badge variant="outline" className="text-xs">{kw.type}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Long-tail Variations</p>
              <div className="flex flex-wrap gap-1">
                {keywordCluster.longTailVariations?.map((lt, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{lt}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical SEO */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Code className="h-4 w-4 text-cyan-500" />
              Technical SEO
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Recommended Title</p>
              <p className="text-sm font-mono bg-muted/50 p-2 rounded">{technicalSEO.recommendedTitle}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Meta Description</p>
              <p className="text-sm font-mono bg-muted/50 p-2 rounded">{technicalSEO.recommendedMetaDescription}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">URL: /{technicalSEO.recommendedURL}</Badge>
              <Badge variant="outline">Schema: {technicalSEO.schemaType}</Badge>
              <Badge variant={technicalSEO.featuredSnippetOpportunity === "high" ? "default" : "secondary"}>
                Snippet: {technicalSEO.featuredSnippetOpportunity}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Action Plan */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Rocket className="h-4 w-4 text-orange-500" />
              Action Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <PriorityBadge priority={actionPlan.priority} />
              <span className="text-sm flex items-center gap-1">
                <Clock className="h-3 w-3" /> {actionPlan.estimatedTimeToRank}
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Quick Wins</p>
                <ul className="text-sm space-y-1">
                  {actionPlan.quickWins?.map((w, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-green-500">*</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Long-term Plays</p>
                <ul className="text-sm space-y-1">
                  {actionPlan.longTermPlays?.map((p, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-blue-500">*</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="p-2 rounded bg-muted/50 text-sm">
              <strong>Content Calendar:</strong> {actionPlan.contentCalendarSuggestion}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
