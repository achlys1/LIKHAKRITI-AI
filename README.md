# Likhakriti AI

> *Anyone can fill the ink of emotions.*

An AI-powered writing, poetry, editing, reflection and personal-expression platform. Likhakriti writes **with** the writer, never for them.

Founder: **Yashraj Sharma (Yash)**. Likhakriti AI is a distinct creative intelligence built around the Likhakriti philosophy — it never claims to be Yash.

---

## Quick start

```bash
npm install
cp .env.example .env      # optional — works offline without it
npm run dev               # http://localhost:3000
```

The app works immediately with **no API key**: an offline heuristic engine handles demos, analysis, RAW/Brutal editing, Poetry Lab, continuation, SEO briefs, etc. It is honest about its limits (e.g. it won't fake a translation). Connect a model provider for full generative quality.

The first account registered becomes **admin** (or set `ADMIN_EMAILS`).

## Environment

| Variable | Purpose |
|---|---|
| `AI_PROVIDER` | `openai` (any OpenAI-compatible endpoint: OpenAI, Groq, OpenRouter, Together, Ollama), `anthropic`, or `local` |
| `AI_MODEL` | model name (defaults: `gpt-4o-mini` / `claude-3-5-haiku-latest`) |
| `OPENAI_API_KEY`, `OPENAI_BASE_URL` | OpenAI-compatible credentials |
| `ANTHROPIC_API_KEY` | Anthropic credentials |
| `IMAGE_PROVIDER=openai` | enable real poem→artwork generation (otherwise a procedural ink/moon SVG is produced) |
| `AUTH_SECRET` | JWT cookie secret (**set in production**; auto-generated locally into `data/.secret`) |
| `ADMIN_EMAILS` | comma-separated admin emails |
| `NEXT_PUBLIC_SITE_URL` | public URL used for share links, sitemap, portfolio |
| `DATABASE_PATH` | local libSQL file (default `data/likhakriti.db`) |
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | production database (Turso) — required on Vercel |

Secrets are never sent to the browser. `.env*` and `data/` are git-ignored.

## Official logo (action required)

Place the founder-supplied assets in `public/brand/` — **untouched, no redesign, original aspect ratio**:

```
public/brand/logo.png         full wordmark for dark backgrounds   (required)
public/brand/logo-light.png   variant for light backgrounds / PDF   (optional)
public/brand/symbol.png       standalone symbol → mobile + favicon  (optional)
public/brand/favicon.ico      favicon (from the symbol if provided)
public/brand/icon-192.png, icon-512.png   PWA icons
```

`src/components/Logo.tsx` renders these files as-is (no filters, glow or recolouring). Until the files exist, a plain typographic placeholder is shown so the UI never breaks. The logo appears in: header, login/signup, AI Studio, dashboard, about, footer, public post & portfolio pages, PDF exports, loading screen.

## Architecture

```
src/lib/ai/
  providers.ts     AI Provider abstraction (openai-compatible | anthropic | local)
  orchestrator.ts  Likhakriti AI Orchestrator → context selection → stream
  persona.ts       Personality + Task Router → per-engine system prompts
                   (conversation, writing, poetry, editing, analysis, seo, translation, author, voice)
  local.ts         Offline heuristic engine (fallback / demo)
  textstats.ts     Language detection (Hindi/English/Hinglish/bilingual), emotion, imagery, clichés, AI-pattern detection
src/lib/db.ts      SQLite schema (users, profiles, documents, versions, journal, memories, projects,
                   voice_profiles, ai_conversations, bookmarks, reports, analytics, ai_usage, settings)
src/lib/repo.ts    Repositories — every private query is scoped by user_id
src/lib/auth.ts    Email/password + JWT httpOnly cookie sessions (bcrypt)
src/lib/voiceLearn.ts  "My Voice" learning from the user's own pages only
src/lib/export.ts  TXT / MD / DOCX / literary PDF / manuscript PDF (client-side)
src/app/api/*      REST + streaming AI endpoint (/api/ai), rate-limited
src/app/*          Pages: home, studio, editor, poetry, lab, journal, journey, voice, dashboard,
                   portfolio, explore, p/[slug], u/[username] (+ /@username rewrite), author, creator, seo,
                   settings, admin, about, login/signup/onboarding
```

Context priority for every AI call: current document → user instruction → voice profile (declared beats learned) → trimmed history.

### Modes
- **RAW** — minimal touch, shows *Original vs Raw Refined*, leaves notes instead of edits.
- **LITERARY** — imagery/structure, sophistication from thought not vocabulary.
- **HUMANIZE** — strips AI-pattern phrasing.
- **Brutal Honesty**, **First Reader**, **Why this line works**, **Keep my imperfections** toggle.
- Suggestions always render as *Original / Suggestion / Why* with **Accept / Reject / Try again** — nothing is silently replaced; accepted edits snapshot the previous version.

## Deploy to Vercel

1. **Database** — create a free Turso DB: `turso db create likhakriti && turso db show likhakriti --url && turso db tokens create likhakriti` (or via turso.tech dashboard). Tables are created automatically on first request.
2. **Import the repo** at vercel.com/new (branch `arena/01a0c5c1-likhakriti-ai` or `main` after merge). Framework is auto-detected; `vercel.json` sets the Mumbai region and a 60 s limit for the streaming AI route.
3. **Environment variables** (Production): `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `AUTH_SECRET` (e.g. `openssl rand -hex 32`), `AI_PROVIDER=anthropic`, `ANTHROPIC_API_KEY`, `AI_MODEL=claude-3-5-haiku-latest` (or a Sonnet model), `ADMIN_EMAILS`, `NEXT_PUBLIC_SITE_URL=https://<your-domain>`.
4. Deploy. Register your account first — it becomes admin.

## Production notes
- libSQL runs as a local file in dev and as Turso in production with the same client; no code changes.
- OAuth (Google etc.): the session layer is provider-agnostic — add a callback route that creates/finds the user by email and calls `createSession(userId)`.
- Rate limiting is in-memory; move to Redis for multiple instances.
- Plans (Free / Creator / Pro / Studio) exist as configuration in the admin dashboard — no prices are set and nothing is paywalled.

## Scripts
`npm run dev` · `npm run build` · `npm start` · `npm run lint`

~Likhakriti
