# Manuscript Studio

Production-ready voice-trained manuscript writer with KDP export. One pipeline: Setup → Voice → Write → Edit → Cover → Publish.

## Stack

- Next.js 14.2 (App Router) on Node 20+
- React 18.3, TypeScript 5.6, Tailwind 3.4
- Supabase (magic-link auth + per-user project storage, RLS-enforced)
- Anthropic Claude API (writing engine, proxied server-side)
- Stripe (paywall, optional for launch)
- `jspdf` + `jszip` for client-side EPUB and print-PDF generation
- Deployed to Vercel

Same pattern as Sovereign Health OS and CareIQ.

---

## Deploy tonight in 30 minutes

### 1. Clone and install (2 min)

```bash
cd manuscript-studio
npm install
```

Node 20+ required (pinned in `package.json` engines). The lockfile resolves cleanly; no `--legacy-peer-deps` needed.

### 2. Create Supabase project (5 min)

Go to supabase.com, create a new project named `manuscript-studio`. Once it's ready:

1. Copy your **Project URL** and **anon key** from Project Settings → API
2. In Authentication → Providers, enable **Email** with **Magic Link**
3. In Authentication → URL Configuration, add your Vercel URL (e.g. `https://manuscript-studio.vercel.app`) to Site URL and Redirect URLs
4. Run the SQL in `supabase/schema.sql` (paste it in the SQL Editor and run). It creates the `projects`, `voice_profiles`, `subscriptions`, and `engine_usage` tables, applies RLS policies, and adds a trigger that auto-creates a `free` subscription row when a new user signs up.

### 3. Set up environment variables (3 min)

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional for launch (skip for free tier launch):
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_PRO=price_...
```

### 4. Test locally (2 min)

```bash
npm run dev
```

Visit `http://localhost:3000`. Sign in with your email. Confirm the magic link works.

### 5. Deploy to Vercel (5 min)

```bash
npm i -g vercel
vercel
```

Or push to GitHub and import on vercel.com. Add all environment variables from `.env.local` to Vercel project settings.

### 6. Point domain (5 min)

In Vercel project settings, add custom domain `manuscript.sovereignshieldtechnologies.com` (or whatever you choose). Update your DNS with the CNAME Vercel gives you.

Update Supabase Site URL and Redirect URLs to match the production domain.

---

## Project layout

```
app/
  api/
    engine/route.ts          # Anthropic proxy, daily-cap enforcement, auto-scrub
    projects/route.ts        # List + create
    projects/[id]/route.ts   # GET/PUT/DELETE for a single project
  app/
    page.tsx                 # Dashboard (list/create/delete projects)
    project/[id]/page.tsx    # Six-stage editor (Setup, Voice, Write, Edit, Cover, Publish)
  auth/callback/route.ts     # Supabase OAuth code → session exchange
  login/page.tsx             # Magic-link sign-in
  page.tsx                   # Public landing page
lib/
  engine.ts                  # callEngine() client, scrub patterns, word counter
  exports.ts                 # .doc, EPUB 3.0, print PDF, plain-text+JSON bundle
  supabase/{client,server}.ts
  types.ts                   # ProjectData shape, defaults
middleware.ts                # Protects /app routes; refreshes Supabase session cookies
supabase/schema.sql          # Tables, RLS policies, triggers
```

## What works tonight

- Magic-link auth via Supabase, session refresh in middleware
- Project save/load from database (per user, RLS-enforced)
- Voice training: paste a writing sample, the engine distills 8–12 specific style observations into a reusable profile
- Manuscript writing with voice-locked engine (draft scenes, continue from cursor, six rewrite moves on selection)
- Edit pass: AI-tell scanner (em dashes, "delve into", "tapestry", 20+ patterns), line edit, voice-consistency check, pacing review — scoped to scene, chapter, or whole manuscript
- Cover designer: 8 palette presets, 5 title fonts, downloads at 1600 × 2560 KDP resolution
- Exports: `.doc` (Word-compatible HTML), KDP-ready EPUB 3.0 with nav.xhtml, print interior PDF with mirrored gutters at the chosen trim, plus a plain-text + project-JSON bundle for backup
- All Claude calls proxied through `/api/engine` so `ANTHROPIC_API_KEY` stays server-side; per-user daily caps (30 free / 500 pro / 2,000 studio)
- Landing page at `/` for marketing

## Develop locally

```bash
npm run dev        # next dev on :3000
npm run build      # production build
npm run lint       # next lint (ESLint 8)
npx tsc --noEmit   # type-check only
```

The Anthropic model is hard-coded in `app/api/engine/route.ts`. Swap the model id there to upgrade the writing engine.

Scrub patterns live in `lib/engine.ts` as `TELL_PATTERNS`. Add or tune entries to refine what the AI-tell scanner catches and auto-fixes.

## What ships in Phase 2 (next week)

- Stripe paywall on exports
- AI-generated cover backgrounds
- Spine and back cover for paperback
- Undo history and draft snapshots
- Queue system for long jobs
