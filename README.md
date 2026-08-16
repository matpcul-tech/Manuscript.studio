# Manuscript Studio

Voice-trained manuscript writer with full KDP export.

One pipeline: Setup → Voice → Write → Edit → Cover → Publish → Launch.

Live: [https://manuscript-studio-os.com](https://manuscript-studio-os.com)

Built by an indie author who self-publishes fiction.

---

## What it does

- **Voice Training** — Paste or upload past writing. The studio builds a reusable profile of cadence, sentence length, word choice, and stylistic habits.
- **Quick Draft** — Describe the book in a paragraph. Get a chapter outline and an opening chapter written in the trained voice.
- **Write** — Scene-by-scene or chapter-by-chapter drafting with voice lock, continue-from-cursor, and six rewrite moves on selection.
- **Edit (Sovereign Prose Validator)** — Multi-layer humanization and quality pass: AI-tell detection, somatic interiority depth, voice consistency, pacing, character continuity, and related checks. Findings link to one-click rewrites. Scoped to scene, chapter, or whole manuscript.
- **Cover** — Live cover builder with palette presets and title fonts. Exports at 1600×2560 KDP resolution.
- **Publish / Launch** — KDP walkthrough with generated description variants, backend keywords, categories, pricing suggestions, front matter, back matter, and metadata pack. Export KDP-ready `.docx`, EPUB 3.0, and print interior PDF.

Your manuscripts remain yours. We never train on your work.

---

## Stack

- Next.js 14.2 (App Router), React 18.3, TypeScript 5.6, Tailwind 3.4
- Supabase (auth + per-user project storage, RLS-enforced)
- Anthropic Claude (writing engine, proxied server-side)
- Stripe (paid plans)
- jspdf + jszip (client-side EPUB and print PDF)
- Capacitor (iOS / Android)
- Inngest (long-running generation jobs)
- Deployed on Vercel

---

## Pricing (live)

| Plan   | Price     | Key limits                                      |
|--------|-----------|-------------------------------------------------|
| Free   | $0        | 1 project, 1 voice profile, 30 engine calls/day, .docx/.txt |
| Pro    | $19/mo    | 150 generations/month, unlimited manuscripts, full publishing pack, Sovereign Prose Validator |
| Studio | $39/mo    | 500 generations/month, whole-manuscript line edit, priority support, Export All zip |

Start free. Upgrade when ready.

---

## Local development

### 1. Clone and install

```bash
git clone https://github.com/matpcul-tech/Manuscript.studio.git
cd Manuscript.studio
npm install
```

Node 20+ required.

### 2. Supabase

1. Create a project at supabase.com.
2. Copy Project URL and anon key (Project Settings → API).
3. Enable Email auth (and Google if desired) under Authentication → Providers.
4. Add your local and production URLs to Authentication → URL Configuration (Site URL + Redirect URLs).
5. Run the SQL in `supabase/schema.sql` in the SQL Editor. This creates `projects`, `voice_profiles`, `subscriptions`, `engine_usage`, `generation_jobs`, applies RLS, and auto-creates a free subscription row on signup.

### 3. Environment

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional until you enable paid plans
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_PRO=price_...
```

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000. Sign in and confirm the flow works.

### 5. Deploy

```bash
vercel
```

Or connect the GitHub repo in the Vercel dashboard. Add the same environment variables. Point a custom domain (currently `manuscript-studio-os.com`) and update Supabase redirect URLs to match.

---

## Project layout

```
app/
  api/
    engine/route.ts          # Anthropic proxy, generation limits, auto-scrub
    projects/route.ts        # List + create
    projects/[id]/route.ts   # GET/PUT/DELETE
  app/
    page.tsx                 # Dashboard
    project/[id]/page.tsx    # Full pipeline editor
  auth/callback/route.ts
  login/page.tsx
  page.tsx                   # Public landing
lib/
  engine.ts                  # Client helper, scrub patterns
  exports.ts                 # .doc, EPUB 3.0, print PDF
  types.ts                   # ProjectData shape + defaults
  checkGenerationLimit.ts
  ai-config.ts               # Single model constant
  supabase/
supabase/schema.sql
middleware.ts                # Protects /app routes, refreshes session
```

---

## Key behaviors

- All Claude calls go through `/api/engine`. The API key never reaches the client.
- Hard anti-AI rules live in the system prompt (no em dashes, banned phrases, concrete over abstract, etc.). Additional post-generation scrub removes residual tells.
- Generation limits are enforced server-side against the `subscriptions` table.
- Long jobs can be tracked via `generation_jobs` (Inngest + Supabase Realtime).
- Project data is stored as JSONB per user with RLS. Voice profiles are separate and reusable across projects.
- Exports are generated client-side (no server file storage of manuscripts).

Model used for generation is set in `lib/ai-config.ts`. Scrub patterns live in `lib/engine.ts`.

---

## Scripts

```bash
npm run dev          # next dev
npm run build        # production build
npm run lint         # next lint
npx tsc --noEmit     # type-check
npm run cap:sync     # Capacitor sync
npm run cap:ios      # open iOS project
npm run cap:android  # open Android project
```

---

## Current status

**Shipped**
- Magic-link / email-password / Google auth
- Voice training and voice-locked drafting
- Quick Draft
- Multi-check humanization + continuity pass
- Cover designer (KDP resolution)
- KDP-ready exports (.docx, EPUB 3.0, print PDF)
- Landing page, pricing, and free → paid path
- Capacitor mobile scaffolding
- Generation usage tracking and plan limits

**Next**
- Stronger per-chapter / per-scene snapshots and one-tap undo
- Full Stripe gate on exports and higher tiers (if not already live)
- AI cover backgrounds
- Spine and back cover for paperback
- Further expansion of the humanization checklist and continuity guard

---

## License / ownership

Private commercial product. All rights reserved.

Manuscripts belong to the user. We do not train on user content.
```
