**VAKIL ON CALL** Legal On-Demand Startup — Full Business & Technical Report 

Prepared for: Mohammed Umair & Team | May 2026 

_A token-based, on-demand legal assistance marketplace connecting citizens with fresh law graduates — making legal help accessible and affordable across India._ 

## **1. Executive Summary** 

Vakil On Call is a mobile-first marketplace where users purchase token packs and spend tokens to connect with verified law graduates for real-time legal guidance — primarily during police encounters, documentation disputes, consumer complaints, and landlord-tenant issues. The platform simultaneously solves a supply-side problem: thousands of fresh law graduates in India struggle to find paid work in their first 1–2 years. This creates a two-sided marketplace with strong natural incentives on both ends. 

The founding team is a group of computer science graduates with zero capital, which makes frugal architecture and zero-cost tooling non-negotiable. This report covers the full opportunity analysis, regulatory risks, development roadmap, and a realistic cost structure for a bootstrap launch. 

## **2. The Problem Being Solved** 

## **2.1 Citizen Side** 

- Most Indians do not know their fundamental rights during a police stop, arrest, or documentation dispute. 

- Legal help is either unaffordable (senior advocates charge I5,000–I50,000/hour) or inaccessible (free legal aid is slow and hard to reach). 

- In a high-stress moment — a cop demanding a bribe, a landlord illegally evicting — people panic because they have no expert voice guiding them in real time. 

## **2.2 Lawyer Side** 

- India produces ~80,000 law graduates per year (Bar Council of India estimate). 

- Most spend 1–3 years in unpaid or near-unpaid 'chamber internships' waiting for senior advocates to give them work. 

- There is no structured platform for fresh lawyers to build a client base, earn income, and gain real-world experience simultaneously. 

## **3. The Solution — How It Works** 

The app operates as a two-sided marketplace with a token economy: 

|**Step**|**User Journey**|**Lawyer Journey**|
|---|---|---|
|1|Download app, sign up with phone number|Sign up, upload Bar enrollment certificate|
|2|Purchase token pack (e.g.I149 = 3 tokens)|Platform verifies enrollment — 24–48 hrs|
|3|In an emergency, tap 'Get Legal Help Now'|Go online, set availability status|
|4|Matched with available lawyer in <60 seconds|Accept incoming call request|
|5|1 token deducted per call (15 min)|EarnI120–150 credited to wallet after call|
|6|Rate the lawyer after the call|Build rating score and client history|



## **4. Opportunity Analysis — Pros & Cons** 

## **4.1 Market Opportunity (Pros)** 

## **PROS** 

India has 1.4 billion people — even 0.1% TAM is 1.4 million potential users 

Police harassment is a documented, widespread pain point with no current digital solution 

Fresh law graduate supply is massive — easy to onboard eager, motivated lawyers 

Token model avoids subscription fatigue; users pay only when in need 

Low CAC potential — word-of-mouth spreads fast when a product saves you in an emergency 

Politically and socially timely — citizen rights awareness is growing post-2020 

Can expand beyond police encounters: landlord disputes, consumer complaints, workplace issues 

## **CONS** 

Bar Council of India regulations restrict how lawyers can advertise and solicit clients 

24/7 availability requires enough active lawyers at all hours — hard early on 

A bad call during a real police encounter has serious real-world consequences 

Low-signal areas (highways, rural) = connectivity problems at the worst moments 

User trust barrier: will someone open an app while a cop is standing in front of them? 

Liability exposure if legal advice leads to a bad outcome 

Language diversity: India has 22 official languages — Hindi+English alone is insufficient 

Monetisation takes time; burn before revenue is real even if lean 

No dominant competitor in this exact niche currently in India 

## **5. Regulatory & Legal Risks** 

## **5.1 Bar Council of India (BCI) — The Biggest Risk** 

The BCI prohibits lawyers from advertising their services under the Bar Council of India Rules (Part VI, Chapter II). Platforms that are seen as facilitating solicitation or touting can be challenged. However, there is a crucial distinction: you are building a marketplace/referral platform, not a law firm. You do not employ lawyers — they are independent service providers on your platform. 

## **How to Mitigate BCI Risk** 

- Register the company as a 'Technology Platform' or 'Legal Tech Marketplace' — NOT a law firm 

- Lawyers on your platform are independent contractors, not employees 

- Terms of Service must state clearly: the platform facilitates connection only; legal advice is from the lawyer, not the company 

