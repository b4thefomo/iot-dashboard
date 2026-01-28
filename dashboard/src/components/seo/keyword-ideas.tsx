"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Link, Lightbulb } from "lucide-react";
import type { KeywordMetrics } from "@/lib/seo-api";

interface KeywordIdeasProps {
  matchingTerms: KeywordMetrics[];
  relatedTerms: KeywordMetrics[];
  suggestions: KeywordMetrics[];
  selectedKeywords: string[];
  onKeywordSelect: (keyword: string) => void;
}

function formatVolume(volume: number): string {
  if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
  return volume.toString();
}

function KeywordList({
  keywords,
  selectedKeywords,
  onKeywordSelect,
  emptyMessage,
}: {
  keywords: KeywordMetrics[];
  selectedKeywords: string[];
  onKeywordSelect: (keyword: string) => void;
  emptyMessage: string;
}) {
  if (keywords.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ScrollArea className="h-[200px]">
      <div className="space-y-2">
        {keywords.map((kw, index) => (
          <div
            key={`${kw.keyword}-${index}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
            onClick={() => onKeywordSelect(kw.keyword)}
          >
            <Checkbox
              checked={selectedKeywords.includes(kw.keyword)}
              onCheckedChange={() => onKeywordSelect(kw.keyword)}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{kw.keyword}</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="secondary">{formatVolume(kw.volume)}</Badge>
              {kw.difficulty !== undefined && (
                <Badge variant="outline">KD: {kw.difficulty}</Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export function KeywordIdeas({
  matchingTerms,
  relatedTerms,
  suggestions,
  selectedKeywords,
  onKeywordSelect,
}: KeywordIdeasProps) {
  const totalKeywords = matchingTerms.length + relatedTerms.length + suggestions.length;

  if (totalKeywords === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Matching Terms */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            Matching Terms
            <Badge variant="secondary" className="ml-auto">
              {matchingTerms.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KeywordList
            keywords={matchingTerms}
            selectedKeywords={selectedKeywords}
            onKeywordSelect={onKeywordSelect}
            emptyMessage="No matching terms found"
          />
        </CardContent>
      </Card>

      {/* Related Terms */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Link className="h-4 w-4 text-blue-500" />
            Related Terms
            <Badge variant="secondary" className="ml-auto">
              {relatedTerms.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KeywordList
            keywords={relatedTerms}
            selectedKeywords={selectedKeywords}
            onKeywordSelect={onKeywordSelect}
            emptyMessage="No related terms found"
          />
        </CardContent>
      </Card>

      {/* Search Suggestions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Search Suggestions
            <Badge variant="secondary" className="ml-auto">
              {suggestions.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KeywordList
            keywords={suggestions}
            selectedKeywords={selectedKeywords}
            onKeywordSelect={onKeywordSelect}
            emptyMessage="No suggestions found"
          />
        </CardContent>
      </Card>
    </div>
  );
}
