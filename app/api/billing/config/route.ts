import { NextResponse } from 'next/server';
import { yearlyAvailable } from '@/lib/plans';

export const dynamic = 'force-dynamic';

// Public: tells the website whether yearly checkout is configured.
export async function GET() {
  return NextResponse.json({ yearly: yearlyAvailable() });
}
