"use client";

import { useState } from "react";
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
import { Search, Loader2, Sparkles } from "lucide-react";
import { COUNTRY_OPTIONS } from "@/lib/seo-api";

// Preset keywords for cold chain / freezer monitoring industry
const PRESET_KEYWORDS = [
  { keyword: "cold chain monitoring", category: "Core" },
  { keyword: "temperature monitoring system", category: "Core" },
  { keyword: "freezer temperature logger", category: "Core" },
  { keyword: "cold storage monitoring", category: "Core" },
  { keyword: "iot temperature sensor", category: "Technology" },
  { keyword: "wireless temperature monitoring", category: "Technology" },
  { keyword: "real-time temperature tracking", category: "Technology" },
  { keyword: "cloud temperature monitoring", category: "Technology" },
  { keyword: "pharmaceutical cold chain", category: "Industry" },
  { keyword: "vaccine storage monitoring", category: "Industry" },
  { keyword: "food cold chain logistics", category: "Industry" },
  { keyword: "restaurant freezer monitoring", category: "Industry" },
  { keyword: "HACCP temperature monitoring", category: "Compliance" },
  { keyword: "FDA cold chain compliance", category: "Compliance" },
  { keyword: "cold chain data logger", category: "Compliance" },
  { keyword: "temperature excursion alerts", category: "Features" },
  { keyword: "freezer alarm system", category: "Features" },
  { keyword: "remote freezer monitoring", category: "Features" },
];

interface KeywordSearchProps {
  onSearch: (keyword: string, country: string) => void;
  isLoading?: boolean;
}

export function KeywordSearch({ onSearch, isLoading }: KeywordSearchProps) {
  const [keyword, setKeyword] = useState("");
  const [country, setCountry] = useState("us");
  const [showPresets, setShowPresets] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      onSearch(keyword.trim(), country);
      setShowPresets(false);
    }
  };

  const handlePresetClick = (presetKeyword: string) => {
    setKeyword(presetKeyword);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Enter keyword to research..."
            className="pl-9"
            disabled={isLoading}
          />
        </div>
        <Select value={country} onValueChange={setCountry} disabled={isLoading}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNTRY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" disabled={isLoading || !keyword.trim()}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching
            </>
          ) : (
            "Search"
          )}
        </Button>
      </form>

      {/* Preset Keywords */}
      {showPresets && !isLoading && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>Quick start with cold chain keywords:</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-xs"
              onClick={() => setShowPresets(false)}
            >
              Hide
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_KEYWORDS.map((preset) => (
              <Badge
                key={preset.keyword}
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors py-1.5 px-3"
                onClick={() => handlePresetClick(preset.keyword)}
              >
                {preset.keyword}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {!showPresets && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => setShowPresets(true)}
        >
          <Sparkles className="mr-1 h-3 w-3" />
          Show preset keywords
        </Button>
      )}
    </div>
  );
}