- Study how platforms like LawRato, Vakil Search, and Nyaay have structured their compliance 

• Consult a startup-friendly legal counsel early (IDIA, Agami, or NLU incubators often connect founders with pro-bono legal advice) 

• Consider reaching out to BCI proactively to understand their stance — being transparent is better than being shut down later 

## **5.2 Consumer Protection Act 2019** 

If a user suffers harm from following legal advice on your platform, they could file a consumer complaint. Your Terms of Service must include a clear disclaimer that the platform is not a law firm and does not provide legal services — it connects users with independent legal professionals. This is standard practice for all legal tech platforms. 

## **5.3 IT Act & Data Privacy** 

Call recordings (if implemented) and user data are governed by the IT Act 2000 and the upcoming Digital Personal Data Protection Act 2023. Ensure: explicit user consent before recording, data stored in India (AWS Mumbai / Google Cloud Mumbai), and a clear privacy policy. Do NOT store recordings longer than necessary. 

## **5.4 Payment Aggregator RBI Guidelines** 

Using Razorpay for token purchases and lawyer payouts is compliant as long as you complete KYC for the business entity and lawyers undergo basic KYC before receiving payouts. Razorpay handles this automatically in their onboarding flow. 

## **6. Development Roadmap** 

Designed for a team of 3–4 CS graduates with no budget. All tools selected are free at the scale you will operate during the first 6 months. 

|**Phase**|**Duration**|**Key Deliverables**|**Cost (**I**)**|
|---|---|---|---|
|Phase 0 Prep|Weeks 1–3|Validate demand: WhatsApp/LinkedIn outreach to 30 law<br>grads. Set up GitHub org, Figma (free), Notion for docs.<br>Register LLP or Pvt Ltd (I5,000–8,000 via Razorpay Rize or<br>Startupindia.gov.in). Open a current account. Build basic<br>Figma wireframes.|~I7,000|
|Phase 1 MVP<br>Build|Weeks 4–14<br>(10 wks)|React Native app (Expo — free). Node.js + Express backend.<br>PostgreSQL on Supabase free tier. Auth via Supabase Auth.<br>In-app calling via Exotel (pay-per-minute, no monthly fee).<br>Razorpay integration for token purchase + lawyer payouts.<br>Basic admin panel (React + Supabase). Manual lawyer<br>verification via WhatsApp initially. Lawyer and user rating<br>system. Push notifications via Expo.|~I2,000<br>(Exotel test<br>calls)|
|Phase 2 Alpha|Weeks 15–18<br>(4 wks)|Onboard 20–30 law grad friends/contacts manually. Give them<br>free token credits for testing. Run 50–100 test calls. Fix bugs.<br>Collect feedback obsessively. Set up basic monitoring (free<br>Sentry, free UptimeRobot).|~I3,000 (call<br>costs)|
|Phase 3 Soft<br>Launch|Weeks 19–26<br>(8 wks)|Launch in ONE city (Mumbai or Delhi — largest lawyer<br>population). Guerrilla marketing: college campus flyers, Reddit<br>India posts, Twitter/X threads. Target law college WhatsApp<br>groups for supply side. Target general college students, young<br>professionals for demand side. Aim: 200 users, 50 active<br>lawyers, 300+ calls.|~I5,000<br>(flyers, data)|
|Phase 4 Growth|Month 7–12|Add language support (Hindi UI at minimum). Senior lawyer tier<br>(premium tokens). Specialized call types (police, landlord,<br>consumer, workplace). Apply to startup incubators: IIM/IIT<br>incubators, T-Hub, Nasscom 10k Startups. Explore angel<br>funding (I20–50 lakh for 10–15% equity is realistic at this<br>stage).|~I15,000/mo|



## **7. Recommended Tech Stack** 

|**Layer**|**Tool**|**Why**|**Cost**|
|---|---|---|---|
|Mobile App|React Native (Expo)|One codebase for Android + iOS. Expo Go for<br>testing without device builds.|Free|
|Backend API|Node.js + Express|Fast to build, huge community, your CS<br>background transfers directly.|Free|
|Database|Supabase<br>(PostgreSQL)|Free tier: 500MB DB, auth, realtime. No DevOps<br>needed.|Free→ I1,700/mo|



