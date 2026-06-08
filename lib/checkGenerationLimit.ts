import { createAdminClient } from '@/lib/supabase/admin';

type Plan = 'free' | 'pro' | 'studio';

const MONTHLY_LIMITS: Record<Plan, number> = { free: 3, pro: 150, studio: 500 };

export async function checkGenerationLimit(userId: string): Promise<{ allowed: boolean; message?: string }> {
  const admin = createAdminClient();

  const { data: sub } = await admin
    .from('subscriptions')
    .select('plan, generation_count, generation_reset_date')
    .eq('user_id', userId)
    .single();

  if (!sub) {
    await admin.from('subscriptions').upsert(
      { user_id: userId, plan: 'free', generation_count: 0, generation_reset_date: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
    return { allowed: true };
  }

  const plan = (sub.plan as Plan) || 'free';
  const limit = MONTHLY_LIMITS[plan];
  const resetDate = sub.generation_reset_date ? new Date(sub.generation_reset_date) : new Date();
  const daysSinceReset = (Date.now() - resetDate.getTime()) / 86400000;

  if (daysSinceReset >= 30) {
    await admin.from('subscriptions')
      .update({ generation_count: 0, generation_reset_date: new Date().toISOString() })
      .eq('user_id', userId);
    return { allowed: true };
  }

  const count = sub.generation_count ?? 0;
  if (count >= limit) {
    return {
      allowed: false,
      message: 'You have reached your monthly generation limit. Upgrade to continue.',
    };
  }

  return { allowed: true };
}

export async function incrementGenerationCount(userId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.rpc('increment_generation_count', { uid: userId });
}
