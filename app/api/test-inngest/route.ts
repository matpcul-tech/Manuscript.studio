import { NextResponse } from 'next/server';
import { inngest } from '@/lib/inngest/client';

// Temporary smoke-test route. GET fires a single test/ping event into Inngest
// and returns the event id. Watch the Inngest dashboard run history to confirm
// the worker picked it up, slept 2s, and returned the payload.
// Delete this route once the generation pipeline is fully migrated.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const message = url.searchParams.get('message') || 'hello from manuscript studio';

  // Diagnostic: confirm the env vars Inngest needs are actually present in
  // this deployment's environment scope. If you set the keys only on the
  // Production env in Vercel, preview deployments will be missing them and
  // inngest.send() will fail with Unauthorized from the event API.
  const env = {
    hasEventKey: !!process.env.INNGEST_EVENT_KEY,
    hasSigningKey: !!process.env.INNGEST_SIGNING_KEY,
    vercelEnv: process.env.VERCEL_ENV || 'unknown',
    nodeEnv: process.env.NODE_ENV,
  };

  try {
    const result = await inngest.send({
      name: 'test/ping',
      data: { message, firedAt: new Date().toISOString() },
    });
    return NextResponse.json({ enqueued: true, eventIds: result.ids, env });
  } catch (err: any) {
    return NextResponse.json(
      {
        enqueued: false,
        error: err?.message || String(err),
        cause: err?.cause ? String(err.cause) : undefined,
        env,
      },
      { status: 500 }
    );
  }
}
