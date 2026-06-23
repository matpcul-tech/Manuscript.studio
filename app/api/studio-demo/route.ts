import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_MODEL } from '@/lib/ai-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// In-memory rate limit: 30 calls per IP per hour (5 full demo runs x 6 passes).
// Best-effort in serverless -- no cross-instance coordination needed for a demo.
const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = 30;
const ipCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    ipCounts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= LIMIT) return false;
  entry.count++;
  return true;
}

const PASSES = ['draft', 'detect', 'edit', 'voice', 'pacing', 'somatic'] as const;
type Pass = (typeof PASSES)[number];

function buildPrompt(pass: Pass, text: string): { system: string; user: string } {
  const t = text.slice(0, 1200);
  switch (pass) {
    case 'draft':
      return {
        system: `You are a literary novelist. Given the SEED below, write a single paragraph (120-150 words) of gripping, human opening prose. No clichés. No filter words. No AI tells. No em dashes. Output only the paragraph.`,
        user: `SEED: ${t}`,
      };
    case 'detect':
      return {
        system: `You are a publishing-quality AI-detection engine. Analyze the PARAGRAPH for tells that mark it as AI-generated. Return strict JSON only, no markdown fences:\n{"tells":["quoted phrase"],"grade":"A","headline":"one sentence verdict","clean":"paragraph with tells removed"}\nGrade A = very human. B = mostly human. C = noticeable AI patterns. D = clearly AI.`,
        user: `PARAGRAPH:\n${t}`,
      };
    case 'edit':
      return {
        system: `You are a line editor for literary fiction. Find up to 4 phrases to cut or tighten. Return strict JSON only, no markdown fences:\n{"edits":[{"original":"...","revision":"...","reason":"..."}],"note":"one overall sentence"}`,
        user: `PARAGRAPH:\n${t}`,
      };
    case 'voice':
      return {
        system: `You are a voice-consistency critic. Find up to 3 phrases that feel generic or off-voice. Return strict JSON only, no markdown fences:\n{"findings":[{"phrase":"...","fix":"..."}]}`,
        user: `PARAGRAPH:\n${t}`,
      };
    case 'pacing':
      return {
        system: `You are a pacing analyst for literary fiction. Assess sentence rhythm and narrative momentum. Return strict JSON only, no markdown fences:\n{"read":"brief 1-2 sentence assessment","findings":[{"phrase":"...","fix":"..."}]}`,
        user: `PARAGRAPH:\n${t}`,
      };
    case 'somatic':
      return {
        system: `You are a somatic interiority specialist. Score how grounded the writing is in the character's body and physical sensation (0-100). Return strict JSON only, no markdown fences:\n{"score":75,"read":"brief 1-2 sentence assessment","lift":"rewritten paragraph with stronger body-based anchoring"}`,
        user: `PARAGRAPH:\n${t}`,
      };
  }
}

export async function POST(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Demo limit reached. You have run 5 full demos this hour. Sign up for unlimited access.' },
      { status: 429 },
    );
  }

  let body: { pass: string; text: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { pass, text } = body;

  if (!PASSES.includes(pass as Pass) || typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { system, user } = buildPrompt(pass as Pass, text);

  try {
    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1000,
      system,
      messages: [{ role: 'user', content: user }],
    });

    const raw = response.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('')
      .trim();

    if (pass === 'draft') {
      return NextResponse.json({ paragraph: raw });
    }

    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    try {
      return NextResponse.json(JSON.parse(cleaned));
    } catch {
      return NextResponse.json({ raw });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'AI call failed' }, { status: 500 });
  }
}
