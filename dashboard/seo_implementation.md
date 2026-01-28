# Subzero SEO Implementation Guide

A step-by-step technical implementation plan for executing the SEO strategy with waitlist integration.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Phase 0: Foundation Setup](#phase-0-foundation-setup)
3. [Phase 1: Core Infrastructure](#phase-1-core-infrastructure)
4. [Phase 2: Waitlist & Lead Capture](#phase-2-waitlist--lead-capture)
5. [Phase 3: Content Pages](#phase-3-content-pages)
6. [Phase 4: Programmatic SEO Pages](#phase-4-programmatic-seo-pages)
7. [Phase 5: Internal Linking System](#phase-5-internal-linking-system)
8. [Phase 6: GitHub Actions & Automation](#phase-6-github-actions--automation)
9. [Phase 7: Analytics & Monitoring](#phase-7-analytics--monitoring)
10. [Task Checklist](#task-checklist)

---

## Project Overview

### Goals
- Launch SEO-optimized marketing site with waitlist
- Implement programmatic SEO for scalable content
- Automate content deployment via GitHub Actions
- Capture leads through strategic CTAs

### Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (waitlist, analytics)
- **Email:** Resend or SendGrid
- **Deployment:** Vercel
- **CI/CD:** GitHub Actions
- **Analytics:** Google Analytics 4 + Search Console

### Directory Structure
```
dashboard/src/app/
├── (marketing)/                    # Marketing pages group
│   ├── page.tsx                    # Homepage
│   ├── layout.tsx                  # Marketing layout with nav/footer
│   ├── pricing/
│   ├── features/
│   ├── about/
│   └── contact/
├── blog/
│   ├── page.tsx                    # Blog index
│   └── [slug]/
│       └── page.tsx                # Blog posts
├── solutions/                      # Industry solutions
│   ├── page.tsx                    # Solutions hub
│   ├── pharmaceutical/
│   ├── food-service/
│   ├── logistics/
│   └── [equipment]/                # Programmatic equipment pages
│       └── page.tsx
├── compliance/
│   ├── page.tsx                    # Compliance hub
│   ├── haccp/
│   ├── fda/
│   └── [state]/                    # Programmatic state pages
│       └── page.tsx
├── temperature-guide/
│   ├── page.tsx                    # Temperature guide hub
│   └── [food-item]/                # Programmatic food pages
│       └── page.tsx
├── compare/
│   └── [competitor]/               # Competitor comparisons
│       └── page.tsx
├── tools/
│   ├── roi-calculator/
│   ├── compliance-checker/
│   └── temperature-lookup/
├── resources/
│   ├── guides/
│   ├── case-studies/
│   └── downloads/
└── api/
    ├── waitlist/
    │   └── route.ts
    ├── subscribe/
    │   └── route.ts
    └── og/
        └── route.tsx               # Dynamic OG images
```

---

## Phase 0: Foundation Setup

### Task 0.1: Project Configuration

**0.1.1 - Update next.config.js for SEO**
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['images.unsplash.com'], // Add image domains
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Add redirects for old URLs if migrating
    ];
  },
};

module.exports = nextConfig;
```

**0.1.2 - Install Required Dependencies**
```bash
npm install @vercel/og resend @supabase/supabase-js
npm install -D @types/node
```

**0.1.3 - Environment Variables**
```env
# .env.local
NEXT_PUBLIC_SITE_URL=https://subzero.io
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

### Task 0.2: Supabase Database Setup

**0.2.1 - Create Waitlist Table**
```sql
-- Create waitlist table
CREATE TABLE waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  company TEXT,
  industry TEXT,
  source TEXT,                    -- Which page they signed up from
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Create index for faster lookups
CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_created ON waitlist(created_at DESC);

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Policy for insert (anyone can join waitlist)
CREATE POLICY "Anyone can join waitlist" ON waitlist
  FOR INSERT WITH CHECK (true);

-- Policy for service role only select
CREATE POLICY "Service role can read waitlist" ON waitlist
  FOR SELECT USING (auth.role() = 'service_role');
```

**0.2.2 - Create Page Analytics Table**
```sql
-- Track page performance for SEO
CREATE TABLE page_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path TEXT NOT NULL,
  page_type TEXT,                 -- 'programmatic', 'blog', 'landing'
  template TEXT,                  -- 'food-temp', 'state-compliance', etc.
  views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  avg_time_on_page INTERVAL,
  bounce_rate DECIMAL(5,2),
  conversions INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_page_analytics_path ON page_analytics(page_path);
```

---

## Phase 1: Core Infrastructure

### Task 1.1: SEO Utility Components

**1.1.1 - Create SEO Metadata Utility**

Create file: `src/lib/seo.ts`
```typescript
import { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://subzero.io';
const SITE_NAME = 'Subzero Asset Command';

interface SEOProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
  noIndex?: boolean;
}

export function generateSEOMetadata({
  title,
  description,
  path,
  image,
  type = 'website',
  publishedTime,
  modifiedTime,
  keywords = [],
  noIndex = false,
}: SEOProps): Metadata {
  const url = `${SITE_URL}${path}`;
  const ogImage = image || `${SITE_URL}/api/og?title=${encodeURIComponent(title)}`;

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    robots: noIndex ? 'noindex, nofollow' : 'index, follow',
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      locale: 'en_US',
      type,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: '@subzeroiot',
    },
  };
}

export function generateArticleSchema(article: {
  title: string;
  description: string;
  path: string;
  publishedTime: string;
  modifiedTime?: string;
  author?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    url: `${SITE_URL}${article.path}`,
    datePublished: article.publishedTime,
    dateModified: article.modifiedTime || article.publishedTime,
    author: {
      '@type': 'Organization',
      name: article.author || SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
  };
}

export function generateProductSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Subzero Asset Command',
    description: 'Enterprise cold chain monitoring system with real-time temperature alerts and compliance reporting',
    brand: {
      '@type': 'Brand',
      name: 'Subzero',
    },
    category: 'Temperature Monitoring Systems',
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/PreOrder',
      priceCurrency: 'USD',
      priceValidUntil: '2026-12-31',
    },
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateBreadcrumbSchema(
  items: { name: string; path: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
```

**1.1.2 - Create JSON-LD Component**

Create file: `src/components/seo/json-ld.tsx`
```typescript
interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

**1.1.3 - Create Dynamic OG Image Generator**

Create file: `src/app/api/og/route.tsx`
```typescript
import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'Subzero Asset Command';
  const subtitle = searchParams.get('subtitle') || 'Cold Chain Monitoring';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(to bottom right, #0f172a, #1e3a5f)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 80px',
          }}
        >
          {/* Logo placeholder */}
          <div
            style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: '#38bdf8',
              marginBottom: 20,
            }}
          >
            ❄️ SUBZERO
          </div>
          <div
            style={{
              fontSize: 60,
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              maxWidth: 900,
              lineHeight: 1.2,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 28,
              color: '#94a3b8',
              marginTop: 20,
              textAlign: 'center',
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

### Task 1.2: Sitemap & Robots Configuration

**1.2.1 - Create Dynamic Sitemap**

Create file: `src/app/sitemap.ts`
```typescript
import { MetadataRoute } from 'next';
import { getAllFoodItems } from '@/lib/data/food-items';
import { getAllStates } from '@/lib/data/states';
import { getAllEquipment } from '@/lib/data/equipment';
import { getAllBlogPosts } from '@/lib/data/blog';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://subzero.io';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages = [
    { url: '', priority: 1.0, changeFrequency: 'weekly' as const },
    { url: '/features', priority: 0.9, changeFrequency: 'monthly' as const },
    { url: '/pricing', priority: 0.9, changeFrequency: 'monthly' as const },
    { url: '/about', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/contact', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/blog', priority: 0.8, changeFrequency: 'daily' as const },
    { url: '/solutions', priority: 0.9, changeFrequency: 'weekly' as const },
    { url: '/solutions/pharmaceutical', priority: 0.8, changeFrequency: 'monthly' as const },
    { url: '/solutions/food-service', priority: 0.8, changeFrequency: 'monthly' as const },
    { url: '/solutions/logistics', priority: 0.8, changeFrequency: 'monthly' as const },
    { url: '/compliance', priority: 0.9, changeFrequency: 'weekly' as const },
    { url: '/compliance/haccp', priority: 0.8, changeFrequency: 'monthly' as const },
    { url: '/compliance/fda', priority: 0.8, changeFrequency: 'monthly' as const },
    { url: '/temperature-guide', priority: 0.9, changeFrequency: 'weekly' as const },
    { url: '/tools/roi-calculator', priority: 0.8, changeFrequency: 'monthly' as const },
  ];

  // Programmatic pages - Food items
  const foodItems = await getAllFoodItems();
  const foodPages = foodItems.map((item) => ({
    url: `/temperature-guide/${item.slug}`,
    priority: 0.7,
    changeFrequency: 'monthly' as const,
    lastModified: item.updatedAt,
  }));

  // Programmatic pages - State compliance
  const states = await getAllStates();
  const statePages = states.map((state) => ({
    url: `/compliance/${state.slug}`,
    priority: 0.7,
    changeFrequency: 'monthly' as const,
    lastModified: state.updatedAt,
  }));

  // Programmatic pages - Equipment
  const equipment = await getAllEquipment();
  const equipmentPages = equipment.map((item) => ({
    url: `/solutions/${item.slug}`,
    priority: 0.7,
    changeFrequency: 'monthly' as const,
    lastModified: item.updatedAt,
  }));

  // Blog posts
  const blogPosts = await getAllBlogPosts();
  const blogPages = blogPosts.map((post) => ({
    url: `/blog/${post.slug}`,
    priority: 0.6,
    changeFrequency: 'weekly' as const,
    lastModified: post.updatedAt,
  }));

  // Combine all pages
  const allPages = [
    ...staticPages,
    ...foodPages,
    ...statePages,
    ...equipmentPages,
    ...blogPages,
  ];

  return allPages.map((page) => ({
    url: `${SITE_URL}${page.url}`,
    lastModified: page.lastModified || new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
```

**1.2.2 - Create Robots.txt**

Create file: `src/app/robots.ts`
```typescript
import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://subzero.io';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/_next/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
```

---

## Phase 2: Waitlist & Lead Capture

### Task 2.1: Waitlist API Endpoint

**2.1.1 - Create Waitlist API Route**

Create file: `src/app/api/waitlist/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, company, industry, source } = body;

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Extract UTM parameters from referrer or body
    const utmSource = body.utm_source || null;
    const utmMedium = body.utm_medium || null;
    const utmCampaign = body.utm_campaign || null;

    // Insert into waitlist
    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        email: email.toLowerCase().trim(),
        name,
        company,
        industry,
        source,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
      })
      .select()
      .single();

    if (error) {
      // Check if duplicate
      if (error.code === '23505') {
        return NextResponse.json(
          { message: 'You are already on the waitlist!' },
          { status: 200 }
        );
      }
      throw error;
    }

    // Send confirmation email
    await resend.emails.send({
      from: 'Subzero <hello@subzero.io>',
      to: email,
      subject: "You're on the Subzero waitlist! 🎉",
      html: `
        <h1>Welcome to Subzero!</h1>
        <p>Hi${name ? ` ${name}` : ''},</p>
        <p>Thanks for joining our waitlist. You're now in line for early access to Subzero Asset Command - the future of cold chain monitoring.</p>
        <p>We'll notify you as soon as we're ready to onboard new users.</p>
        <p>In the meantime, here are some resources:</p>
        <ul>
          <li><a href="https://subzero.io/blog">Read our blog</a></li>
          <li><a href="https://subzero.io/temperature-guide">Explore our temperature guides</a></li>
          <li><a href="https://subzero.io/tools/roi-calculator">Calculate your ROI</a></li>
        </ul>
        <p>Best,<br>The Subzero Team</p>
      `,
    });

    return NextResponse.json({
      message: 'Successfully joined waitlist',
      position: data.id,
    });
  } catch (error) {
    console.error('Waitlist error:', error);
    return NextResponse.json(
      { error: 'Failed to join waitlist' },
      { status: 500 }
    );
  }
}
```

### Task 2.2: Waitlist UI Components

**2.2.1 - Create Waitlist Form Component**

Create file: `src/components/waitlist/waitlist-form.tsx`
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WaitlistFormProps {
  source: string;
  variant?: 'inline' | 'full';
  onSuccess?: () => void;
}

const industries = [
  { value: 'pharmaceutical', label: 'Pharmaceutical / Healthcare' },
  { value: 'food-service', label: 'Food Service / Restaurant' },
  { value: 'logistics', label: 'Logistics / Distribution' },
  { value: 'grocery', label: 'Grocery / Retail' },
  { value: 'facility', label: 'Facility Management' },
  { value: 'other', label: 'Other' },
];

export function WaitlistForm({
  source,
  variant = 'full',
  onSuccess,
}: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Get UTM params from URL
    const urlParams = new URLSearchParams(window.location.search);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: variant === 'full' ? name : undefined,
          company: variant === 'full' ? company : undefined,
          industry: variant === 'full' ? industry : undefined,
          source,
          utm_source: urlParams.get('utm_source'),
          utm_medium: urlParams.get('utm_medium'),
          utm_campaign: urlParams.get('utm_campaign'),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      setMessage(data.message);
      setEmail('');
      setName('');
      setCompany('');
      setIndustry('');
      onSuccess?.();

      // Track conversion
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'waitlist_signup', {
          event_category: 'conversion',
          event_label: source,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'inline') {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Joining...' : 'Join Waitlist'}
        </Button>
        {message && <p className="text-green-600 text-sm mt-2">{message}</p>}
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="John Smith"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Company</Label>
        <Input
          id="company"
          type="text"
          placeholder="Acme Inc."
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="industry">Industry</Label>
        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger>
            <SelectValue placeholder="Select your industry" />
          </SelectTrigger>
          <SelectContent>
            {industries.map((ind) => (
              <SelectItem key={ind.value} value={ind.value}>
                {ind.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Joining...' : 'Join the Waitlist'}
      </Button>

      {message && (
        <p className="text-green-600 text-sm text-center">{message}</p>
      )}
      {error && <p className="text-red-600 text-sm text-center">{error}</p>}
    </form>
  );
}
```

**2.2.2 - Create CTA Banner Component**

Create file: `src/components/waitlist/cta-banner.tsx`
```typescript
import { WaitlistForm } from './waitlist-form';

interface CTABannerProps {
  title?: string;
  description?: string;
  source: string;
}

export function CTABanner({
  title = 'Ready to protect your cold chain?',
  description = 'Join the waitlist for early access to Subzero Asset Command.',
  source,
}: CTABannerProps) {
  return (
    <section className="bg-gradient-to-r from-blue-900 to-cyan-900 py-16 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>
        <p className="text-lg text-blue-100 mb-8">{description}</p>
        <div className="max-w-md mx-auto">
          <WaitlistForm source={source} variant="inline" />
        </div>
      </div>
    </section>
  );
}
```

**2.2.3 - Create Exit Intent Popup**

Create file: `src/components/waitlist/exit-intent.tsx`
```typescript
'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { WaitlistForm } from './waitlist-form';

export function ExitIntentPopup() {
  const [open, setOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Check if already shown this session
    if (sessionStorage.getItem('exitIntentShown')) {
      setHasShown(true);
      return;
    }

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasShown) {
        setOpen(true);
        setHasShown(true);
        sessionStorage.setItem('exitIntentShown', 'true');
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [hasShown]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Wait! Don't miss out 🥶</DialogTitle>
          <DialogDescription>
            Join 500+ companies on the waitlist for early access to Subzero
            Asset Command.
          </DialogDescription>
        </DialogHeader>
        <WaitlistForm
          source="exit-intent"
          variant="full"
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
```

---

## Phase 3: Content Pages

### Task 3.1: Homepage

**3.1.1 - Create Homepage**

Create file: `src/app/(marketing)/page.tsx`
```typescript
import { Metadata } from 'next';
import { generateSEOMetadata, generateProductSchema } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';
import { WaitlistForm } from '@/components/waitlist/waitlist-form';
import { CTABanner } from '@/components/waitlist/cta-banner';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Cold Chain Monitoring System',
  description:
    'Subzero Asset Command provides real-time temperature monitoring, automated alerts, and compliance reporting for pharmaceutical, food service, and logistics industries.',
  path: '/',
  keywords: [
    'cold chain monitoring',
    'temperature monitoring system',
    'freezer temperature logger',
    'HACCP compliance',
    'vaccine storage monitoring',
  ],
});

export default function HomePage() {
  return (
    <>
      <JsonLd data={generateProductSchema()} />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-slate-900 to-slate-800 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold text-white mb-6">
                Cold Chain Monitoring That Never Sleeps
              </h1>
              <p className="text-xl text-slate-300 mb-8">
                Protect your temperature-sensitive products with real-time
                monitoring, instant alerts, and automated compliance reporting.
              </p>
              <div className="bg-white/10 backdrop-blur rounded-lg p-6">
                <p className="text-white font-medium mb-4">
                  Join the waitlist for early access
                </p>
                <WaitlistForm source="homepage-hero" variant="inline" />
              </div>
            </div>
            <div className="relative">
              {/* Dashboard preview image */}
              <div className="bg-slate-700 rounded-lg aspect-video flex items-center justify-center">
                <span className="text-slate-400">Dashboard Preview</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need for cold chain compliance
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="p-6 border rounded-lg">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Built for your industry
          </h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Whether you're storing vaccines, managing restaurant coolers, or
            monitoring transport, Subzero has you covered.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {industries.map((industry) => (
              <a
                key={industry.slug}
                href={`/solutions/${industry.slug}`}
                className="block p-6 bg-white rounded-lg border hover:shadow-lg transition"
              >
                <h3 className="text-lg font-semibold mb-2">{industry.name}</h3>
                <p className="text-slate-600 text-sm">{industry.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-lg text-slate-600 mb-8">
            Trusted by teams managing temperature-sensitive products
          </p>
          <div className="flex justify-center gap-12 opacity-50">
            {/* Logo placeholders */}
            <div className="h-8 w-24 bg-slate-200 rounded" />
            <div className="h-8 w-24 bg-slate-200 rounded" />
            <div className="h-8 w-24 bg-slate-200 rounded" />
            <div className="h-8 w-24 bg-slate-200 rounded" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <CTABanner source="homepage-bottom" />
    </>
  );
}

const features = [
  {
    icon: '🌡️',
    title: 'Real-Time Monitoring',
    description:
      'Track temperatures across all your locations with live dashboards and instant visibility.',
  },
  {
    icon: '🚨',
    title: 'Smart Alerts',
    description:
      'Get notified via SMS, email, or call before temperatures reach critical levels.',
  },
  {
    icon: '📋',
    title: 'Automated Compliance',
    description:
      'Generate HACCP, FDA, and CDC-compliant reports automatically. Always audit-ready.',
  },
  {
    icon: '📱',
    title: 'Mobile Access',
    description:
      'Monitor your cold chain from anywhere with our iOS and Android apps.',
  },
  {
    icon: '🔌',
    title: 'Easy Installation',
    description:
      'Wireless sensors install in minutes. No electrician required.',
  },
  {
    icon: '📊',
    title: 'Analytics & Insights',
    description:
      'Identify trends, predict failures, and optimize your cold chain operations.',
  },
];

const industries = [
  {
    slug: 'pharmaceutical',
    name: 'Pharmaceutical & Healthcare',
    description:
      'CDC and FDA compliant monitoring for vaccines, medications, and blood products.',
  },
  {
    slug: 'food-service',
    name: 'Food Service & Restaurants',
    description:
      'HACCP-ready temperature logging for walk-ins, reach-ins, and prep areas.',
  },
  {
    slug: 'logistics',
    name: 'Logistics & Distribution',
    description:
      'In-transit monitoring for reefers, cold storage, and distribution centers.',
  },
];
```

### Task 3.2: Industry Solution Pages

**3.2.1 - Create Solution Page Template**

Create file: `src/app/(marketing)/solutions/[industry]/page.tsx`
```typescript
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';
import { CTABanner } from '@/components/waitlist/cta-banner';
import { getIndustryData, getAllIndustries } from '@/lib/data/industries';

interface PageProps {
  params: { industry: string };
}

export async function generateStaticParams() {
  const industries = await getAllIndustries();
  return industries.map((industry) => ({ industry: industry.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const industry = await getIndustryData(params.industry);
  if (!industry) return {};

  return generateSEOMetadata({
    title: industry.metaTitle,
    description: industry.metaDescription,
    path: `/solutions/${params.industry}`,
    keywords: industry.keywords,
  });
}

export default async function IndustryPage({ params }: PageProps) {
  const industry = await getIndustryData(params.industry);
  if (!industry) notFound();

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Solutions', path: '/solutions' },
    { name: industry.name, path: `/solutions/${params.industry}` },
  ];

  return (
    <>
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} />

      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-cyan-400 font-medium mb-4">{industry.tagline}</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {industry.headline}
          </h1>
          <p className="text-xl text-slate-300 mb-8">{industry.description}</p>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">
            Challenges in {industry.name}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {industry.painPoints.map((point, i) => (
              <div key={i} className="flex gap-4 p-4 bg-red-50 rounded-lg">
                <span className="text-red-500 text-2xl">⚠️</span>
                <div>
                  <h3 className="font-semibold">{point.title}</h3>
                  <p className="text-slate-600 text-sm">{point.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">
            How Subzero Helps
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {industry.solutions.map((solution, i) => (
              <div key={i} className="p-6 bg-white rounded-lg border">
                <h3 className="font-semibold mb-2">{solution.title}</h3>
                <p className="text-slate-600 text-sm">{solution.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">
            Compliance Made Easy
          </h2>
          <div className="flex flex-wrap gap-4">
            {industry.compliance.map((item, i) => (
              <a
                key={i}
                href={item.link}
                className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition"
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Related Content */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Related Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {industry.relatedContent.map((content, i) => (
              <a
                key={i}
                href={content.link}
                className="block p-4 bg-white rounded-lg border hover:shadow transition"
              >
                <span className="text-xs text-slate-500 uppercase">
                  {content.type}
                </span>
                <h3 className="font-medium mt-1">{content.title}</h3>
              </a>
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        title={`Ready to modernize your ${industry.name.toLowerCase()} cold chain?`}
        source={`solution-${params.industry}`}
      />
    </>
  );
}
```

---

## Phase 4: Programmatic SEO Pages

### Task 4.1: Data Files Setup

**4.1.1 - Create Food Items Data**

Create file: `src/lib/data/food-items.ts`
```typescript
export interface FoodItem {
  slug: string;
  name: string;
  category: string;
  fridgeTemp: number;
  fridgeTempMax?: number;
  fridgeDays: number;
  freezerTemp: number;
  freezerMonths: number;
  dangerZone: boolean;
  cookTemp?: number;
  description: string;
  storageNotes: string[];
  spoilageIndicators: string[];
  relatedItems: string[];
  searchVolume: number;
  updatedAt: Date;
}

export const foodItems: FoodItem[] = [
  {
    slug: 'chicken',
    name: 'Chicken',
    category: 'Poultry',
    fridgeTemp: 40,
    fridgeDays: 2,
    freezerTemp: 0,
    freezerMonths: 9,
    dangerZone: true,
    cookTemp: 165,
    description: 'Raw chicken should be stored at 40°F (4°C) or below and used within 1-2 days of purchase.',
    storageNotes: [
      'Store on the bottom shelf to prevent drips onto other foods',
      'Keep in original packaging or airtight container',
      'Never leave at room temperature for more than 2 hours',
    ],
    spoilageIndicators: [
      'Slimy or sticky texture',
      'Gray or green discoloration',
      'Sour or ammonia-like smell',
    ],
    relatedItems: ['turkey', 'ground-chicken', 'chicken-breast'],
    searchVolume: 4400,
    updatedAt: new Date('2026-01-15'),
  },
  {
    slug: 'milk',
    name: 'Milk',
    category: 'Dairy',
    fridgeTemp: 38,
    fridgeTempMax: 40,
    fridgeDays: 7,
    freezerTemp: 0,
    freezerMonths: 3,
    dangerZone: true,
    description: 'Milk should be stored at 38-40°F (3-4°C) and consumed by the sell-by date.',
    storageNotes: [
      'Store on interior shelves, not in the door',
      'Keep container tightly closed',
      'Return to refrigerator promptly after use',
    ],
    spoilageIndicators: [
      'Sour smell',
      'Lumpy or chunky texture',
      'Yellow discoloration',
    ],
    relatedItems: ['cream', 'half-and-half', 'buttermilk'],
    searchVolume: 5400,
    updatedAt: new Date('2026-01-15'),
  },
  // Add more food items...
];

export async function getAllFoodItems(): Promise<FoodItem[]> {
  return foodItems;
}

export async function getFoodItem(slug: string): Promise<FoodItem | undefined> {
  return foodItems.find((item) => item.slug === slug);
}

export async function getFoodItemsByCategory(category: string): Promise<FoodItem[]> {
  return foodItems.filter((item) => item.category === category);
}
```

**4.1.2 - Create States Data**

Create file: `src/lib/data/states.ts`
```typescript
export interface StateCompliance {
  slug: string;
  name: string;
  abbreviation: string;
  healthDept: string;
  healthDeptUrl: string;
  coldHoldingTemp: number;
  hotHoldingTemp: number;
  regulationCode: string;
  inspectionFrequency: string;
  penaltyRange: string;
  additionalRequirements: string[];
  resources: { name: string; url: string }[];
  updatedAt: Date;
}

export const states: StateCompliance[] = [
  {
    slug: 'california',
    name: 'California',
    abbreviation: 'CA',
    healthDept: 'California Department of Public Health',
    healthDeptUrl: 'https://www.cdph.ca.gov/',
    coldHoldingTemp: 41,
    hotHoldingTemp: 135,
    regulationCode: 'California Retail Food Code (CalCode)',
    inspectionFrequency: '1-3 times per year based on risk category',
    penaltyRange: '$100 - $1,000 per violation',
    additionalRequirements: [
      'Food handler certification required within 30 days of employment',
      'Person-in-charge must be present during all operating hours',
      'Temperature logs must be maintained for 90 days',
    ],
    resources: [
      { name: 'CalCode Full Text', url: 'https://www.cdph.ca.gov/Programs/CEH/DFDCS/CDPH%20Document%20Library/FDB/FoodSafetyProgram/RetailFood/CalCodeText.pdf' },
      { name: 'Food Safety Training', url: 'https://www.cdph.ca.gov/Programs/CEH/DFDCS/Pages/FDBPrograms/FoodSafetyProgram.aspx' },
    ],
    updatedAt: new Date('2026-01-10'),
  },
  {
    slug: 'texas',
    name: 'Texas',
    abbreviation: 'TX',
    healthDept: 'Texas Department of State Health Services',
    healthDeptUrl: 'https://www.dshs.texas.gov/',
    coldHoldingTemp: 41,
    hotHoldingTemp: 135,
    regulationCode: 'Texas Food Establishment Rules (TFER)',
    inspectionFrequency: '1-4 times per year based on risk',
    penaltyRange: '$100 - $500 per violation',
    additionalRequirements: [
      'Certified food manager required on-site',
      'Employee health policy must be posted',
      'HACCP plan required for certain processes',
    ],
    resources: [
      { name: 'TFER Rules', url: 'https://www.dshs.texas.gov/foods/rules.aspx' },
    ],
    updatedAt: new Date('2026-01-10'),
  },
  // Add all 50 states...
];

export async function getAllStates(): Promise<StateCompliance[]> {
  return states;
}

export async function getStateData(slug: string): Promise<StateCompliance | undefined> {
  return states.find((state) => state.slug === slug);
}
```

### Task 4.2: Programmatic Page Templates

**4.2.1 - Create Food Temperature Page**

Create file: `src/app/(marketing)/temperature-guide/[food-item]/page.tsx`
```typescript
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  generateSEOMetadata,
  generateFAQSchema,
  generateBreadcrumbSchema,
} from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';
import { CTABanner } from '@/components/waitlist/cta-banner';
import { getAllFoodItems, getFoodItem, getFoodItemsByCategory } from '@/lib/data/food-items';

interface PageProps {
  params: { 'food-item': string };
}

export async function generateStaticParams() {
  const items = await getAllFoodItems();
  return items.map((item) => ({ 'food-item': item.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const item = await getFoodItem(params['food-item']);
  if (!item) return {};

  return generateSEOMetadata({
    title: `${item.name} Storage Temperature Guide`,
    description: `Learn the safe storage temperature for ${item.name}. Refrigerator: ${item.fridgeTemp}°F for up to ${item.fridgeDays} days. Freezer: ${item.freezerTemp}°F for up to ${item.freezerMonths} months.`,
    path: `/temperature-guide/${item.slug}`,
    keywords: [
      `${item.name.toLowerCase()} storage temperature`,
      `${item.name.toLowerCase()} refrigerator temp`,
      `how long does ${item.name.toLowerCase()} last`,
      `${item.name.toLowerCase()} safe temperature`,
    ],
  });
}

export default async function FoodTemperaturePage({ params }: PageProps) {
  const item = await getFoodItem(params['food-item']);
  if (!item) notFound();

  const relatedItems = await Promise.all(
    item.relatedItems.map((slug) => getFoodItem(slug))
  );
  const categoryItems = await getFoodItemsByCategory(item.category);

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Temperature Guide', path: '/temperature-guide' },
    { name: item.name, path: `/temperature-guide/${item.slug}` },
  ];

  const faqs = [
    {
      question: `What temperature should ${item.name.toLowerCase()} be stored at?`,
      answer: `${item.name} should be stored at ${item.fridgeTemp}°F (${Math.round((item.fridgeTemp - 32) * 5/9)}°C) or below in the refrigerator.`,
    },
    {
      question: `How long does ${item.name.toLowerCase()} last in the refrigerator?`,
      answer: `${item.name} can be safely stored in the refrigerator for up to ${item.fridgeDays} days when kept at proper temperature.`,
    },
    {
      question: `Can you freeze ${item.name.toLowerCase()}?`,
      answer: `Yes, ${item.name.toLowerCase()} can be frozen at ${item.freezerTemp}°F (${Math.round((item.freezerTemp - 32) * 5/9)}°C) or below for up to ${item.freezerMonths} months.`,
    },
    {
      question: `How do you know if ${item.name.toLowerCase()} has gone bad?`,
      answer: `Signs of spoilage include: ${item.spoilageIndicators.join(', ')}.`,
    },
  ];

  return (
    <>
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} />
      <JsonLd data={generateFAQSchema(faqs)} />

      {/* Breadcrumbs */}
      <nav className="bg-slate-100 py-3 px-4">
        <div className="max-w-6xl mx-auto">
          <ol className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <li key={crumb.path} className="flex items-center gap-2">
                {i > 0 && <span className="text-slate-400">/</span>}
                {i === breadcrumbs.length - 1 ? (
                  <span className="text-slate-600">{crumb.name}</span>
                ) : (
                  <Link href={crumb.path} className="text-blue-600 hover:underline">
                    {crumb.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </div>
      </nav>

      {/* Main Content */}
      <article className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <p className="text-blue-600 font-medium mb-2">{item.category}</p>
            <h1 className="text-4xl font-bold mb-4">
              {item.name} Storage Temperature Guide
            </h1>
            <p className="text-xl text-slate-600">{item.description}</p>
          </header>

          {/* Quick Reference Table */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Quick Reference</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border p-3 text-left">Storage Type</th>
                    <th className="border p-3 text-left">Temperature</th>
                    <th className="border p-3 text-left">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-3">Refrigerator</td>
                    <td className="border p-3 font-medium">
                      {item.fridgeTemp}°F ({Math.round((item.fridgeTemp - 32) * 5/9)}°C)
                      {item.fridgeTempMax && ` - ${item.fridgeTempMax}°F`}
                    </td>
                    <td className="border p-3">{item.fridgeDays} days</td>
                  </tr>
                  <tr>
                    <td className="border p-3">Freezer</td>
                    <td className="border p-3 font-medium">
                      {item.freezerTemp}°F ({Math.round((item.freezerTemp - 32) * 5/9)}°C) or below
                    </td>
                    <td className="border p-3">{item.freezerMonths} months</td>
                  </tr>
                  {item.cookTemp && (
                    <tr>
                      <td className="border p-3">Safe Cooking Temp</td>
                      <td className="border p-3 font-medium">
                        {item.cookTemp}°F ({Math.round((item.cookTemp - 32) * 5/9)}°C)
                      </td>
                      <td className="border p-3">Internal temperature</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Danger Zone Warning */}
          {item.dangerZone && (
            <section className="mb-12 p-6 bg-red-50 border border-red-200 rounded-lg">
              <h2 className="text-xl font-bold text-red-800 mb-2">
                ⚠️ Danger Zone Warning
              </h2>
              <p className="text-red-700">
                {item.name} is susceptible to bacterial growth in the danger zone
                (40°F - 140°F / 4°C - 60°C). Never leave at room temperature for
                more than 2 hours (1 hour if above 90°F).
              </p>
            </section>
          )}

          {/* Storage Notes */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Storage Best Practices</h2>
            <ul className="space-y-3">
              {item.storageNotes.map((note, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-green-500">✓</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Spoilage Indicators */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Signs of Spoilage</h2>
            <p className="text-slate-600 mb-4">
              Discard {item.name.toLowerCase()} if you notice any of these signs:
            </p>
            <ul className="space-y-2">
              {item.spoilageIndicators.map((indicator, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-red-500">✗</span>
                  <span>{indicator}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Monitoring CTA */}
          <section className="mb-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-xl font-bold mb-2">
              Never Worry About Temperature Again
            </h2>
            <p className="text-slate-600 mb-4">
              Subzero monitors your refrigerators and freezers 24/7, alerting you
              instantly if temperatures drift into the danger zone.
            </p>
            <Link
              href="/#waitlist"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Join the Waitlist
            </Link>
          </section>

          {/* FAQ Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, i) => (
                <div key={i}>
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-slate-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Related Items */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Related Temperature Guides</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {relatedItems.filter(Boolean).map((related) => (
                <Link
                  key={related!.slug}
                  href={`/temperature-guide/${related!.slug}`}
                  className="block p-4 border rounded-lg hover:shadow transition"
                >
                  <h3 className="font-medium">{related!.name}</h3>
                  <p className="text-sm text-slate-600">
                    {related!.fridgeTemp}°F / {related!.fridgeDays} days
                  </p>
                </Link>
              ))}
            </div>
          </section>

          {/* Category Items */}
          <section>
            <h2 className="text-2xl font-bold mb-4">
              More {item.category} Storage Guides
            </h2>
            <div className="flex flex-wrap gap-2">
              {categoryItems
                .filter((cat) => cat.slug !== item.slug)
                .slice(0, 10)
                .map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/temperature-guide/${cat.slug}`}
                    className="px-3 py-1 bg-slate-100 rounded-full text-sm hover:bg-slate-200 transition"
                  >
                    {cat.name}
                  </Link>
                ))}
            </div>
          </section>
        </div>
      </article>

      <CTABanner
        title="Automate your temperature monitoring"
        description="Get real-time alerts before food spoils. Join 500+ businesses on the waitlist."
        source={`temperature-guide-${item.slug}`}
      />
    </>
  );
}
```

**4.2.2 - Create State Compliance Page**

Create file: `src/app/(marketing)/compliance/[state]/page.tsx`
```typescript
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';
import { CTABanner } from '@/components/waitlist/cta-banner';
import { getAllStates, getStateData } from '@/lib/data/states';

interface PageProps {
  params: { state: string };
}

export async function generateStaticParams() {
  const states = await getAllStates();
  return states.map((state) => ({ state: state.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const state = await getStateData(params.state);
  if (!state) return {};

  return generateSEOMetadata({
    title: `${state.name} Food Safety Temperature Requirements`,
    description: `Complete guide to ${state.name} food safety regulations. Cold holding: ${state.coldHoldingTemp}°F. Hot holding: ${state.hotHoldingTemp}°F. Inspections: ${state.inspectionFrequency}.`,
    path: `/compliance/${state.slug}`,
    keywords: [
      `${state.name.toLowerCase()} food safety regulations`,
      `${state.abbreviation} health code temperature`,
      `${state.name.toLowerCase()} restaurant compliance`,
      `${state.name.toLowerCase()} HACCP requirements`,
    ],
  });
}

export default async function StateCompliancePage({ params }: PageProps) {
  const state = await getStateData(params.state);
  if (!state) notFound();

  const allStates = await getAllStates();

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Compliance', path: '/compliance' },
    { name: state.name, path: `/compliance/${state.slug}` },
  ];

  return (
    <>
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} />

      {/* Breadcrumbs */}
      <nav className="bg-slate-100 py-3 px-4">
        <div className="max-w-6xl mx-auto">
          <ol className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <li key={crumb.path} className="flex items-center gap-2">
                {i > 0 && <span className="text-slate-400">/</span>}
                {i === breadcrumbs.length - 1 ? (
                  <span className="text-slate-600">{crumb.name}</span>
                ) : (
                  <Link href={crumb.path} className="text-blue-600 hover:underline">
                    {crumb.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </div>
      </nav>

      {/* Main Content */}
      <article className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-4">
              {state.name} Food Safety Temperature Requirements
            </h1>
            <p className="text-xl text-slate-600">
              Complete guide to food temperature regulations under the{' '}
              {state.regulationCode}. Regulated by the {state.healthDept}.
            </p>
          </header>

          {/* Quick Reference */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">
              Required Temperatures in {state.name}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border p-3 text-left">Requirement</th>
                    <th className="border p-3 text-left">Temperature</th>
                    <th className="border p-3 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-3 font-medium">Cold Holding</td>
                    <td className="border p-3">
                      {state.coldHoldingTemp}°F ({Math.round((state.coldHoldingTemp - 32) * 5/9)}°C) or below
                    </td>
                    <td className="border p-3 text-slate-600">
                      All TCS foods in refrigeration
                    </td>
                  </tr>
                  <tr>
                    <td className="border p-3 font-medium">Hot Holding</td>
                    <td className="border p-3">
                      {state.hotHoldingTemp}°F ({Math.round((state.hotHoldingTemp - 32) * 5/9)}°C) or above
                    </td>
                    <td className="border p-3 text-slate-600">
                      Cooked foods kept for service
                    </td>
                  </tr>
                  <tr>
                    <td className="border p-3 font-medium">Danger Zone</td>
                    <td className="border p-3">
                      41°F - 135°F (5°C - 57°C)
                    </td>
                    <td className="border p-3 text-slate-600">
                      Max 4 hours cumulative exposure
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Inspection Info */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">
              Inspections & Enforcement
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Inspection Frequency</h3>
                <p className="text-slate-600">{state.inspectionFrequency}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Penalty Range</h3>
                <p className="text-slate-600">{state.penaltyRange}</p>
              </div>
            </div>
          </section>

          {/* Additional Requirements */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">
              {state.name}-Specific Requirements
            </h2>
            <ul className="space-y-3">
              {state.additionalRequirements.map((req, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-blue-500">•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Resources */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Official Resources</h2>
            <div className="space-y-3">
              <a
                href={state.healthDeptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:underline"
              >
                {state.healthDept} →
              </a>
              {state.resources.map((resource, i) => (
                <a
                  key={i}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  {resource.name} →
                </a>
              ))}
            </div>
          </section>

          {/* Compliance CTA */}
          <section className="mb-12 p-6 bg-green-50 border border-green-200 rounded-lg">
            <h2 className="text-xl font-bold mb-2">
              Automate {state.name} Compliance
            </h2>
            <p className="text-slate-600 mb-4">
              Subzero automatically generates {state.abbreviation}-compliant
              temperature logs and alerts you before violations occur.
            </p>
            <Link
              href="/#waitlist"
              className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Join the Waitlist
            </Link>
          </section>

          {/* Other States */}
          <section>
            <h2 className="text-2xl font-bold mb-4">
              Food Safety Requirements by State
            </h2>
            <div className="flex flex-wrap gap-2">
              {allStates
                .filter((s) => s.slug !== state.slug)
                .map((s) => (
                  <Link
                    key={s.slug}
                    href={`/compliance/${s.slug}`}
                    className="px-3 py-1 bg-slate-100 rounded-full text-sm hover:bg-slate-200 transition"
                  >
                    {s.abbreviation}
                  </Link>
                ))}
            </div>
          </section>
        </div>
      </article>

      <CTABanner
        title={`Stay compliant in ${state.name}`}
        description="Automated temperature logging and real-time alerts for stress-free inspections."
        source={`compliance-${state.slug}`}
      />
    </>
  );
}
```

---

## Phase 5: Internal Linking System

### Task 5.1: Internal Link Components

**5.1.1 - Create Related Content Component**

Create file: `src/components/seo/related-content.tsx`
```typescript
import Link from 'next/link';

interface RelatedItem {
  title: string;
  href: string;
  type: 'guide' | 'blog' | 'tool' | 'compliance';
}

interface RelatedContentProps {
  items: RelatedItem[];
  title?: string;
}

const typeLabels = {
  guide: 'Guide',
  blog: 'Blog',
  tool: 'Tool',
  compliance: 'Compliance',
};

const typeColors = {
  guide: 'bg-blue-100 text-blue-800',
  blog: 'bg-purple-100 text-purple-800',
  tool: 'bg-green-100 text-green-800',
  compliance: 'bg-orange-100 text-orange-800',
};

export function RelatedContent({
  items,
  title = 'Related Resources',
}: RelatedContentProps) {
  return (
    <section className="my-12">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block p-4 border rounded-lg hover:shadow-md transition group"
          >
            <span
              className={`inline-block px-2 py-1 text-xs rounded ${typeColors[item.type]} mb-2`}
            >
              {typeLabels[item.type]}
            </span>
            <h3 className="font-medium group-hover:text-blue-600 transition">
              {item.title}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

**5.1.2 - Create Internal Linking Map**

Create file: `src/lib/internal-links.ts`
```typescript
// Define relationships between content for internal linking

export const linkingMap = {
  // Temperature guide pages link to:
  'temperature-guide': {
    relatedCompliance: ['/compliance/haccp', '/compliance/fda'],
    relatedTools: ['/tools/temperature-lookup'],
    relatedSolutions: ['/solutions/food-service', '/solutions/pharmaceutical'],
  },

  // Compliance pages link to:
  compliance: {
    relatedGuides: ['/temperature-guide', '/guides/haccp-temperature-monitoring'],
    relatedTools: ['/tools/compliance-checker'],
    relatedSolutions: ['/solutions'],
  },

  // Industry pages link to:
  pharmaceutical: {
    relatedCompliance: ['/compliance/fda', '/compliance/cdc-vaccine-storage'],
    relatedGuides: ['/temperature-guide/vaccine', '/temperature-guide/insulin'],
    relatedContent: ['/blog/pharmaceutical-cold-chain-best-practices'],
  },

  'food-service': {
    relatedCompliance: ['/compliance/haccp'],
    relatedGuides: ['/guides/restaurant-temperature-monitoring'],
    relatedContent: ['/blog/walk-in-cooler-monitoring-guide'],
  },

  logistics: {
    relatedCompliance: ['/compliance/fda', '/compliance/fsma'],
    relatedGuides: ['/guides/transport-temperature-monitoring'],
    relatedContent: ['/blog/reefer-monitoring-best-practices'],
  },
};

// Food items to compliance mapping
export const foodToCompliance: Record<string, string[]> = {
  chicken: ['/compliance/haccp', '/compliance/fda'],
  milk: ['/compliance/fda', '/compliance/state'],
  vaccine: ['/compliance/cdc-vaccine-storage', '/compliance/fda'],
  insulin: ['/compliance/fda', '/compliance/usp-797'],
};

// Get related links for a page
export function getRelatedLinks(pageType: string, slug?: string) {
  const baseLinks = linkingMap[pageType as keyof typeof linkingMap] || {};
  const specificLinks = slug ? foodToCompliance[slug] || [] : [];

  return {
    ...baseLinks,
    specificCompliance: specificLinks,
  };
}
```

### Task 5.2: Hub Pages

**5.2.1 - Create Temperature Guide Hub**

Create file: `src/app/(marketing)/temperature-guide/page.tsx`
```typescript
import { Metadata } from 'next';
import Link from 'next/link';
import { generateSEOMetadata } from '@/lib/seo';
import { CTABanner } from '@/components/waitlist/cta-banner';
import { getAllFoodItems } from '@/lib/data/food-items';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Food Storage Temperature Guide',
  description:
    'Complete guide to safe food storage temperatures. Learn proper refrigerator and freezer temperatures for meat, dairy, produce, and more.',
  path: '/temperature-guide',
  keywords: [
    'food storage temperature',
    'safe food temperatures',
    'refrigerator temperature guide',
    'freezer storage times',
  ],
});

export default async function TemperatureGuideHub() {
  const items = await getAllFoodItems();

  // Group by category
  const categories = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <>
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Food Storage Temperature Guide
          </h1>
          <p className="text-xl text-slate-300">
            Safe storage temperatures and times for 200+ foods. Keep your
            products fresh and your customers safe.
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {Object.entries(categories).map(([category, categoryItems]) => (
            <div key={category} className="mb-12">
              <h2 className="text-2xl font-bold mb-6">{category}</h2>
              <div className="grid md:grid-cols-4 gap-4">
                {categoryItems.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/temperature-guide/${item.slug}`}
                    className="block p-4 border rounded-lg hover:shadow-md transition"
                  >
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-slate-600">
                      {item.fridgeTemp}°F / {item.fridgeDays} days
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <CTABanner
        title="Monitor all your temperatures automatically"
        source="temperature-guide-hub"
      />
    </>
  );
}
```

---

## Phase 6: GitHub Actions & Automation

### Task 6.1: CI/CD Workflows

**6.1.1 - Create Main Deploy Workflow**

Create file: `.github/workflows/deploy.yml`
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: dashboard/package-lock.json

      - name: Install dependencies
        working-directory: dashboard
        run: npm ci

      - name: Run linter
        working-directory: dashboard
        run: npm run lint

      - name: Run type check
        working-directory: dashboard
        run: npm run type-check

      - name: Run tests
        working-directory: dashboard
        run: npm test -- --passWithNoTests

  build:
    needs: lint-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: dashboard/package-lock.json

      - name: Install dependencies
        working-directory: dashboard
        run: npm ci

      - name: Build
        working-directory: dashboard
        run: npm run build
        env:
          NEXT_PUBLIC_SITE_URL: ${{ secrets.NEXT_PUBLIC_SITE_URL }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

  deploy-preview:
    needs: build
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Vercel CLI
        run: npm install -g vercel

      - name: Deploy to Vercel (Preview)
        working-directory: dashboard
        run: |
          vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}
          vercel build --token=${{ secrets.VERCEL_TOKEN }}
          vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Vercel CLI
        run: npm install -g vercel

      - name: Deploy to Vercel (Production)
        working-directory: dashboard
        run: |
          vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
          vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
          vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

**6.1.2 - Create SEO Validation Workflow**

Create file: `.github/workflows/seo-check.yml`
```yaml
name: SEO Validation

on:
  push:
    branches: [main]
    paths:
      - 'dashboard/src/app/**'
      - 'dashboard/src/lib/data/**'
  pull_request:
    branches: [main]
    paths:
      - 'dashboard/src/app/**'
      - 'dashboard/src/lib/data/**'

jobs:
  validate-seo:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: dashboard/package-lock.json

      - name: Install dependencies
        working-directory: dashboard
        run: npm ci

      - name: Build site
        working-directory: dashboard
        run: npm run build
        env:
          NEXT_PUBLIC_SITE_URL: https://subzero.io

      - name: Validate sitemap
        working-directory: dashboard
        run: |
          # Check sitemap exists and has entries
          if [ ! -f ".next/server/app/sitemap.xml" ]; then
            echo "Sitemap not generated!"
            exit 1
          fi

      - name: Check for missing meta descriptions
        working-directory: dashboard
        run: |
          # Custom script to validate SEO metadata
          node scripts/validate-seo.js

      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v11
        with:
          configPath: dashboard/lighthouserc.json
          uploadArtifacts: true
          temporaryPublicStorage: true
```

**6.1.3 - Create Lighthouse Config**

Create file: `dashboard/lighthouserc.json`
```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/temperature-guide",
        "http://localhost:3000/compliance",
        "http://localhost:3000/solutions/pharmaceutical"
      ],
      "startServerCommand": "npm run start",
      "startServerReadyPattern": "ready on"
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", { "minScore": 0.8 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["warn", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.9 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

**6.1.4 - Create Content Update Workflow**

Create file: `.github/workflows/content-update.yml`
```yaml
name: Scheduled Content Updates

on:
  schedule:
    # Run weekly on Sunday at midnight
    - cron: '0 0 * * 0'
  workflow_dispatch:

jobs:
  update-content:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        working-directory: dashboard
        run: npm ci

      - name: Update food temperature data
        working-directory: dashboard
        run: node scripts/update-food-data.js

      - name: Update state compliance data
        working-directory: dashboard
        run: node scripts/update-state-data.js

      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add -A
          git diff --quiet && git diff --staged --quiet || git commit -m "chore: automated content update [skip ci]"
          git push

  notify-on-failure:
    needs: update-content
    if: failure()
    runs-on: ubuntu-latest
    steps:
      - name: Send notification
        run: |
          # Add Slack/email notification here
          echo "Content update failed!"
```

### Task 6.2: SEO Validation Script

**6.2.1 - Create SEO Validation Script**

Create file: `dashboard/scripts/validate-seo.js`
```javascript
const fs = require('fs');
const path = require('path');

const REQUIRED_META = ['title', 'description'];
const MIN_DESCRIPTION_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 160;
const MIN_TITLE_LENGTH = 30;
const MAX_TITLE_LENGTH = 60;

function validateSEO() {
  const errors = [];
  const warnings = [];

  // Check data files exist
  const dataFiles = [
    'src/lib/data/food-items.ts',
    'src/lib/data/states.ts',
    'src/lib/data/equipment.ts',
  ];

  dataFiles.forEach((file) => {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
      warnings.push(`Data file missing: ${file}`);
    }
  });

  // Check for duplicate slugs in data files
  // Add more validation as needed

  // Report results
  console.log('\n🔍 SEO Validation Results\n');

  if (errors.length > 0) {
    console.log('❌ Errors:');
    errors.forEach((e) => console.log(`   - ${e}`));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach((w) => console.log(`   - ${w}`));
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All SEO checks passed!');
  }

  // Exit with error if there are errors
  if (errors.length > 0) {
    process.exit(1);
  }
}

validateSEO();
```

---

## Phase 7: Analytics & Monitoring

### Task 7.1: Analytics Setup

**7.1.1 - Create Analytics Provider**

Create file: `src/components/analytics/analytics-provider.tsx`
```typescript
'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const GA_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_ID) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : '');
    window.gtag('config', GA_ID, {
      page_path: url,
    });
  }, [pathname, searchParams]);

  if (!GA_ID) return <>{children}</>;

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
      {children}
    </>
  );
}

// Track custom events
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}
```

**7.1.2 - Create Search Console Verification**

Add to `src/app/layout.tsx`:
```typescript
export const metadata: Metadata = {
  // ... other metadata
  verification: {
    google: 'your-google-verification-code',
  },
};
```

---

## Task Checklist

### Phase 0: Foundation (Week 1)
- [ ] Update next.config.js for SEO
- [ ] Install required dependencies
- [ ] Set up environment variables
- [ ] Create Supabase waitlist table
- [ ] Create page_analytics table
- [ ] Test database connections

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Create SEO utility library (`src/lib/seo.ts`)
- [ ] Create JSON-LD component
- [ ] Create dynamic OG image generator
- [ ] Create sitemap.ts
- [ ] Create robots.ts
- [ ] Test sitemap generation

### Phase 2: Waitlist & Lead Capture (Week 2)
- [ ] Create waitlist API endpoint
- [ ] Create WaitlistForm component
- [ ] Create CTA banner component
- [ ] Create exit intent popup
- [ ] Set up Resend email integration
- [ ] Test waitlist flow end-to-end

### Phase 3: Content Pages (Week 2-3)
- [ ] Create marketing layout
- [ ] Create homepage
- [ ] Create solutions hub page
- [ ] Create industry solution template
- [ ] Create pharmaceutical solution page
- [ ] Create food service solution page
- [ ] Create logistics solution page

### Phase 4: Programmatic SEO (Week 3-4)
- [ ] Create food-items.ts data file (50+ items)
- [ ] Create states.ts data file (50 states)
- [ ] Create equipment.ts data file
- [ ] Create food temperature page template
- [ ] Create state compliance page template
- [ ] Create temperature guide hub page
- [ ] Create compliance hub page
- [ ] Generate all static params
- [ ] Test all programmatic pages

### Phase 5: Internal Linking (Week 4)
- [ ] Create related content component
- [ ] Create internal linking map
- [ ] Add breadcrumbs to all pages
- [ ] Add related content to all templates
- [ ] Create hub pages with category links
- [ ] Verify all internal links work

### Phase 6: GitHub Actions (Week 4-5)
- [ ] Create deploy workflow
- [ ] Create SEO validation workflow
- [ ] Create Lighthouse CI config
- [ ] Create content update workflow
- [ ] Create SEO validation script
- [ ] Set up Vercel secrets
- [ ] Test all workflows

### Phase 7: Analytics (Week 5)
- [ ] Create analytics provider
- [ ] Add Google Analytics
- [ ] Set up Google Search Console
- [ ] Add event tracking for conversions
- [ ] Create analytics dashboard in Supabase
- [ ] Verify tracking is working

### Launch Checklist
- [ ] All pages have unique meta titles
- [ ] All pages have meta descriptions (120-160 chars)
- [ ] All images have alt text
- [ ] Sitemap includes all pages
- [ ] Robots.txt is correct
- [ ] Schema markup validates
- [ ] Core Web Vitals pass
- [ ] Mobile responsive
- [ ] SSL certificate active
- [ ] Submit sitemap to Google Search Console
- [ ] Set up rank tracking

---

## Maintenance Schedule

### Weekly
- Review waitlist signups and sources
- Check Google Search Console for errors
- Monitor Core Web Vitals

### Monthly
- Review keyword rankings
- Update content based on performance
- Add new food items / state updates
- Publish 2-4 blog posts

### Quarterly
- Full SEO audit
- Competitor analysis
- Content gap analysis
- Strategy adjustment

---

## Success Metrics

| Metric | Month 1 | Month 3 | Month 6 |
|--------|---------|---------|---------|
| Indexed Pages | 100+ | 200+ | 400+ |
| Organic Sessions | 1,000 | 5,000 | 20,000 |
| Waitlist Signups | 100 | 500 | 2,000 |
| Keywords (Top 100) | 200 | 1,000 | 3,000 |
| Domain Authority | 10 | 20 | 30 |

---

*Document Version: 1.0*
*Last Updated: January 2026*
