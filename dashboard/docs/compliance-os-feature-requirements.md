# Flux Compliance OS - Feature Requirements

A comprehensive product requirements document for the Flux Compliance OS platform evolution.

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Core Features by Tier](#core-features-by-tier)
3. [Training System Requirements](#training-system-requirements)
4. [Certification System Requirements](#certification-system-requirements)
5. [Employee Features](#employee-features)
6. [Manager Features](#manager-features)
7. [Integration Requirements](#integration-requirements)
8. [Implementation Phases](#implementation-phases)
9. [Technical Specifications](#technical-specifications)

---

## Platform Overview

### Vision Statement

Flux Compliance OS transforms cold chain management from reactive monitoring into a **Compliance Performance System** - a new product category that combines IoT sensors, AI-powered analysis, and outcome-verified training into a continuous improvement flywheel.

### Blue Ocean Positioning

| Traditional Approach | Flux Compliance OS |
|---------------------|-------------------|
| Monitor → Alert → React | Detect → Analyse → Report → Train → Improve → Verify → Certify |
| Point-in-time compliance audits | Continuous compliance verification |
| Training as checkbox exercise | Training triggered by real gaps, verified by outcomes |
| Certificates prove attendance | Certificates prove competency through data |
| Separate monitoring and training systems | Unified performance platform |

### The Continuous Improvement Flywheel

```
     ┌─────────────────────────────────────────────────────────────┐
     │                                                             │
     ▼                                                             │
  DETECT ──────► ANALYSE ──────► REPORT ──────► TRAIN             │
     │              │               │              │               │
     │         AI identifies    Automated      Micro-learning     │
     │         root causes     compliance     targeted to gaps    │
     │                         reports                             │
     │                                                             │
     │                                                             │
  CERTIFY ◄────── VERIFY ◄────── IMPROVE ◄─────────────────────────┘
     │              │               │
     │         Performance      Behaviour
  Outcome-        data           change
  verified        proves         through
  credentials     competency     application
```

### Core Differentiator

**Traditional Compliance Training:**
```
Complete course → Get certificate → Check box → Forget → Repeat annually
```

**Flux Compliance OS:**
```
Learn → Apply → Verify through data → Earn certification → Continuous improvement
```

---

## Core Features by Tier

### Tier 1: Monitor (£149/month)

The foundation tier provides IoT-based cold chain monitoring with basic AI insights.

| Feature | Description | Priority |
|---------|-------------|----------|
| Real-time temperature dashboard | Live view of all connected assets with status indicators | P0 |
| Multi-asset monitoring | Support for unlimited sensors per location | P0 |
| Configurable alert thresholds | Custom min/max temperatures per asset type | P0 |
| Multi-channel alerts | SMS, email, push notifications, phone calls | P0 |
| 24/7 monitoring | Continuous data collection and alerting | P0 |
| Basic AI insights | Trend detection, anomaly flagging | P1 |
| Mobile app access | iOS and Android apps with full monitoring | P1 |
| 12-month data retention | Historical data for basic analysis | P1 |
| Fleet overview map | Geographic view of all monitored locations | P1 |
| API access (read-only) | Integration with existing systems | P2 |

**Target User:** Operations Manager, Facility Manager

**Value Proposition:** "Never lose product to temperature excursions again."

---

### Tier 2: Comply (£299/month)

Adds automated compliance reporting and documentation to the Monitor tier.

| Feature | Description | Priority |
|---------|-------------|----------|
| All Monitor features | Everything from Tier 1 | P0 |
| Automated compliance reports | HACCP, FDA, MHRA, BRC-ready reports | P0 |
| One-click audit export | PDF/CSV export for inspectors | P0 |
| Excursion documentation | Automatic deviation logging with timestamps | P0 |
| Digital signatures | Electronic signature capture for records | P1 |
| Corrective action tracking | Log and track CAPA for each incident | P1 |
| Custom report templates | Branded reports with company details | P1 |
| Scheduled report delivery | Automatic weekly/monthly report emails | P1 |
| Regulatory calendar | Upcoming inspection reminders, recertification dates | P2 |
| 3-year data retention | Extended historical data for audits | P2 |
| Multi-location roll-up reports | Consolidated compliance view across sites | P2 |

**Target User:** Quality Assurance Manager, Compliance Officer

**Value Proposition:** "Be audit-ready every day, not just audit day."

---

### Tier 3: Develop (£499/month)

Introduces the training LMS with AI-triggered micro-learning and employee competency profiles.

| Feature | Description | Priority |
|---------|-------------|----------|
| All Comply features | Everything from Tiers 1-2 | P0 |
| Core training curriculum | 5-module temperature compliance fundamentals | P0 |
| AI-triggered micro-learning | Training assigned based on sensor data patterns | P0 |
| Sector-specific training tracks | Food Service, Healthcare, Manufacturing, Retail | P0 |
| Employee competency profiles | Individual learning progress and skills | P1 |
| Quiz and assessment engine | Knowledge verification with pass/fail thresholds | P1 |
| Training completion tracking | Dashboard for completion rates by employee | P1 |
| Manager team dashboard | View team training status and compliance | P1 |
| Training calendar | Scheduled learning with reminders | P2 |
| Content library access | On-demand access to all training materials | P2 |
| Mobile training app | Learn on any device, anytime | P2 |
| Custom training uploads | Add company-specific training content | P2 |

**Target User:** HR Director, L&D Manager, Training Coordinator

**Value Proposition:** "Training triggered by real gaps, not arbitrary schedules."

---

### Tier 4: Certify (£799/month)

The complete Compliance Performance System with outcome-verified certification.

| Feature | Description | Priority |
|---------|-------------|----------|
| All Develop features | Everything from Tiers 1-3 | P0 |
| Outcome-verified certification | Certs issued based on performance data | P0 |
| Certification levels | Fundamentals, Verified Competent, Compliance Champion | P0 |
| Public verification portal | Employers can verify credentials online | P0 |
| Portable digital credentials | LinkedIn badges, PDF certificates, QR codes | P1 |
| Career pathway visualisation | Clear progression from novice to expert | P1 |
| Performance-linked recertification | Auto-recert with clean performance data | P1 |
| Site-level certification | Facility certification based on team performance | P1 |
| Achievement system | Gamification with badges and recognition | P2 |
| Certification analytics | Track certification rates, trends, gaps | P2 |
| External verification API | Third-party systems can verify credentials | P2 |
| Compliance leaderboards | Gamified team competition | P2 |

**Target User:** HR Director, L&D Manager, Individual Employees

**Value Proposition:** "Prove competency with data, not just attendance."

---

### Tier 5: Enterprise (Custom Pricing)

Full platform with custom integrations, SSO, and dedicated support.

| Feature | Description | Priority |
|---------|-------------|----------|
| All Certify features | Everything from Tiers 1-4 | P0 |
| Single Sign-On (SSO) | SAML, OIDC integration with IdP | P0 |
| Custom integrations | HR systems, ERP, existing LMS | P0 |
| Dedicated account manager | Named support contact | P0 |
| SLA guarantee | 99.9% uptime, 4-hour response | P0 |
| Custom training development | Bespoke courses for specific needs | P1 |
| White-label option | Full branding customisation | P1 |
| Multi-tenant administration | Franchise/multi-site hierarchy | P1 |
| Advanced analytics | Custom reports, data exports, BI integration | P1 |
| On-premise deployment option | For regulated industries | P2 |
| Unlimited data retention | Perpetual data storage | P2 |
| Custom certification programmes | Industry-specific credentials | P2 |

**Target User:** Enterprise Compliance Director, CTO

**Value Proposition:** "Enterprise-grade compliance infrastructure."

---

## Training System Requirements

### 3.1 Core Curriculum (5 Modules)

All users with Develop tier or above receive access to the core curriculum.

| Module | Duration | Topics Covered | Learning Objectives |
|--------|----------|----------------|---------------------|
| **Module 1: Temperature Fundamentals** | 20 mins | Danger zone, bacterial growth, time-temperature abuse | Understand why temperature control matters |
| **Module 2: Monitoring Essentials** | 25 mins | Sensor placement, reading data, interpreting trends | Correctly use monitoring equipment |
| **Module 3: Alert Response** | 20 mins | Alert types, escalation procedures, documentation | Respond appropriately to alerts |
| **Module 4: Documentation & Compliance** | 25 mins | Record keeping, audit preparation, regulatory overview | Maintain compliant records |
| **Module 5: Corrective Actions** | 20 mins | Root cause analysis, CAPA procedures, prevention | Handle and prevent incidents |

**Total Core Curriculum Time:** ~2 hours

### 3.2 AI-Triggered Micro-Learning

The system automatically assigns targeted training based on sensor data patterns.

| Trigger Event | Training Assigned | Duration | Verification Metric | Verification Period |
|---------------|-------------------|----------|---------------------|---------------------|
| Alert response > 10 mins | "Rapid Response Protocol" | 5 mins | Response time < 5 mins | 30 days |
| Repeated door-open alerts | "Door Discipline Essentials" | 5 mins | Door alerts decrease 50% | 30 days |
| Post-delivery temp spikes | "Receiving Protocols" | 7 mins | No spikes for 30 days | 30 days |
| Documentation gaps | "Record Keeping Excellence" | 5 mins | 100% documentation rate | 30 days |
| Defrost cycle issues | "Defrost Management" | 5 mins | Normal defrost patterns | 14 days |
| After-hours excursions | "End-of-Day Procedures" | 5 mins | No after-hours issues | 14 days |
| Multiple CAPA needed | "Root Cause Analysis Deep Dive" | 15 mins | CAPA effectiveness | 60 days |
| New equipment added | "Equipment Onboarding" | 10 mins | Proper readings within 48h | 7 days |

**Technical Requirements:**
- Real-time event stream from sensor data
- Pattern recognition for trigger identification
- Automatic course assignment to relevant employee(s)
- Progress tracking and reminder notifications
- Verification metric monitoring

### 3.3 Sector-Specific Training Tracks

Additional specialised training for industry-specific compliance.

| Track | Target Audience | Modules | Duration |
|-------|-----------------|---------|----------|
| **Food Service** | Restaurants, cafes, pubs | HACCP, SFBB, Food Hygiene Rating prep | 3 hours |
| **Healthcare** | NHS, pharmacies, clinics | MHRA, CQC, vaccine storage, GDP | 4 hours |
| **Manufacturing** | Food production, processing | BRC, SALSA, FSSC 22000 | 4 hours |
| **Retail** | Supermarkets, food retail | Due diligence, supplier management | 2.5 hours |
| **Logistics** | Distribution, transport | In-transit monitoring, cold chain handovers | 3 hours |

### 3.4 Training Content Format

| Format | Use Case | Technical Requirements |
|--------|----------|------------------------|
| Video lessons | Core concepts, demonstrations | 720p minimum, captions, mobile-optimised |
| Interactive scenarios | Decision-making practice | Branching logic, tracking responses |
| Quick reference cards | On-the-job reference | Printable PDF, mobile-friendly web |
| Knowledge checks | Progress verification | Question bank, randomised selection |
| Assessments | Certification requirements | Proctoring-ready, time-limited |
| Flowcharts | Incident response procedures | Interactive, printable versions |

---

## Certification System Requirements

### 4.1 Certification Levels

| Level | Name | Requirements | Verification | Validity |
|-------|------|--------------|--------------|----------|
| Level 1 | **Fundamentals** | Core curriculum + sector track | 30-day performance check | 2 years |
| Level 2 | **Verified Competent** | Level 1 + 90-day clean performance | Rolling 90-day verification | Continuous |
| Level 3 | **Compliance Champion** | Level 2 + train others + 180-day excellence | Site-level performance | Continuous |

### 4.2 Standard vs Outcome-Verified Certificates

| Aspect | Standard Certificate | Outcome-Verified Certificate |
|--------|---------------------|------------------------------|
| Issued when | Course completed | Course completed + performance verified |
| Proves | Attendance, quiz passed | Actual competency in job |
| Verification | Certificate ID lookup | Real-time performance data |
| Value to employer | "They sat through training" | "They apply it correctly" |
| Renewal | Time-based expiry | Continuous with clean performance |
| Differentiator | Common | Unique to Flux |

### 4.3 Performance Verification Metrics

| Competency Area | Metrics Tracked | Green (Pass) | Amber (Warning) | Red (Fail) |
|-----------------|-----------------|--------------|-----------------|------------|
| Temperature Knowledge | Proper storage temps maintained | <2 excursions/month | 2-4 excursions | >4 excursions |
| Incident Response | Alert response time | <5 min avg | 5-15 min avg | >15 min avg |
| Documentation | Record completion rate | >98% | 95-98% | <95% |
| Regulatory Awareness | Compliance issues during audits | 0 critical | 1-2 minor | Any critical |
| Continuous Improvement | Training completion | On-time | <7 days late | >7 days late |

### 4.4 Public Verification Portal

**URL Pattern:** `verify.fluxiot.com/[certificate-id]` or `/verify/[certificate-id]`

**Page Elements:**
- Certificate holder name
- Credential level and type
- Issue date and validity status
- Issuing authority (Flux IoT)
- Skills verified (list)
- Performance verification status (for outcome-verified)
- QR code for mobile verification
- Download printable certificate button
- "Get Certified" CTA for visitors

**Schema Markup:**
```json
{
  "@context": "https://schema.org",
  "@type": "EducationalOccupationalCredential",
  "name": "Flux Cold Chain Compliance - Level 2: Verified Competent",
  "credentialCategory": "certificate",
  "recognizedBy": {
    "@type": "Organization",
    "name": "Flux IoT"
  },
  "validFor": "P2Y",
  "competencyRequired": [
    "Temperature Compliance Management",
    "Incident Response",
    "Documentation Excellence"
  ]
}
```

### 4.5 Certificate Database Schema

```sql
CREATE TABLE certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_id TEXT UNIQUE NOT NULL,        -- Public-facing ID (FLUX-XXXX-XXXX)
  user_id UUID REFERENCES users(id),
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  organisation_id UUID REFERENCES organisations(id),

  -- Credential details
  credential_type TEXT NOT NULL,              -- 'fundamentals', 'verified_competent', 'compliance_champion'
  sector_track TEXT,                          -- 'food-service', 'healthcare', etc.

  -- Dates
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  last_verified_at TIMESTAMP WITH TIME ZONE,

  -- Status
  status TEXT DEFAULT 'active',               -- 'active', 'expired', 'revoked', 'pending_verification'
  verification_type TEXT DEFAULT 'standard',  -- 'standard', 'outcome_verified'

  -- Performance data (for outcome-verified)
  performance_data JSONB DEFAULT '{}',
  performance_score INTEGER,                  -- 0-100

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_certificates_id ON certificates(certificate_id);
CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_certificates_org ON certificates(organisation_id);
CREATE INDEX idx_certificates_status ON certificates(status);
```

---

## Employee Features

### 5.1 Personal Dashboard

Every employee with training access gets a personal compliance dashboard.

| Feature | Description | Priority |
|---------|-------------|----------|
| My compliance score | Overall score based on performance data | P0 |
| Training progress | Courses completed, in-progress, assigned | P0 |
| Upcoming training | Calendar of required training with due dates | P0 |
| My certifications | Active credentials with verification links | P0 |
| Performance trends | Personal metrics over time | P1 |
| Achievements earned | Badges and recognition | P1 |
| Career pathway | Progress towards next certification level | P1 |
| Notification preferences | Control training reminders | P2 |

### 5.2 Competency Profiles

Each employee builds a competency profile based on training and performance.

| Competency Category | How Measured | Training Linked |
|---------------------|--------------|-----------------|
| Temperature Knowledge | Quiz scores, excursion rates | Core Module 1, sector tracks |
| Incident Response | Alert response times, CAPA quality | Core Module 3, Rapid Response |
| Documentation | Record completion rate, accuracy | Core Module 4, Record Keeping |
| Regulatory Awareness | Audit results, compliance incidents | Core Module 4, sector tracks |
| Team Leadership | Training others, mentorship | Compliance Champion pathway |

### 5.3 Career Pathways

Visual progression from entry-level to expert.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     COMPLIANCE CAREER PATHWAY                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   NEW STARTER                                                        │
│       │                                                              │
│       ▼                                                              │
│   ┌───────────────────┐                                              │
│   │   FUNDAMENTALS    │  Core curriculum + Sector track              │
│   │   (Level 1)       │  30-day performance check                    │
│   └─────────┬─────────┘                                              │
│             │                                                        │
│             ▼                                                        │
│   ┌───────────────────┐                                              │
│   │ VERIFIED COMPETENT│  90-day clean performance                    │
│   │   (Level 2)       │  Continuous verification                     │
│   └─────────┬─────────┘                                              │
│             │                                                        │
│             ▼                                                        │
│   ┌───────────────────┐                                              │
│   │    COMPLIANCE     │  Train others + 180-day excellence           │
│   │    CHAMPION       │  Site-level certification eligible           │
│   │   (Level 3)       │                                              │
│   └───────────────────┘                                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.4 Achievement System

Gamification to encourage engagement and continuous improvement.

| Badge | Requirement | Tier Required |
|-------|-------------|---------------|
| First Steps | Complete first training module | Develop |
| Knowledge Seeker | Complete core curriculum | Develop |
| Sector Specialist | Complete sector-specific track | Develop |
| Quick Responder | <5 min alert response for 30 days | Develop |
| Perfect Record | 100% documentation rate for 30 days | Develop |
| Cool Under Pressure | Zero excursions for 90 days | Certify |
| Compliance Champion | Achieve Level 3 certification | Certify |
| Mentor | Help train 5+ colleagues | Certify |
| Streak Master | 365 days of clean compliance | Certify |

---

## Manager Features

### 6.1 Team Overview Dashboard

Managers see aggregated compliance data for their team.

| Widget | Description | Priority |
|--------|-------------|----------|
| Team compliance score | Aggregated score across all team members | P0 |
| Training completion rate | % of required training completed on time | P0 |
| Certification status | Team members by certification level | P0 |
| Outstanding training | Overdue and upcoming training by employee | P0 |
| Alert response times | Team average vs benchmark | P1 |
| Top performers | Recognition of high-performing team members | P1 |
| Risk indicators | Employees needing attention | P1 |
| Trend analysis | Team performance over time | P2 |

### 6.2 Actionable Insights

AI-generated recommendations for managers.

| Insight Type | Example | Action |
|--------------|---------|--------|
| Training gap | "3 team members haven't completed HACCP module" | Assign training, set deadline |
| Performance drop | "Alert response times increased 40% this week" | Schedule refresher, investigate cause |
| Certification expiry | "2 certifications expiring in 30 days" | Trigger recertification training |
| High performer | "Sarah has maintained 100% compliance for 90 days" | Recognise, consider for Champion pathway |
| Pattern detection | "Monday mornings show more excursions" | Adjust procedures, assign targeted training |

### 6.3 Training Assignment

Managers can manually assign training beyond AI triggers.

| Feature | Description |
|---------|-------------|
| Individual assignment | Assign specific courses to specific employees |
| Bulk assignment | Assign training to multiple employees at once |
| Deadline setting | Set due dates with reminder notifications |
| Prerequisite management | Enforce training order where required |
| Custom learning paths | Create role-specific training sequences |
| Training reports | Export completion data for audits |

### 6.4 Performance Reports

Exportable reports for compliance audits and HR.

| Report | Contents | Format |
|--------|----------|--------|
| Training Compliance Report | Completion rates, outstanding training, trends | PDF, CSV |
| Certification Status Report | All certifications, levels, validity dates | PDF, CSV |
| Performance Summary | Key metrics by employee, benchmarked | PDF |
| Incident Response Report | Alert response times, outcomes | PDF, CSV |
| Audit Preparation Report | Combined compliance documentation | PDF |

---

## Integration Requirements

### 7.1 Sensor → Training Triggers

The core innovation: sensor data triggers training assignments.

**Data Flow:**
```
Sensor Event ──► Event Processor ──► Pattern Matcher ──► Training Assignment
                     │                     │                     │
                     ▼                     ▼                     ▼
              Alert generated        Trigger identified     Course assigned
              (existing flow)         (new logic)         to relevant user(s)
```

**Technical Requirements:**
- Real-time event streaming from sensor data
- Pattern recognition service (rules engine or ML)
- Integration with training LMS
- User attribution (which employee is responsible for this asset)
- Assignment notification system

### 7.2 Performance → Certification Link

Continuous performance data verifies certification validity.

**Data Flow:**
```
Performance Metrics ──► Aggregation ──► Threshold Check ──► Certification Status
                            │                │                      │
                            ▼                ▼                      ▼
                       Daily rollup    Pass/Warn/Fail         Active/Warning/Revoked
```

**Metrics Aggregated:**
- Alert response times (per employee, per asset)
- Excursion rates (per employee responsibility)
- Documentation completion rates
- Training completion timeliness
- CAPA effectiveness

### 7.3 HR System Integration

Enterprise customers need SSO and HR data sync.

| Integration | Data Exchanged | Direction |
|-------------|----------------|-----------|
| Employee sync | Name, email, department, role, manager | HR → Flux |
| Training records | Completions, certifications | Flux → HR |
| Org structure | Departments, locations, hierarchy | HR → Flux |
| Offboarding | Deactivate users, archive records | HR → Flux |

**Supported HR Systems (Roadmap):**
- BambooHR
- Workday
- SAP SuccessFactors
- ADP
- Hibob
- Custom API

### 7.4 LMS Integration (Optional)

For customers with existing LMS, option to embed Flux training or export records.

| Option | Description |
|--------|-------------|
| Flux as primary LMS | All training delivered through Flux platform |
| Content export | SCORM packages for import into existing LMS |
| Record sync | Completions sync to external LMS for unified reporting |
| Embedded modules | Flux training embedded in existing LMS via LTI |

---

## Implementation Phases

### Phase 1: MVP (Months 1-3)

**Scope:** Monitor + Comply tiers fully functional

| Deliverable | Description | Priority |
|-------------|-------------|----------|
| Core monitoring dashboard | Real-time temperature display, alerts | P0 |
| Alert management | Multi-channel notifications, escalation | P0 |
| Basic compliance reports | HACCP, FDA template reports | P0 |
| Report export | PDF/CSV download | P0 |
| Waitlist → customer conversion | Onboarding flow for paying customers | P0 |
| Stripe integration | Subscription billing for Monitor/Comply | P1 |
| Basic mobile app | View-only monitoring on iOS/Android | P1 |

**Success Metrics:**
- 10 paying customers on Monitor or Comply tier
- <5 min average alert response time
- 95% customer satisfaction (NPS)

---

### Phase 2: Training LMS (Months 4-6)

**Scope:** Develop tier with training platform

| Deliverable | Description | Priority |
|-------------|-------------|----------|
| Training content creation | Core curriculum (5 modules) | P0 |
| LMS platform | Course delivery, progress tracking | P0 |
| Quiz engine | Knowledge verification | P0 |
| Employee dashboard | Personal training view | P0 |
| Manager dashboard | Team training oversight | P0 |
| Sector-specific tracks | Food Service + Healthcare first | P1 |
| AI-triggered training (basic) | 3 trigger types initially | P1 |
| Mobile training access | Complete training on mobile | P1 |

**Success Metrics:**
- 5 customers upgraded to Develop tier
- 80% training completion rate
- 50+ employees using platform

---

### Phase 3: Certification System (Months 7-9)

**Scope:** Certify tier with outcome verification

| Deliverable | Description | Priority |
|-------------|-------------|----------|
| Certification engine | Issue, track, verify certificates | P0 |
| Public verification portal | verify.fluxiot.com/[id] | P0 |
| Outcome verification | Performance-linked certification | P0 |
| Certification levels | L1, L2, L3 pathways | P0 |
| Digital credentials | LinkedIn badges, QR codes | P1 |
| Achievement system | Badges and gamification | P1 |
| Career pathway UI | Visual progression | P1 |
| Full AI-trigger suite | All 8 trigger types | P2 |

**Success Metrics:**
- 3 customers on Certify tier
- 100+ certificates issued
- 50+ verification page visits/month

---

### Phase 4: Enterprise Features (Months 10-12)

**Scope:** Enterprise tier with integrations

| Deliverable | Description | Priority |
|-------------|-------------|----------|
| SSO integration | SAML/OIDC support | P0 |
| API access (full) | Read/write API for integrations | P0 |
| HR system connectors | BambooHR, Workday first | P1 |
| White-label option | Custom branding | P1 |
| Advanced analytics | Custom reports, BI export | P1 |
| Multi-tenant admin | Franchise/multi-site hierarchy | P2 |
| Custom training uploads | Company-specific content | P2 |

**Success Metrics:**
- 2 Enterprise customers signed
- £50K+ ARR from Enterprise tier
- <1 week SSO implementation time

---

## Technical Specifications

### 9.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FLUX COMPLIANCE OS                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   MONITOR   │  │    COMPLY   │  │   DEVELOP   │  │   CERTIFY   │ │
│  │   Module    │  │    Module   │  │   Module    │  │   Module    │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │
│         │                │                │                │        │
│         └────────────────┴────────────────┴────────────────┘        │
│                                   │                                  │
│                        ┌──────────┴──────────┐                      │
│                        │    Core Platform    │                      │
│                        ├─────────────────────┤                      │
│                        │ • User Management   │                      │
│                        │ • Organisation Mgmt │                      │
│                        │ • Billing (Stripe)  │                      │
│                        │ • Notification Hub  │                      │
│                        │ • Analytics Engine  │                      │
│                        │ • AI/ML Services    │                      │
│                        └─────────────────────┘                      │
│                                   │                                  │
│                        ┌──────────┴──────────┐                      │
│                        │     Data Layer      │                      │
│                        ├─────────────────────┤                      │
│                        │ • Supabase (Postgres)│                     │
│                        │ • Redis (Cache)     │                      │
│                        │ • TimescaleDB       │                      │
│                        │   (Sensor Data)     │                      │
│                        └─────────────────────┘                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.2 Database Schema Summary

| Table | Purpose | Key Fields |
|-------|---------|------------|
| organisations | Company accounts | id, name, plan_tier, settings |
| users | Employee accounts | id, org_id, email, role, manager_id |
| assets | Monitored equipment | id, org_id, name, type, location |
| sensor_readings | Time-series data | asset_id, timestamp, temperature |
| alerts | Alert history | id, asset_id, type, status, response_time |
| training_courses | Course catalogue | id, title, sector, duration, content |
| training_enrollments | User-course assignments | user_id, course_id, status, progress |
| training_completions | Finished courses | user_id, course_id, score, completed_at |
| certificates | Issued credentials | id, user_id, type, status, performance_data |
| competency_scores | Employee competencies | user_id, category, score, updated_at |
| achievements | Earned badges | user_id, badge_id, earned_at |

### 9.3 API Endpoints (Summary)

| Endpoint | Method | Purpose | Tier |
|----------|--------|---------|------|
| `/api/v1/assets` | GET, POST | List/create assets | All |
| `/api/v1/readings` | GET, POST | Sensor data | All |
| `/api/v1/alerts` | GET, POST, PATCH | Alert management | All |
| `/api/v1/reports` | GET, POST | Compliance reports | Comply+ |
| `/api/v1/training/courses` | GET | List available courses | Develop+ |
| `/api/v1/training/enroll` | POST | Enroll user in course | Develop+ |
| `/api/v1/training/progress` | GET, PATCH | Track progress | Develop+ |
| `/api/v1/certificates` | GET, POST | Certificate management | Certify+ |
| `/api/v1/verify/:id` | GET | Public certificate verification | Public |
| `/api/v1/competencies` | GET | Employee competency scores | Develop+ |
| `/api/v1/analytics` | GET | Performance analytics | All |

### 9.4 Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| Authentication | JWT tokens, 24h expiry, refresh tokens |
| Authorisation | Role-based access control (RBAC) |
| Encryption at rest | AES-256 for sensitive data |
| Encryption in transit | TLS 1.3 minimum |
| Audit logging | All data access logged |
| GDPR compliance | Data export, deletion on request |
| SOC 2 readiness | Security controls documented |
| Penetration testing | Annual third-party assessment |

### 9.5 Performance Requirements

| Metric | Target |
|--------|--------|
| Dashboard load time | <2 seconds |
| Alert delivery (SMS/email) | <30 seconds from trigger |
| Real-time data latency | <5 seconds from sensor |
| API response time (p95) | <200ms |
| Uptime SLA | 99.9% |
| Training video load | <3 seconds to start playback |
| Certificate verification | <1 second |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 2026 | Product Team | Initial feature requirements |

**Next Review Date:** April 2026

**Document Owner:** Product Team

---

*This document should be reviewed quarterly and updated based on customer feedback, market changes, and technical capabilities.*
