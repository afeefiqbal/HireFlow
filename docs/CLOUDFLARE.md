# Cloudflare Deployment Architecture Guide

This document outlines the deployment strategy for **AI Job Agent** using Cloudflare's edge platform for the frontend while keeping the backend, PostgreSQL database, and n8n services in appropriate compute environments.

---

## Architecture Topology

```
┌────────────────────────────────────────────────────────┐
│ Cloudflare Edge (Pages / Workers / DNS / WAF / SSL)     │
│ - Frontend: Next.js static / edge deployment on Pages  │
│ - Security: Cloudflare Access / Turnstile bot defense │
└───────────────────────────┬────────────────────────────┘
                            │ Cloudflare Tunnel (cloudflared)
                            ▼
┌────────────────────────────────────────────────────────┐
│ Private Compute VPS / Container Host (Docker Compose)   │
│ - Backend API (Node.js / Express): port 4000           │
│ - Database (PostgreSQL 16): port 5432                  │
│ - Automation (n8n Engine): port 5678                   │
└────────────────────────────────────────────────────────┘
```

---

## 1. Frontend Deployment (Cloudflare Pages)

The `apps/web` Next.js application can be deployed directly to Cloudflare Pages.

### Step 1: Cloudflare Pages Setup
1. In the Cloudflare Dashboard, navigate to **Compute (Workers & Pages)** > **Create application** > **Pages** > **Connect to Git**.
2. Select your repository.
3. Configure build settings:
   - **Framework preset:** Next.js
   - **Root directory:** `apps/web`
   - **Build command:** `npm run build`
   - **Output directory:** `.next` (or static export `out`)

### Step 2: Environment Variables
Configure the following in the Pages dashboard:
- `NEXT_PUBLIC_API_URL`: `https://api.yourdomain.com/api` (routed via Cloudflare Tunnel)
- `NEXT_PUBLIC_APP_NAME`: `AI Job Agent`

---

## 2. Backend Security & Cloudflare Tunnel (`cloudflared`)

To protect the candidate profile and private job data:
1. **Never expose PostgreSQL (5432) or n8n (5678) directly to the open public internet.**
2. Install Cloudflare Tunnel on your host machine:
   ```bash
   brew install cloudflared # or apt install cloudflared on Linux
   cloudflared tunnel login
   cloudflared tunnel create ai-job-agent-tunnel
   ```
3. Route your subdomain (e.g. `api.yourdomain.com`) to `localhost:4000`.
4. Only traffic verified through Cloudflare WAF and SSL will reach the API.

---

## 3. Zero Hard-Coded Domains

All URLs and endpoints are dynamically governed through environment variables:
- `DATABASE_URL`
- `PORT`
- `API_ACCESS_TOKEN`
- `JWT_SECRET`
- `NEXT_PUBLIC_API_URL`
- `AI_PROVIDER`
- `OPENAI_API_KEY` / `GEMINI_API_KEY` / `ANTHROPIC_API_KEY`