|Auth|Supabase Auth|Phone OTP login built-in. Twilio SMS charges<br>apply.|~I0.5/OTP|
|---|---|---|---|
|In-App Calls|Exotel|India-focused VoIP. Pay-per-minute (~I0.50/min).<br>No monthly minimum.|~I0.50/min|
|Payments|Razorpay|Best for UPI, cards, wallets in India. 2% per<br>transaction. Easy KYC.|2% txn fee|
|Push Notif.|Expo Push / Firebase<br>FCM|Free. Notify users when a lawyer accepts, etc.|Free|
|Hosting|Railway.app or<br>Render.com|Free tier for backend. Easy deploys from GitHub.|Free→ I700/mo|
|Monitoring|Sentry + UptimeRobot|Error tracking + uptime alerts. Both free for small<br>scale.|Free|
|Design|Figma|Free for up to 3 projects. Use community UI kits.|Free|



## **8. Cost Estimation — Bootstrap Mode** 

All figures assume you and your friends work for free (equity compensation). No office, no salaries. This is a zero-overhead startup. 

## **8.1 One-Time Setup Costs** 

|**Item**|**Cost (**I**)**|**Notes**|
|---|---|---|
|LLP / Pvt Ltd Registration|5,000 – 8,000|Via Startupindia portal or Razorpay Rize (cheaper).<br>Necessary for Razorpay.|
|Domain Name (.in or .com)|700 – 1,500|GoDaddy/Namecheap. vakiloncall.in or similar.|
|Google Play Store|1,700 (one-time)|$25 one-time fee. Apple App Store isI7,000/year —<br>skip iOS until funded.|
|Initial Exotel top-up|2,000|For alpha testing calls. Pay as you go after.|
|Misc (SIM card, bank charges)|1,000|Current account minimum balance, etc.|
|TOTAL ONE-TIME|**~**I**11,000 – 14,000**|Extremely lean for a tech startup|



## **8.2 Monthly Operating Costs (Post-Launch)** 

|**Item**|**Free / Paid**|**Monthly Cost (**I**)**|**Notes**|
|---|---|---|---|
|Supabase (DB + Auth)|Free→Paid|0→1,700|Free up to 50,000 monthly active users|
|Railway / Render (Hosting)|Free→Paid|0→700|Free tier covers early-stage traffic|
|Exotel (Calls)|Pay-per-use|~2,000 – 8,000|Depends on call volume; ~I0.50/min|
|Razorpay SMS OTP|Pay-per-use|~500 – 1,500|~I0.20–0.50 per OTP sent|
|Razorpay transaction fees|2% per txn|Deducted|No monthly fee; taken from revenue|
|Domain renewal|Annual|~120/mo|Averaged monthly|
|Google Play annual|Free|0|One-time paid already|
|Sentry / UptimeRobot|Free tier|0|Free up to small volume|
|**TOTAL MONTHLY BURN**||I**2,620 –**<br>**12,020/month**|Bootstrap viable|



## **Bottom Line: How Much Money Do You Actually Need to Start?** 

- One-time setup: I12,000–15,000 (split among 3–4 founders = I3,000–4,000 each) 

- First 3 months of operations: I10,000–15,000 total 

- Grand total to reach alpha: I25,000–30,000 — less than one month's rent in Mumbai 

- If even one friend puts in I10,000 and you each contribute I5,000, you can build this 

• Revenue kicks in the moment real users buy tokens — this can cover costs from Month 4–5 

## **9. Revenue Model & Unit Economics** 

## **9.1 Token Pricing Model** 

|**Pack**|**Tokens**|**Price (**I**)**|**Per Token (**I**)**|**Target User**|
|---|---|---|---|---|
|Starter|1|59|59|Try-before-you-commit users|
|Basic|3|149|49.7|Occasional users, students|
|Standard|7|299|42.7|Frequent travelers, self-employed|
|Premium|15|549|36.6|Small business owners, families|



## **9.2 Per-Call Revenue Split** 

|**Party**|**Amount (**I**)**|**% of Token Value**|
|---|---|---|
|Lawyer payout|32|65%|
|Platform revenue|10|20%|
|Exotel call cost (~15 min)|4–8|8–15%|
|Buffer / bad debt|0–4|0–7%|
|Token value (Basic pack)|~I50|100%|



## **9.3 What Does a Lawyer Earn?** 

- 5 calls/day × I32 × 25 working days = I4,000/month minimum 

- 10 calls/day × I32 × 25 days = I8,000/month — significant for a fresh law grad 

- Add senior tier (premium tokens at I80 payout): 5 calls/day = I10,000/month 

