# Flux IoT SEO Implementation Guide

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
10. [Phase 8: Training Center (Flux Academy)](#phase-8-training-center-flux-academy)
11. [Phase 9: Compliance OS Platform](#phase-9-compliance-os-platform)
12. [Task Checklist](#task-checklist)

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
NEXT_PUBLIC_SITE_URL=https://fluxiot.com
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://fluxiot.com';
const SITE_NAME = 'Flux IoT Asset Command';

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
      creator: '@fluxiot',
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
    name: 'Flux IoT Asset Command',
    description: 'Enterprise cold chain monitoring system with real-time temperature alerts and compliance reporting',
    brand: {
      '@type': 'Brand',
      name: 'Flux IoT',
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
  const title = searchParams.get('title') || 'Flux IoT Asset Command';
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://fluxiot.com';

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://fluxiot.com';

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
      from: 'Flux IoT <hello@fluxiot.com>',
      to: email,
      subject: "You're on the Flux IoT waitlist! 🎉",
      html: `
        <h1>Welcome to Flux IoT!</h1>
        <p>Hi${name ? ` ${name}` : ''},</p>
        <p>Thanks for joining our waitlist. You're now in line for early access to Flux IoT Asset Command - the future of cold chain monitoring.</p>
        <p>We'll notify you as soon as we're ready to onboard new users.</p>
        <p>In the meantime, here are some resources:</p>
        <ul>
          <li><a href="https://fluxiot.com/blog">Read our blog</a></li>
          <li><a href="https://fluxiot.com/temperature-guide">Explore our temperature guides</a></li>
          <li><a href="https://fluxiot.com/tools/roi-calculator">Calculate your ROI</a></li>
        </ul>
        <p>Best,<br>The Flux IoT Team</p>
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
  description = 'Join the waitlist for early access to Flux IoT Asset Command.',
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
            Join 500+ companies on the waitlist for early access to Flux IoT
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
    'Flux IoT Asset Command provides real-time temperature monitoring, automated alerts, and compliance reporting for pharmaceutical, food service, and logistics industries.',
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
            monitoring transport, Flux IoT has you covered.
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
            How Flux IoT Helps
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
              Flux IoT monitors your refrigerators and freezers 24/7, alerting you
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
              Flux IoT automatically generates {state.abbreviation}-compliant
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
          NEXT_PUBLIC_SITE_URL: https://fluxiot.com

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

## Phase 8: Training Center (Flux Academy)

### Task 8.1: Training Hub Setup

**8.1.1 - Create Training Hub Page**

Create file: `src/app/(marketing)/training/page.tsx`
```typescript
import { Metadata } from 'next';
import Link from 'next/link';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';
import { CTABanner } from '@/components/waitlist/cta-banner';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Cold Chain Training & Certification',
  description:
    'Free temperature compliance training courses. Get certified in HACCP monitoring, vaccine storage, and cold chain management. Start with our free 15-minute course.',
  path: '/training',
  keywords: [
    'cold chain training',
    'temperature compliance training',
    'HACCP training online',
    'food safety temperature course',
    'cold chain certification',
  ],
});

const courses = [
  {
    slug: 'compliance-101',
    title: 'Temperature Compliance 101',
    description: 'The 15-Minute Foundation - Learn the essentials of temperature compliance',
    duration: '15 min',
    level: 'Beginner',
    price: 'Free',
    badge: 'Most Popular',
  },
  {
    slug: 'fundamentals',
    title: 'Cold Chain Fundamentals',
    description: 'Comprehensive 5-module certification in temperature monitoring',
    duration: '3 hours',
    level: 'Intermediate',
    price: 'Free for customers',
    badge: null,
  },
  {
    slug: 'food-service',
    title: 'Food Service Compliance Track',
    description: 'HACCP, health inspections, and restaurant temperature management',
    duration: '2 hours',
    level: 'Intermediate',
    price: 'Free for customers',
    badge: 'Sector Track',
  },
  {
    slug: 'healthcare',
    title: 'Healthcare & Pharma Track',
    description: 'Vaccine storage, medication compliance, and MHRA/CDC requirements',
    duration: '2.5 hours',
    level: 'Intermediate',
    price: 'Free for customers',
    badge: 'Sector Track',
  },
  {
    slug: 'manufacturing',
    title: 'Manufacturing & BRC Track',
    description: 'BRC compliance, production cold chain, and audit preparation',
    duration: '2 hours',
    level: 'Advanced',
    price: 'Free for customers',
    badge: 'Sector Track',
  },
  {
    slug: 'retail',
    title: 'Retail Food Safety Track',
    description: 'Store-level compliance, display case monitoring, and EHO preparation',
    duration: '1.5 hours',
    level: 'Intermediate',
    price: 'Free for customers',
    badge: 'Sector Track',
  },
];

export default function TrainingHubPage() {
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Training', path: '/training' },
  ];

  return (
    <>
      <JsonLd data={generateBreadcrumbSchema(breadcrumbs)} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'EducationalOrganization',
          name: 'Flux Academy',
          description: 'Cold chain training and certification programs',
          url: 'https://fluxiot.com/training',
        }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-cyan-400 font-medium mb-4">Flux Academy</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Cold Chain Training & Certification
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Master temperature compliance with free courses designed by industry experts.
            Start with our 15-minute foundation course.
          </p>
          <Link
            href="/training/compliance-101"
            className="inline-flex items-center px-6 py-3 bg-cyan-500 text-white font-medium rounded-lg hover:bg-cyan-600 transition"
          >
            Start Free Course
          </Link>
        </div>
      </section>

      {/* Course Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Available Courses</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link
                key={course.slug}
                href={`/training/${course.slug}`}
                className="block p-6 bg-white border rounded-lg hover:shadow-lg transition"
              >
                {course.badge && (
                  <span className="inline-block px-2 py-1 bg-cyan-100 text-cyan-800 text-xs font-medium rounded mb-3">
                    {course.badge}
                  </span>
                )}
                <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
                <p className="text-slate-600 text-sm mb-4">{course.description}</p>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span>{course.duration}</span>
                  <span>{course.level}</span>
                  <span className="font-medium text-green-600">{course.price}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Why Get Certified?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">📜</div>
              <h3 className="font-semibold mb-2">Verifiable Credentials</h3>
              <p className="text-slate-600 text-sm">
                Each certificate has a unique verification page you can share with employers
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="font-semibold mb-2">Industry-Recognised</h3>
              <p className="text-slate-600 text-sm">
                Content aligned with HACCP, CDC, MHRA, and BRC requirements
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">💼</div>
              <h3 className="font-semibold mb-2">Career Advancement</h3>
              <p className="text-slate-600 text-sm">
                Stand out with demonstrable cold chain expertise
              </p>
            </div>
          </div>
        </div>
      </section>

      <CTABanner
        title="Ready to become certified?"
        description="Start with our free 15-minute foundation course today."
        source="training-hub"
      />
    </>
  );
}
```

**8.1.2 - Create Free Course Landing Page**

Create file: `src/app/(marketing)/training/compliance-101/page.tsx`
```typescript
import { Metadata } from 'next';
import { generateSEOMetadata, generateFAQSchema } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';
import { CourseEnrollmentForm } from '@/components/training/course-enrollment-form';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Temperature Compliance 101 - Free 15-Minute Course',
  description:
    'Learn the essentials of temperature compliance in just 15 minutes. Free online course covering danger zones, monitoring basics, and compliance fundamentals.',
  path: '/training/compliance-101',
  keywords: [
    'HACCP training online free',
    'food safety temperature training',
    'temperature compliance course',
    'free cold chain training',
  ],
});

const faqs = [
  {
    question: 'Is this course really free?',
    answer:
      'Yes! Temperature Compliance 101 is completely free. We believe everyone should have access to food safety fundamentals.',
  },
  {
    question: 'Do I get a certificate?',
    answer:
      'Yes, upon completion you receive a verifiable digital certificate you can share on LinkedIn or with employers.',
  },
  {
    question: 'How long does it take?',
    answer:
      'The course takes approximately 15 minutes to complete, including a short quiz at the end.',
  },
];

export default function Compliance101Page() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: 'Temperature Compliance 101',
          description: 'The 15-Minute Foundation for temperature compliance',
          provider: {
            '@type': 'Organization',
            name: 'Flux Academy',
            sameAs: 'https://fluxiot.com',
          },
          isAccessibleForFree: true,
          educationalLevel: 'Beginner',
          timeRequired: 'PT15M',
          teaches: [
            'Temperature danger zones',
            'Basic monitoring principles',
            'Compliance documentation',
          ],
        }}
      />
      <JsonLd data={generateFAQSchema(faqs)} />

      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium mb-4">
                Free Course
              </span>
              <h1 className="text-4xl font-bold text-white mb-4">
                Temperature Compliance 101
              </h1>
              <p className="text-xl text-slate-300 mb-6">
                The 15-Minute Foundation
              </p>
              <p className="text-slate-400 mb-8">
                Master the essentials of temperature compliance. Learn about danger zones,
                monitoring basics, and documentation requirements.
              </p>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> 15-minute video lessons
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Interactive quiz
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Verifiable certificate
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Downloadable reference card
                </li>
              </ul>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-white mb-4">
                Start Your Free Course
              </h2>
              <CourseEnrollmentForm
                courseSlug="compliance-101"
                courseName="Temperature Compliance 101"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Course Content */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">What You'll Learn</h2>
          <div className="space-y-4">
            {[
              { title: 'Module 1: The Temperature Danger Zone', duration: '4 min' },
              { title: 'Module 2: Monitoring Fundamentals', duration: '4 min' },
              { title: 'Module 3: Documentation & Compliance', duration: '4 min' },
              { title: 'Module 4: Quick Quiz', duration: '3 min' },
            ].map((module, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-sm font-medium">
                    {i + 1}
                  </span>
                  <span>{module.title}</span>
                </div>
                <span className="text-slate-500 text-sm">{module.duration}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="p-4 bg-white rounded-lg">
                <h3 className="font-semibold mb-2">{faq.question}</h3>
                <p className="text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
```

### Task 8.2: Certificate Verification System

**8.2.1 - Create Certificate Database Table**

Add to Supabase:
```sql
-- Create certificates table
CREATE TABLE certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_id TEXT UNIQUE NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  course_slug TEXT NOT NULL,
  course_name TEXT NOT NULL,
  sector_track TEXT,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '2 years'),
  status TEXT DEFAULT 'active',
  skills_verified TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_certificates_certificate_id ON certificates(certificate_id);
CREATE INDEX idx_certificates_user_email ON certificates(user_email);
CREATE INDEX idx_certificates_course ON certificates(course_slug);

-- Enable RLS
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Public read access for verification
CREATE POLICY "Anyone can verify certificates" ON certificates
  FOR SELECT USING (true);

-- Service role can insert/update
CREATE POLICY "Service role can manage certificates" ON certificates
  FOR ALL USING (auth.role() = 'service_role');
```

**8.2.2 - Create Certificate Verification Page**

Create file: `src/app/(marketing)/verify/[certificate-id]/page.tsx`
```typescript
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { JsonLd } from '@/components/seo/json-ld';
import { QRCode } from '@/components/verify/qr-code';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PageProps {
  params: { 'certificate-id': string };
}

async function getCertificate(certificateId: string) {
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('certificate_id', certificateId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const certificate = await getCertificate(params['certificate-id']);
  if (!certificate) return { title: 'Certificate Not Found' };

  return {
    title: `Certificate Verification - ${certificate.user_name}`,
    description: `Verify ${certificate.user_name}'s ${certificate.course_name} certification from Flux Academy.`,
    robots: 'index, follow',
  };
}

export default async function CertificateVerificationPage({ params }: PageProps) {
  const certificate = await getCertificate(params['certificate-id']);
  if (!certificate) notFound();

  const isExpired = new Date(certificate.expires_at) < new Date();
  const isActive = certificate.status === 'active' && !isExpired;
  const verifyUrl = `https://fluxiot.com/verify/${certificate.certificate_id}`;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'EducationalOccupationalCredential',
          name: certificate.course_name,
          credentialCategory: 'certificate',
          recognizedBy: {
            '@type': 'Organization',
            name: 'Flux IoT',
            url: 'https://fluxiot.com',
          },
          validFor: 'P2Y',
          dateCreated: certificate.issued_at,
          expires: certificate.expires_at,
        }}
      />

      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Verification Status */}
          <div className="text-center mb-8">
            {isActive ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full">
                <span className="text-xl">✓</span>
                <span className="font-medium">Verified Certificate</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-full">
                <span className="text-xl">✗</span>
                <span className="font-medium">
                  {isExpired ? 'Expired Certificate' : 'Revoked Certificate'}
                </span>
              </div>
            )}
          </div>

          {/* Certificate Card */}
          <div className="bg-white border-2 border-slate-200 rounded-lg p-8 shadow-lg">
            <div className="text-center mb-6">
              <p className="text-cyan-600 font-medium text-sm mb-1">Flux Academy</p>
              <h1 className="text-2xl font-bold">Certificate of Completion</h1>
            </div>

            <div className="text-center mb-8">
              <p className="text-slate-500 text-sm mb-1">This certifies that</p>
              <p className="text-3xl font-bold text-slate-900">
                {certificate.user_name}
              </p>
              <p className="text-slate-500 text-sm mt-4 mb-1">
                has successfully completed
              </p>
              <p className="text-xl font-semibold text-slate-800">
                {certificate.course_name}
              </p>
              {certificate.sector_track && (
                <p className="text-cyan-600 text-sm mt-1">
                  {certificate.sector_track} Track
                </p>
              )}
            </div>

            {/* Certificate Details */}
            <div className="border-t pt-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase mb-4">
                Certificate Details
              </h2>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-slate-500">Certificate ID</dt>
                  <dd className="font-mono">{certificate.certificate_id}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Issued Date</dt>
                  <dd>
                    {new Date(certificate.issued_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Valid Until</dt>
                  <dd>
                    {new Date(certificate.expires_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Status</dt>
                  <dd
                    className={
                      isActive ? 'text-green-600 font-medium' : 'text-red-600 font-medium'
                    }
                  >
                    {isActive ? 'Active' : isExpired ? 'Expired' : 'Revoked'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Skills Verified */}
            {certificate.skills_verified && certificate.skills_verified.length > 0 && (
              <div className="border-t pt-6 mt-6">
                <h2 className="text-sm font-semibold text-slate-500 uppercase mb-4">
                  Skills Verified
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {certificate.skills_verified.map((skill: string, i: number) => (
                    <li
                      key={i}
                      className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* QR Code */}
            <div className="border-t pt-6 mt-6 flex justify-center">
              <div className="text-center">
                <QRCode value={verifyUrl} size={120} />
                <p className="text-xs text-slate-500 mt-2">Scan to verify</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href={`/training/${certificate.course_slug}`}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50 transition"
            >
              View Course
            </Link>
            <Link
              href="/training"
              className="px-4 py-2 text-sm bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition"
            >
              Get Certified
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
```

**8.2.3 - Create QR Code Component**

Create file: `src/components/verify/qr-code.tsx`
```typescript
'use client';

import { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number;
}

export function QRCode({ value, size = 150 }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#1e293b',
          light: '#ffffff',
        },
      });
    }
  }, [value, size]);

  return <canvas ref={canvasRef} />;
}
```

### Task 8.3: Course Enrollment Components

**8.3.1 - Create Course Enrollment Form**

Create file: `src/components/training/course-enrollment-form.tsx`
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CourseEnrollmentFormProps {
  courseSlug: string;
  courseName: string;
}

export function CourseEnrollmentForm({
  courseSlug,
  courseName,
}: CourseEnrollmentFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/training/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          courseSlug,
          courseName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enroll');
      }

      setSuccess(true);

      // Track conversion
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'course_enrollment', {
          event_category: 'training',
          event_label: courseSlug,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🎉</div>
        <h3 className="text-xl font-semibold text-white mb-2">You're enrolled!</h3>
        <p className="text-slate-300 mb-4">
          Check your email for access to {courseName}.
        </p>
        <Button variant="secondary" asChild>
          <a href={`/training/${courseSlug}/start`}>Start Now</a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-slate-300">
          Your Name
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="John Smith"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="bg-slate-700 border-slate-600 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-300">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-slate-700 border-slate-600 text-white"
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Enrolling...' : 'Start Free Course'}
      </Button>

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      <p className="text-xs text-slate-400 text-center">
        By enrolling, you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  );
}
```

**8.3.2 - Create Training Enrollment API**

Create file: `src/app/api/training/enroll/route.ts`
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
    const { email, name, courseSlug, courseName } = body;

    if (!email || !name || !courseSlug) {
      return NextResponse.json(
        { error: 'Email, name, and course are required' },
        { status: 400 }
      );
    }

    // Add to enrollments table
    const { data, error } = await supabase
      .from('course_enrollments')
      .upsert(
        {
          email: email.toLowerCase().trim(),
          name,
          course_slug: courseSlug,
          course_name: courseName,
          enrolled_at: new Date().toISOString(),
        },
        {
          onConflict: 'email,course_slug',
        }
      )
      .select()
      .single();

    if (error) throw error;

    // Also add to waitlist for marketing
    await supabase.from('waitlist').upsert(
      {
        email: email.toLowerCase().trim(),
        name,
        source: `training-${courseSlug}`,
      },
      { onConflict: 'email' }
    );

    // Send welcome email
    await resend.emails.send({
      from: 'Flux Academy <academy@fluxiot.com>',
      to: email,
      subject: `Welcome to ${courseName}! 🎓`,
      html: `
        <h1>Welcome to ${courseName}!</h1>
        <p>Hi ${name},</p>
        <p>You're now enrolled in <strong>${courseName}</strong>.</p>
        <p><a href="https://fluxiot.com/training/${courseSlug}/start">Click here to start your course</a></p>
        <p>Happy learning!</p>
        <p>The Flux Academy Team</p>
      `,
    });

    return NextResponse.json({
      message: 'Successfully enrolled',
      enrollmentId: data.id,
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    return NextResponse.json(
      { error: 'Failed to enroll' },
      { status: 500 }
    );
  }
}
```

### Task 8.4: Update Sitemap for Training

**8.4.1 - Add Training Pages to Sitemap**

Update `src/app/sitemap.ts` to include:
```typescript
// Add to sitemap generation
const trainingPages = [
  { url: '/training', priority: 0.9, changeFrequency: 'weekly' as const },
  { url: '/training/compliance-101', priority: 0.9, changeFrequency: 'monthly' as const },
  { url: '/training/fundamentals', priority: 0.8, changeFrequency: 'monthly' as const },
  { url: '/training/food-service', priority: 0.8, changeFrequency: 'monthly' as const },
  { url: '/training/healthcare', priority: 0.8, changeFrequency: 'monthly' as const },
  { url: '/training/manufacturing', priority: 0.8, changeFrequency: 'monthly' as const },
  { url: '/training/retail', priority: 0.8, changeFrequency: 'monthly' as const },
];

// Add certificate verification pages
const { data: certificates } = await supabase
  .from('certificates')
  .select('certificate_id, issued_at')
  .eq('status', 'active');

const certificatePages = (certificates || []).map((cert) => ({
  url: `/verify/${cert.certificate_id}`,
  priority: 0.5,
  changeFrequency: 'yearly' as const,
  lastModified: new Date(cert.issued_at),
}));
```

---

## Phase 9: Compliance OS Platform

Phase 9 implements the Compliance OS positioning with dedicated product pages, pricing tiers, and feature showcases.

### Task 9.1: Pricing Page

**9.1.1 - Create Pricing Page**

Create file: `src/app/(marketing)/pricing/page.tsx`
```typescript
import { Metadata } from 'next';
import { generateSEOMetadata, generateProductSchema } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';
import { WaitlistForm } from '@/components/waitlist/waitlist-form';
import { Check, X } from 'lucide-react';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Pricing - Compliance Performance System',
  description:
    'Choose the right Flux Compliance OS tier for your organisation. From basic monitoring to full outcome-verified certification. Plans from £149/month.',
  path: '/pricing',
  keywords: [
    'compliance software pricing',
    'cold chain monitoring cost',
    'temperature monitoring subscription',
    'compliance training platform pricing',
  ],
});

const tiers = [
  {
    name: 'Monitor',
    price: 149,
    description: 'Real-time cold chain monitoring with AI-powered alerts',
    features: [
      { text: 'Unlimited sensors', included: true },
      { text: 'Real-time dashboard', included: true },
      { text: 'Multi-channel alerts', included: true },
      { text: 'Basic AI insights', included: true },
      { text: 'Mobile app access', included: true },
      { text: '12-month data retention', included: true },
      { text: 'Compliance reports', included: false },
      { text: 'Training LMS', included: false },
      { text: 'Outcome certification', included: false },
    ],
    cta: 'Start Monitoring',
    popular: false,
  },
  {
    name: 'Comply',
    price: 299,
    description: 'Automated compliance reporting and audit-ready documentation',
    features: [
      { text: 'Everything in Monitor', included: true },
      { text: 'HACCP/FDA/MHRA reports', included: true },
      { text: 'One-click audit export', included: true },
      { text: 'Corrective action tracking', included: true },
      { text: 'Digital signatures', included: true },
      { text: '3-year data retention', included: true },
      { text: 'Training LMS', included: false },
      { text: 'Outcome certification', included: false },
    ],
    cta: 'Get Compliant',
    popular: false,
  },
  {
    name: 'Develop',
    price: 499,
    description: 'AI-triggered training with employee competency profiles',
    features: [
      { text: 'Everything in Comply', included: true },
      { text: 'Core training curriculum', included: true },
      { text: 'AI-triggered micro-learning', included: true },
      { text: 'Sector-specific tracks', included: true },
      { text: 'Employee profiles', included: true },
      { text: 'Manager dashboard', included: true },
      { text: 'Training analytics', included: true },
      { text: 'Outcome certification', included: false },
    ],
    cta: 'Develop Your Team',
    popular: true,
  },
  {
    name: 'Certify',
    price: 799,
    description: 'Outcome-verified certification with data-proven competency',
    features: [
      { text: 'Everything in Develop', included: true },
      { text: 'Outcome-verified certs', included: true },
      { text: 'Public verification portal', included: true },
      { text: 'Career pathways', included: true },
      { text: 'Achievement system', included: true },
      { text: 'Site-level certification', included: true },
      { text: 'LinkedIn badges', included: true },
      { text: 'Continuous verification', included: true },
    ],
    cta: 'Get Certified',
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <>
      <JsonLd data={generateProductSchema()} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Flux Compliance OS',
          applicationCategory: 'BusinessApplication',
          offers: tiers.map((tier) => ({
            '@type': 'Offer',
            name: tier.name,
            price: tier.price,
            priceCurrency: 'GBP',
            priceValidUntil: '2026-12-31',
          })),
        }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            From monitoring to certification. Choose the tier that matches your
            compliance maturity.
          </p>
        </div>
      </section>

      {/* Pricing Grid */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-6">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`bg-white rounded-xl p-6 border-2 ${
                  tier.popular ? 'border-blue-500 shadow-lg' : 'border-slate-200'
                }`}
              >
                {tier.popular && (
                  <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="text-2xl font-bold mt-4">{tier.name}</h3>
                <p className="text-slate-600 text-sm mt-2">{tier.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold">£{tier.price}</span>
                  <span className="text-slate-500">/month</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-slate-300" />
                      )}
                      <span className={feature.included ? '' : 'text-slate-400'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full mt-6 py-3 rounded-lg font-medium ${
                    tier.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Enterprise</h2>
          <p className="text-slate-600 mb-8">
            Need SSO, custom integrations, or dedicated support? Let's talk.
          </p>
          <a
            href="/contact"
            className="inline-block px-8 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
          >
            Contact Sales
          </a>
        </div>
      </section>

      {/* Waitlist */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Not ready yet?</h2>
          <p className="text-slate-600 mb-6">
            Join the waitlist for early access and exclusive launch pricing.
          </p>
          <WaitlistForm source="pricing" variant="inline" />
        </div>
      </section>
    </>
  );
}
```

### Task 9.2: Feature Pages

**9.2.1 - Create AI Training Feature Page**

Create file: `src/app/(marketing)/features/ai-training/page.tsx`
```typescript
import { Metadata } from 'next';
import { generateSEOMetadata, generateFAQSchema } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';
import { CTABanner } from '@/components/waitlist/cta-banner';

export const metadata: Metadata = generateSEOMetadata({
  title: 'AI-Triggered Training - Adaptive Compliance Learning',
  description:
    'Training triggered by real performance gaps, not arbitrary schedules. Our AI assigns micro-learning based on sensor data patterns for targeted skill development.',
  path: '/features/ai-training',
  keywords: [
    'AI compliance training',
    'adaptive learning platform',
    'micro-learning compliance',
    'automated training assignment',
  ],
});

const triggers = [
  {
    event: 'Alert response > 10 mins',
    training: 'Rapid Response Protocol',
    duration: '5 mins',
    verification: 'Response time < 5 mins for 30 days',
  },
  {
    event: 'Repeated door-open alerts',
    training: 'Door Discipline Essentials',
    duration: '5 mins',
    verification: 'Door alerts decrease 50%',
  },
  {
    event: 'Post-delivery temp spikes',
    training: 'Receiving Protocols',
    duration: '7 mins',
    verification: 'No spikes for 30 days',
  },
  {
    event: 'Documentation gaps',
    training: 'Record Keeping Excellence',
    duration: '5 mins',
    verification: '100% documentation rate',
  },
];

const faqs = [
  {
    question: 'How does AI-triggered training work?',
    answer:
      'Our system analyses sensor data in real-time to identify performance patterns. When it detects a gap—like slow alert response or repeated incidents—it automatically assigns targeted micro-learning to the relevant employee.',
  },
  {
    question: 'What makes this different from traditional LMS?',
    answer:
      'Traditional LMS assigns training on schedules or after incidents. Flux assigns training proactively based on data patterns, and verifies the training worked through subsequent performance improvement.',
  },
  {
    question: 'How long are the micro-learning modules?',
    answer:
      'Most modules are 5-7 minutes—short enough to complete on shift, focused enough to address specific gaps. Employees can learn without disrupting operations.',
  },
];

export default function AITrainingPage() {
  return (
    <>
      <JsonLd data={generateFAQSchema(faqs)} />

      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-cyan-400 font-medium mb-4">Develop Tier Feature</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Training Triggered by Real Gaps
          </h1>
          <p className="text-xl text-slate-300">
            Not arbitrary schedules. Our AI assigns micro-learning based on
            actual performance patterns detected by your sensors.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            The AI Training Loop
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {['Detect Pattern', 'Assign Training', 'Complete Module', 'Verify Improvement'].map(
              (step, i) => (
                <div key={step} className="text-center">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                    {i + 1}
                  </div>
                  <h3 className="font-semibold mt-4">{step}</h3>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Triggers Table */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Example AI Triggers
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-4 text-left">Trigger Event</th>
                  <th className="p-4 text-left">Training Assigned</th>
                  <th className="p-4 text-left">Duration</th>
                  <th className="p-4 text-left">Verification Metric</th>
                </tr>
              </thead>
              <tbody>
                {triggers.map((trigger, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-4">{trigger.event}</td>
                    <td className="p-4 font-medium">{trigger.training}</td>
                    <td className="p-4">{trigger.duration}</td>
                    <td className="p-4 text-green-600">{trigger.verification}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b pb-6">
                <h3 className="font-semibold mb-2">{faq.question}</h3>
                <p className="text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        title="Ready for training that actually works?"
        description="Join the waitlist for AI-triggered micro-learning."
        source="feature-ai-training"
      />
    </>
  );
}
```

**9.2.2 - Create Outcome Certification Feature Page**

Create file: `src/app/(marketing)/features/outcome-certification/page.tsx`
```typescript
import { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';
import { CTABanner } from '@/components/waitlist/cta-banner';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Outcome-Verified Certification - Prove Competency with Data',
  description:
    'Certificates that prove competency through actual job performance, not just attendance. Continuous verification with rolling performance data.',
  path: '/features/outcome-certification',
  keywords: [
    'outcome-based certification',
    'verified compliance certification',
    'competency verification',
    'performance-based credentials',
  ],
});

const certificationLevels = [
  {
    level: 1,
    name: 'Fundamentals',
    requirements: 'Core curriculum + sector track completion',
    verification: '30-day performance check',
    validity: '2 years',
  },
  {
    level: 2,
    name: 'Verified Competent',
    requirements: 'Level 1 + 90 days of clean performance',
    verification: 'Rolling 90-day verification',
    validity: 'Continuous',
  },
  {
    level: 3,
    name: 'Compliance Champion',
    requirements: 'Level 2 + train others + 180 days excellence',
    verification: 'Site-level performance metrics',
    validity: 'Continuous',
  },
];

export default function OutcomeCertificationPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-cyan-400 font-medium mb-4">Certify Tier Feature</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Certificates That Prove Real Competency
          </h1>
          <p className="text-xl text-slate-300">
            Not just "they sat through training." Our certificates are backed by
            performance data that proves your team can actually do the job.
          </p>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Standard vs Outcome-Verified
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-100 rounded-lg p-8">
              <h3 className="text-xl font-bold mb-4 text-slate-600">
                Standard Certificate
              </h3>
              <ul className="space-y-3 text-slate-600">
                <li>Issued when course completed</li>
                <li>Proves attendance only</li>
                <li>Static verification (certificate ID)</li>
                <li>Time-based expiry (annual)</li>
                <li>Value: "They sat through it"</li>
              </ul>
            </div>
            <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-8">
              <h3 className="text-xl font-bold mb-4 text-blue-800">
                Outcome-Verified Certificate
              </h3>
              <ul className="space-y-3 text-blue-800">
                <li>Issued when performance verified</li>
                <li>Proves actual competency</li>
                <li>Real-time verification with data</li>
                <li>Continuous with clean performance</li>
                <li>Value: "They apply it correctly"</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Certification Levels */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Certification Levels
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {certificationLevels.map((cert) => (
              <div key={cert.level} className="bg-white rounded-lg p-6 border">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold mb-4">
                  L{cert.level}
                </div>
                <h3 className="text-xl font-bold mb-2">{cert.name}</h3>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-slate-500">Requirements</dt>
                    <dd>{cert.requirements}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Verification</dt>
                    <dd className="text-green-600">{cert.verification}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Validity</dt>
                    <dd>{cert.validity}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Public Verification */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Public Verification Portal</h2>
          <p className="text-slate-600 mb-8">
            Every certificate includes a verification URL and QR code. Employers,
            auditors, and regulators can verify credentials instantly at
            verify.fluxiot.com.
          </p>
          <div className="bg-slate-100 rounded-lg p-8 inline-block">
            <code className="text-lg">verify.fluxiot.com/FLUX-XXXX-XXXX</code>
          </div>
        </div>
      </section>

      <CTABanner
        title="Ready for credentials that matter?"
        description="Join the waitlist for outcome-verified certification."
        source="feature-outcome-certification"
      />
    </>
  );
}
```

**9.2.3 - Create Manager Dashboard Feature Page**

Create file: `src/app/(marketing)/features/manager-dashboard/page.tsx`
```typescript
import { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';
import { CTABanner } from '@/components/waitlist/cta-banner';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Manager Dashboard - Team Compliance Oversight',
  description:
    'Complete visibility into team compliance status, training progress, and certification levels. Actionable insights and proactive alerts for managers.',
  path: '/features/manager-dashboard',
  keywords: [
    'compliance team dashboard',
    'training management dashboard',
    'employee compliance tracking',
    'team compliance oversight',
  ],
});

const dashboardFeatures = [
  {
    title: 'Team Compliance Score',
    description: 'Aggregated score across all team members with trend indicators',
  },
  {
    title: 'Training Completion Rate',
    description: 'Percentage of required training completed on time',
  },
  {
    title: 'Certification Status',
    description: 'Team members by certification level with expiry alerts',
  },
  {
    title: 'Outstanding Training',
    description: 'Overdue and upcoming training by employee',
  },
  {
    title: 'Alert Response Times',
    description: 'Team average response times vs benchmark',
  },
  {
    title: 'Actionable Insights',
    description: 'AI-generated recommendations for improving team performance',
  },
];

const insightExamples = [
  {
    insight: '3 team members haven\'t completed HACCP module',
    action: 'Assign training with deadline',
  },
  {
    insight: 'Alert response times increased 40% this week',
    action: 'Schedule refresher training',
  },
  {
    insight: '2 certifications expiring in 30 days',
    action: 'Trigger recertification pathway',
  },
  {
    insight: 'Sarah has maintained 100% compliance for 90 days',
    action: 'Consider for Champion pathway',
  },
];

export default function ManagerDashboardPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-cyan-400 font-medium mb-4">Develop Tier Feature</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Complete Team Compliance Visibility
          </h1>
          <p className="text-xl text-slate-300">
            See every team member's training status, certification level, and
            performance metrics in one unified dashboard.
          </p>
        </div>
      </section>

      {/* Dashboard Features */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            What You'll See
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {dashboardFeatures.map((feature, i) => (
              <div key={i} className="p-6 border rounded-lg">
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Actionable Insights */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            AI-Powered Insights
          </h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Not just data—actionable recommendations. Our AI surfaces what needs
            attention and suggests next steps.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {insightExamples.map((example, i) => (
              <div key={i} className="bg-white p-6 rounded-lg border flex gap-4">
                <div className="text-2xl">💡</div>
                <div>
                  <p className="font-medium">{example.insight}</p>
                  <p className="text-blue-600 text-sm mt-2">→ {example.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        title="Ready for complete team visibility?"
        description="Join the waitlist for the manager dashboard."
        source="feature-manager-dashboard"
      />
    </>
  );
}
```

**9.2.4 - Create Employee Profiles Feature Page**

Create file: `src/app/(marketing)/features/employee-profiles/page.tsx`
```typescript
import { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';
import { CTABanner } from '@/components/waitlist/cta-banner';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Employee Profiles - Competency Tracking & Career Pathways',
  description:
    'Personal compliance dashboards with competency scores, certification progress, and clear career pathways from novice to Compliance Champion.',
  path: '/features/employee-profiles',
  keywords: [
    'employee compliance tracking',
    'competency profiles',
    'career pathway compliance',
    'employee certification tracking',
  ],
});

const competencyCategories = [
  { name: 'Temperature Knowledge', description: 'Understanding of storage requirements and danger zones' },
  { name: 'Incident Response', description: 'Alert handling and escalation procedures' },
  { name: 'Documentation', description: 'Record keeping and audit trail maintenance' },
  { name: 'Regulatory Awareness', description: 'Understanding of compliance requirements' },
  { name: 'Team Leadership', description: 'Ability to train and mentor others' },
];

export default function EmployeeProfilesPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-cyan-400 font-medium mb-4">Develop Tier Feature</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Every Employee's Compliance Journey
          </h1>
          <p className="text-xl text-slate-300">
            Personal dashboards showing competency scores, certification progress,
            achievements, and a clear path to Compliance Champion.
          </p>
        </div>
      </section>

      {/* Personal Dashboard */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            What Employees See
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {['My Compliance Score', 'Training Progress', 'My Certifications', 'Career Pathway'].map(
              (item, i) => (
                <div key={i} className="bg-slate-50 p-6 rounded-lg text-center">
                  <div className="text-3xl mb-4">
                    {['📊', '📚', '🏆', '🚀'][i]}
                  </div>
                  <h3 className="font-semibold">{item}</h3>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Competency Categories */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Competency Categories
          </h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Each employee builds a competency profile based on training completion
            and verified job performance.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competencyCategories.map((cat, i) => (
              <div key={i} className="bg-white p-6 rounded-lg border">
                <h3 className="font-semibold mb-2">{cat.name}</h3>
                <p className="text-slate-600 text-sm">{cat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Career Pathway */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Clear Career Progression</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            {['New Starter', 'Fundamentals (L1)', 'Verified Competent (L2)', 'Compliance Champion (L3)'].map(
              (stage, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      i === 3 ? 'bg-blue-600 text-white' : 'bg-slate-100'
                    }`}
                  >
                    {stage}
                  </div>
                  {i < 3 && <span className="text-slate-400">→</span>}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      <CTABanner
        title="Empower your team with clear progression"
        description="Join the waitlist for employee competency profiles."
        source="feature-employee-profiles"
      />
    </>
  );
}
```

### Task 9.3: Update Sitemap for Compliance OS Pages

**9.3.1 - Add Compliance OS Pages to Sitemap**

Update `src/app/sitemap.ts` to include:
```typescript
// Add Compliance OS product pages
const complianceOSPages = [
  { url: '/pricing', priority: 0.9, changeFrequency: 'weekly' as const },
  { url: '/features/ai-training', priority: 0.8, changeFrequency: 'monthly' as const },
  { url: '/features/outcome-certification', priority: 0.8, changeFrequency: 'monthly' as const },
  { url: '/features/manager-dashboard', priority: 0.8, changeFrequency: 'monthly' as const },
  { url: '/features/employee-profiles', priority: 0.8, changeFrequency: 'monthly' as const },
  { url: '/features/continuous-improvement', priority: 0.7, changeFrequency: 'monthly' as const },
];
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

### Phase 8: Training Center (Week 6-8)
- [ ] Create `/training` hub page with course listings
- [ ] Build Compliance 101 free course landing page
- [ ] Create course enrollment form component
- [ ] Set up email gate for course access
- [ ] Create training enrollment API endpoint
- [ ] Set up course_enrollments table in Supabase
- [ ] Create sector-specific training landing pages (food-service, healthcare, manufacturing, retail)
- [ ] Implement certificate verification system (`/verify/[id]`)
- [ ] Create certificates database table
- [ ] Add `EducationalOccupationalCredential` schema markup
- [ ] Create QR code component for certificates
- [ ] Build certificate verification page template
- [ ] Update sitemap to include training pages
- [ ] Update sitemap to include certificate pages
- [ ] Set up YouTube channel for training videos (optional)
- [ ] Create training email nurture sequence in Resend
- [ ] Add course enrollment tracking events
- [ ] Test full enrollment → certification flow

### Phase 9: Compliance OS Platform (Week 9-12)
- [ ] Create `/pricing` page with tier comparison
- [ ] Add SoftwareApplication schema markup to pricing page
- [ ] Create `/features/ai-training` page
- [ ] Create `/features/outcome-certification` page
- [ ] Create `/features/manager-dashboard` page
- [ ] Create `/features/employee-profiles` page
- [ ] Create `/features/continuous-improvement` page
- [ ] Add feature pages to sitemap
- [ ] Create feature comparison components
- [ ] Implement ROI calculator on pricing page
- [ ] Add tier-specific CTAs and conversion tracking
- [ ] Create "Why Flux" comparison page (vs traditional LMS)
- [ ] Add Compliance OS messaging to homepage
- [ ] Update meta descriptions for Compliance OS keywords
- [ ] Create testimonial components for each tier
- [ ] Test pricing page performance (Core Web Vitals)
- [ ] Set up A/B testing for pricing page CTAs

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
- Review training enrollments and completions
- Monitor certificate verification page traffic

### Monthly
- Review keyword rankings
- Update content based on performance
- Add new food items / state updates
- Publish 2-4 blog posts
- Repurpose training content into 1-2 blog posts
- Review training completion rates
- Update training content based on quiz feedback

### Quarterly
- Full SEO audit
- Competitor analysis
- Content gap analysis
- Strategy adjustment
- Review and update training course content
- Analyze certificate verification traffic and backlinks
- Plan new training modules based on demand

---

## Success Metrics

### Core SEO Metrics
| Metric | Month 1 | Month 3 | Month 6 |
|--------|---------|---------|---------|
| Indexed Pages | 100+ | 200+ | 400+ |
| Organic Sessions | 1,000 | 5,000 | 20,000 |
| Waitlist Signups | 100 | 500 | 2,000 |
| Keywords (Top 100) | 200 | 1,000 | 3,000 |
| Domain Authority | 10 | 20 | 30 |

### Training Center Metrics
| Metric | Month 1 | Month 3 | Month 6 |
|--------|---------|---------|---------|
| Course Enrollments | 50 | 300 | 1,500 |
| Course Completions | 25 | 150 | 800 |
| Certificates Issued | 20 | 120 | 600 |
| Certificate Verifications | 10 | 100 | 500 |
| Training → Waitlist Conv. | 40% | 50% | 60% |
| Training Keyword Rankings | 5 | 25 | 75 |

### Content Repurposing Metrics
| Metric | Month 1 | Month 3 | Month 6 |
|--------|---------|---------|---------|
| Blog Posts from Training | 2 | 10 | 25 |
| YouTube Videos | 0 | 5 | 15 |
| Interactive Tools | 1 | 3 | 5 |
| Training-Sourced Traffic | 100 | 1,000 | 5,000 |

### Compliance OS Product Metrics
| Metric | Month 1 | Month 3 | Month 6 |
|--------|---------|---------|---------|
| Pricing Page Views | 500 | 2,500 | 10,000 |
| Pricing Page → Demo | 5% | 8% | 12% |
| Feature Page Views | 1,000 | 5,000 | 20,000 |
| "Compliance OS" Keywords (Top 100) | 10 | 50 | 150 |
| Product Tier Signups | 5 | 25 | 100 |
| Enterprise Inquiries | 1 | 5 | 15 |

---

*Document Version: 1.2*
*Last Updated: January 2026*
*Added: Phase 9 Compliance OS Platform implementation*
