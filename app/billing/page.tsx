'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Sub = {
  plan: string;
  status: string;
  current_period_end: string | null;
};

const PLANS = [
  {
    tier: 'pro',
    name: 'Pro',
    price: '$19',
    sub: 'per month',
    badge: 'Most popular',
    items: [
      '150 AI generations per month',
      'Unlimited manuscripts',
      'Full Publishing Pack',
      'Title and Subtitle Generator',
      'All exports (.docx, .txt)',
      'Voice consistency check',
      'Sovereign Prose Validator',
    ],
  },
  {
    tier: 'studio',
    name: 'Studio',
    price: '$39',
    sub: 'per month',
    items: [
      '500 AI generations per month',
      'Unlimited manuscripts',
      'Everything in Pro',
      'Voice training upload',
      'Export All zip download',
      'Whole manuscript line edit',
      'Priority support',
      'AI cover backgrounds (coming soon)',
    ],
  },
];

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  studio: 'Studio',
};

export default function BillingPage() {
  const router = useRouter();
  const [sub, setSub] = useState<Sub | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }
        const { data, error } = await supabase
          .from('subscriptions')
          .select('plan, status, current_period_end')
          .eq('user_id', user.id)
          .single();
        // PGRST116 = no row found, expected for new users -- silently default to free
        if (error && error.code !== 'PGRST116') {
          console.error('Subscription fetch error:', error);
        }
        setSub(data ?? { plan: 'free', status: 'free', current_period_end: null });
      } catch (e) {
        console.error('Billing load error:', e);
        setSub({ plan: 'free', status: 'free', current_period_end: null });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function startCheckout(tier: string) {
    setActionLoading(tier);
    setError('');
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error || 'Could not start checkout.');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setActionLoading('');
    }
  }

  async function openPortal() {
    setActionLoading('portal');
    setError('');
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error || 'Could not open billing portal.');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setActionLoading('');
    }
  }

  function fmtDate(s: string) {
    return new Date(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  const isPaid = sub?.plan === 'pro' || sub?.plan === 'studio';

  return (
    <main className="min-h-screen bg-[var(--bg-2)]">
      <nav className="h-16 bg-white border-b border-[var(--line)] flex items-center px-6">
        <Link href="/app" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[var(--blue)] to-[var(--blue-deep)] grid place-items-center text-white font-display font-bold text-[19px]">M</div>
          <span className="font-bold text-[16px] tracking-tight">Manuscript Studio</span>
        </Link>
        <Link href="/app" className="ml-auto text-sm text-[var(--ink-3)] hover:text-[var(--ink)] px-3 py-2 rounded-lg hover:bg-[var(--bg-3)]">Back to projects</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-bold mb-1">Billing</h1>
        <p className="text-[var(--ink-3)] mb-10">Manage your plan and payment method.</p>

        {loading ? (
          <div className="text-[var(--ink-3)]">Loading<span className="dots"><span></span><span></span><span></span></span></div>
        ) : (
          <>
            {/* Current plan */}
            <div className="bg-white rounded-2xl border border-[var(--line)] p-7 mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="text-xs font-bold tracking-wider text-[var(--ink-4)] uppercase mb-1">Current plan</div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-2xl font-bold">{PLAN_LABELS[sub?.plan ?? 'free']}</span>
                    {isPaid && (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--green-soft)] text-[var(--green)] text-xs font-semibold">Active</span>
                    )}
                  </div>
                  {isPaid && sub?.current_period_end && (
                    <div className="text-sm text-[var(--ink-3)] mt-1">
                      Next billing date: <strong className="text-[var(--ink-2)]">{fmtDate(sub.current_period_end)}</strong>
                    </div>
                  )}
                </div>
                {isPaid && (
                  <button
                    onClick={openPortal}
                    disabled={actionLoading === 'portal'}
                    className="px-5 py-2.5 rounded-lg border border-[var(--line)] text-sm font-semibold text-[var(--ink-2)] hover:border-[var(--blue)] hover:text-[var(--blue-deep)] transition disabled:opacity-50"
                  >
                    {actionLoading === 'portal' ? 'Loading...' : 'Manage subscription'}
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="text-sm text-[var(--red)] bg-[var(--red-soft)] rounded-lg px-4 py-3 mb-6">{error}</div>
            )}

            {/* Free plan summary -- shown when on free plan */}
            {!isPaid && (
              <div className="bg-[var(--bg-3)] rounded-2xl border border-[var(--line)] p-6 mb-6">
                <div className="text-xs font-bold tracking-wider text-[var(--ink-4)] uppercase mb-2">Free plan includes</div>
                <ul className="space-y-1.5">
                  {['3 AI generations per month', '3 manuscripts', 'Quick Draft (limited)', 'KDP Launch Walkthrough', 'Basic structure check'].map(it => (
                    <li key={it} className="text-sm text-[var(--ink-2)] flex items-start gap-2">
                      <span className="text-[var(--green)] font-bold mt-0.5 flex-shrink-0">&#10003;</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Upgrade options -- only shown for free users */}
            {!isPaid && (
              <>
                <div className="text-sm font-semibold text-[var(--ink-3)] mb-4">Upgrade your plan</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {PLANS.map(plan => (
                    <div key={plan.tier} className={`relative p-7 rounded-2xl border-2 bg-white ${plan.tier === 'pro' ? 'border-[var(--blue)] shadow-[var(--shadow-lg)]' : 'border-[var(--line)]'}`}>
                      {plan.tier === 'pro' && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[var(--blue)] text-white text-[11px] font-bold tracking-wider uppercase">Most popular</div>
                      )}
                      <div className="font-display text-xl font-bold mb-1">{plan.name}</div>
                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="font-display text-4xl font-bold">{plan.price}</span>
                        <span className="text-sm text-[var(--ink-3)]">/ {plan.sub}</span>
                      </div>
                      <ul className="space-y-2 mb-6">
                        {plan.items.map(it => (
                          <li key={it} className="text-sm text-[var(--ink-2)] flex items-start gap-2">
                            <span className="text-[var(--green)] font-bold mt-0.5 flex-shrink-0">&#10003;</span>
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => startCheckout(plan.tier)}
                        disabled={!!actionLoading}
                        className={`w-full py-2.5 rounded-lg font-semibold text-sm transition disabled:opacity-50 ${plan.tier === 'pro' ? 'bg-[var(--blue)] hover:bg-[var(--blue-deep)] text-white shadow-[0_4px_14px_rgba(79,109,245,0.4)]' : 'bg-white border border-[var(--line)] text-[var(--ink-2)] hover:border-[var(--blue)] hover:text-[var(--blue-deep)]'}`}
                      >
                        {actionLoading === plan.tier ? 'Loading...' : `Upgrade to ${plan.name}`}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
