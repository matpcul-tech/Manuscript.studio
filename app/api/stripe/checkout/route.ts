import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripePriceId, type Interval } from '@/lib/plans';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { tier, interval: rawInterval } = await req.json();
    if (tier !== 'pro' && tier !== 'studio') {
      return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });
    }
    const interval: Interval = rawInterval === 'year' ? 'year' : 'month';
    const priceId = stripePriceId(tier, interval);

    if (!priceId) {
      return NextResponse.json({ error: interval === 'year' ? 'Yearly billing is not available yet.' : `Missing Stripe price ID for tier: ${tier}` }, { status: 400 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable');
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
      const { error: upsertError } = await admin
        .from('subscriptions')
        .upsert(
          { user_id: user.id, stripe_customer_id: customerId },
          { onConflict: 'user_id' }
        );
      if (upsertError) console.error('Failed to save stripe_customer_id:', upsertError);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${req.nextUrl.origin}/app?upgraded=true`,
      cancel_url: `${req.nextUrl.origin}/billing`,
      metadata: { userId: user.id, tier, interval },
      subscription_data: { metadata: { userId: user.id, tier, interval } },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout error:', err.message, { type: err.type, code: err.code });
    return NextResponse.json({ error: err.message || 'Stripe checkout failed' }, { status: 500 });
  }
}
