create table if not exists public.resume_templates (
  id text primary key,
  name text not null,
  description text,
  template_type text not null,
  is_ats_friendly boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.resume_templates enable row level security;

drop policy if exists "Authenticated users can read active resume templates" on public.resume_templates;
create policy "Authenticated users can read active resume templates"
  on public.resume_templates
  for select
  to authenticated
  using (is_active = true);

insert into public.resume_templates (id, name, description, template_type, is_ats_friendly, is_active)
values (
  'nextstep-ats-modern',
  'NextStep ATS Modern',
  'Clean single-column ATS-friendly resume template with a strong header and readable sections.',
  'revised_cv',
  true,
  true
)
on conflict (id) do update
set name = excluded.name,
    description = excluded.description,
    template_type = excluded.template_type,
    is_ats_friendly = excluded.is_ats_friendly,
    is_active = excluded.is_active;

create table if not exists public.resume_revisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ats_scan_id uuid references public.scans(id) on delete set null,
  original_resume_id uuid references public.resume_drafts(id) on delete set null,
  source_type text not null,
  target_job_role text,
  job_description text,
  original_resume_data jsonb not null,
  revised_resume_data jsonb not null,
  applied_patches jsonb not null default '[]'::jsonb,
  manual_review_patches jsonb not null default '[]'::jsonb,
  inserted_keywords jsonb not null default '[]'::jsonb,
  template_id text references public.resume_templates(id),
  current_score integer,
  after_changes_score integer,
  scoring_version text not null default 'ats_v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.resume_revisions enable row level security;

drop policy if exists "Users can read their own resume revisions" on public.resume_revisions;
create policy "Users can read their own resume revisions"
  on public.resume_revisions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own resume revisions" on public.resume_revisions;
create policy "Users can insert their own resume revisions"
  on public.resume_revisions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own resume revisions" on public.resume_revisions;
create policy "Users can update their own resume revisions"
  on public.resume_revisions
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own resume revisions" on public.resume_revisions;
create policy "Users can delete their own resume revisions"
  on public.resume_revisions
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create index if not exists resume_revisions_user_created_idx
  on public.resume_revisions (user_id, created_at desc);

create index if not exists resume_revisions_template_idx
  on public.resume_revisions (template_id);
