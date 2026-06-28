-- Create ats_scans table
create table if not exists public.ats_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_id uuid references public.resume_drafts(id) on delete set null,
  job_role text,
  job_description text,
  final_score integer not null,
  confidence_level text not null,
  keyword_score numeric not null,
  skills_score numeric not null,
  experience_score numeric not null,
  structure_score numeric not null,
  formatting_score numeric not null,
  achievement_score numeric not null,
  matched_keywords jsonb default '[]'::jsonb,
  missing_keywords jsonb default '[]'::jsonb,
  required_keywords jsonb default '[]'::jsonb,
  matched_skills jsonb default '[]'::jsonb,
  missing_skills jsonb default '[]'::jsonb,
  required_skills jsonb default '[]'::jsonb,
  resume_sections_found jsonb default '{}'::jsonb,
  formatting_issues jsonb default '[]'::jsonb,
  achievement_quality jsonb default '{}'::jsonb,
  experience_relevance jsonb default '{}'::jsonb,
  suggestions jsonb default '[]'::jsonb,
  better_bullet_suggestions jsonb default '[]'::jsonb,
  improved_summary_suggestion text,
  section_wise_guidance jsonb default '[]'::jsonb,
  issues jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.ats_scans enable row level security;

-- Setup RLS Policies
create policy "Users can select their own scans"
  on public.ats_scans for select
  using (auth.uid() = user_id);

create policy "Users can insert their own scans"
  on public.ats_scans for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own scans"
  on public.ats_scans for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own scans"
  on public.ats_scans for delete
  using (auth.uid() = user_id);

-- Create Indexes for performance
create index if not exists ats_scans_user_id_idx on public.ats_scans(user_id);
create index if not exists ats_scans_created_at_idx on public.ats_scans(created_at desc);
