import { NextResponse } from 'next/server';
import { inngest } from '@/lib/inngest/client';

// Temporary smoke-test route. GET fires a single test/ping event into Inngest
// and returns the event id. Watch the Inngest dashboard run history to confirm
// the worker picked it up, slept 2s, and returned the payload.
// Delete this route once the generation pipeline is fully migrated.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const message = url.searchParams.get('message') || 'hello from manuscript studio';
  const result = await inngest.send({
    name: 'test/ping',
    data: { message, firedAt: new Date().toISOString() },
  });
  return NextResponse.json({ enqueued: true, eventIds: result.ids });
}
