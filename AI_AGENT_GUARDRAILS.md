# VAKIL ON CALL — AI Agent Operating Manual

> **Purpose**: This file ensures any AI coding agent (Gemini, Claude, GPT, Copilot, etc.) working on this project stays on track, does NOT hallucinate, follows established decisions, and conserves tokens. Read this file FIRST before every session.

---

## ⚠️ CRITICAL: Read Before Every Coding Session

**If you are an AI agent working on this project, you MUST:**

1. Read this file completely before writing ANY code
2. Cross-reference against `TECH_STACK_AND_DEVELOPMENT_PLAN.md` for specifications
3. Read `VakilOnCall_BusinessReport.md` for business rules
4. Read `VakilOnCall_IndiaGapAnalysis.md` for India-specific requirements
5. Never assume — check the codebase first, then ask if unsure

---

## 1. PROJECT IDENTITY

| Field | Value |
|---|---|
| **Project Name** | Vakil On Call |
| **What it is** | Token-based, on-demand legal assistance marketplace connecting Indian citizens with verified fresh law graduates for real-time legal guidance during police encounters, documentation disputes, consumer complaints, and landlord-tenant issues |
| **What it is NOT** | A law firm. A legal advice platform. A subscription service. An activism tool. |
| **Target Country** | India ONLY (all regulatory, legal, and design decisions are India-specific) |
| **Launch City** | Mumbai or Delhi (single city first) |
| **Founding Team** | CS graduates, zero capital, bootstrap mode |
| **Legal Structure** | Technology Platform / Legal Tech Marketplace (NOT a law firm) |

---

## 2. DECIDED TECH STACK — DO NOT CHANGE

These decisions are FINAL. Do not suggest alternatives unless explicitly asked.

### Mobile App
| Decision | Choice | DO NOT USE |
|---|---|---|
| Framework | **React Native (Expo SDK 52+)** | Flutter, Kotlin, Swift, native |
| Language | **TypeScript** | JavaScript, Dart |
| Navigation | **Expo Router** | React Navigation standalone |
| State | **Zustand** | Redux, MobX, Context API alone |
| UI Library | **React Native Paper** | NativeBase, Tamagui |
| Forms | **React Hook Form + Zod** | Formik, Yup |
| Animations | **React Native Reanimated 3** | Animated API |
| Secure Storage | **Expo SecureStore** | AsyncStorage for sensitive data |
| General Storage | **MMKV** | AsyncStorage |
| Push Notifications | **Expo Notifications + Firebase FCM** | OneSignal |
| OTA Updates | **EAS Update** | CodePush |

### Backend
| Decision | Choice | DO NOT USE |
|---|---|---|
| Runtime | **Node.js 20 LTS** | Deno, Bun |
| Framework | **Express.js 5** | Fastify, NestJS, Hapi |
| Language | **TypeScript** | JavaScript |
| ORM | **Prisma** | TypeORM, Sequelize, Drizzle |
| Validation | **Zod** | Joi, Yup |
| Real-time | **Socket.io** | ws library, Pusher |
| Job Queue | **BullMQ + Redis** | Agenda, node-cron |
| Logging | **Pino** | Winston, Morgan |

### Infrastructure
| Decision | Choice | DO NOT USE |
|---|---|---|
| Database | **Supabase (PostgreSQL)** | Firebase, MongoDB, MySQL |
| Auth | **Supabase Auth (Phone OTP)** | Firebase Auth, Auth0 |
| Storage | **Supabase Storage** | AWS S3 directly, Cloudinary |
| Backend Hosting | **Railway.app** | Heroku, Vercel (for backend) |
| Redis | **Upstash Redis** | Redis Cloud, ElastiCache |
| VoIP/Calling | **Exotel** | Twilio, Agora, 100ms |
| Payments | **Razorpay** | Stripe, PayU, Cashfree |
| Error Tracking | **Sentry** | Bugsnag, LogRocket |
| Uptime | **UptimeRobot** | Pingdom, StatusCake |
| CI/CD | **GitHub Actions** | CircleCI, TravisCI |
| Mobile Build | **EAS Build** | Bitrise, AppCenter |

---

## 3. BUSINESS RULES — HARD CONSTRAINTS

These rules come directly from the business report and gap analysis. They are NOT negotiable.

### Token Economy
- Token packs: Starter (1 for ₹59), Basic (3 for ₹149), Standard (7 for ₹299), Premium (15 for ₹549)
- 1 token = 1 call (15 min max)
- Token deduction happens at call START (not end)
- Token REFUND if call drops in < 2 minutes
- No subscription model. Tokens only.
- Users purchase tokens via Razorpay (UPI, cards, wallets)

