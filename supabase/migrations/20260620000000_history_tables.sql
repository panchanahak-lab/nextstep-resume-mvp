create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null,
  mode text not null,
  resume_snippet text,
  missing_keywords text[] default array[]::text[],
  strengths text[] default array[]::text[],
  suggestions text[] default array[]::text[],
  created_at timestamptz not null default now()
);

alter table public.scans enable row level security;

create policy "Users can read their own scans"
  on public.scans
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own scans"
  on public.scans
  for insert
  with check (auth.uid() = user_id);


create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_role text not null,
  score integer not null,
  top_tip text,
  created_at timestamptz not null default now()
);

alter table public.interviews enable row level security;

create policy "Users can read their own interviews"
  on public.interviews
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own interviews"
  on public.interviews
  for insert
  with check (auth.uid() = user_id);
