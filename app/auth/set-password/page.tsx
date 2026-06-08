'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push('/app');
      router.refresh();
    } catch (e: any) {
      setError(e.message || 'Could not set password.');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-[var(--bg-2)]">
      <nav className="h-16 bg-white border-b border-[var(--line)] flex items-center px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[var(--blue)] to-[var(--blue-deep)] grid place-items-center text-white font-display font-bold text-[19px]">M</div>
          <span className="font-bold text-[16px] tracking-tight">Manuscript Studio</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-[var(--line)] shadow-[var(--shadow-md)] p-9">
            <h1 className="font-display text-2xl font-bold mb-2">Set your password</h1>
            <p className="text-sm text-[var(--ink-3)] mb-7">Choose a password for your account.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1.5">New password</label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="8 characters minimum"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--line)] focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15 outline-none text-[15px] transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1.5">Confirm password</label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Same password again"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--line)] focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15 outline-none text-[15px] transition"
                />
              </div>

              {error && (
                <div className="text-sm text-[var(--red)] bg-[var(--red-soft)] rounded-lg px-3 py-2">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-[var(--blue)] hover:bg-[var(--blue-deep)] disabled:bg-[var(--ink-4)] text-white font-semibold transition"
              >
                {loading ? 'Saving...' : 'Set password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