### Lawyer Payouts
- Lawyer earns ₹32 per call (from Basic pack rate ~₹50/token)
- Platform keeps ₹10 per call
- Exotel cost: ₹4-8 per call
- Lawyer wallet balance withdrawable after 7-day hold
- Payouts via Razorpay Route / UPI

### Call Matching Rules (in priority order)
1. Lawyer must be `is_online = true`
2. Lawyer must be `verification_status = 'verified'`
3. Language match (user preference ↔ lawyer languages)
4. Scenario competency match (if tags exist)
5. Rating threshold ≥ 3.0 stars
6. First lawyer to accept wins (race condition handling required)
7. Timeout: 30 seconds per lawyer. 60 seconds total before "no lawyers available"

### SOS Rules
- SOS fires IMMEDIATELY when user taps "Get Help Now" — BEFORE lawyer match
- SOS sends SMS to up to 3 emergency contacts
- SMS includes: GPS coordinates link, timestamp, user name
- SOS fires even if no lawyer is available
- If phone is confiscated, SOS has already fired — this is the design intent

### Call Recording Rules
- ALL calls are recorded (this is non-negotiable for legal protection)
- User sees consent banner before call connects
- Recordings stored encrypted in Supabase Storage
- Retention: 90 days, then auto-delete
- Accessible to NHRC/courts only on proper legal notice

### Scenarios (EXACTLY these, no more no less for MVP)
1. `traffic_stop` — Traffic stop / document check / bribe attempt
2. `fir_refusal` — Police refusing to register FIR
3. `custodial_arrest` — Being taken into custody
4. `domestic_dispute` — Domestic dispute (not DV protection — important distinction)
5. `digital_scam` — Digital arrest scam verification
6. `workplace_raid` — Workplace raid or inspection
7. `eviction` — Landlord eviction
8. `consumer` — Consumer complaint
9. `other` — General legal help

---

## 4. CODING STANDARDS — FOLLOW EXACTLY

### File Naming
- React Native components: `PascalCase.tsx` (e.g., `TokenStore.tsx`, `CallScreen.tsx`)
- Hooks: `camelCase.ts` prefixed with `use` (e.g., `useCallSession.ts`, `useTokenBalance.ts`)
- Utils/helpers: `camelCase.ts` (e.g., `formatCurrency.ts`, `validatePhone.ts`)
- Constants: `SCREAMING_SNAKE_CASE` in `constants.ts`
- Types: `PascalCase` with `I` prefix for interfaces (e.g., `IUser`, `ICallSession`)
- Zustand stores: `camelCase.ts` with `Store` suffix (e.g., `authStore.ts`, `tokenStore.ts`)
- Backend routes: `kebab-case.ts` (e.g., `call-sessions.ts`, `token-packs.ts`)
- Backend controllers: `camelCase.controller.ts`
- Backend services: `camelCase.service.ts`

### Code Style
- **Always use TypeScript** — no `.js` or `.jsx` files
- **Always add explicit return types** to functions
- **No `any` type** — use `unknown` if type is truly unknown, then narrow
- **Use `const` by default**, `let` only when reassignment is needed
- **No default exports** — use named exports only
- **Error handling**: every async function must have try/catch. Use custom `AppError` class.
- **API responses**: always return `{ success: boolean, data?: T, error?: string }`
- **Comments**: only when logic is non-obvious. No obvious comments like `// increment counter`
- **Console.log**: NEVER in production code. Use Pino logger in backend, `__DEV__` guard in mobile.

### Git Conventions
- Branch naming: `feature/VOC-XX-description`, `bugfix/VOC-XX-description`, `hotfix/VOC-XX-description`
- Commit messages: `feat(module): description`, `fix(module): description`, `chore(module): description`
- Pull requests: require 1 review minimum
- Never commit `.env` files, secrets, or API keys

### Mobile-Specific Rules
- **No inline styles** — use `StyleSheet.create()` or styled components
- **No hardcoded colors** — use theme from React Native Paper
- **No hardcoded strings** — use constants for API URLs, error messages, scenario labels
- **Screen components go in `app/` directory** (Expo Router file-based routing)
- **Shared components go in `components/` directory**
- **Always handle loading, error, and empty states** for every screen
- **Keyboard avoiding view** on all screens with text inputs
- **SafeAreaView** on all screens

