// SEO Studio API Client
// Handles communication with the backend SEO endpoints

const API_BASE = 'http://localhost:4000';

export interface KeywordMetrics {
  keyword: string;
  volume: number;
  difficulty: number;
  cpc: number;
  clicks?: number;
  global_volume?: number;
}

export interface KeywordResearchResponse {
  success: boolean;
  keyword: string;
  country: string;
  metrics: KeywordMetrics | null;
}

export interface KeywordIdeasResponse {
  success: boolean;
  keyword: string;
  country: string;
  matchingTerms: KeywordMetrics[];
  relatedTerms: KeywordMetrics[];
  suggestions: KeywordMetrics[];
}

export interface ContentBrief {
  targetKeyword: string;
  searchIntent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  suggestedTitle: string;
  metaDescription: string;
  targetWordCount: number;
  headings: Array<{
    level: string;
    text: string;
    keywords?: string[];
  }>;
  questionsToAnswer: string[];
  keyPointsToCover: string[];
  internalLinkingSuggestions: string[];
  ctaSuggestions: string[];
}

export interface BriefResponse {
  success: boolean;
  keyword: string;
  brief: ContentBrief;
}

export interface ArticleData {
  title: string;
  metaDescription: string;
  outline?: Array<{
    level: number;
    text: string;
  }>;
  content: string;
  wordCount?: number;
  keywordsUsed?: string[];
  raw?: boolean;
}

export interface ArticleResponse {
  success: boolean;
  keyword: string;
  article: ArticleData;
}

export interface DeepResearch {
  keywordAnalysis: {
    primaryKeyword: string;
    estimatedMonthlyVolume: number;
    difficulty: number;
    cpc: number;
    searchIntent: string;
    buyerJourneyStage: string;
    seasonality: string;
    trendDirection: string;
  };
  audienceInsights: {
    primaryAudience: string;
    painPoints: string[];
    goals: string[];
    objections: string[];
    decisionFactors: string[];
  };
  competitorLandscape: {
    competitionLevel: string;
    dominantPlayerTypes: string[];
    contentFormats: string[];
    averageContentLength: number;
    gaps: string[];
  };
  contentStrategy: {
    recommendedAngle: string;
    contentType: string;
    uniqueValueProposition: string;
    keyTopicsTocover: string[];
    questionsToAnswer: string[];
    internalLinkOpportunities: string[];
    ctaRecommendation: string;
  };
  keywordCluster: {
    pillarKeyword: string;
    supportingKeywords: Array<{ keyword: string; volume: number; type: string }>;
    longTailVariations: string[];
    relatedQuestions: string[];
  };
  technicalSEO: {
    recommendedTitle: string;
    recommendedMetaDescription: string;
    recommendedURL: string;
    schemaType: string;
    featuredSnippetOpportunity: string;
    featuredSnippetFormat: string;
  };
  actionPlan: {
    priority: string;
    estimatedTimeToRank: string;
    quickWins: string[];
    longTermPlays: string[];
    contentCalendarSuggestion: string;
  };
}

export interface DeepResearchResponse {
  success: boolean;
  keyword: string;
  country: string;
  research: DeepResearch;
}

export interface ArticleGenerationParams {
  keyword: string;
  relatedKeywords?: string[];
  tone?: 'professional' | 'casual' | 'academic' | 'conversational';
  length?: 'short' | 'medium' | 'long';
  includeOutline?: boolean;
}

/**
 * Research a single keyword - get volume, difficulty, CPC
 */
export async function researchKeyword(
  keyword: string,
  country: string = 'us'
): Promise<KeywordResearchResponse> {
  const response = await fetch(`${API_BASE}/api/seo/keywords/research`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword, country })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to research keyword');
  }

  return response.json();
}

/**
 * Get keyword ideas - matching terms, related terms, suggestions
 */
export async function getKeywordIdeas(
  keyword: string,
  country: string = 'us',
  limit: number = 20
): Promise<KeywordIdeasResponse> {
  const response = await fetch(`${API_BASE}/api/seo/keywords/ideas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword, country, limit })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get keyword ideas');
  }

  return response.json();
}

/**
 * Deep research - comprehensive keyword and market analysis
 */
export async function deepResearch(
  keyword: string,
  country: string = 'us',
  industry: string = 'cold chain / IoT'
): Promise<DeepResearchResponse> {
  const response = await fetch(`${API_BASE}/api/seo/keywords/deep-research`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword, country, industry })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to perform deep research');
  }

  return response.json();
}

/**
 * Generate a content brief for a keyword
 */
export async function generateBrief(
  keyword: string,
  relatedKeywords: string[] = [],
  country: string = 'us'
): Promise<BriefResponse> {
  const response = await fetch(`${API_BASE}/api/seo/brief/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword, relatedKeywords, country })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate brief');
  }

  return response.json();
}

/**
 * Generate a full SEO-optimized article
 */
export async function generateArticle(
  params: ArticleGenerationParams
): Promise<ArticleResponse> {
  const response = await fetch(`${API_BASE}/api/seo/article/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate article');
  }

  return response.json();
}

// Country options for keyword research
export const COUNTRY_OPTIONS = [
  { value: 'us', label: 'United States' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'es', label: 'Spain' },
  { value: 'it', label: 'Italy' },
  { value: 'nl', label: 'Netherlands' },
  { value: 'br', label: 'Brazil' },
  { value: 'mx', label: 'Mexico' },
  { value: 'in', label: 'India' },
  { value: 'jp', label: 'Japan' },
  { value: 'kr', label: 'South Korea' },
  { value: 'sg', label: 'Singapore' }
];

// Tone options for article generation
export const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual & Friendly' },
  { value: 'academic', label: 'Academic' },
  { value: 'conversational', label: 'Conversational' }
];

// Length options for article generation
export const LENGTH_OPTIONS = [
  { value: 'short', label: 'Short (800-1000 words)' },
  { value: 'medium', label: 'Medium (1500-2000 words)' },
  { value: 'long', label: 'Long (2500-3500 words)' }
];
