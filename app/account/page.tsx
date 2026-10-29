'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('free');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push('/login?next=/account');
        return;
      }
      setEmail(data.user.email ?? '');
      const { data: sub } = await supabase.from('subscriptions').select('plan').eq('user_id', data.user.id).maybeSingle();
      if (sub?.plan) setPlan(sub.plan);
    });
  }, [router]);

  async function deleteAccount() {
    setBusy(true);
    setError('');
    const res = await fetch('/api/account/delete', { method: 'POST' });
    if (res.ok) {
      router.push('/delete-account?done=1');
      return;
    }
    const body = await res.json().catch(() => ({}));
    setError(body.error || 'Something went wrong.');
    setBusy(false);
  }

  return (
    <main className="max-w-xl mx-auto px-6 py-12">
      <Link href="/app" className="text-sm text-[var(--blue)] font-semibold">Back to projects</Link>
      <h1 className="font-display text-3xl font-bold mt-4 mb-6">Account</h1>

      <section className="bg-white border border-[var(--line)] rounded-xl p-6 mb-6">
        <div className="text-sm text-[var(--ink-3)]">Signed in as</div>
        <div className="font-semibold mb-3">{email}</div>
        <div className="text-sm text-[var(--ink-3)]">Plan</div>
        <div className="font-semibold capitalize">{plan}</div>
      </section>

      <section className="bg-white border border-red-200 rounded-xl p-6">
        <h2 className="font-semibold text-lg mb-2">Delete account</h2>
        <p className="text-sm text-[var(--ink-3)] mb-4 leading-relaxed">
          This permanently deletes your account, manuscripts, voice profiles, and usage history.
          Any active web subscription is canceled. This cannot be undone.
        </p>
        <label className="block text-sm mb-2">Type DELETE to confirm</label>
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full border border-[var(--line)] rounded-lg px-3 py-2 mb-4"
        />
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button
          onClick={deleteAccount}
          disabled={confirm !== 'DELETE' || busy}
          className="px-5 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-40"
        >
          {busy ? 'Deleting...' : 'Delete my account'}
        </button>
      </section>
    </main>
  );
}