### Backend-Specific Rules
- **All routes must have validation middleware** (Zod schemas)
- **All routes must have auth middleware** (except public routes: OTP endpoints, rights content)
- **Rate limiting on sensitive endpoints**: OTP (5/min), token purchase (10/min), SOS (3/min)
- **Database transactions for atomic operations**: token deduction + call creation must be in a transaction
- **Never expose internal error messages** to client — log internally, return generic message

---

## 5. API CONTRACT — DO NOT DEVIATE

All API responses MUST follow this format:

```typescript
// Success Response
{
  success: true,
  data: T,
  meta?: {
    page: number,
    limit: number,
    total: number
  }
}

// Error Response
{
  success: false,
  error: {
    code: string,       // e.g., 'TOKEN_INSUFFICIENT', 'LAWYER_NOT_VERIFIED'
    message: string     // Human-readable message
  }
}
```

### Standard Error Codes (use these EXACTLY)
```
AUTH_INVALID_OTP
AUTH_EXPIRED_OTP
AUTH_PHONE_REQUIRED
AUTH_UNAUTHORIZED
USER_NOT_FOUND
USER_BANNED
LAWYER_NOT_VERIFIED
LAWYER_ALREADY_ONLINE
LAWYER_OFFLINE
TOKEN_INSUFFICIENT
TOKEN_PACK_NOT_FOUND
PAYMENT_FAILED
PAYMENT_SIGNATURE_INVALID
CALL_NOT_FOUND
CALL_ALREADY_MATCHED
CALL_NO_LAWYERS_AVAILABLE
CALL_ALREADY_ENDED
CALL_DROP_REFUND_ISSUED
SOS_NO_CONTACTS
SOS_SEND_FAILED
EVIDENCE_UPLOAD_FAILED
EVIDENCE_NOT_FOUND
RATE_LIMIT_EXCEEDED
INTERNAL_ERROR
VALIDATION_ERROR
```

---

## 6. DATABASE RULES — CRITICAL

- **Schema is defined in `TECH_STACK_AND_DEVELOPMENT_PLAN.md` Section 4** — use those exact table and column names
- **Always use UUID for primary keys** (`gen_random_uuid()`)
- **All timestamps must be `TIMESTAMPTZ`** (timezone-aware)
- **Use Supabase Row Level Security (RLS)** — users can ONLY access their own data
- **Token balance is stored on the `users` table** — single source of truth
- **Token deduction MUST be atomic** — use `UPDATE users SET token_balance = token_balance - 1 WHERE token_balance >= 1 RETURNING token_balance` pattern
- **Never delete records** — use `is_active = false` or `is_banned = true` flags (soft delete)
- **Call recordings URL stored in `call_sessions.recording_url`** — file stored in Supabase Storage
- **Lawyer `avg_rating` is computed** — update on every new rating, do NOT recalculate from scratch each time

---

## 7. ANTI-HALLUCINATION RULES

### DO NOT
- ❌ Invent features not listed in the development plan
- ❌ Add new database tables or columns without explicit request
- ❌ Change the tech stack or suggest alternatives
- ❌ Add authentication providers beyond Phone OTP (no email/password, no social login for MVP)
- ❌ Build for languages beyond English for MVP (Hindi UI comes in Phase 4)
- ❌ Implement video calling in MVP (audio only via Exotel for MVP)
- ❌ Add a subscription/monthly plan — token model ONLY
- ❌ Build iOS-specific native modules (Expo handles both platforms)
- ❌ Use Firebase Firestore or Realtime Database (we use Supabase PostgreSQL)
- ❌ Implement Stripe (we use Razorpay, India-only)
- ❌ Build a web app (mobile-only for MVP, admin panel is the only web interface)
- ❌ Add AI/ML features unless explicitly requested
- ❌ Over-engineer: no microservices, no Kubernetes, no Docker for MVP
- ❌ Generate placeholder/dummy data in production code
- ❌ Assume US legal context — ALL legal content is India-specific (BNS/BNSS, DK Basu, etc.)
- ❌ Add a chat/messaging feature (calls only for MVP)

### DO
- ✅ Check existing files before creating new ones
- ✅ Follow the exact database schema from the plan
- ✅ Use the exact API endpoint paths from the plan
- ✅ Use the exact error codes listed above
- ✅ Follow the exact file naming conventions
- ✅ Handle loading, error, and empty states for every screen
- ✅ Add proper TypeScript types to everything
- ✅ Test edge cases: no internet, API timeout, empty token balance, no lawyers online
- ✅ Use India-specific formatting: ₹ for currency, +91 for phone, IST for timezone
- ✅ Keep costs at ZERO for all free-tier services

