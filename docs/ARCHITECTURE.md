# AI Job Agent — Architecture Document (V1 & Future Vision)

**Target Candidate:** Afeef Iqbal (Full-Stack Developer | Laravel, PHP, Node.js, Vue.js)  
**System Type:** Private Personal Job-Search & AI Application Intelligence Platform  
**Version:** 1.0.0

---

## 1. System Overview & Philosophy

The **AI Job Agent** is a purpose-built, private, single-user intelligence dashboard designed to streamline the job discovery, relevance evaluation, and application tracking pipeline for Afeef Iqbal.

### Fundamental Tenets
1. **Candidate Profile as Single Source of Truth:**  
   The AI agent possesses zero creative license to invent, embellish, or fabricate skills, employers, job titles, certifications, or project details. Any generated match reasoning, tailored resume, or screening response must map 1:1 to verified profile items.
2. **Strict Time Truth (<24 Hours):**  
   Only jobs with verified posting timestamps within the preceding 24 hours are classified as fresh. Aggregator badges ("new", "just posted") are untrusted without an authentic underlying timestamp.
3. **Human-in-the-Loop:**  
   The agent performs discovery, filtering, match scoring, and application preparation. Application submission is strictly initiated by the human operator.
4. **Clean Decoupling:**  
   Front-end presentation, API business logic, database persistence, external job polling (n8n), and AI analysis are strictly modular.

