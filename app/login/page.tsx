'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useInAppBrowser } from '@/lib/useInAppBrowser';

type Mode = 'signin' | 'signup' | 'reset';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const isInApp = useInAppBrowser();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Pre-select signup tab when arriving with ?signup=1 (e.g. from /start).
  // Also surface the callback error message here rather than a blank screen.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('signup') === '1') setMode('signup');
    if (params.get('error') === 'callback') {
      setError('Sign-in link expired or already used. Please try again.');
    }
  }, []);

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
    setNotice('');
    setPassword('');
    setConfirm('');
  }

  async function signInWithGoogle() {
    setGoogleLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message || 'Google sign-in failed. Use email and password below.');
      setGoogleLoading(false);
    }
    // On success the browser navigates away; no cleanup needed.
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    const supabase = createClient();

    if (mode === 'reset') {
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/set-password`,
        });
        if (error) throw error;
        setNotice('Password reset link sent. Check your email.');
      } catch (e: any) {
        setError(e.message || 'Could not send reset link.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
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
          setNotice('Check your email for a confirmation link to activate your account.');
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

            {/* In-app browser warning -- Google OAuth can be blocked inside FB/IG/TikTok */}
            {isInApp && (
              <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 leading-snug">
                <span className="font-semibold">Open in your browser</span> for the smoothest signup. Google sign-in may be blocked inside social apps. Email and password always works.
              </div>
            )}

            {mode !== 'reset' && (
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
            )}

            <h1 className="font-display text-2xl font-bold mb-7">
              {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Start writing' : 'Reset password'}
            </h1>

            {/* Google sign-in -- only shown in signin and signup modes */}
            {mode !== 'reset' && (
              <>
                <button
                  onClick={signInWithGoogle}
                  disabled={googleLoading || loading}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-[var(--line)] bg-white hover:bg-[var(--bg-2)] text-[var(--ink)] text-[15px] font-semibold transition disabled:opacity-50"
                >
                  <GoogleIcon />
                  {googleLoading ? 'Redirecting...' : 'Continue with Google'}
                </button>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--line)]" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-xs text-[var(--ink-4)] font-medium">or</span>
                  </div>
                </div>
              </>
            )}

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

              {mode !== 'reset' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[var(--ink-2)]">Password</label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => switchMode('reset')}
                        className="text-xs text-[var(--blue-deep)] font-medium hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="8 characters minimum"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--line)] focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/15 outline-none text-[15px] transition"
                  />
                </div>
              )}

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
              {notice && (
                <div className="text-sm text-[var(--green)] bg-[var(--green-soft)] rounded-lg px-3 py-2">{notice}</div>
              )}

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full py-3 rounded-lg bg-[var(--blue)] hover:bg-[var(--blue-deep)] disabled:bg-[var(--ink-4)] text-white font-semibold transition"
              >
                {loading
                  ? <span>Please wait<span className="dots"><span></span><span></span><span></span></span></span>
                  : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
              </button>

              {mode === 'reset' && (
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="w-full text-sm text-[var(--ink-3)] hover:text-[var(--ink)] font-medium"
                >
                  Back to sign in
                </button>
              )}
            </form>

            <div className="mt-6 pt-6 border-t border-[var(--line-2)] text-xs text-[var(--ink-4)] text-center">
              By signing in, you agree that your manuscripts remain yours. We never train on your work.
            </div>
          </div>
          <div className="text-center mt-6">
            <Link href="/" className="text-sm text-[var(--ink-3)] hover:text-[var(--ink)]">Back to home</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
