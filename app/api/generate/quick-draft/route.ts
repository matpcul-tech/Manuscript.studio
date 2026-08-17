import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { inngest } from '@/lib/inngest/client';
import { checkGenerationLimit, incrementGenerationCount } from '@/lib/checkGenerationLimit';

// Enqueue route for Quick Draft. Validates auth, checks monthly generation limit,
// creates the generation_jobs row, fires one Inngest event, and returns the job id.
export const runtime = 'nodejs';
export const maxDuration = 10;

function chapterCountFor(targetWords: number): number {
  if (targetWords <= 3000) return 1;
  if (targetWords <= 8000) return 3;
  if (targetWords <= 20000) return 5;
  if (targetWords <= 40000) return 8;
  if (targetWords <= 70000) return 12;
  return 18;
}

export async function POST(req: Request) {
  console.log('[quick-draft] POST', req.url);
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[quick-draft] 401 Unauthorized');
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH' }, { status: 401 });
    }

    const body = await req.json();
    const {
      projectId,
      quickPrompt,
      voiceSample,
      voiceProfile,
      voiceNotes,
      targetWords,
      mode,
      title,
      genre,
    } = body;

    if (!quickPrompt || typeof quickPrompt !== 'string' || quickPrompt.trim().length < 20) {
      return NextResponse.json(
        { error: 'Tell us a bit more about what you want to write.' },
        { status: 400 }
      );
    }
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    if (mode !== 'opening' && mode !== 'all') {
      return NextResponse.json({ error: 'mode must be "opening" or "all"' }, { status: 400 });
    }

    const limitCheck = await checkGenerationLimit(user.id, user.email);
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.message }, { status: 403 });
    }

    const words = Number(targetWords) || 60000;
    const chapterCount = chapterCountFor(words);

    const { data: job, error } = await supabase
      .from('generation_jobs')
      .insert({
        user_id: user.id,
        project_id: projectId,
        job_type: 'quick_draft',
        prompt_input: {
          quickPrompt: quickPrompt.slice(0, 8000),
          targetWords: words,
          chapterCount,
          mode,
          hasVoice: !!voiceSample,
        },
      })
      .select()
      .single();

    if (error || !job) {
      console.error('[quick-draft] DB insert failed:', error?.message);
      return NextResponse.json(
        { error: error?.message || 'Could not create job' },
        { status: 500 }
      );
    }

    await inngest.send({
      name: 'manuscript/generate.quick-draft',
      data: {
        jobId: job.id,
        userId: user.id,
        projectId,
        quickPrompt: quickPrompt.slice(0, 8000),
        voiceSample: voiceSample ? voiceSample.slice(0, 8000) : undefined,
        voiceProfile: voiceProfile ? voiceProfile.slice(0, 2000) : undefined,
        voiceNotes: voiceNotes ? voiceNotes.slice(0, 2000) : undefined,
        targetWords: words,
        chapterCount,
        mode,
        title,
        genre,
      },
    });

    await incrementGenerationCount(user.id);
    console.log('[quick-draft] 200 jobId:', job.id);
    return NextResponse.json({ jobId: job.id });
  } catch (err: any) {
    console.error('[quick-draft] unhandled error:', err?.message ?? err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Mark all active Quick Draft jobs for a project as failed so the client
// can reset and the user can start a fresh generation.
export async function DELETE(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized', code: 'AUTH' }, { status: 401 });

    const body = await req.json();
    const { projectId } = body;
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

    const admin = createAdminClient();
    await admin
      .from('generation_jobs')
      .update({ status: 'failed', error_message: 'Cancelled by user.' })
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .eq('job_type', 'quick_draft')
      .in('status', ['queued', 'running', 'streaming']);

    console.log('[quick-draft] DELETE cancelled active jobs for project', projectId);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[quick-draft] DELETE error:', err?.message ?? err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
