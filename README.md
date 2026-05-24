# Manuscript Studio

Production-ready voice-trained manuscript writer with KDP export. One pipeline: Setup → Voice → Write → Edit → Cover → Publish.

## Stack

- Next.js 14 (App Router)
- Supabase (auth + project storage)
- Anthropic Claude API (writing engine)
- Stripe (paywall, optional for launch)
- Tailwind CSS (styling)
- Deployed to Vercel

Same pattern as Sovereign Health OS and CareIQ.

---

## Deploy tonight in 30 minutes

### 1. Clone and install (2 min)

```bash
cd manuscript-studio
npm install
```

### 2. Create Supabase project (5 min)

Go to supabase.com, create a new project named `manuscript-studio`. Once it's ready:

1. Copy your **Project URL** and **anon key** from Project Settings → API
2. In Authentication → Providers, enable **Email** with **Magic Link**
3. In Authentication → URL Configuration, add your Vercel URL (e.g. `https://manuscript-studio.vercel.app`) to Site URL and Redirect URLs
4. Run the SQL in `supabase/schema.sql` (paste it in the SQL Editor and run)

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

## What works tonight

- Magic link auth via Supabase
- Project save/load from database (per user)
- Voice training with profile distillation
- Manuscript writing with voice-locked engine
- Edit pass (scrub, line edit, consistency, pacing)
- Cover designer with download
- Export .docx, .epub, print PDF
- All Claude calls proxied through `/api/engine` so the key stays server-side
- Landing page at `/` for marketing

## What ships in Phase 2 (next week)

- Stripe paywall on exports
- AI-generated cover backgrounds
- Spine and back cover for paperback
- Undo history and draft snapshots
- Queue system for long jobs
