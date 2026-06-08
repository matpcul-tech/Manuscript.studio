import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// App Router reads raw body via req.text() -- no bodyParser config needed.
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const tier = session.metadata?.tier;
      if (!userId || !tier) break;
      await supabase
        .from('subscriptions')
        .update({
          plan: tier,
          status: 'active',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const { data } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', sub.customer as string)
        .single();
      if (!data) break;

      const priceId = sub.items.data[0]?.price.id;
      const plan =
        priceId === process.env.STRIPE_PRO_PRICE_ID ? 'pro' :
        priceId === process.env.STRIPE_STUDIO_PRICE_ID ? 'studio' : 'free';

      await supabase
        .from('subscriptions')
        .update({
          plan,
          status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', data.user_id);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const { data } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', sub.customer as string)
        .single();
      if (!data) break;
      await supabase
        .from('subscriptions')
        .update({
          plan: 'free',
          status: 'free',
          stripe_subscription_id: null,
          current_period_end: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', data.user_id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