These numbers are modest but highly meaningful for lawyers who currently earn zero in their first year. The reputational and experiential value adds to the financial one. 

## **9.4 Break-Even for the Platform** 

- Monthly costs at early scale: ~I8,000–12,000 

- Break-even: ~800–1,200 calls/month (assuming I10 platform revenue per call) 

- At 50 active lawyers doing 5 calls/day each = 1,250 calls/day — well past break-even 

- Realistic 6-month target: 100 calls/month. Real break-even: Month 9–12. 

## **10. Risk Register & Mitigation** 

|**Risk**|**Likelihood**|**Impact**|**Mitigation**|
|---|---|---|---|
|BCI challenges platform<br>legality|Medium|High|Structure as marketplace, not law firm. Get legal<br>counsel early. Study precedents.|
|No lawyers online at 3am|High|High|Incentivise night-shift availability with bonus tokens.<br>Show live availability before purchase.|
|Bad advice leads to user<br>harm|Low|Very High|Robust T&C; disclaimers. Lawyer verification.<br>Rating/review system. Incident reporting.|
|Low user adoption|Medium|High|Viral moment strategy: one viral Twitter story of app<br>saving someone = thousands of downloads.|
|Connectivity failure during<br>call|High|Medium|Fallback to regular phone call. Token not deducted if call<br>drops in <2 min.|
|Razorpay / Exotel API<br>downtime|Low|Medium|Monitor uptime. Cache pre-bought tokens locally. Use<br>status page webhooks.|
|Competitor copies idea|Medium|Medium|Speed of execution is your moat. Launch before anyone<br>else. Build brand loyalty.|



## **11. Your First 30 Days — Action Plan** 

Before writing a single line of code, do this: 

## **Week 1** 

## **Validation** 

- Message 30 law graduates on LinkedIn with a 3-question survey: Would you take calls for I120–150 each? How many per day? What worries you? 

- Ask 20 non-lawyer friends: Have you ever faced a situation where legal help would have changed the outcome? Would you pay I49–59 for one call? 

- If 15+ law grads say yes and 10+ non-lawyers say yes — you have enough signal to build. 

## **Week 2** 

## **Business Setup** 

- Register as LLP via Startupindia.gov.in (cheapest and fastest) 

- Open a current account (HDFC/ICICI startup accounts have no minimum balance) 

- Create Razorpay account and complete KYC 

- Grab vakiloncall.in domain (or similar — check availability first) 

## **Week 3–4** 

## **Start Building** 

- Set up GitHub org, Supabase project, Expo project 

- Build user auth (phone OTP) and lawyer auth with document upload first 

- Nothing else matters until you can log in as both user types 

## **12. Funding Path (When You're Ready)** 

You don't need money to start. But once you have traction (300+ users, 1,000+ calls), here's where to go: 

## **Free Resources Right Now** 

- Startup India registration: free DPIIT recognition = tax benefits + scheme access 

- AWS Activate / Google for Startups: up to $100,000 in cloud credits (apply early) 

- Microsoft for Startups: Azure credits + GitHub Copilot free 

- IIM/IIT Incubators: free co-working, mentorship, sometimes grant funding 

- T-Hub (Hyderabad), NSRCEL (Bangalore), CIIE (Ahmedabad): apply to all simultaneously 

## **Angel Round (Month 8–12 if traction exists)** 

- Target: I20–50 lakh for 10–15% equity 

- Platforms: LetsVenture, AngelList India, Venture Catalysts, 100X.VC 

- Your pitch: 'Uber for legal help — marketplace with two underserved sides, IX MRR, growing X% month-on-month, built by 4 engineers for I30,000' 

## **13. Final Thoughts** 

This idea is genuinely strong. The combination of a real, painful problem + an underserved supply side (fresh lawyers) + a token model that aligns incentives + a founding team that can build it themselves is a rare setup. 

The regulatory risk from the Bar Council is real but not fatal — dozens of legal tech platforms operate in India today. Structure it right from day one and you will be fine. 

The biggest risk is not building. Every week you spend overthinking is a week someone else could launch. Your only moat right now is execution speed. 

## **The One Thing That Matters Most Right Now** 

- Talk to 30 law graduates this week. If they say yes — start building Monday. 

- The rest of this document is only useful if that first answer is yes. 

   - _Prepared with Claude, Anthropic | May 2026 | For personal use by Mohammed Umair_ 

