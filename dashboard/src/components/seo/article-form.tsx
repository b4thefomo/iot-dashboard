"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Loader2, X, Sparkles } from "lucide-react";
import { TONE_OPTIONS, LENGTH_OPTIONS } from "@/lib/seo-api";
import type { ArticleGenerationParams } from "@/lib/seo-api";

interface ArticleFormProps {
  initialKeyword?: string;
  selectedKeywords?: string[];
  onGenerate: (params: ArticleGenerationParams) => void;
  onGenerateBrief: (keyword: string, relatedKeywords: string[]) => void;
  isGenerating?: boolean;
  isGeneratingBrief?: boolean;
}

export function ArticleForm({
  initialKeyword = "",
  selectedKeywords = [],
  onGenerate,
  onGenerateBrief,
  isGenerating,
  isGeneratingBrief,
}: ArticleFormProps) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [relatedKeywords, setRelatedKeywords] = useState<string[]>(selectedKeywords);
  const [tone, setTone] = useState<ArticleGenerationParams["tone"]>("professional");
  const [length, setLength] = useState<ArticleGenerationParams["length"]>("medium");
  const [newKeyword, setNewKeyword] = useState("");

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !relatedKeywords.includes(newKeyword.trim())) {
      setRelatedKeywords([...relatedKeywords, newKeyword.trim()]);
      setNewKeyword("");
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setRelatedKeywords(relatedKeywords.filter((k) => k !== kw));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      onGenerate({
        keyword: keyword.trim(),
        relatedKeywords,
        tone,
        length,
        includeOutline: true,
      });
    }
  };

  const handleGenerateBrief = () => {
    if (keyword.trim()) {
      onGenerateBrief(keyword.trim(), relatedKeywords);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generate Article
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Keyword */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Keyword *</label>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter main keyword for the article..."
              disabled={isGenerating}
            />
          </div>

          {/* Related Keywords */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Related Keywords</label>
            <div className="flex gap-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Add related keyword..."
                disabled={isGenerating}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddKeyword}
                disabled={isGenerating || !newKeyword.trim()}
              >
                Add
              </Button>
            </div>
            {relatedKeywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {relatedKeywords.map((kw) => (
                  <Badge
                    key={kw}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {kw}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => handleRemoveKeyword(kw)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Tone & Length */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tone</label>
              <Select
                value={tone}
                onValueChange={(v) => setTone(v as ArticleGenerationParams["tone"])}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Length</label>
              <Select
                value={length}
                onValueChange={(v) => setLength(v as ArticleGenerationParams["length"])}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LENGTH_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateBrief}
              disabled={isGenerating || isGeneratingBrief || !keyword.trim()}
              className="flex-1"
            >
              {isGeneratingBrief ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Brief...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Brief
                </>
              )}
            </Button>
            <Button
              type="submit"
              disabled={isGenerating || !keyword.trim()}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Article
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
