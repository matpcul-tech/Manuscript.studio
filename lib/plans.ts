// Single source of truth for plan limits and website pricing copy.
// lib/checkGenerationLimit.ts enforces these numbers; billing and landing
// pages render them, so the copy always states what is enforced.

export type Plan = 'free' | 'pro' | 'studio';
export type Interval = 'month' | 'year';

// AI generations per rolling 30 days.
export const MONTHLY_LIMITS: Record<Plan, number> = { free: 20, pro: 150, studio: 500 };

// Whole-book drafts (Quick Draft, all chapters) per rolling 30 days.
// Counted separately, on top of normal generation usage.
export const WHOLE_BOOK_LIMITS: Record<Plan, number> = { free: 0, pro: 2, studio: 6 };

export const PRICES: Record<Exclude<Plan, 'free'>, Record<Interval, number>> = {
  pro: { month: 19, year: 190 },
  studio: { month: 39, year: 390 },
};

function draftsLine(plan: Plan): string {
  const n = WHOLE_BOOK_LIMITS[plan];
  if (n === 0) return 'Whole-book drafts on paid plans';
  return `${n} whole-book drafts per 30 days`;
}

export const PLAN_FEATURES: Record<Plan, string[]> = {
  free: [
    '1 project',
    '1 voice profile',
    `${MONTHLY_LIMITS.free} AI generations per 30 days`,
    'Export .docx and .txt',
    'No credit card required',
  ],
  pro: [
    `${MONTHLY_LIMITS.pro} AI generations per 30 days`,
    draftsLine('pro'),
    'Unlimited manuscripts',
    'Full Publishing Pack',
    'Title and Subtitle Generator',
    'All exports (.docx, .txt)',
    'Voice consistency check',
    'Sovereign Prose Validator',
  ],
  studio: [
    `${MONTHLY_LIMITS.studio} AI generations per 30 days`,
    draftsLine('studio'),
    'Unlimited manuscripts',
    'Everything in Pro',
    'Voice training upload',
    'Export All zip download',
    'Whole manuscript line edit',
    'Priority support',
    'AI cover backgrounds (coming soon)',
  ],
};

export function priceLabel(plan: Plan, interval: Interval): { price: string; sub: string; note?: string } {
  if (plan === 'free') return { price: '$0', sub: 'forever' };
  const p = PRICES[plan];
  if (interval === 'year') {
    return { price: `$${p.year}`, sub: 'per year', note: `$${(p.year / 12).toFixed(2)} a month, 2 months free` };
  }
  return { price: `$${p.month}`, sub: 'per month' };
}

// Server only: Stripe price IDs from env. Yearly is optional until set.
export function stripePriceId(plan: Exclude<Plan, 'free'>, interval: Interval): string | undefined {
  if (plan === 'pro') return interval === 'year' ? process.env.STRIPE_PRICE_PRO_YEARLY : process.env.STRIPE_PRO_PRICE_ID;
  return interval === 'year' ? process.env.STRIPE_PRICE_STUDIO_YEARLY : process.env.STRIPE_STUDIO_PRICE_ID;
}

export function yearlyAvailable(): boolean {
  return !!(process.env.STRIPE_PRICE_PRO_YEARLY && process.env.STRIPE_PRICE_STUDIO_YEARLY);
}

// Server only: map any known Stripe price to its plan tier (monthly or yearly).
export function planForPriceId(priceId: string | undefined | null): Plan | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRO_PRICE_ID || priceId === process.env.STRIPE_PRICE_PRO_YEARLY) return 'pro';
  if (priceId === process.env.STRIPE_STUDIO_PRICE_ID || priceId === process.env.STRIPE_PRICE_STUDIO_YEARLY) return 'studio';
  return null;
}
