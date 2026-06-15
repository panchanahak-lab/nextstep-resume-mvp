create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create policy "Users can read their own profile"
  on public.user_profiles for select
  using (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.user_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and is_admin = false);

create table if not exists public.resume_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Primary Resume',
  resume_data jsonb not null default '{}'::jsonb,
  ats_score integer,
  last_analysis_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.resume_drafts enable row level security;

create policy "Users manage own resume drafts"
  on public.resume_drafts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.ats_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_name text,
  job_description_present boolean not null default false,
  overall_score integer,
  readiness_score integer,
  result jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.ats_reports enable row level security;

create policy "Users read own ATS reports"
  on public.ats_reports for select
  using (auth.uid() = user_id);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  role text not null,
  status text not null default 'Saved',
  notes text,
  salary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.job_applications enable row level security;

create policy "Users manage own job applications"
  on public.job_applications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.packages (
  id text primary key,
  name text not null,
  amount_inr integer not null,
  feature_key text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.packages enable row level security;

create policy "Anyone authenticated can read active packages"
  on public.packages for select
  using (auth.role() = 'authenticated' and active = true);

insert into public.packages (id, name, amount_inr, feature_key)
values
  ('resume_pack_29', 'Resume Pack', 29, 'resume'),
  ('interview_pack_29', 'Interview Pack', 29, 'interview'),
  ('job_ready_pack_49', 'Get Job Ready Pack', 49, 'job_ready')
on conflict (id) do update
set name = excluded.name,
    amount_inr = excluded.amount_inr,
    feature_key = excluded.feature_key,
    active = true;

create table if not exists public.package_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  package_id text not null references public.packages(id),
  granted_by uuid references auth.users(id),
  source text not null default 'purchase',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (user_id, package_id, active)
);

alter table public.package_entitlements enable row level security;

create policy "Users read own package entitlements"
  on public.package_entitlements for select
  using (auth.uid() = user_id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  package_id text not null references public.packages(id),
  provider text not null default 'razorpay',
  provider_order_id text,
  provider_payment_id text,
  provider_signature text,
  amount_inr integer not null,
  status text not null default 'created',
  raw_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "Users read own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  source text not null,
  message text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.error_logs enable row level security;

create or replace function public.is_app_admin(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_profiles
    where user_id = p_user_id and is_admin = true
  );
$$;

create or replace function public.record_error_log(
  p_user_id uuid,
  p_source text,
  p_message text,
  p_detail jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.error_logs (user_id, source, message, detail)
  values (p_user_id, p_source, p_message, coalesce(p_detail, '{}'::jsonb))
  returning id into v_id;

  return v_id;
end;
$$;

create index if not exists resume_drafts_user_updated_idx
  on public.resume_drafts (user_id, updated_at desc);

create index if not exists ats_reports_user_created_idx
  on public.ats_reports (user_id, created_at desc);

create index if not exists job_applications_user_updated_idx
  on public.job_applications (user_id, updated_at desc);

create index if not exists package_entitlements_user_idx
  on public.package_entitlements (user_id, active);

create index if not exists payments_user_created_idx
  on public.payments (user_id, created_at desc);

create index if not exists error_logs_created_idx
  on public.error_logs (created_at desc);
