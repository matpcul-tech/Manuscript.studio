import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_IDS: Record<string, string | undefined> = {
  pro: process.env.STRIPE_PRO_PRICE_ID,
  studio: process.env.STRIPE_STUDIO_PRICE_ID,
};

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { tier } = await req.json();
  const priceId = PRICE_IDS[tier];
  if (!priceId) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  let customerId = sub?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await admin
      .from('subscriptions')
      .update({ stripe_customer_id: customerId })
      .eq('user_id', user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${req.nextUrl.origin}/app?upgraded=true`,
    cancel_url: `${req.nextUrl.origin}/billing`,
    metadata: { userId: user.id, tier },
  });

  return NextResponse.json({ url: session.url });
}
