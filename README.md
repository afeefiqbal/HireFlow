# AI Job Agent (V1)

A production-quality, private personal job-search and AI matching dashboard built specifically for **Afeef Iqbal** (Senior Full-Stack Developer | Laravel, PHP, Node.js, Vue.js).

---

## 1. Core Mission & Philosophy

The application automates fresh job discovery (&lt;24h), enforces strict candidate profile truth (zero hallucinated skills, zero gap filling), performs multi-vector AI match scoring, and provides application tracking.

### Ground Truth Guarantees:
- **Candidate Profile as Source of Truth:** Never invents skills, employers, years of experience, titles, certifications, degrees, projects, or achievements.
- **Career Gap Transparency:** Preserves the career break between August 2024 and July 2025 without inventing fictitious activities.
- **Strict 24-Hour Job Filter:** Evaluates actual `posted_at` timestamps. Unverifiable aggregator labels ("new", "today") are marked as `UNKNOWN`.
- **Human-in-the-Loop:** Discovery, filtering, match scoring, and CV preparation are automated. Application submission remains 100% human-controlled.

---

## 2. Monorepo Project Structure

```
ai-job-agent/
├── apps/
│   ├── web/                     # Next.js 15 App Router + Tailwind CSS + Lucide
│   │   ├── src/app/             # Dashboard, Jobs, Matches, Applications, Profile, Resume, Settings
│   │   ├── src/components/      # JobCard, AiMatchAnalysisCard, MetricCard, Navigation
│   │   └── src/lib/api.ts       # REST client
│   └── api/                     # Node.js + Express + TypeScript
│       ├── src/controllers/     # Dashboard, Jobs, Matches, Profile, Applications
│       ├── src/services/        # MatchingService, JobFilterService, ApplicationService
│       ├── src/adapters/        # Greenhouse & Lever normalized source adapters
│       └── src/routes/          # REST API endpoints
├── packages/
│   └── shared/                  # Shared TypeScript interfaces, DTOs, Enums, and contracts
├── database/
│   └── prisma/
│       ├── schema.prisma        # PostgreSQL models with indexes
│       └── seed.ts              # Verified profile, experiences, projects, skills, & test jobs
├── prompts/
│   ├── system_matching.md       # Anti-hallucination AI system prompt
│   └── cv_tailoring_future.md   # Prompt template for future tailored CV generation
├── n8n/
│   ├── workflows/               # Scheduled hourly polling workflow JSON
│   └── README.md                # n8n import guide
├── docs/
│   ├── ARCHITECTURE.md          # Full system architecture document
│   └── CLOUDFLARE.md            # Cloudflare Pages & Tunnel deployment guide
├── docker-compose.yml           # Multi-service composition (PostgreSQL, API, Web, n8n)
├── .env.example                 # Environment variables template
├── package.json                 # Monorepo root workspace configuration
└── README.md                    # System documentation
```

---

## 3. Quick Start (Running Locally)

### Prerequisites
- **Node.js**: v20+ or v26 LTS
- **PostgreSQL**: 16+ running locally or in Docker

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` matches your local PostgreSQL instance:
```env
DATABASE_URL="postgresql://pixbit@localhost:5432/ai_job_agent?schema=public"
PORT=4000
NODE_ENV=development
API_ACCESS_TOKEN="afeef_private_dashboard_token_2026"
AI_PROVIDER="mock" # or "openai" / "gemini" / "anthropic"
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

### Step 3: Database Migration & Ground Truth Seed
```bash
npm run db:push
npm run db:seed
```
This initializes PostgreSQL with Afeef Iqbal's verified employment history, 3 verified projects, skills taxonomy, realistic fresh jobs (<24h), and older jobs for testing.

### Step 4: Run the Application
You can start both backend and frontend concurrently:
```bash
npm run dev
```
Or start individually:
- Backend API (Port 4000): `npm run dev:api`
- Frontend Web (Port 3000): `npm run dev:web`

---

## 4. Verified Candidate Truth (Afeef Iqbal)

| Attribute | Verified Value |
| :--- | :--- |
| **Full Name** | Afeef Iqbal |
| **Headline** | Full-Stack Developer \| Laravel, PHP, Node.js, Vue.js |
| **Total Experience** | 7+ years professional software development |
| **Primary Technologies** | PHP, Laravel, MySQL, REST APIs |
| **Additional Technologies**| Node.js, Express.js, Vue.js, React, PostgreSQL, MongoDB, AWS, Docker, Git |
| **Target Roles** | Senior Laravel Developer, Senior PHP Developer, Full Stack Developer, Backend Developer, Node.js Developer |
| **Target Locations** | Germany, Netherlands, Europe, Worldwide Remote |
| **Remote Work** | Preferred |
| **Relocation** | Preferred |
| **Visa Sponsorship** | Required for relocation-based opportunities |

### Verified Employment History:
1. **Crabviz Private Limited** — Software Engineer (Dec 2018 – Sep 2020)
2. **D5N Digital** — Software Developer (Dec 2020 – Jul 2022)
3. **Pentacodes** — Software Developer (Jul 2022 – Jun 2023)
4. **Lilac Infotech Pvt. Ltd.** — Software Engineer (Jul 2023 – Aug 2024)
5. **Pixbit Solutions** — Senior Software Developer (Jul 2025 – Present)
*Explicit gap between Aug 2024 and Jul 2025 is strictly un-invented.*

### Verified Projects:
- **DealCode:** Node.js, React, PostgreSQL, AWS
- **Artemyst:** Laravel, PHP, AJAX, E-commerce, Payments
- **Samasta:** Laravel, Vue.js

---

## 5. API Endpoints

- `GET /health` — Health check
- `GET /api/dashboard/stats` — Metrics (Discovered today, Fresh <24h, Strong matches, Pipeline counts)
- `GET /api/jobs` — Job listings with strict `freshOnly=true` filter, search, role, location
- `GET /api/jobs/:id` — Job details, description, requirements, latest match
- `POST /api/jobs/:id/analyze` — Run anti-hallucination AI match evaluation
- `GET /api/matches` — Curated high compatibility matches
- `GET /api/profile` — Candidate master profile and verified history
- `PUT /api/profile` — Update candidate preferences
- `GET /api/applications` — Application lifecycle tracking pipeline
- `POST /api/applications` — Update application status (`SAVED`, `READY_TO_APPLY`, `APPLIED`, etc.)

---

## 6. Next Development Steps (V2 Roadmap)

1. **Scheduled Polling Integration:** Deploy n8n workflow or VPS cron runner for continuous Greenhouse/Lever board scanning.
2. **Dynamic AI CV Generation:** Implement the V2 tailored CV generator with ATS layout exports.
3. **Screening Questions Assistant:** Pre-generate concise answers to recurring employer questions.
# HireFlow
# HireFlow
