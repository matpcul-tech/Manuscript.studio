'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      setError(e.message || 'Could not send link.');
    } finally {
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
            {sent ? (
              <>
                <div className="w-14 h-14 rounded-full bg-[var(--green-soft)] grid place-items-center mb-5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="3" className="w-7 h-7">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h1 className="font-display text-2xl font-bold mb-2">Check your email</h1>
                <p className="text-[var(--ink-3)] leading-relaxed">
                  We sent a sign-in link to <strong className="text-[var(--ink-2)]">{email}</strong>. Click it and you're in.
                </p>
                <button
                  onClick={() => { setSent(false); setEmail(''); }}
                  className="mt-6 text-sm text-[var(--blue-deep)] font-semibold hover:underline"
                >
                  Use a different email
                </button>
              </>
            ) : (
              <>
                <h1 className="font-display text-2xl font-bold mb-2">Sign in</h1>
                <p className="text-[var(--ink-3)] mb-7 leading-relaxed">
                  Enter your email. We'll send a magic link. No password required.
                </p>
                <form onSubmit={handleLogin}>
                  <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--line)] focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15 outline-none text-[15px] mb-4 transition"
                  />
                  {error && (
                    <div className="text-sm text-[var(--red)] bg-[var(--red-soft)] rounded-lg px-3 py-2 mb-4">{error}</div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-lg bg-[var(--blue)] hover:bg-[var(--blue-deep)] disabled:bg-[var(--ink-4)] text-white font-semibold transition"
                  >
                    {loading ? (
                      <span>Sending<span className="dots"><span></span><span></span><span></span></span></span>
                    ) : 'Send magic link'}
                  </button>
                </form>
                <div className="mt-6 pt-6 border-t border-[var(--line-2)] text-xs text-[var(--ink-4)] text-center">
                  By signing in, you agree that your manuscripts remain yours. We never train on your work.
                </div>
              </>
            )}
          </div>
          <div className="text-center mt-6">
            <Link href="/" className="text-sm text-[var(--ink-3)] hover:text-[var(--ink)]">← Back to home</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
