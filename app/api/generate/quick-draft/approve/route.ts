import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { inngest } from '@/lib/inngest/client';

// Approves a Quick Draft plan that is paused in review. Validates that the
// job belongs to the caller and is actually awaiting review, then fires the
// event the worker's waitForEvent step is matched on. The payload may carry
// an edited outline and story bible; the worker sanitizes shapes and lengths
// before using them, so this route only guards ownership, state, and size.
export const runtime = 'nodejs';
export const maxDuration = 10;

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized', code: 'AUTH' }, { status: 401 });

    const body = await req.json();
    const { jobId, outline, storyBible } = body || {};
    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }
    if (JSON.stringify(body).length > 200_000) {
      return NextResponse.json({ error: 'Plan payload too large.' }, { status: 413 });
    }

    const { data: job } = await supabase
      .from('generation_jobs')
      .select('id, status, job_type')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (!job || job.job_type !== 'quick_draft') {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }
    if (job.status !== 'awaiting_review') {
      // Already resumed (timeout or a second tab). Treat as success so the
      // client stops showing the review card.
      return NextResponse.json({ ok: true, alreadyResumed: true });
    }

    await inngest.send({
      name: 'manuscript/plan.approved',
      data: { jobId, outline: outline ?? null, storyBible: storyBible ?? null },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[quick-draft/approve] error:', err?.message ?? err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
