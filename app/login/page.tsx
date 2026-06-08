'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Mode = 'signin' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
    setPassword('');
    setConfirm('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/app');
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        if (data.session) {
          router.push('/app');
          router.refresh();
        } else {
          setAwaitingConfirm(true);
        }
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
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
            {awaitingConfirm ? (
              <>
                <div className="w-14 h-14 rounded-full bg-[var(--green-soft)] grid place-items-center mb-5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="3" className="w-7 h-7">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h1 className="font-display text-2xl font-bold mb-2">Check your email</h1>
                <p className="text-[var(--ink-3)] leading-relaxed">
                  We sent a confirmation link to <strong className="text-[var(--ink-2)]">{email}</strong>. Click it to activate your account.
                </p>
                <button
                  onClick={() => { setAwaitingConfirm(false); setEmail(''); setPassword(''); setConfirm(''); }}
                  className="mt-6 text-sm text-[var(--blue-deep)] font-semibold hover:underline"
                >
                  Use a different email
                </button>
              </>
            ) : (
              <>
                <div className="inline-flex p-1 bg-[var(--bg-3)] rounded-[10px] mb-7">
                  <button
                    onClick={() => switchMode('signin')}
                    className={`px-4 py-1.5 rounded-[7px] text-[13px] font-semibold transition ${mode === 'signin' ? 'bg-white text-[var(--blue-deep)] shadow-sm' : 'text-[var(--ink-3)] hover:text-[var(--ink)]'}`}
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => switchMode('signup')}
                    className={`px-4 py-1.5 rounded-[7px] text-[13px] font-semibold transition ${mode === 'signup' ? 'bg-white text-[var(--blue-deep)] shadow-sm' : 'text-[var(--ink-3)] hover:text-[var(--ink)]'}`}
                  >
                    Create account
                  </button>
                </div>

                <h1 className="font-display text-2xl font-bold mb-7">
                  {mode === 'signin' ? 'Welcome back' : 'Start writing'}
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--line)] focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15 outline-none text-[15px] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1.5">Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="8 characters minimum"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--line)] focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15 outline-none text-[15px] transition"
                    />
                  </div>

                  {mode === 'signup' && (
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
                  )}

                  {error && (
                    <div className="text-sm text-[var(--red)] bg-[var(--red-soft)] rounded-lg px-3 py-2">{error}</div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-lg bg-[var(--blue)] hover:bg-[var(--blue-deep)] disabled:bg-[var(--ink-4)] text-white font-semibold transition"
                  >
                    {loading
                      ? <span>Please wait<span className="dots"><span></span><span></span><span></span></span></span>
                      : mode === 'signin' ? 'Sign in' : 'Create account'}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-[var(--line-2)] text-xs text-[var(--ink-4)] text-center">
                  By signing in, you agree that your manuscripts remain yours. We never train on your work.
                </div>
              </>
            )}
          </div>
          <div className="text-center mt-6">
            <Link href="/" className="text-sm text-[var(--ink-3)] hover:text-[var(--ink)]">Back to home</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
