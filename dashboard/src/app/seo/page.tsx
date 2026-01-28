"use client";

import { useState, useCallback } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, FileText, AlertCircle, Microscope, Loader2 } from "lucide-react";
import {
  KeywordSearch,
  KeywordResults,
  KeywordIdeas,
  ArticleForm,
  ArticlePreview,
  DeepResearchResults,
} from "@/components/seo";
import {
  researchKeyword,
  getKeywordIdeas,
  generateArticle,
  generateBrief,
  deepResearch,
} from "@/lib/seo-api";
import type {
  KeywordMetrics,
  ArticleData,
  ContentBrief,
  ArticleGenerationParams,
  DeepResearch,
} from "@/lib/seo-api";

export default function SEOStudioPage() {
  // Research state
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [currentKeyword, setCurrentKeyword] = useState("");
  const [currentCountry, setCurrentCountry] = useState("us");
  const [keywordMetrics, setKeywordMetrics] = useState<KeywordMetrics | null>(null);
  const [matchingTerms, setMatchingTerms] = useState<KeywordMetrics[]>([]);
  const [relatedTerms, setRelatedTerms] = useState<KeywordMetrics[]>([]);
  const [suggestions, setSuggestions] = useState<KeywordMetrics[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedArticle, setGeneratedArticle] = useState<ArticleData | null>(null);
  const [generatedBrief, setGeneratedBrief] = useState<ContentBrief | null>(null);

  // Deep research state
  const [isDeepResearching, setIsDeepResearching] = useState(false);
  const [deepResearchResult, setDeepResearchResult] = useState<DeepResearch | null>(null);
  const [deepResearchError, setDeepResearchError] = useState<string | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState("research");

  const handleSearch = useCallback(async (keyword: string, country: string) => {
    setIsSearching(true);
    setSearchError(null);
    setCurrentKeyword(keyword);
    setCurrentCountry(country);
    setKeywordMetrics(null);
    setMatchingTerms([]);
    setRelatedTerms([]);
    setSuggestions([]);

    try {
      // Fetch main keyword metrics and ideas in parallel
      const [metricsResponse, ideasResponse] = await Promise.all([
        researchKeyword(keyword, country),
        getKeywordIdeas(keyword, country, 15),
      ]);

      setKeywordMetrics(metricsResponse.metrics);
      setMatchingTerms(ideasResponse.matchingTerms);
      setRelatedTerms(ideasResponse.relatedTerms);
      setSuggestions(ideasResponse.suggestions);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Search failed");
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleKeywordSelect = useCallback((keyword: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(keyword)
        ? prev.filter((k) => k !== keyword)
        : [...prev, keyword]
    );
  }, []);

  const handleGenerateArticle = useCallback(
    async (params: ArticleGenerationParams) => {
      setIsGenerating(true);
      setGenerationError(null);

      try {
        const response = await generateArticle(params);
        setGeneratedArticle(response.article);
        setActiveTab("generate"); // Switch to generate tab to show result
      } catch (error) {
        setGenerationError(
          error instanceof Error ? error.message : "Article generation failed"
        );
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const handleGenerateBrief = useCallback(
    async (keyword: string, relatedKeywords: string[]) => {
      setIsGeneratingBrief(true);
      setGenerationError(null);

      try {
        const response = await generateBrief(keyword, relatedKeywords, currentCountry);
        setGeneratedBrief(response.brief);
        setActiveTab("generate"); // Switch to generate tab to show result
      } catch (error) {
        setGenerationError(
          error instanceof Error ? error.message : "Brief generation failed"
        );
      } finally {
        setIsGeneratingBrief(false);
      }
    },
    [currentCountry]
  );

  const handleGenerateFromSelected = useCallback(() => {
    if (currentKeyword) {
      setActiveTab("generate");
    }
  }, [currentKeyword]);

  const handleDeepResearch = useCallback(async () => {
    if (!currentKeyword) return;

    setIsDeepResearching(true);
    setDeepResearchError(null);

    try {
      const response = await deepResearch(currentKeyword, currentCountry);
      setDeepResearchResult(response.research);
      setActiveTab("deep-research");
    } catch (error) {
      setDeepResearchError(
        error instanceof Error ? error.message : "Deep research failed"
      );
    } finally {
      setIsDeepResearching(false);
    }
  }, [currentKeyword, currentCountry]);

  return (
    <SidebarProvider>
      <AppSidebar isOnline={false} isConnected={true} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Search className="h-5 w-5" />
          <h1 className="font-semibold">SEO Studio</h1>
          {selectedKeywords.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {selectedKeywords.length} selected
            </Badge>
          )}
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="research" className="gap-2">
                <Search className="h-4 w-4" />
                Research
              </TabsTrigger>
              <TabsTrigger value="deep-research" className="gap-2">
                <Microscope className="h-4 w-4" />
                Deep Research
              </TabsTrigger>
              <TabsTrigger value="generate" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate
              </TabsTrigger>
            </TabsList>

            {/* Research Tab */}
            <TabsContent value="research" className="space-y-6">
              {/* Search Bar */}
              <KeywordSearch onSearch={handleSearch} isLoading={isSearching} />

              {/* Error Message */}
              {searchError && (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <span>{searchError}</span>
                </div>
              )}

              {/* Results */}
              {currentKeyword && !isSearching && (
                <>
                  <KeywordResults
                    keyword={currentKeyword}
                    metrics={keywordMetrics}
                    country={currentCountry}
                  />

                  <KeywordIdeas
                    matchingTerms={matchingTerms}
                    relatedTerms={relatedTerms}
                    suggestions={suggestions}
                    selectedKeywords={selectedKeywords}
                    onKeywordSelect={handleKeywordSelect}
                  />

                  {/* Actions */}
                  {(keywordMetrics || selectedKeywords.length > 0) && (
                    <div className="flex justify-center gap-3 pt-4">
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={handleDeepResearch}
                        disabled={isDeepResearching}
                        className="gap-2"
                      >
                        {isDeepResearching ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Researching...
                          </>
                        ) : (
                          <>
                            <Microscope className="h-5 w-5" />
                            Deep Research
                          </>
                        )}
                      </Button>
                      <Button
                        size="lg"
                        onClick={handleGenerateFromSelected}
                        className="gap-2"
                      >
                        <FileText className="h-5 w-5" />
                        Generate Article from{" "}
                        {selectedKeywords.length > 0
                          ? `${selectedKeywords.length + 1} Keywords`
                          : "Keyword"}
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* Empty State */}
              {!currentKeyword && !isSearching && (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Enter a keyword to start researching</p>
                  <p className="text-sm mt-1">
                    Get search volume, difficulty, CPC, and keyword ideas
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Deep Research Tab */}
            <TabsContent value="deep-research" className="space-y-6">
              {deepResearchError && (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <span>{deepResearchError}</span>
                </div>
              )}

              {!deepResearchResult && !isDeepResearching && (
                <div className="text-center py-12 text-muted-foreground">
                  <Microscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Run deep research on a keyword</p>
                  <p className="text-sm mt-1">
                    Get comprehensive market analysis, audience insights, and content strategy
                  </p>
                  {currentKeyword && (
                    <Button
                      className="mt-4 gap-2"
                      onClick={handleDeepResearch}
                      disabled={isDeepResearching}
                    >
                      <Microscope className="h-4 w-4" />
                      Research "{currentKeyword}"
                    </Button>
                  )}
                </div>
              )}

              {isDeepResearching && (
                <div className="text-center py-12">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-lg">Conducting deep research...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Analyzing market, competitors, and content strategy for "{currentKeyword}"
                  </p>
                </div>
              )}

              {deepResearchResult && !isDeepResearching && (
                <DeepResearchResults research={deepResearchResult} keyword={currentKeyword} />
              )}
            </TabsContent>

            {/* Generate Tab */}
            <TabsContent value="generate" className="space-y-6">
              {generationError && (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <span>{generationError}</span>
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                <ArticleForm
                  initialKeyword={currentKeyword}
                  selectedKeywords={selectedKeywords}
                  onGenerate={handleGenerateArticle}
                  onGenerateBrief={handleGenerateBrief}
                  isGenerating={isGenerating}
                  isGeneratingBrief={isGeneratingBrief}
                />

                <ArticlePreview article={generatedArticle} brief={generatedBrief} />
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
