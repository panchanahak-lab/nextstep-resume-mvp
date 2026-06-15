import { getAccessToken, supabase } from './supabaseClient';

export interface AnalysisResult {
  overallScore: number;
  matchScore?: number;
  sectionScores: {
    summary: number;
    experience: number;
    education: number;
    skills: number;
  };
  formattingScore: number;
  keywordScore: number;
  detectedKeywords: string[];
  missingKeywords: string[];
  issues: {
    title: string;
    location: string;
    description: string;
    highlight: string;
    suggestion: string;
    severity: 'critical' | 'warning' | 'info';
  }[];
}

export interface TranscriptItem {
  role: 'user' | 'ai';
  text: string;
}

export interface InterviewFeedback {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

async function invokeFunction<T>(functionName: string, body: unknown): Promise<T> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const token = await getAccessToken();
  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data?.result ?? data) as T;
}

export async function analyzeResume(payload: {
  file: {
    name: string;
    mimeType: string;
    data: string;
  };
  jobDescription: string;
}): Promise<AnalysisResult> {
  return invokeFunction<AnalysisResult>('ats-analysis', payload);
}

export async function enhanceResumeBullet(text: string): Promise<string> {
  const result = await invokeFunction<{ text: string }>('resume-enhancement', { text });
  return result.text;
}

export async function generateResumeSummary(payload: {
  targetRole: string;
  resumeData: unknown;
}): Promise<string> {
  const result = await invokeFunction<{ summary: string }>('resume-summary', payload);
  return result.summary;
}

export async function getInterviewFeedback(payload: {
  jobRole: string;
  transcripts: TranscriptItem[];
}): Promise<InterviewFeedback> {
  return invokeFunction<InterviewFeedback>('interview-feedback', payload);
}

export async function createLiveInterviewSocket(params: {
  jobRole: string;
  language: string;
}): Promise<WebSocket> {
  const token = await getAccessToken();
  const url = new URL(import.meta.env.VITE_SUPABASE_URL as string);
  const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${url.host}/functions/v1/live-interview-relay`;
  const search = new URLSearchParams({
    access_token: token,
    job_role: params.jobRole,
    language: params.language,
  });

  return new WebSocket(`${wsUrl}?${search.toString()}`);
}
