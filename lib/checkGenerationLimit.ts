import { createAdminClient } from '@/lib/supabase/admin';

import { MONTHLY_LIMITS, WHOLE_BOOK_LIMITS, type Plan } from '@/lib/plans';

// Owner accounts bypass the generation limit entirely. Comma-separated list,
// overridable via env without a code change.
const FOUNDER_EMAILS = (process.env.FOUNDER_EMAILS || 'matpcul@gmail.com')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export async function checkGenerationLimit(userId: string, email?: string | null): Promise<{ allowed: boolean; message?: string }> {
  const admin = createAdminClient();

  if (email && FOUNDER_EMAILS.includes(email.toLowerCase())) {
    // Keep the founder's subscriptions row on the studio plan so client-side
    // feature gates (which read subscriptions.plan directly) stay unlocked.
    await admin.from('subscriptions').upsert(
      { user_id: userId, plan: 'studio' },
      { onConflict: 'user_id' }
    );
    return { allowed: true };
  }

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
      message: `You have used all ${limit} AI generations for this 30-day period. Your count resets 30 days after it started.`,
    };
  }

  return { allowed: true };
}

export async function incrementGenerationCount(userId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.rpc('increment_generation_count', { uid: userId });
}

// Whole-book drafts are counted from generation_jobs (Quick Draft, mode "all")
// in the last 30 days, separately from the per-generation count.
export async function checkWholeBookLimit(userId: string, email?: string | null): Promise<{ allowed: boolean; message?: string }> {
  if (email && FOUNDER_EMAILS.includes(email.toLowerCase())) return { allowed: true };
  const admin = createAdminClient();
  const { data: sub } = await admin.from('subscriptions').select('plan').eq('user_id', userId).maybeSingle();
  const plan = ((sub?.plan as Plan) || 'free') as Plan;
  const limit = WHOLE_BOOK_LIMITS[plan] ?? 0;
  if (limit <= 0) {
    return { allowed: false, message: 'Whole-book drafts are available on paid plans. You can still draft the opening chapter or write scene by scene.' };
  }
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const { count } = await admin
    .from('generation_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('job_type', 'quick_draft')
    .eq('prompt_input->>mode', 'all')
    .neq('status', 'failed') // failed and user-cancelled drafts do not count
    .gte('created_at', since);
  if ((count ?? 0) >= limit) {
    return { allowed: false, message: `You have used all ${limit} whole-book drafts for this 30-day period. You can still draft the opening chapter or write scene by scene.` };
  }
  return { allowed: true };
}
