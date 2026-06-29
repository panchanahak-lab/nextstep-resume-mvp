create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_role text not null,
  score integer not null,
  top_tip text,
  created_at timestamptz not null default now()
);

alter table public.interviews enable row level security;

drop policy if exists "Users can read their own interviews" on public.interviews;
create policy "Users can read their own interviews"
  on public.interviews
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own interviews" on public.interviews;
create policy "Users can insert their own interviews"
  on public.interviews
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create index if not exists interviews_user_created_idx
  on public.interviews (user_id, created_at desc);
