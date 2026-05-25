import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { inngest } from '@/lib/inngest/client';

// Enqueue route for Quick Draft. Validates auth, applies the same daily cap
// the engine route uses, creates the generation_jobs row, fires one Inngest
// event, and returns the job id. Never blocks on Anthropic.
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
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

  // Same daily cap pattern as /api/engine for now. Replace with a proper
  // rate limiter (Upstash sliding window) in a later slice.
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { data: usageRows } = await supabase
    .from('engine_usage')
    .select('id')
    .eq('user_id', user.id)
    .gte('created_at', startOfDay.toISOString());
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', user.id)
    .single();
  const plan = sub?.plan || 'free';
  const dailyCap = plan === 'pro' ? 500 : plan === 'studio' ? 2000 : 30;
  if (usageRows && usageRows.length >= dailyCap) {
    return NextResponse.json(
      {
        error: 'Daily limit reached',
        message: `You have used ${usageRows.length} of ${dailyCap} engine calls today. Upgrade for more.`,
      },
      { status: 429 }
    );
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
      quickPrompt,
      voiceSample,
      voiceProfile,
      voiceNotes,
      targetWords: words,
      chapterCount,
      mode,
      title,
      genre,
    },
  });

  return NextResponse.json({ jobId: job.id });
}