---

## 8. TOKEN CONSERVATION RULES FOR AI AGENTS

### Session Start Protocol
1. Read this file (`AI_AGENT_GUARDRAILS.md`) — ALWAYS
2. Check what files already exist — `list files in project`
3. Check current state of the feature being worked on — read relevant files
4. Ask what specific task needs to be done — don't assume

### During Coding
- **Don't regenerate entire files** — edit only the changed sections
- **Don't repeat code that already exists** — import from shared modules
- **Don't explain obvious code** — only explain non-obvious design decisions
- **Don't generate multiple alternatives** — generate the ONE correct implementation based on this plan
- **Don't ask clarifying questions for things defined in this document** — the answer is here
- **Don't re-read files you've already read in this session** — remember context
- **Keep responses concise** — code + brief explanation only

### When Stuck
1. Check if the answer is in `TECH_STACK_AND_DEVELOPMENT_PLAN.md`
2. Check if the answer is in `VakilOnCall_BusinessReport.md`
3. Check if the answer is in `VakilOnCall_IndiaGapAnalysis.md`
4. Check existing codebase for patterns
5. ONLY THEN ask the user

---

## 9. FEATURE COMPLETION CHECKLIST

Use this checklist for EVERY feature you build:

```
- [ ] TypeScript types defined
- [ ] API endpoint matches the plan (Section 5 of dev plan)
- [ ] Database queries match the schema (Section 4 of dev plan)
- [ ] Zod validation schema created
- [ ] Error handling with proper error codes
- [ ] Loading state handled in UI
- [ ] Error state handled in UI
- [ ] Empty state handled in UI
- [ ] Auth middleware applied (if not public)
- [ ] Rate limiting applied (if sensitive)
- [ ] Console.log removed / replaced with proper logger
- [ ] No hardcoded values (use constants/env vars)
- [ ] No `any` types
- [ ] Matches the scenario list exactly
- [ ] Follows file naming conventions
- [ ] Works offline gracefully (where applicable)
```

---

## 10. CURRENT PHASE TRACKER

> **Update this section as development progresses**

| Phase | Status | Notes |
|---|---|---|
| Phase 0 — Preparation (Weeks 1–3) | 🔴 Not Started | Demand validation + setup |
| Phase 1 — MVP Build (Weeks 4–14) | 🔴 Not Started | Core app development |
| Phase 2 — Alpha Testing (Weeks 15–18) | 🔴 Not Started | 20–30 testers, 50 calls |
| Phase 3 — Soft Launch (Weeks 19–26) | 🔴 Not Started | Single city launch |
| Phase 4 — Growth (Month 7–12) | 🔴 Not Started | Scale + funding |

### Current Sprint
```
Sprint: None started
Focus: N/A
Blocking Issues: None
```

### Files Created So Far
```
/VakilOnCall_BusinessReport.md          — Business report (reference)
/VakilOnCall_IndiaGapAnalysis.md        — India gap analysis (reference)
/TECH_STACK_AND_DEVELOPMENT_PLAN.md     — Tech stack + development plan
/AI_AGENT_GUARDRAILS.md                 — This file (AI agent operating manual)
```

---

## 11. QUICK REFERENCE CARD

For fast lookup during coding:

```
Currency symbol:    ₹ (INR)
Phone format:       +91XXXXXXXXXX
Date format:        ISO 8601 (TIMESTAMPTZ)
Timezone:           Asia/Kolkata (IST, UTC+5:30)
DB:                 PostgreSQL via Supabase
Auth:               Phone OTP via Supabase Auth
Payments:           Razorpay
VoIP:               Exotel
State:              Zustand
Navigation:         Expo Router
Forms:              React Hook Form + Zod
API format:         { success, data/error }
Token per call:     1
Call max duration:   15 minutes
Lawyer payout:      ₹32/call
Platform revenue:   ₹10/call
Lawyer min rating:  3.0 stars
Match timeout:      60 seconds
SOS contacts max:   3
Recording retention: 90 days
Data region:        India (ap-south-1 / Mumbai)
```

---

> **Last Updated**: May 2026
> **Maintainer**: Mohammed Umair & Team
> **Rule**: Any AI agent that modifies this file must add a changelog entry below.

### Changelog
| Date | Agent | Change |
|---|---|---|
| 2026-05-23 | Initial | Created AI Agent Guardrails document |
