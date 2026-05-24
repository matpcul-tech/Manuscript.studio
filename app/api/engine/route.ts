import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const maxDuration = 300;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const HARD_RULES = `RULES - never violate:
- NEVER use em dashes ( — ) or en dashes ( – ). Use period, comma, or semicolon.
- Forbidden: "it's worth noting", "in conclusion", "ultimately,", "indeed,", "moreover,", "furthermore,", "additionally,", "at its core", "in a world where", "stands as a testament", "the realm of", "tapestry", "delve into", "navigate the", "ever-evolving", "unlock", "unleash", "robust", "seamless", "elevate".
- No "not just X but Y". No "this isn't just A, it's B". No "more than ever before".
- No tricolons climbing to abstract nouns.
- No throat-clearing. Start at the first real sentence.
- Concrete over abstract. Vary sentence length. Trust the reader.
- Never frame output. No "Here is the scene." Return only the prose.`;

function buildSystem(task: string, voiceSample?: string, voiceProfile?: string, voiceNotes?: string) {
  let voice = '';
  if (voiceSample) {
    voice = `VOICE SAMPLE - match cadence, sentence length, word choice, rhythm:\n---\n${voiceSample.slice(0, 8000)}\n---`;
    if (voiceProfile) voice += `\nVOICE PROFILE:\n${voiceProfile}`;
    if (voiceNotes) voice += `\nWRITER'S OWN STYLE NOTES (honor these):\n${voiceNotes}`;
  } else {
    voice = `Write clean, direct prose. Short sentences carry weight. Concrete over abstract. Never sound like a chatbot.`;
  }
  return `You are a manuscript writer producing prose for a long-form book. Nothing should reveal that it came from a language model.\n\n${voice}\n\n${HARD_RULES}\n\n${task}\n\nOutput ONLY the prose. No headings, no preamble, no closing remarks, no markdown.`;
}

function autoScrub(text: string): string {
  return text
    .replace(/—/g, ', ')
    .replace(/ – /g, ', ')
    .replace(/–/g, '-')
    .replace(/^\s*Here(?:\s+is|'s)[^.\n]*\.\s*/i, '')
    .replace(/\n\s*Here(?:\s+is|'s)[^.\n]*\.\s*/i, '\n');
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      task,
      userPrompt,
      voiceSample,
      voiceProfile,
      voiceNotes,
      systemOverride,
      maxTokens = 1800,
    } = body;

    if (!userPrompt) {
      return NextResponse.json({ error: 'Missing userPrompt' }, { status: 400 });
    }

    // Fair-use throttling: cap calls per user per day
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { data: usageRows } = await supabase
      .from('engine_usage')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', startOfDay.toISOString());

    // Free tier: 30 calls/day. Adjust based on subscription.
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .single();

    const plan = sub?.plan || 'free';
    const dailyCap = plan === 'pro' ? 500 : plan === 'studio' ? 2000 : 30;

    if (usageRows && usageRows.length >= dailyCap) {
      return NextResponse.json({
        error: 'Daily limit reached',
        message: `You have used ${usageRows.length} of ${dailyCap} engine calls today. Upgrade for more.`,
      }, { status: 429 });
    }

    const systemPrompt = systemOverride
      ? systemOverride
      : buildSystem(task || '', voiceSample, voiceProfile, voiceNotes);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: Math.min(maxTokens, 4000),
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n')
      .trim();

    const cleaned = autoScrub(text);

    // Log usage
    await supabase.from('engine_usage').insert({
      user_id: user.id,
      task: task || 'unknown',
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
    });

    return NextResponse.json({
      text: cleaned,
      usage: response.usage,
    });
  } catch (e: any) {
    console.error('Engine error:', e);
    return NextResponse.json({ error: e.message || 'Engine failed' }, { status: 500 });
  }
}
