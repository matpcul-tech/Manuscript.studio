-- Manuscript Studio: Database Schema
-- Run this in Supabase SQL Editor

-- Projects table: one row per book project
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null default 'Untitled Project',
  data jsonb not null default '{}'::jsonb,
  word_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists projects_user_id_idx on projects(user_id);
create index if not exists projects_updated_at_idx on projects(updated_at desc);

-- Voice profiles table: separate so users can have multiple voices reusable across projects
create table if not exists voice_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null default 'My Voice',
  sample text not null,
  notes text,
  profile text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists voice_profiles_user_id_idx on voice_profiles(user_id);

-- Subscriptions table for Stripe integration (optional)
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text default 'free',
  plan text default 'free',
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists subscriptions_user_id_idx on subscriptions(user_id);

-- Usage tracking for fair-use enforcement
create table if not exists engine_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  task text not null,
  input_tokens integer default 0,
  output_tokens integer default 0,
  created_at timestamp with time zone default now()
);

create index if not exists engine_usage_user_id_idx on engine_usage(user_id);
create index if not exists engine_usage_created_at_idx on engine_usage(created_at desc);

-- Row Level Security
alter table projects enable row level security;
alter table voice_profiles enable row level security;
alter table subscriptions enable row level security;
alter table engine_usage enable row level security;

-- Projects policies
drop policy if exists "Users can view own projects" on projects;
create policy "Users can view own projects" on projects
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own projects" on projects;
create policy "Users can insert own projects" on projects
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own projects" on projects;
create policy "Users can update own projects" on projects
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own projects" on projects;
create policy "Users can delete own projects" on projects
  for delete using (auth.uid() = user_id);

-- Voice profiles policies
drop policy if exists "Users can view own voice profiles" on voice_profiles;
create policy "Users can view own voice profiles" on voice_profiles
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own voice profiles" on voice_profiles;
create policy "Users can insert own voice profiles" on voice_profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own voice profiles" on voice_profiles;
create policy "Users can update own voice profiles" on voice_profiles
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own voice profiles" on voice_profiles;
create policy "Users can delete own voice profiles" on voice_profiles
  for delete using (auth.uid() = user_id);

-- Subscriptions policies
drop policy if exists "Users can view own subscription" on subscriptions;
create policy "Users can view own subscription" on subscriptions
  for select using (auth.uid() = user_id);

-- Usage policies
drop policy if exists "Users can view own usage" on engine_usage;
create policy "Users can view own usage" on engine_usage
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own usage" on engine_usage;
create policy "Users can insert own usage" on engine_usage
  for insert with check (auth.uid() = user_id);

-- Trigger to update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on projects;
create trigger set_updated_at before update on projects
  for each row execute function update_updated_at_column();

drop trigger if exists set_updated_at_voice on voice_profiles;
create trigger set_updated_at_voice before update on voice_profiles
  for each row execute function update_updated_at_column();

drop trigger if exists set_updated_at_sub on subscriptions;
create trigger set_updated_at_sub before update on subscriptions
  for each row execute function update_updated_at_column();

-- Auto-create a free subscription record when user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into subscriptions (user_id, status, plan)
  values (new.id, 'free', 'free');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================================
-- Background job tracking for long-running AI generations.
-- Each row is one generation attempt (chapter draft, back matter, description,
-- export, etc). The API route inserts a 'queued' row in under 500ms; the
-- Inngest worker picks it up, transitions it through running -> streaming ->
-- complete, and writes the final result_text. Tokens are streamed live to
-- the client via Supabase Realtime broadcast on channel `job:{id}`; this
-- table holds the persisted state so users can close the browser mid-job
-- and find the finished result waiting when they come back.
-- ============================================================================

create table if not exists generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references projects(id) on delete cascade,
  job_type text not null,
  status text not null default 'queued',
  prompt_input jsonb not null default '{}'::jsonb,
  result_text text,
  error_message text,
  tokens_used integer,
  model_used text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create index if not exists generation_jobs_user_created_idx
  on generation_jobs(user_id, created_at desc);

create index if not exists generation_jobs_project_idx
  on generation_jobs(project_id);

-- Partial index keeps the stale-job watchdog cron cheap.
create index if not exists generation_jobs_active_idx
  on generation_jobs(status, created_at)
  where status in ('queued', 'running', 'streaming');

alter table generation_jobs enable row level security;

-- Users can read their own jobs. The worker writes via service role, which
-- bypasses RLS, so no UPDATE policy is needed for normal operation. Add one
-- later if users need to cancel or edit their own jobs from the client.
drop policy if exists "Users can view own jobs" on generation_jobs;
create policy "Users can view own jobs" on generation_jobs
  for select using (auth.uid() = user_id);

drop policy if exists "Users can create own jobs" on generation_jobs;
create policy "Users can create own jobs" on generation_jobs
  for insert with check (auth.uid() = user_id);
