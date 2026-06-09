'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Project = {
  id: string;
  name: string;
  word_count: number;
  updated_at: string;
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [plan, setPlan] = useState<'free' | 'pro' | 'studio'>('free');
  const upgraded = searchParams.get('upgraded') === 'true';

  useEffect(() => {
    loadProjects();
    loadUser();
  }, []);

  async function loadUser() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserEmail(user.email || '');
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .single();
    setPlan((sub?.plan as any) || 'free');
  }

  async function loadProjects() {
    try {
      const r = await fetch('/api/projects');
      const data = await r.json();
      setProjects(data.projects || []);
    } catch (e) {}
    setLoading(false);
  }

  async function createProject() {
    setCreating(true);
    try {
      const r = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Untitled Project' }),
      });
      const data = await r.json();
      if (data.project) router.push(`/app/project/${data.project.id}`);
    } catch (e) {
      alert('Could not create project.');
    } finally {
      setCreating(false);
    }
  }

  async function deleteProject(id: string) {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    loadProjects();
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  function fmtDate(s: string) {
    const d = new Date(s);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <main className="min-h-screen bg-[var(--bg-2)]">
      <nav className="h-16 bg-white border-b border-[var(--line)] flex items-center px-6">
        <Link href="/app" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[var(--blue)] to-[var(--blue-deep)] grid place-items-center text-white font-display font-bold text-[19px]">M</div>
          <span className="font-bold text-[16px] tracking-tight">Manuscript Studio</span>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-[var(--ink-3)] hidden sm:block">{userEmail}</span>
          <Link href="/billing" className="text-sm text-[var(--ink-2)] hover:text-[var(--ink)] px-3 py-2 rounded-lg hover:bg-[var(--bg-3)]">Billing</Link>
          <button onClick={signOut} className="text-sm text-[var(--ink-2)] hover:text-[var(--ink)] px-3 py-2 rounded-lg hover:bg-[var(--bg-3)]">Sign out</button>
        </div>
      </nav>

      {upgraded && (
        <div className="bg-[var(--green)] text-white text-sm font-semibold text-center py-3 px-6">
          Your plan has been upgraded. Welcome to the next level.
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1">Your projects</h1>
            <p className="text-[var(--ink-3)]">Pick up where you left off, or start something new.</p>
          </div>
          {plan === 'free' && projects.length >= 1 ? (
            <Link
              href="/billing"
              className="px-5 py-2.5 rounded-lg bg-[var(--amber)] hover:opacity-90 text-white font-semibold shadow-sm transition flex items-center gap-2 text-sm"
            >
              Upgrade for more projects
            </Link>
          ) : (
            <button
              onClick={createProject}
              disabled={creating}
              className="px-5 py-2.5 rounded-lg bg-[var(--blue)] hover:bg-[var(--blue-deep)] text-white font-semibold shadow-sm transition flex items-center gap-2 disabled:opacity-60"
            >
              {creating ? (
                <span>Creating<span className="dots"><span></span><span></span><span></span></span></span>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  New project
                </>
              )}
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 text-[var(--ink-3)]">Loading<span className="dots"><span></span><span></span><span></span></span></div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-[var(--line)] p-16 text-center">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="font-display text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-[var(--ink-3)] mb-6 max-w-md mx-auto">Create your first manuscript project. Set up the book, train your voice, write your draft, design a cover, and export KDP-ready files.</p>
            <button
              onClick={createProject}
              disabled={creating}
              className="px-6 py-2.5 rounded-lg bg-[var(--blue)] hover:bg-[var(--blue-deep)] text-white font-semibold transition"
            >
              {creating ? 'Creating...' : 'Create your first project'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-[var(--line)] hover:border-[var(--blue)]/40 hover:shadow-[var(--shadow-md)] transition group">
                <Link href={`/app/project/${p.id}`} className="block p-5">
                  <div className="font-display text-lg font-semibold mb-1 group-hover:text-[var(--blue-deep)] transition truncate">{p.name}</div>
                  <div className="text-xs text-[var(--ink-3)] mb-4 font-mono">
                    <b className="text-[var(--ink-2)]">{p.word_count.toLocaleString()}</b> words · updated {fmtDate(p.updated_at)}
                  </div>
                </Link>
                <div className="px-5 pb-4 flex items-center justify-between">
                  <Link href={`/app/project/${p.id}`} className="text-xs font-semibold text-[var(--blue-deep)] hover:underline">Open →</Link>
                  <button
                    onClick={() => deleteProject(p.id)}
                    className="text-xs text-[var(--ink-4)] hover:text-[var(--red)]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
