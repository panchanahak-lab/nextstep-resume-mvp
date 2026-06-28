import { getSupabaseClient } from '@nextstep/shared';

export type ScanMode = 'ats-match' | 'resume-quality';

export interface ResumeIssue {
  title?: string;
  location?: string;
  description?: string;
  highlight?: string;
  suggestion?: string;
  severity?: string;
}

export interface ATSScanResult {
  id: string;
  created_at: string;
  user_id: string;
  resume_id: string | null;
  job_role: string | null;
  job_description: string | null;
  
  // New Transparent Scoring Fields
  final_score: number;
  confidence_level: 'High' | 'Medium' | 'Low';
  keyword_score: number;
  skills_score: number;
  experience_score: number;
  structure_score: number;
  formatting_score: number;
  achievement_score: number;

  matched_keywords: string[];
  missing_keywords: string[];
  required_keywords: string[];
  matched_skills: string[];
  missing_skills: string[];
  required_skills: string[];
  
  resume_sections_found: {
    contact: boolean;
    summary: boolean;
    skills: boolean;
    experience: boolean;
    projects: boolean;
    education: boolean;
    certifications: boolean;
  };
  formatting_issues: string[];
  
  achievement_quality: {
    has_numbers: boolean;
    has_action_verbs: boolean;
    has_impact_statements: boolean;
    examples_found: string[];
  };
  experience_relevance: {
    label: 'high' | 'medium' | 'low' | 'not_found';
    reasons: string[];
  };
  
  suggestions: string[];
  better_bullet_suggestions: { original: string; improved: string }[];
  improved_summary_suggestion: string;
  section_wise_guidance: string[];
  
  // Tracked changes issues
  issues: ResumeIssue[];
  
  // Compatibility fields for the original UI features
  score: number;
  projectedScore: number;
  strengths: string[];
  missingKeywords: string[];
  improvedSummary?: string;
  mode: ScanMode;
  warning?: string;
}

interface AnalyzeResumeInput {
  resumeText?: string;
  resumeFile?: File | null;
  jobDescription: string;
  jobRole?: string;
  resumeId?: string;
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

const buildStrengths = (keywordScore: number, skillsScore: number, experienceScore: number, structureScore: number, formattingScore: number, achievementScore: number) => {
  const strengths: string[] = [];
  if (keywordScore >= 22) strengths.push("Strong keyword alignment with the target role.");
  if (skillsScore >= 15) strengths.push("Excellent matching skill set detected.");
  if (experienceScore >= 12) strengths.push("Relevant experience matching target requirements.");
  if (structureScore >= 12) strengths.push("Well-structured resume with all key sections.");
  if (formattingScore >= 8) strengths.push("Clean, ATS-friendly resume formatting.");
  if (achievementScore >= 8) strengths.push("Strong achievement statements with measurable impact.");
  if (strengths.length === 0) strengths.push("Clear and legible resume sections.");
  return strengths;
};

/**
 * Analyze a resume through the Supabase Edge Function so production uses
 * backend Gemini secrets instead of exposing or requiring a browser API key.
 * This runs the transparent, 2-layer scoring system.
 */
export const analyzeResume = async ({
  resumeText = '',
  resumeFile = null,
  jobDescription,
  jobRole = '',
  resumeId = undefined
}: AnalyzeResumeInput): Promise<ATSScanResult> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Scanner backend is not configured. Please try again later.');
  }

  const hasJD = jobDescription.trim().length > 0;
  const mode: ScanMode = hasJD ? 'ats-match' : 'resume-quality';

  let filePayload: { mimeType: string; data: string; name: string } | null = null;
  if (resumeFile) {
    filePayload = {
      mimeType: resumeFile.type || (resumeFile.name.toLowerCase().endsWith('.pdf')
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
      data: await fileToBase64(resumeFile),
      name: resumeFile.name,
    };
  }

  const { data, error } = await supabase.functions.invoke('analyze-resume', {
    body: {
      resumeText: resumeText || '',
      file: filePayload,
      jobDescription,
      jobRole,
      resumeId: resumeId || null,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to analyze resume. Please try again.');
  }

  if (!data) {
    throw new Error('Scanner returned an empty response. Please try again.');
  }

  const result = data as any;

  // Dynamic compatibility mappings so the existing CV diff UI continues to work flawlessly
  return {
    ...result,
    score: result.final_score,
    projectedScore: result.projected_score || result.final_score,
    strengths: buildStrengths(
      result.keyword_score,
      result.skills_score,
      result.experience_score,
      result.structure_score,
      result.formatting_score,
      result.achievement_score
    ),
    missingKeywords: result.missing_keywords || [],
    suggestions: result.suggestions || [],
    issues: result.issues || [],
    improvedSummary: result.improved_summary_suggestion,
    mode,
  };
};
