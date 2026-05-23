# VAKIL ON CALL — Tech Stack & Detailed Development Plan

> **Version**: 1.0 | **Date**: May 2026 | **Author**: AI-Assisted for Mohammed Umair & Team
>
> **Purpose**: This document defines the final tech stack, architecture, feature breakdown, database schema, API design, and phased sprint plan for building the VakilOnCall mobile application for Android and iOS.

---

## Table of Contents

1. [Tech Stack Decision & Rationale](#1-tech-stack-decision--rationale)
2. [System Architecture](#2-system-architecture)
3. [Feature Breakdown by Priority](#3-feature-breakdown-by-priority)
4. [Database Schema Design](#4-database-schema-design)
5. [API Design](#5-api-design)
6. [Phased Sprint Plan](#6-phased-sprint-plan)
7. [Third-Party Integrations](#7-third-party-integrations)
8. [Security & Compliance](#8-security--compliance)
9. [Testing Strategy](#9-testing-strategy)
10. [Deployment & DevOps](#10-deployment--devops)
11. [Cost Breakdown](#11-cost-breakdown)
12. [Risk Mitigation Checklist](#12-risk-mitigation-checklist)

---

## 1. Tech Stack Decision & Rationale

### 1.1 Mobile App — React Native (Expo)

| Criteria | Decision | Rationale |
|---|---|---|
| **Framework** | React Native with Expo SDK 52+ | Single codebase for Android + iOS. Expo Go enables instant device testing without native builds. Fast iteration. |
| **Language** | TypeScript | Type safety prevents runtime bugs in a legally-sensitive app. Better IDE support. |
| **Navigation** | Expo Router (file-based routing) | Built into Expo, no extra dependency. Familiar Next.js-style routing. |
| **State Management** | Zustand | Lightweight (~1KB), simple API, no boilerplate. Perfect for a small team. |
| **UI Components** | React Native Paper + Custom components | Material Design 3 compliance. Pre-built accessible components. Customizable theming. |
| **Forms** | React Hook Form + Zod | Performant form handling. Zod provides schema validation shared with backend. |
| **Animations** | React Native Reanimated 3 | Smooth 60fps animations for SOS triggers, scenario selection, call UI. |
| **Local Storage** | Expo SecureStore (sensitive) + MMKV (general) | SecureStore for tokens/auth. MMKV is 30x faster than AsyncStorage. |
| **Push Notifications** | Expo Notifications + Firebase FCM | Free. Expo handles both platforms. FCM for background delivery. |
| **OTA Updates** | Expo Updates (EAS Update) | Push JS bundle updates without app store review. Critical for legal content updates. |

**Why React Native over Flutter?**

- Team has CS/JS background — zero learning curve for React Native
- Expo eliminates native build complexity (no Xcode/Android Studio needed initially)
- Larger ecosystem for India-specific packages (Razorpay SDK, Exotel, etc.)
- EAS Build provides free cloud builds (no Mac required for iOS builds)

### 1.2 Backend — Node.js + Express + TypeScript

| Layer | Tool | Rationale |
|---|---|---|
| **Runtime** | Node.js 20 LTS | Non-blocking I/O for real-time call matching. Team knows JS. |
| **Framework** | Express.js 5 | Minimal, battle-tested. Easy to add middleware (auth, rate limiting, logging). |
| **Language** | TypeScript | Shared types with frontend. Prevents API contract bugs. |
| **ORM** | Prisma | Type-safe DB queries. Auto-generates types from schema. Easy migrations. |
| **Validation** | Zod | Shared validation schemas between frontend and backend. |
| **Real-time** | Socket.io | WebSocket-based real-time matching (lawyer-user pairing, status updates). |
| **Job Queue** | BullMQ + Redis | Background jobs: lawyer verification, recording processing, notification batching. |
| **File Upload** | Multer + Supabase Storage | Lawyer documents, evidence locker files, call recordings. |
| **Logging** | Pino | Structured JSON logging. 5x faster than Winston. |
| **Rate Limiting** | express-rate-limit + Redis | Prevent abuse of token purchase and SOS endpoints. |

### 1.3 Database — Supabase (PostgreSQL)

| Feature | Detail |
|---|---|
| **Primary DB** | PostgreSQL 15 via Supabase (free tier: 500MB, 2 projects) |
| **Auth** | Supabase Auth (Phone OTP built-in, Google/Apple OAuth) |
| **Realtime** | Supabase Realtime for lawyer availability broadcast |
| **Storage** | Supabase Storage for documents and call recordings (S3-compatible) |
| **Edge Functions** | Supabase Edge Functions for webhooks (Razorpay, Exotel callbacks) |
| **Row Level Security** | PostgreSQL RLS policies — users can only access their own data |

### 1.4 Additional Infrastructure

| Service | Tool | Cost |
|---|---|---|
| **Backend Hosting** | Railway.app (free → ₹700/mo) | Free 500hrs/mo |
| **Redis** | Upstash Redis (serverless, free tier) | Free → pay per request |
| **VoIP/Calling** | Exotel API | ~₹0.50/min |
| **Payments** | Razorpay (UPI, cards, wallets) | 2% per txn |
| **SMS OTP** | Supabase Auth → Twilio | ~₹0.20–0.50/OTP |
| **Error Tracking** | Sentry (free tier: 5K events/mo) | Free |
| **Uptime Monitor** | UptimeRobot (free: 50 monitors) | Free |
| **CI/CD** | GitHub Actions (free: 2000 min/mo) | Free |
| **iOS Builds** | EAS Build (free tier: 30 builds/mo) | Free |
| **Analytics** | PostHog (free: 1M events/mo) | Free |
| **Design** | Figma (free: 3 projects) | Free |

### 1.5 Complete Architecture Diagram

```
┌────────────────────────────────────────────────────────────┐
│                    MOBILE APP (Expo/RN)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ User App │ │ Lawyer   │ │ Evidence │ │ SOS/Emergency│  │
│  │  Module  │ │  Module  │ │  Locker  │ │   Module     │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘  │
│       └─────────────┴────────────┴──────────────┘          │
│                          │                                  │
│              Expo Notifications (FCM)                       │
└──────────────────────────┬─────────────────────────────────┘
                           │ HTTPS + WebSocket
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    API GATEWAY (Express.js)                   │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │  Auth   │ │  Match   │ │  Token   │ │  Call Session  │  │
│  │Middleware│ │  Engine  │ │  Engine  │ │   Manager      │  │
│  └─────────┘ └──────────┘ └──────────┘ └────────────────┘  │
│                          │                                   │
│  ┌───────────────────────┴──────────────────────────┐       │
│  │              BullMQ Job Queue (Redis)             │       │
│  │  • Lawyer verification  • Recording processing   │       │
│  │  • Notification batch   • Analytics aggregation   │       │
│  └──────────────────────────────────────────────────┘       │
└──────────────┬───────────────┬────────────┬─────────────────┘
               │               │            │
       ┌───────▼──────┐ ┌─────▼─────┐ ┌────▼─────┐
       │  Supabase    │ │  Exotel   │ │ Razorpay │
       │  (Postgres + │ │  (VoIP)   │ │(Payments)│
       │  Auth +      │ │           │ │          │
       │  Storage +   │ │           │ │          │
       │  Realtime)   │ │           │ │          │
       └──────────────┘ └───────────┘ └──────────┘
```

---

## 2. System Architecture

### 2.1 Module Decomposition

The application is split into these independent modules:

| Module | Responsibility | Key Screens |
|---|---|---|
| **Auth** | Phone OTP login, user/lawyer role selection, lawyer document upload + verification | Login, OTP Verify, Role Select, Lawyer Document Upload |
| **User Dashboard** | Token balance, buy tokens, active encounters, history | Home, Token Store, History |
| **Lawyer Dashboard** | Go online/offline, incoming requests, earnings, profile | Lawyer Home, Earnings, Profile |
| **Matching Engine** | Real-time user-lawyer pairing by language, scenario, availability | (Backend-only, no UI) |
| **Call Session** | In-call UI, timer, recording consent, scenario context display | Active Call, Call Summary |
| **SOS** | Emergency contact setup, auto-fire GPS + timestamp + details | SOS Setup, SOS Fired Confirmation |
| **Evidence Locker** | Store Aadhaar, DL, RC, PUC, insurance, encounter evidence | Document Vault, Add Document |
| **Rights Knowledge** | Free rights display (DK Basu, BNSS), scenario-specific guides | Rights Screen, Scenario Guide |
| **Rating & Review** | Post-call rating, lawyer review, reporting mechanism | Rate Call, Report Issue |
| **Admin Panel** | Lawyer verification queue, call audit, user management | (Web-only, React + Supabase) |

### 2.2 Real-Time Call Matching Flow

```
User taps "Get Help Now"
       │
       ▼
Select Scenario (Traffic Stop / FIR Refusal / Custodial / etc.)
       │
       ▼
Check Token Balance → If 0 → Redirect to Token Store
       │ (≥1 token)
       ▼
Auto-fire SOS to emergency contacts (GPS + timestamp)
       │
       ▼
WebSocket: Broadcast to online lawyers matching:
  1. Language preference
  2. Scenario competency
  3. Availability status
  4. Rating threshold (≥3.0)
       │
       ▼
First lawyer to accept → Deduct 1 token → Initiate Exotel call
       │
       ▼
In-call: Timer starts, recording begins (with consent banner)
  - Lawyer sees scenario context
  - User sees rights checklist for scenario
       │
       ▼
Call ends (user PIN or 15 min limit)
       │
       ▼
Post-call: Rate lawyer → Follow-up prompt → Evidence save option
       │
       ▼
Lawyer wallet: ₹32 credited → Withdrawable after 7-day hold
```

---

## 3. Feature Breakdown by Priority

### P0 — MVP (Must have for first release)

| # | Feature | Module | Complexity |
|---|---|---|---|
| 1 | Phone OTP auth (user + lawyer) | Auth | Medium |
| 2 | User role vs Lawyer role selection | Auth | Low |
| 3 | Lawyer Bar enrollment document upload | Auth | Medium |
| 4 | Manual lawyer verification (admin flags verified) | Admin | Low |
| 5 | Token purchase (₹59/₹149/₹299/₹549 packs) via Razorpay | Token | High |
| 6 | Token balance display | Dashboard | Low |
| 7 | "Get Help Now" → Scenario selection → Match → Call | Core Loop | Very High |
| 8 | Lawyer go online/offline toggle | Lawyer | Low |
| 9 | Lawyer accepts/rejects incoming request | Lawyer | Medium |
| 10 | Exotel VoIP call between matched user-lawyer | Call | High |
| 11 | Call recording with consent | Call | Medium |
| 12 | 15-min call timer | Call | Low |
| 13 | Post-call rating (1–5 stars) | Rating | Low |
| 14 | Emergency contact setup (3 contacts) | SOS | Medium |
| 15 | Auto-SOS on encounter start (SMS + GPS to contacts) | SOS | High |
| 16 | Free rights screen (no token needed) | Rights | Low |
| 17 | Push notification: lawyer accepted, call starting | Notifications | Medium |
| 18 | Lawyer earnings display + withdrawal request | Lawyer | Medium |

### P1 — Post-MVP (Weeks 15–18 Alpha)

| # | Feature | Module | Complexity |
|---|---|---|---|
| 19 | Evidence Locker (store Aadhaar, DL, RC, PUC, insurance) | Evidence | Medium |
| 20 | Post-encounter follow-up prompt | Call | Low |
| 21 | Lawyer profile (photo, languages, rating, call count) | Lawyer | Medium |
| 22 | User call history with details | Dashboard | Low |
| 23 | Report a lawyer (post-call) | Rating | Medium |
| 24 | Scenario-specific rights checklists (6 scenarios) | Rights | Medium |
| 25 | Token refund if call drops < 2 min | Token | Medium |

### P2 — Soft Launch (Weeks 19–26)

| # | Feature | Module | Complexity |
|---|---|---|---|
| 26 | Language preference matching (Hindi + English) | Matching | High |
| 27 | Digital arrest scam detector ("Is this call real?") | Rights | Low |
| 28 | FIR filing guidance (step-by-step post-encounter) | Rights | Medium |
| 29 | Lawyer BNS/BNSS competency quiz (onboarding gate) | Admin | Medium |
| 30 | Admin panel: call audit, lawyer management | Admin | High |
| 31 | In-app knowledge base (BNS/BNSS, DK Basu) | Rights | Medium |

### P3 — Growth (Month 7–12)

| # | Feature | Module | Complexity |
|---|---|---|---|
| 32 | Hindi UI | i18n | High |
| 33 | Senior lawyer tier (premium tokens) | Token | Medium |
| 34 | Specialized call routing (police, landlord, consumer, workplace) | Matching | High |
| 35 | Video call option | Call | High |
| 36 | Encounter evidence photos/audio storage | Evidence | Medium |
| 37 | Regional language support (Tamil, Telugu, Kannada, Bengali, Marathi) | i18n | Very High |
| 38 | Offline rights display (cached) | Rights | Low |
| 39 | Dark mode | UI | Low |

---

## 4. Database Schema Design

### 4.1 Core Tables

```sql
-- ==========================================
-- USERS TABLE
-- ==========================================
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           VARCHAR(15) UNIQUE NOT NULL,
  full_name       VARCHAR(100),
  role            VARCHAR(10) NOT NULL CHECK (role IN ('user', 'lawyer')),
  language_pref   VARCHAR(10) DEFAULT 'en',  -- 'en', 'hi', 'ta', 'te', etc.
  token_balance   INTEGER DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  is_banned       BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- LAWYER PROFILES TABLE
-- ==========================================
CREATE TABLE lawyer_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bar_enrollment_number VARCHAR(50) UNIQUE NOT NULL,
  bar_council_state     VARCHAR(50) NOT NULL,
  enrollment_cert_url   TEXT NOT NULL,          -- Supabase Storage URL
  id_proof_url          TEXT,
  verification_status   VARCHAR(20) DEFAULT 'pending'
                        CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_at           TIMESTAMPTZ,
  verified_by           UUID,                   -- Admin user ID
  is_online             BOOLEAN DEFAULT false,
  languages             TEXT[] DEFAULT '{en}',   -- Array: ['en', 'hi', 'ta']
  scenario_tags         TEXT[] DEFAULT '{}',     -- Array: ['traffic', 'fir', 'custodial']
  avg_rating            DECIMAL(3,2) DEFAULT 0.00,
  total_calls           INTEGER DEFAULT 0,
  total_earnings        DECIMAL(10,2) DEFAULT 0.00,
  wallet_balance        DECIMAL(10,2) DEFAULT 0.00,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- EMERGENCY CONTACTS TABLE
-- ==========================================
CREATE TABLE emergency_contacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  phone       VARCHAR(15) NOT NULL,
  relation    VARCHAR(50),
  priority    INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 3),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, priority)
);

-- ==========================================
-- TOKEN PACKS TABLE
-- ==========================================
CREATE TABLE token_packs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(50) NOT NULL,       -- 'Starter', 'Basic', 'Standard', 'Premium'
  tokens      INTEGER NOT NULL,           -- 1, 3, 7, 15
  price_inr   DECIMAL(8,2) NOT NULL,      -- 59, 149, 299, 549
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- TOKEN TRANSACTIONS TABLE
-- ==========================================
CREATE TABLE token_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  type              VARCHAR(20) NOT NULL
                    CHECK (type IN ('purchase', 'deduct', 'refund', 'promo')),
  tokens            INTEGER NOT NULL,       -- Positive for credit, negative for debit
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  token_pack_id     UUID REFERENCES token_packs(id),
  call_session_id   UUID,                   -- References call that consumed the token
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- CALL SESSIONS TABLE
-- ==========================================
CREATE TABLE call_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id),
  lawyer_id         UUID REFERENCES users(id),
  scenario          VARCHAR(30) NOT NULL
                    CHECK (scenario IN (
                      'traffic_stop', 'fir_refusal', 'custodial_arrest',
                      'domestic_dispute', 'digital_scam', 'workplace_raid',
                      'eviction', 'consumer', 'other'
                    )),
  status            VARCHAR(20) DEFAULT 'matching'
                    CHECK (status IN (
                      'matching', 'lawyer_accepted', 'in_call',
                      'completed', 'dropped', 'cancelled', 'no_lawyers'
                    )),
  exotel_call_sid   VARCHAR(100),
  recording_url     TEXT,
  recording_duration_sec INTEGER,
  tokens_charged    INTEGER DEFAULT 0,
  lawyer_payout     DECIMAL(8,2) DEFAULT 0.00,
  platform_revenue  DECIMAL(8,2) DEFAULT 0.00,
  user_latitude     DECIMAL(10,7),
  user_longitude    DECIMAL(10,7),
  sos_fired         BOOLEAN DEFAULT false,
  started_at        TIMESTAMPTZ,
  connected_at      TIMESTAMPTZ,
  ended_at          TIMESTAMPTZ,
  end_reason        VARCHAR(20)
                    CHECK (end_reason IN (
                      'user_ended', 'lawyer_ended', 'time_limit',
                      'dropped', 'cancelled'
                    )),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- RATINGS TABLE
-- ==========================================
CREATE TABLE ratings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_session_id UUID UNIQUE REFERENCES call_sessions(id),
  user_id         UUID REFERENCES users(id),
  lawyer_id       UUID REFERENCES users(id),
  stars           INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment         TEXT,
  is_reported     BOOLEAN DEFAULT false,
  report_reason   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- SOS ALERTS TABLE
-- ==========================================
CREATE TABLE sos_alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  call_session_id UUID REFERENCES call_sessions(id),
  latitude        DECIMAL(10,7) NOT NULL,
  longitude       DECIMAL(10,7) NOT NULL,
  contacts_notified JSONB DEFAULT '[]',   -- Array of {name, phone, sms_status}
  officer_name    VARCHAR(100),
  officer_badge   VARCHAR(50),
  fired_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- EVIDENCE LOCKER TABLE
-- ==========================================
CREATE TABLE evidence_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  doc_type        VARCHAR(30) NOT NULL
                  CHECK (doc_type IN (
                    'aadhaar', 'driving_license', 'rc_book',
                    'vehicle_insurance', 'puc_certificate',
                    'encounter_photo', 'encounter_audio', 'other'
                  )),
  file_url        TEXT NOT NULL,
  file_name       VARCHAR(200),
  is_encrypted    BOOLEAN DEFAULT true,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- LAWYER PAYOUTS TABLE
-- ==========================================
CREATE TABLE lawyer_payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id       UUID REFERENCES users(id),
  amount          DECIMAL(10,2) NOT NULL,
  status          VARCHAR(20) DEFAULT 'pending'
                  CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  razorpay_payout_id VARCHAR(100),
  bank_account    JSONB,                    -- {ifsc, account_number, name}
  upi_id          VARCHAR(100),
  requested_at    TIMESTAMPTZ DEFAULT NOW(),
  processed_at    TIMESTAMPTZ
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_lawyer_online ON lawyer_profiles(is_online) WHERE is_online = true;
CREATE INDEX idx_lawyer_verified ON lawyer_profiles(verification_status) WHERE verification_status = 'verified';
CREATE INDEX idx_lawyer_languages ON lawyer_profiles USING GIN(languages);
CREATE INDEX idx_call_sessions_status ON call_sessions(status);
CREATE INDEX idx_call_sessions_user ON call_sessions(user_id);
CREATE INDEX idx_call_sessions_lawyer ON call_sessions(lawyer_id);
CREATE INDEX idx_token_transactions_user ON token_transactions(user_id);
CREATE INDEX idx_sos_alerts_user ON sos_alerts(user_id);
```

---

## 5. API Design

### 5.1 REST API Endpoints

#### Auth
```
POST   /api/v1/auth/send-otp          { phone }
POST   /api/v1/auth/verify-otp        { phone, otp }
POST   /api/v1/auth/set-role           { role: 'user' | 'lawyer' }
GET    /api/v1/auth/me                 → Current user profile
```

#### User
```
GET    /api/v1/user/profile
PATCH  /api/v1/user/profile            { full_name, language_pref }
GET    /api/v1/user/token-balance
GET    /api/v1/user/call-history       ?page=1&limit=20
```

#### Tokens
```
GET    /api/v1/tokens/packs                       → Available token packs
POST   /api/v1/tokens/create-order     { pack_id } → Razorpay order
POST   /api/v1/tokens/verify-payment   { razorpay_order_id, payment_id, signature }
```

#### Call Sessions
```
POST   /api/v1/calls/request           { scenario, latitude, longitude }
POST   /api/v1/calls/:id/cancel        (user cancels before match)
GET    /api/v1/calls/:id/status         → Current call status
POST   /api/v1/calls/:id/end           { pin }  (user ends call)
POST   /api/v1/calls/:id/rate          { stars, comment }
POST   /api/v1/calls/:id/report        { reason }
```

#### Lawyer
```
POST   /api/v1/lawyer/register         { bar_number, state, cert_file, id_file }
GET    /api/v1/lawyer/profile
PATCH  /api/v1/lawyer/profile           { languages, scenario_tags }
POST   /api/v1/lawyer/toggle-online     { is_online: boolean }
GET    /api/v1/lawyer/earnings          ?from=&to=
POST   /api/v1/lawyer/payout-request    { amount, upi_id | bank_account }
```

#### SOS
```
POST   /api/v1/sos/contacts             { contacts: [{name, phone, relation}] }
GET    /api/v1/sos/contacts
POST   /api/v1/sos/fire                 { latitude, longitude, officer_name?, badge? }
```

#### Evidence
```
POST   /api/v1/evidence/upload          { doc_type, file }
GET    /api/v1/evidence/documents
DELETE /api/v1/evidence/:id
```

#### Admin
```
GET    /api/v1/admin/lawyers/pending     → Unverified lawyers
POST   /api/v1/admin/lawyers/:id/verify  { status: 'verified' | 'rejected' }
GET    /api/v1/admin/calls/audit         ?page=&limit=&status=
GET    /api/v1/admin/dashboard/stats     → Platform KPIs
```

### 5.2 WebSocket Events

```
// Client → Server
ws.emit('lawyer:go-online')
ws.emit('lawyer:go-offline')
ws.emit('lawyer:accept-request',  { call_session_id })
ws.emit('lawyer:reject-request',  { call_session_id })

// Server → Client (to Lawyers)
ws.emit('call:incoming',          { call_session_id, scenario, language, user_location })
ws.emit('call:cancelled',         { call_session_id })

// Server → Client (to Users)
ws.emit('call:matched',           { call_session_id, lawyer_name, lawyer_rating })
ws.emit('call:no-lawyers',        { call_session_id })
ws.emit('call:lawyer-connected',  { exotel_call_url })
ws.emit('call:ended',             { call_session_id, duration, summary })
```

---

## 6. Phased Sprint Plan

### Phase 0 — Preparation (Weeks 1–3)

| Sprint | Tasks | Owner | Deliverable |
|---|---|---|---|
| **Week 1** | Validate demand: 30 law grad outreach (LinkedIn/WhatsApp). 20 non-lawyer friend surveys. | Umair + Team | Survey results doc. Go/no-go decision. |
| **Week 1** | Set up GitHub org, create monorepo (`apps/mobile`, `apps/backend`, `apps/admin`). Configure ESLint, Prettier, Husky. | Dev Lead | Clean repo with CI pipeline. |
| **Week 2** | Register LLP via Startupindia.gov.in. Open current account. Grab domain. | Umair | Legal entity + domain. |
| **Week 2** | Create Razorpay account + KYC. Create Exotel test account. Create Supabase project. | Dev 2 | All accounts live. |
| **Week 3** | Figma wireframes: 12 key screens (Login, Home, Scenario Select, Call, Lawyer Dashboard, Token Store, SOS Setup, Rights Screen, Evidence Locker, Rating, Admin Queue, Earnings). | Dev 3 / Designer | Clickable Figma prototype. |
| **Week 3** | Initialize Expo project with TypeScript. Set up Supabase schema (run SQL above). Initialize Express backend. | Dev Lead | Bootable app + running backend + DB with tables. |

### Phase 1 — MVP Build (Weeks 4–14)

#### Sprint 1 (Weeks 4–5): Auth + User/Lawyer Registration

| Task | Details | Effort |
|---|---|---|
| Phone OTP Login | Supabase Auth phone provider. OTP screen. Auto-verify. | 3 days |
| Role Selection | "I need legal help" vs "I am a lawyer" screen after first login. | 1 day |
| User Profile Setup | Name, language preference. | 1 day |
| Lawyer Registration | Bar enrollment number, state, document upload (camera + gallery). | 3 days |
| Admin Verification Queue | Simple web page listing pending lawyers. Approve/Reject buttons. | 2 days |

#### Sprint 2 (Weeks 6–7): Token System + Razorpay

| Task | Details | Effort |
|---|---|---|
| Token Packs UI | Display 4 packs with pricing. "Most Popular" badge on Basic. | 2 days |
| Razorpay Integration | Create order → open checkout → verify webhook → credit tokens. | 3 days |
| Token Balance | Display on home screen. Animate on change. | 1 day |
| Transaction History | List of all token purchases and deductions. | 1 day |
| Token Deduction Logic | Backend: atomic decrement on call start. Refund if call < 2 min. | 2 days |

#### Sprint 3 (Weeks 8–9): Matching Engine + Lawyer Dashboard

| Task | Details | Effort |
|---|---|---|
| Lawyer Online/Offline Toggle | WebSocket connection on toggle. Heartbeat every 30s. | 2 days |
| Matching Algorithm | When user requests: find online, verified, language-matching, rating≥3.0 lawyers. Broadcast to top 5. First accept wins. | 3 days |
| Lawyer Incoming Request UI | Notification + modal: "User needs help — Traffic Stop — Hindi" Accept/Reject (30s timeout). | 2 days |
| No Lawyers Available Flow | If no match in 60s → show "no lawyers available" + suggest retry later. | 1 day |
| Lawyer Earnings Dashboard | Total earned, pending, withdrawn. List of completed calls with payout. | 2 days |

#### Sprint 4 (Weeks 10–11): Call Session + Exotel VoIP

| Task | Details | Effort |
|---|---|---|
| Exotel API Integration | Create call via Exotel Connect API. Get call SID, status webhooks. | 3 days |
| In-Call UI (User) | Timer, scenario context, rights checklist, "End Call" button with PIN. | 2 days |
| In-Call UI (Lawyer) | Timer, scenario context, user location map, "End Call" button. | 2 days |
| Call Recording | Enable via Exotel API. Store recording URL in DB. Consent banner at call start. | 1 day |
| Call End Flow | Deduct token, credit lawyer wallet, update session status, trigger rating prompt. | 2 days |

#### Sprint 5 (Weeks 12–13): SOS + Notifications + Rights

| Task | Details | Effort |
|---|---|---|
| Emergency Contact Setup | Add up to 3 contacts with name, phone, relation. | 2 days |
| Auto-SOS Fire | On "Get Help Now" tap: SMS to all contacts with GPS link + timestamp. Uses Exotel SMS API. | 3 days |
| Push Notifications | Expo Notifications setup. Notify: lawyer accepted, call starting, token low, etc. | 2 days |
| Free Rights Screen | Hardcoded top 5 constitutional rights. DK Basu guidelines summary. No token required. | 1 day |
| Post-Call Rating | 1–5 stars + optional comment. Updates lawyer avg_rating. | 1 day |

#### Sprint 6 (Week 14): Integration, Bug Fixes, QA

| Task | Details | Effort |
|---|---|---|
| End-to-end flow testing | Full user journey: signup → buy tokens → request help → match → call → rate. | 3 days |
| Full lawyer journey testing | Signup → verify → go online → accept call → earn → request payout. | 2 days |
| Bug fixes | From testing. | 3 days |
| Performance optimization | API response times, app startup time, WebSocket reconnection. | 2 days |

### Phase 2 — Alpha Testing (Weeks 15–18)

| Week | Tasks |
|---|---|
| **Week 15** | Onboard 20–30 law grad contacts manually. Give 10 free tokens each. |
| **Week 16** | Run 50 test calls across scenarios. Document all bugs + UX friction. |
| **Week 17** | Build Evidence Locker (Aadhaar, DL, RC, PUC storage). Add scenario-specific rights checklists. |
| **Week 18** | Fix all critical bugs. Add call drop token refund logic. Set up Sentry + UptimeRobot. Performance baseline. |

### Phase 3 — Soft Launch (Weeks 19–26)

| Week | Tasks |
|---|---|
| **Weeks 19–20** | Launch in ONE city (Mumbai or Delhi). Google Play Store submission. Guerrilla marketing: law college WhatsApp groups, Reddit India, Twitter/X threads. |
| **Weeks 21–22** | Add language matching (Hindi + English). Digital arrest scam detector feature. FIR filing guidance. |
| **Weeks 23–24** | Build admin panel: lawyer management, call audit, platform stats dashboard. Lawyer BNS/BNSS competency quiz. |
| **Weeks 25–26** | Target: 200 users, 50 active lawyers, 300+ calls. Collect feedback obsessively. Analytics review. Plan Phase 4. |

### Phase 4 — Growth (Month 7–12)

- Hindi UI localization
- Senior lawyer tier (premium tokens, higher payout)
- Video call option
- Regional language support (Tamil, Telugu, Kannada, Bengali, Marathi)
- Apply to startup incubators (IIM/IIT, T-Hub, NSRCEL)
- Explore angel funding (₹20–50 lakh for 10–15% equity)
- iOS App Store submission (requires Apple Developer Account: ₹7,000/yr)

---

## 7. Third-Party Integrations

### 7.1 Razorpay (Payments)

| Integration Point | API | Notes |
|---|---|---|
| Create token purchase order | `POST /v1/orders` | Amount in paise. Currency INR. |
| Verify payment | Webhook `payment.captured` | Verify signature with secret. Credit tokens atomically. |
| Lawyer payouts | Razorpay Route / Payout API | Requires Route activation. KYC for each lawyer. |
| Refunds | `POST /v1/payments/:id/refund` | For failed calls < 2 min. Partial refund. |

### 7.2 Exotel (VoIP Calling)

| Integration Point | API | Notes |
|---|---|---|
| Initiate call | Connect API `/v1/Accounts/{sid}/Calls/connect` | User phone → Exotel → Lawyer phone. |
| Call status | Webhook callbacks | `completed`, `busy`, `failed`, `no-answer`. |
| Call recording | Enabled per call | Recording URL in callback. Store in Supabase Storage. |
| SMS (SOS) | `POST /v1/Accounts/{sid}/Sms/send` | Emergency SMS with GPS link. |

### 7.3 Supabase Auth (OTP)

| Integration Point | API | Notes |
|---|---|---|
| Send OTP | `supabase.auth.signInWithOtp({ phone })` | Uses Twilio under the hood. |
| Verify OTP | `supabase.auth.verifyOtp({ phone, token })` | Returns JWT. |
| Session refresh | `supabase.auth.getSession()` | Auto-refresh with Supabase client. |

---

## 8. Security & Compliance

### 8.1 Data Security

| Requirement | Implementation |
|---|---|
| **Data at rest** | Supabase encrypts all data at rest (AES-256). |
| **Data in transit** | HTTPS everywhere (TLS 1.3). WSS for WebSocket. |
| **Auth tokens** | JWT stored in Expo SecureStore (keychain/keystore). |
| **Evidence encryption** | Client-side encryption for sensitive documents before upload. |
| **PII handling** | Aadhaar stored masked (last 4 digits only in DB, full in encrypted storage). |
| **Call recordings** | Encrypted at rest in Supabase Storage. Access only via signed URLs with expiry. |
| **Row Level Security** | PostgreSQL RLS policies: users access only their own data. |

### 8.2 Compliance Checklist

- [ ] Register as Technology Platform / Legal Tech Marketplace (NOT law firm)
- [ ] Lawyers are independent contractors — explicit in Terms of Service
- [ ] Platform disclaimer: "We connect users with lawyers. We do not provide legal advice."
- [ ] Explicit consent before call recording (in-app banner + Exotel prompt)
- [ ] Data stored in India (Supabase Mumbai region / AWS ap-south-1)
- [ ] Privacy Policy compliant with IT Act 2000 + DPDP Act 2023
- [ ] Razorpay business KYC complete
- [ ] Lawyer KYC via Bar enrollment verification
- [ ] Call recordings retained for 90 days, then auto-deleted
- [ ] NHRC/court accessible recordings on proper legal notice only

---

## 9. Testing Strategy

### 9.1 Automated Testing

| Layer | Tool | Coverage Target |
|---|---|---|
| **Unit Tests (Backend)** | Jest + Supertest | All API endpoints. Token deduction atomicity. Matching algorithm. |
| **Unit Tests (Mobile)** | Jest + React Native Testing Library | All form validations. Token balance display. Scenario selection. |
| **Integration Tests** | Jest + Supabase test DB | Full call session lifecycle. Payment → token credit flow. |
| **E2E Tests** | Detox (mobile) | Login → buy tokens → request help → match → call → rate. |

### 9.2 Manual Testing Checklist

- [ ] OTP delivery on 5 different phone numbers (across carriers)
- [ ] Token purchase with UPI, credit card, debit card, wallet
- [ ] Call quality test: WiFi, 4G, 3G, low signal
- [ ] SOS SMS delivery to 3 contacts simultaneously
- [ ] Call recording playback after session ends
- [ ] Lawyer verification flow (upload → admin approve → status update)
- [ ] Token refund on call drop < 2 min
- [ ] App behavior on kill/background during active call
- [ ] Push notification delivery (foreground + background + killed)
- [ ] Concurrent matching: 5 users requesting simultaneously

---

## 10. Deployment & DevOps

### 10.1 Repository Structure

```
vakiloncall/
├── apps/
│   ├── mobile/           # Expo React Native app
│   │   ├── app/          # Expo Router screens
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Custom hooks
│   │   ├── stores/       # Zustand stores
│   │   ├── services/     # API client, socket client
│   │   ├── utils/        # Helpers, constants, types
│   │   ├── assets/       # Images, fonts
│   │   └── app.json      # Expo config
│   ├── backend/          # Express.js API
│   │   ├── src/
│   │   │   ├── routes/       # API route handlers
│   │   │   ├── controllers/  # Business logic
│   │   │   ├── services/     # External API integrations
│   │   │   ├── middleware/   # Auth, validation, rate limiting
│   │   │   ├── socket/       # WebSocket event handlers
│   │   │   ├── jobs/         # BullMQ job processors
│   │   │   ├── prisma/       # Prisma schema + migrations
│   │   │   └── utils/        # Helpers, constants
│   │   ├── tests/
│   │   └── package.json
│   └── admin/            # React admin panel (Supabase + React)
│       ├── src/
│       └── package.json
├── packages/
│   └── shared/           # Shared types, Zod schemas, constants
├── .github/
│   └── workflows/        # CI/CD pipelines
├── package.json          # Workspace root (npm workspaces)
└── turbo.json            # Turborepo config (optional)
```

### 10.2 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js 20
      - Install dependencies (npm ci)
      - Run ESLint
      - Run TypeScript type check
      - Run backend unit tests
      - Run mobile unit tests

  deploy-backend:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - Deploy to Railway.app via Railway CLI

  build-mobile:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - EAS Build for Android (preview profile)
      - EAS Update for OTA JS updates
```

### 10.3 Environment Configuration

```
# .env.example (Backend)
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
EXOTEL_SID=xxx
EXOTEL_API_KEY=xxx
EXOTEL_API_TOKEN=xxx
REDIS_URL=redis://xxx
SENTRY_DSN=https://xxx@sentry.io/xxx
JWT_SECRET=xxx
```

---

## 11. Cost Breakdown

### 11.1 One-Time Costs

| Item | Cost (₹) |
|---|---|
| LLP Registration | 5,000 – 8,000 |
| Domain (.in) | 700 – 1,500 |
| Google Play Store | 1,700 |
| Exotel test credits | 2,000 |
| Misc (SIM, bank) | 1,000 |
| **TOTAL** | **~₹11,000 – 14,000** |

### 11.2 Monthly Burn (Post-Launch)

| Item | Month 1–3 | Month 4–6 | Month 7–12 |
|---|---|---|---|
| Supabase | Free | Free | ₹1,700 |
| Railway | Free | ₹700 | ₹700 |
| Exotel | ₹2,000 | ₹5,000 | ₹8,000 |
| SMS OTP | ₹500 | ₹1,000 | ₹1,500 |
| Sentry/Monitoring | Free | Free | Free |
| Marketing | ₹0 | ₹5,000 | ₹10,000 |
| **TOTAL** | **₹2,500** | **₹11,700** | **₹21,900** |

---

## 12. Risk Mitigation Checklist

| Risk | Mitigation | Status |
|---|---|---|
| BCI challenges legality | Register as tech platform, not law firm. Lawyers are independent contractors. Get legal counsel. | ☐ |
| No lawyers online at odd hours | Night-shift bonus tokens. Show live availability before token purchase. | ☐ |
| Bad advice causes user harm | T&C disclaimers. Call recording. Lawyer verification. Rating system. | ☐ |
| Low connectivity during encounter | Fallback to regular phone call. Cache rights screen offline. Token refund on drop. | ☐ |
| User trust barrier | Free rights screen (no signup needed). Testimonials. NGO partnerships. | ☐ |
| Competitor copies idea | Speed of execution. First-mover advantage. Build brand loyalty early. | ☐ |
| Data breach | RLS policies. Encryption at rest + transit. Minimal PII storage. | ☐ |
| App store rejection | Follow guidelines strictly. No misleading claims. Proper age rating. | ☐ |

---

> **Next Steps**: Create the project repository, run Figma wireframes for the 12 key screens, and begin Sprint 0 (Week 1) with demand validation outreach.
