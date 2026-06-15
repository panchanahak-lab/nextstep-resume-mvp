create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null,
  model text not null,
  provider text not null default 'google_gemini',
  request_units integer not null default 1,
  input_bytes integer not null default 0,
  output_bytes integer not null default 0,
  estimated_cost_usd numeric(12, 6),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.ai_usage_events enable row level security;

create policy "Users can read their own AI usage"
  on public.ai_usage_events
  for select
  using (auth.uid() = user_id);

create table if not exists public.ai_rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, feature, window_start)
);

alter table public.ai_rate_limits enable row level security;

create table if not exists public.ai_live_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null default 'live_interview',
  model text not null,
  status text not null default 'started',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer,
  input_bytes integer not null default 0,
  output_bytes integer not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.ai_live_sessions enable row level security;

create policy "Users can read their own live sessions"
  on public.ai_live_sessions
  for select
  using (auth.uid() = user_id);

create or replace function public.check_ai_rate_limit(
  p_user_id uuid,
  p_feature text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.ai_rate_limits (user_id, feature, window_start, request_count)
  values (p_user_id, p_feature, v_window_start, 1)
  on conflict (user_id, feature, window_start)
  do update
    set request_count = public.ai_rate_limits.request_count + 1,
        updated_at = now()
  returning request_count into v_count;

  return v_count <= p_limit;
end;
$$;

create or replace function public.record_ai_usage_event(
  p_user_id uuid,
  p_feature text,
  p_model text,
  p_provider text default 'google_gemini',
  p_request_units integer default 1,
  p_input_bytes integer default 0,
  p_output_bytes integer default 0,
  p_estimated_cost_usd numeric default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
begin
  insert into public.ai_usage_events (
    user_id,
    feature,
    model,
    provider,
    request_units,
    input_bytes,
    output_bytes,
    estimated_cost_usd,
    metadata
  )
  values (
    p_user_id,
    p_feature,
    p_model,
    p_provider,
    p_request_units,
    p_input_bytes,
    p_output_bytes,
    p_estimated_cost_usd,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;

create index if not exists ai_usage_events_user_created_idx
  on public.ai_usage_events (user_id, created_at desc);

create index if not exists ai_usage_events_feature_created_idx
  on public.ai_usage_events (feature, created_at desc);

create index if not exists ai_live_sessions_user_started_idx
  on public.ai_live_sessions (user_id, started_at desc);
