import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Permanently deletes the signed-in user's account.
// Projects, voice profiles, usage rows, and the subscription row are removed by
// ON DELETE CASCADE on auth.users. An active Stripe subscription is canceled
// first so a deleted account is never billed again.
export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const admin = createAdminClient();

    const { data: sub } = await admin
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (sub?.stripe_subscription_id && process.env.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      try {
        await stripe.subscriptions.cancel(sub.stripe_subscription_id);
      } catch (err: any) {
        // Already canceled subscriptions are fine. Anything else stops the deletion.
        if (err?.code !== 'resource_missing') throw err;
      }
    }

    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;

    await supabase.auth.signOut();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Account deletion failed', err);
    return NextResponse.json({ error: 'Account deletion failed. Contact support.' }, { status: 500 });
  }
}
