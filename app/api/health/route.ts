import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_MODEL } from '@/lib/ai-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const start = Date.now();
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 5,
      messages: [{ role: 'user', content: 'ping' }],
    });
    return NextResponse.json({
      status: 'ok',
      model: ANTHROPIC_MODEL,
      latency_ms: Date.now() - start,
    });
  } catch (e: any) {
    return NextResponse.json({
      status: 'error',
      model: ANTHROPIC_MODEL,
      error: e?.message ?? 'unknown',
      latency_ms: Date.now() - start,
    }, { status: 503 });
  }
}
