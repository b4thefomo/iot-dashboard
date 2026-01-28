"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Copy,
  Check,
  Download,
  List,
  BookOpen,
  Tag
} from "lucide-react";
import { Markdown } from "@/components/ui/markdown";
import type { ArticleData, ContentBrief } from "@/lib/seo-api";

interface ArticlePreviewProps {
  article?: ArticleData | null;
  brief?: ContentBrief | null;
}

export function ArticlePreview({ article, brief }: ArticlePreviewProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState(article ? "article" : "brief");

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!article && !brief) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Generated content will appear here</p>
          <p className="text-sm mt-1">
            Enter a keyword and click Generate to create SEO content
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Generated Content</CardTitle>
            <TabsList>
              {brief && (
                <TabsTrigger value="brief" className="gap-2">
                  <List className="h-4 w-4" />
                  Brief
                </TabsTrigger>
              )}
              {article && (
                <TabsTrigger value="article" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Article
                </TabsTrigger>
              )}
            </TabsList>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Brief Tab */}
          {brief && (
            <TabsContent value="brief" className="mt-0">
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-6">
                  {/* Title & Meta */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Suggested Title
                      </label>
                      <p className="font-semibold">{brief.suggestedTitle}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Meta Description
                      </label>
                      <p className="text-sm">{brief.metaDescription}</p>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          Search Intent
                        </label>
                        <Badge variant="outline" className="ml-2 capitalize">
                          {brief.searchIntent}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          Target Word Count
                        </label>
                        <Badge variant="secondary" className="ml-2">
                          {brief.targetWordCount} words
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Headings */}
                  {brief.headings && brief.headings.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">
                        Suggested Headings
                      </label>
                      <div className="mt-2 space-y-2">
                        {brief.headings.map((h, i) => (
                          <div
                            key={i}
                            className="p-2 rounded bg-muted/50 flex items-center gap-2"
                          >
                            <Badge variant="outline" className="font-mono">
                              {h.level}
                            </Badge>
                            <span className="text-sm">{h.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Questions */}
                  {brief.questionsToAnswer && brief.questionsToAnswer.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">
                        Questions to Answer
                      </label>
                      <ul className="mt-2 space-y-1">
                        {brief.questionsToAnswer.map((q, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-primary">?</span>
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Key Points */}
                  {brief.keyPointsToCover && brief.keyPointsToCover.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">
                        Key Points to Cover
                      </label>
                      <ul className="mt-2 space-y-1">
                        {brief.keyPointsToCover.map((p, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-green-500">+</span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* CTAs */}
                  {brief.ctaSuggestions && brief.ctaSuggestions.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">
                        CTA Suggestions
                      </label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {brief.ctaSuggestions.map((cta, i) => (
                          <Badge key={i} variant="secondary">
                            {cta}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          )}

          {/* Article Tab */}
          {article && (
            <TabsContent value="article" className="mt-0">
              <div className="space-y-4">
                {/* Article Header */}
                <div className="space-y-2">
                  <h2 className="text-xl font-bold">{article.title}</h2>
                  {article.metaDescription && (
                    <p className="text-sm text-muted-foreground italic">
                      {article.metaDescription}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    {article.wordCount && (
                      <Badge variant="secondary">
                        {article.wordCount} words
                      </Badge>
                    )}
                    {article.keywordsUsed && article.keywordsUsed.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        {article.keywordsUsed.slice(0, 5).map((kw, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(article.content)}
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleDownload(
                        `# ${article.title}\n\n${article.content}`,
                        `${article.title.toLowerCase().replace(/\s+/g, "-")}.md`
                      )
                    }
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>

                {/* Article Content */}
                <ScrollArea className="h-[400px] rounded-lg border p-4">
                  <Markdown content={article.content} />
                </ScrollArea>
              </div>
            </TabsContent>
          )}
        </CardContent>
      </Tabs>
    </Card>
  );
}
