# Manuscript Studio

Voice-trained manuscript writer with full KDP export.

One pipeline: Setup → Voice → Write → Edit → Cover → Publish → Launch.

Live: [https://manuscript-studio-os.com](https://manuscript-studio-os.com)

Built by an indie author who self-publishes fiction.

---

## What it does

- **Voice Training**: Paste or upload past writing. Your sample and style notes steer every generation, and a local stylometric voice-match score (sentence rhythm, punctuation habits, diction, dialogue share, function words) measures the finished manuscript against the sample at publish time. The voice lock is verified, not asserted.
- **Quick Draft**: Describe the book in a paragraph. Get a chapter outline and a character canon (story bible), then an editable review step: fix chapter titles, synopses, and character names before a single line of prose is written. Locations are extracted into the canon alongside characters. Approve to start the draft, or do nothing and it starts on its own after 30 minutes. Names in the canon are locked across the whole draft, and if the canon fails to build, the job warns you visibly instead of drafting without one.
- **Write**: Scene-by-scene or chapter-by-chapter drafting with voice lock, continue-from-cursor, six rewrite moves, and a Workshop: Describe, Show-not-tell, Twist, and Next beat each return three distinct takes to pick from.
- **Story Bible**: a living codex per project: protagonist, setting, locked character names, locations, and lore, editable any time from the Write stage and injected as locked canon into every draft, continue, rewrite, workshop call, and Quick Draft chapter.
- **Edit (Sovereign Prose Validator)**: Multi-layer humanization and quality pass: AI phrase scan (tracked-phrase density, a tally rather than a detector), somatic interiority depth, voice consistency, pacing, character continuity, and related checks. Findings link to one-click rewrites. Scoped to scene, chapter, or whole manuscript.
- **Cover**: Live cover builder with palette presets and title fonts. Exports at 1600×2560 KDP resolution and embeds into the EPUB.
- **Interior themes**: Classic, Elegant, Modern, and Minimal style the chapter titles, scene breaks, and drop caps across the print PDF, the EPUB, and the .docx. Elegant sets letterspaced capitals with a rule and a three-line drop cap; Modern sets sans titles with embedded DejaVu Sans.
- **Publish / Launch**: KDP walkthrough with generated description variants, backend keywords, categories, pricing suggestions, front matter, back matter, and metadata pack. Exports:
  - **.docx**: real OOXML via the `docx` library: Word TOC field, heading styles, title/copyright/dedication/epigraph/foreword front matter, scene breaks, gutter margin, footer page numbers.
  - **EPUB 3**: embedded cover from your design, landmarks nav, scene breaks in markup, full metadata. Validated by epubcheck with zero errors.
  - **Print interior PDF**: embedded DejaVu Serif (KDP requires embedded fonts), chapters open on recto pages, running heads and folios on body pages only, mirrored margins at your trim size.

Your manuscripts remain yours. We never train on your work.

---

## Stack

- Next.js 14.2 (App Router), React 18.3, TypeScript 5.6, Tailwind 3.4
- Supabase (auth + per-user project storage, RLS-enforced)
- Anthropic Claude (writing engine, proxied server-side)
- Stripe (paid plans)
- docx + jszip + jspdf (client-side .docx, EPUB 3, and print PDF; DejaVu Serif in `public/fonts` for PDF embedding)
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
  engine.ts                  # Client helper, scrub patterns, AI phrase scan
  exports.ts                 # .docx (OOXML), EPUB 3, print PDF builders
  voice-match.ts             # Stylometric sample-vs-manuscript score
  types.ts                   # ProjectData shape + defaults
  checkGenerationLimit.ts
  ai-config.ts               # Single model constant
  supabase/
scripts/check-exports.ts     # Export harness: builds samples, runs epubcheck
public/fonts/                # DejaVu Serif faces embedded into print PDFs
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
- Exports are generated client-side (no server file storage of manuscripts). `npm run check:exports` builds sample files through the real builders, asserts their structure, and runs epubcheck when it is available; the EPUB ships only epubcheck-clean.
- The AI phrase scan counts tracked phrases per 1,000 words. It is a tally of known tells, not an AI detector, and the UI says so.

Model used for generation is set in `lib/ai-config.ts`. Scrub patterns live in `lib/engine.ts`.

---

## Scripts

```bash
npm run dev          # next dev
npm run build        # production build
npm run lint         # next lint
npm run check:exports # build sample .docx/.epub/.pdf and validate (epubcheck)
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
- Cover designer (KDP resolution, embedded into the EPUB)
- Real exports: OOXML .docx with a Word TOC field, epubcheck-clean EPUB 3 with embedded cover, print PDF with embedded fonts, recto chapter starts, and running heads
- Stylometric voice-match score in the Publish pre-flight
- Story bible retry with a visible warning when the character canon cannot be built
- Editable plan review between outline and draft: correct chapters and character canon before prose runs, with a 30 minute auto-start fallback
- Story Bible codex (characters, locations, lore) injected as locked canon into every generation call
- Workshop: variant-based craft moves (Describe, Show, Twist, Next beat), three takes each
- Four interior themes across PDF/EPUB/.docx, drop caps and ornaments verified by the export harness
- Public before/after proof on the landing page with scores from the shipped voice match (85 strong vs 61 drifting)
- Landing page, pricing, and free → paid path
- Capacitor mobile scaffolding
- Generation usage tracking and plan limits

**Next**
- Series-level codex shared across projects
- More interior themes and ornament sets
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
