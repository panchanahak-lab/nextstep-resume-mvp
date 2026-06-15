import { getCurrentUserId, supabase } from './supabaseClient';
import type { JobApplication } from '../types';

export async function saveResumeDraft(resumeData: unknown, atsScore?: number) {
  if (!supabase) return;
  const userId = await getCurrentUserId();
  if (!userId) return;

  const { data: existing } = await supabase
    .from('resume_drafts')
    .select('id')
    .eq('user_id', userId)
    .eq('title', 'Primary Resume')
    .maybeSingle();

  const payload = {
    user_id: userId,
    title: 'Primary Resume',
    resume_data: resumeData,
    ats_score: atsScore ?? null,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    await supabase.from('resume_drafts').update(payload).eq('id', existing.id);
  } else {
    await supabase.from('resume_drafts').insert(payload);
  }
}

export async function loadResumeDraft<T>(): Promise<T | null> {
  if (!supabase) return null;
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data } = await supabase
    .from('resume_drafts')
    .select('resume_data')
    .eq('user_id', userId)
    .eq('title', 'Primary Resume')
    .maybeSingle();

  return (data?.resume_data as T) ?? null;
}

export async function saveAtsReport(report: {
  resumeName?: string;
  jobDescriptionPresent: boolean;
  overallScore?: number;
  readinessScore?: number;
  result: unknown;
}) {
  if (!supabase) return;
  const userId = await getCurrentUserId();
  if (!userId) return;

  await supabase.from('ats_reports').insert({
    user_id: userId,
    resume_name: report.resumeName ?? null,
    job_description_present: report.jobDescriptionPresent,
    overall_score: report.overallScore ?? null,
    readiness_score: report.readinessScore ?? null,
    result: report.result,
  });
}

export async function loadJobs(): Promise<JobApplication[] | null> {
  if (!supabase) return null;
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data } = await supabase
    .from('job_applications')
    .select('id,company,role,status,created_at,notes,salary')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  return data?.map((job: any) => ({
    id: job.id,
    company: job.company,
    role: job.role,
    status: job.status,
    dateAdded: job.created_at,
    notes: job.notes ?? undefined,
    salary: job.salary ?? undefined,
  })) ?? null;
}

export async function upsertJob(job: JobApplication) {
  if (!supabase) return;
  const userId = await getCurrentUserId();
  if (!userId) return;

  await supabase.from('job_applications').upsert({
    id: job.id,
    user_id: userId,
    company: job.company,
    role: job.role,
    status: job.status,
    notes: job.notes ?? null,
    salary: job.salary ?? null,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteStoredJob(id: string) {
  if (!supabase) return;
  const userId = await getCurrentUserId();
  if (!userId) return;
  await supabase.from('job_applications').delete().eq('id', id).eq('user_id', userId);
}

export async function getPackages() {
  if (!supabase) return [];
  const { data } = await supabase
    .from('packages')
    .select('id,name,amount_inr,feature_key')
    .eq('active', true)
    .order('amount_inr');
  return data ?? [];
}