```
                    ┌────────────────────────┐
                    │ External Job Sources   │
                    │ (Greenhouse, Lever,    │
                    │  Ashby, Remote Boards) │
                    └───────────┬────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  n8n Collector  │ (Cron / Scheduled Webhooks)
                       └────────┬────────┘
                                │ Normalized POST /api/jobs/ingest
                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        AI JOB AGENT BACKEND                            │
│                                                                        │
│   ┌─────────────────────┐             ┌────────────────────────────┐   │
│   │ 24h Filter &        │             │ AI Matching Engine         │   │
│   │ Deduplication Engine│             │ (Anti-hallucination Prompt)│   │
│   └──────────┬──────────┘             └─────────────┬──────────────┘   │
│              │                                      │                  │
│              ▼                                      ▼                  │
│   ┌────────────────────────────────────────────────────────────┐       │
│   │               PostgreSQL Database (Prisma ORM)             │       │
│   │  - Users & Master Profile (Verified Work History & Projects)│      │
│   │  - Jobs & Job Sources                                      │       │
│   │  - Matches & Recommendations                               │       │
│   │  - Applications & Lifecycle Events                         │       │
│   └────────────────────────────────────────────────────────────┘       │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ REST API
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        AI JOB AGENT FRONTEND                           │
│   Next.js 15 / React / Tailwind CSS / TypeScript / Lucide              │
│   - Live Dashboard (<24h Fresh Jobs, Today's Strongest Matches)        │
│   - Interactive Discovery & Filter Matrix                              │
│   - Comprehensive Job & AI Match Deep Dive                             │
│   - Visual Application Tracking Kanban / Pipeline                      │
│   - Candidate Master Profile & Verified Timeline                       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture (`apps/web`)

- **Framework:** Next.js (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS with CSS Variables for theme switching (Slate/Obsidian dark theme primary with high-contrast text and emerald/amber/indigo semantic status indicators).
- **Icons & UI:** Lucide React icons, Radix UI headless primitives for accessible modals and drawers.
- **Routing Structure:**
  - `/` — Command Dashboard (Fresh job metrics, today's top matches, pipeline velocity)
  - `/jobs` — Job Discovery & Filtering (24h filter toggle, role, tech stack, location, visa filters)
  - `/jobs/[id]` — Deep-dive inspection & AI analysis view (Score breakdown, technical match, missing skills, explicit reasoning, recommendation)
  - `/matches` — Curated strong matches overview
  - `/applications` — Full lifecycle pipeline (Discovered → Matched → Saved → Ready to Apply → Applied → Interview → Offer)
  - `/profile` — Master Candidate Profile (Verified timeline with gap transparency, verified projects, skills inventory)
  - `/resume` — Tailored CV generation & ATS optimizer preview (V2 blueprint)
  - `/settings` — Source adapters, match thresholds, and API configuration

---

## 3. Backend Architecture (`apps/api`)

- **Runtime:** Node.js (v20+ / v26 LTS) with Express.js and TypeScript.
- **Architecture Layers:**
  - **Controllers:** Request validation, parameter parsing, HTTP status orchestration.
  - **Services:**
    - `JobFilterService`: Calculates `job_age_hours`, deduplicates via composite keys (`company_normalized + title_normalized + canonical_url`), and tags status `FRESH`, `OLDER`, or `UNKNOWN`.
    - `MatchingService`: Takes verified candidate profile + job specifications and calculates multi-vector compatibility (Technical, Experience, Location, Visa), returning structured JSON with strict audit reasoning.
    - `ApplicationService`: Manages status transitions, event auditing, and note taking.
  - **Adapters:** Modular `JobSourceAdapter` interface for Greenhouse, Lever, Ashby, and general remote RSS/JSON feeds.
  - **Middleware:** Token-based personal authentication, CORS security, request rate-limiting, and error handling.

---

## 4. Database Architecture (PostgreSQL)

### Key Entities
1. **`users` & `profiles`**: Personal master account and career positioning ("Full-Stack Developer | Laravel, PHP, Node.js, Vue.js").
2. **`experiences`**: Verified employment history:
   - Crabviz (Dec 2018 – Sep 2020)
   - D5N Digital (Dec 2020 – Jul 2022)
   - Pentacodes (Jul 2022 – Jun 2023)
   - Lilac Infotech (Jul 2023 – Aug 2024)
   - Pixbit Solutions (Jul 2025 – Present)
   - *Aug 2024 – Jul 2025 gap explicitly preserved and un-invented.*
3. **`projects`**: DealCode (Node.js, React, Postgres, AWS), Artemyst (Laravel, PHP, AJAX, Payments), Samasta (Laravel, Vue.js), plus future entries.
4. **`skills`**: Categorized taxonomy (Primary: PHP, Laravel, MySQL, REST APIs; Additional: Node.js, Express, Vue.js, React, Postgres, MongoDB, AWS, Docker, Git).
5. **`job_sources` & `jobs`**:
   - `posted_at`, `discovered_at`, `job_age_hours`, `age_status` (`FRESH`, `OLDER`, `UNKNOWN`).
   - Indexes on: `posted_at`, `company`, `canonical_url`, `status`.
6. **`job_matches`**: Overall score, technical score, experience score, location score, visa compatibility, strong matches JSON, missing requirements JSON, concerns JSON, reasoning JSON, and recommendation (`APPLY`, `REVIEW`, `SKIP`).
7. **`applications` & `application_events`**: Audit trail of every status transition.

---

## 5. AI Layer & Anti-Hallucination Governance

### Matching Engine Contract
```json
{
  "overall_match": 92,
  "technical_match": 95,
  "experience_match": 90,
  "location_match": 90,
  "visa_compatibility": "compatible",
  "strong_matches": ["PHP", "Laravel", "REST APIs", "Vue.js", "Docker"],
  "missing_requirements": ["Kubernetes"],
  "concerns": ["Job mentions occasional on-call rotation in CET timezone"],
  "reasoning": [
    "Candidate possesses 7+ years of professional full-stack development experience exceeding the 5-year requirement.",
    "Candidate's verified history demonstrates deep production mastery with Laravel, PHP, and Vue.js (Lilac Infotech, Pixbit Solutions, Artemyst, Samasta).",
    "Candidate prefers remote in Europe and requires visa sponsorship for on-site relocation. Job offers full remote in Germany/EU."
  ],
  "recommendation": "APPLY"
}
```

### Hallucination Prevention Rules
- The system prompt injects the verified JSON payload of Afeef Iqbal's profile.
- Explicit negative constraints:
  - "NEVER assume candidate has technologies not listed in verified skills."
  - "NEVER explain away missing career periods as employment."
  - "If a required technology is absent from verified profile, mark it under missing_requirements."

---

## 6. Job Sources & Discovery Architecture

- **Adapter Interface (`JobSourceAdapter`):**
  - `fetchFreshJobs(since: Date): Promise<NormalizedJob[]>`
  - `parseJobDetail(url: string): Promise<NormalizedJobDetail>`
- **Initial Sources:**
  - Greenhouse Public Board API (`boards-api.greenhouse.io`)
  - Lever Public Job API (`api.lever.co/v0/postings`)
  - Ashby Public Board API
  - Curated remote tech feed adapters
- **Anti-Scraping / Security Compliance:**
  - Zero bypass of CAPTCHA or Cloudflare Turnstile.
  - Zero scraping behind authentication (no LinkedIn/Indeed login required or stored).
  - Adherence to public API contracts and rate limits.

---

## 7. n8n Automation Architecture

- Location: `n8n/workflows/job-discovery-polling.json`
- **Schedule:** Cron trigger every 60 minutes.
- **Workflow:**
  1. Trigger external search across configured Greenhouse/Lever endpoints for keywords: `Laravel`, `PHP`, `Node.js`, `Full Stack`.
  2. Parse `posted_at` timestamp.
  3. Filter jobs where `NOW() - posted_at <= 24 hours`.
  4. POST payload to backend `/api/jobs/ingest` with bearer secret.
  5. If `overall_match >= 85%`, trigger desktop/email notification to Afeef.

---

## 8. Cloudflare Deployment Blueprint

- **Frontend (`apps/web`):**
  - Deployed on **Cloudflare Pages** (Next.js with OpenNext adapter / static export with API proxy).
  - DNS, SSL/TLS, and DDoS mitigation natively handled by Cloudflare.
- **Backend (`apps/api`), Database & n8n:**
  - Deployed on VPS / container instance (Hetzner / DigitalOcean / Railway / fly.io) running PostgreSQL 16 and Docker Compose.
  - Connected securely to Cloudflare via **Cloudflare Tunnel (`cloudflared`)**, ensuring no backend ports are directly exposed to the public Internet.
- **Secrets Management:**
  - Secrets injected via environment variables (`DATABASE_URL`, `JWT_SECRET`, `API_KEY`, `OPENAI_API_KEY` / `GEMINI_API_KEY`).

---

## 9. Future CV & Screening System Roadmap (V2 Preview)

1. **Master Profile → Tailored CV Generation:**
   - For a Laravel Senior position: Elevate Laravel, Eloquent ORM, MySQL performance tuning, Artemyst & Samasta projects.
   - For a Node.js position: Elevate Node.js, Express, async processing, DealCode project, AWS & PostgreSQL architecture.
   - For a Full Stack position: Present balanced portfolio highlighting end-to-end delivery with Vue/React and backend frameworks.
2. **ATS Compatibility Validator:**
   - Evaluates keyword density, heading hierarchy, single-column parsing, and standard date formatting without fluff.
3. **Screening Questions Assistant:**
   - Pre-drafts answers to common recruiter questions ("Why are you looking for a new role?", "Describe your experience with high-traffic Laravel applications") drawing solely on verified career milestones.
