import { getSupabaseClient } from '@nextstep/shared';

export type ScanMode = 'ats-match' | 'resume-quality';

export interface ATSScanResult {
  score: number;
  strengths: string[];
  missingKeywords: string[];
  suggestions: string[];
  mode: ScanMode;
}

/**
 * Analyse a resume. If a job description is provided, runs a full ATS match.
 * If no job description, runs a general resume quality check.
 *
 * The analysis runs server-side through the authenticated `ai-router` Supabase
 * Edge Function so the Gemini key stays on the server (never shipped to the
 * browser). Every call generates a completely fresh result — nothing is cached.
 */
export const analyzeResume = async (
  resumeText: string,
  jobDescription: string,
): Promise<ATSScanResult> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Resume scanning is not configured. Please try again later.');
  }

  const hasJD = jobDescription.trim().length > 0;
  const mode: ScanMode = hasJD ? 'ats-match' : 'resume-quality';

  const { data, error } = await supabase.functions.invoke('ai-router', {
    body: {
      action: 'resume-scan',
      payload: { resumeText, jobDescription },
    },
  });

  if (error) {
    console.error('Error analyzing resume via ai-router:', error);
    throw new Error('Failed to analyze resume. Please try again in a moment.');
  }

  const result = (data?.result ?? {}) as Partial<Omit<ATSScanResult, 'mode'>>;

  const score = typeof result.score === 'number'
    ? result.score
    : parseInt(result.score as unknown as string, 10) || 0;
  const strengths = Array.isArray(result.strengths) ? result.strengths : [];
  const missingKeywords = hasJD && Array.isArray(result.missingKeywords) ? result.missingKeywords : [];
  const suggestions = Array.isArray(result.suggestions) ? result.suggestions : [];

  return { score, strengths, missingKeywords, suggestions, mode };
};
