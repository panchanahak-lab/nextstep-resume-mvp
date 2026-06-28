import { getSupabaseClient } from '@nextstep/shared';

export type ScanMode = 'ats-match' | 'resume-quality';

export interface ATSScanResult {
  score: number;
  projectedScore: number;
  strengths: string[];
  missingKeywords: string[];
  suggestions: string[];
  issues: ResumeIssue[];
  improvedSummary?: string;
  mode: ScanMode;
}

export interface ResumeIssue {
  title?: string;
  location?: string;
  description?: string;
  highlight?: string;
  suggestion?: string;
  severity?: string;
}

interface AnalyzeResumeInput {
  resumeText?: string;
  resumeFile?: File | null;
  jobDescription: string;
}

interface EdgeAtsResult {
  overallScore?: number;
  matchScore?: number;
  detectedKeywords?: string[];
  missingKeywords?: string[];
  optimizationPlan?: string[];
  readinessSummary?: string;
  improvedSummary?: string;
  formattingScore?: number;
  keywordScore?: number;
  sectionScores?: Record<string, number>;
  issues?: ResumeIssue[];
}

const fileToBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const result = typeof reader.result === 'string' ? reader.result : '';
    resolve(result.split(',')[1] || '');
  };
  reader.onerror = () => reject(reader.error || new Error('Could not read uploaded file.'));
  reader.readAsDataURL(file);
});

const textToBase64 = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const buildStrengths = (result: EdgeAtsResult) => {
  const strengths: string[] = [];

  Object.entries(result.sectionScores || {}).forEach(([section, score]) => {
    const sectionScore = clampScore(score);
    if (sectionScore >= 75) {
      strengths.push(`Strong ${section} section score (${sectionScore}/100).`);
    }
  });

  const formattingScore = clampScore(result.formattingScore);
  if (formattingScore >= 75) {
    strengths.push(`Clean formatting score (${formattingScore}/100).`);
  }

  const keywordScore = clampScore(result.keywordScore);
  if (keywordScore >= 75) {
    strengths.push(`Strong keyword coverage score (${keywordScore}/100).`);
  }

  if (Array.isArray(result.detectedKeywords) && result.detectedKeywords.length > 0) {
    strengths.push(`Includes relevant keywords: ${result.detectedKeywords.slice(0, 8).join(', ')}.`);
  }

  return strengths;
};

const buildSuggestions = (result: EdgeAtsResult) => {
  const suggestions = [
    result.readinessSummary || '',
    ...(Array.isArray(result.optimizationPlan) ? result.optimizationPlan : []),
    ...(Array.isArray(result.issues)
      ? result.issues.map((issue) => issue.suggestion || issue.title || '').filter(Boolean)
      : []),
  ].filter(Boolean);

  return Array.from(new Set(suggestions)).slice(0, 8);
};

const clampScore = (value: unknown) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

const estimateProjectedScore = (currentScore: number, result: EdgeAtsResult, hasJD: boolean) => {
  const issueCount = Array.isArray(result.issues) ? result.issues.length : 0;
  const missingKeywordCount = hasJD && Array.isArray(result.missingKeywords) ? result.missingKeywords.length : 0;
  const suggestionCount = Array.isArray(result.optimizationPlan) ? result.optimizationPlan.length : 0;
  const improvementPotential = Math.min(35, (issueCount * 4) + (missingKeywordCount * 3) + (suggestionCount * 2));
  const floorBoost = currentScore < 50 ? 12 : currentScore < 70 ? 8 : 5;

  return clampScore(currentScore + floorBoost + improvementPotential);
};

/**
 * Analyze a resume through the Supabase Edge Function so production uses
 * backend Gemini secrets instead of exposing or requiring a browser API key.
 */
export const analyzeResume = async ({
  resumeText = '',
  resumeFile = null,
  jobDescription,
}: AnalyzeResumeInput): Promise<ATSScanResult> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Scanner backend is not configured. Please try again later.');
  }

  const hasJD = jobDescription.trim().length > 0;
  const mode: ScanMode = hasJD ? 'ats-match' : 'resume-quality';

  let filePayload: { mimeType: string; data: string; name: string };
  if (resumeFile) {
    filePayload = {
      mimeType: resumeFile.type || (resumeFile.name.toLowerCase().endsWith('.pdf')
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
      data: await fileToBase64(resumeFile),
      name: resumeFile.name,
    };
  } else if (resumeText.trim()) {
    filePayload = {
      mimeType: 'text/plain',
      data: textToBase64(resumeText),
      name: 'pasted-resume.txt',
    };
  } else {
    throw new Error('Please add your resume to continue.');
  }

  const { data, error } = await supabase.functions.invoke('ats-analysis', {
    body: {
      file: filePayload,
      jobDescription,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to analyze resume. Please try again.');
  }

  const result = (data as { result?: EdgeAtsResult } | null)?.result;
  if (!result) {
    throw new Error('Scanner returned an empty response. Please try again.');
  }

  const currentScore = clampScore(hasJD ? result.matchScore ?? result.overallScore : result.overallScore);

  return {
    score: currentScore,
    projectedScore: Math.max(currentScore, estimateProjectedScore(currentScore, result, hasJD)),
    strengths: buildStrengths(result),
    missingKeywords: hasJD && Array.isArray(result.missingKeywords) ? result.missingKeywords : [],
    suggestions: buildSuggestions(result),
    issues: Array.isArray(result.issues) ? result.issues : [],
    improvedSummary: result.improvedSummary,
    mode,
  };
};
