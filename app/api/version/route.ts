import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const version =
    process.env.NEXT_PUBLIC_BUILD_ID ||
    process.env.VERCEL_DEPLOYMENT_ID ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    'dev';

  return NextResponse.json({ version });
}
