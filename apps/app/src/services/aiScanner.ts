import { GoogleGenerativeAI } from '@google/generative-ai';

type ViteImportMeta = ImportMeta & {
  env?: Record<string, string | undefined>;
};

const env = (import.meta as ViteImportMeta).env ?? {};
const apiKey = env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

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
 * Every call generates a completely fresh result — nothing is cached.
 */
export const analyzeResume = async (
  resumeText: string,
  jobDescription: string,
): Promise<ATSScanResult> => {
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env.local file.');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const hasJD = jobDescription.trim().length > 0;
  const mode: ScanMode = hasJD ? 'ats-match' : 'resume-quality';

  const prompt = hasJD
    ? buildAtsMatchPrompt(resumeText, jobDescription)
    : buildResumeQualityPrompt(resumeText);

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON from markdown fences if the model wraps it
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr) as Omit<ATSScanResult, 'mode'>;

    // Defensive normalisation
    const score = typeof parsed.score === 'number' ? parsed.score : parseInt(parsed.score as any, 10) || 0;
    const strengths = Array.isArray(parsed.strengths) ? parsed.strengths : [];
    const missingKeywords = Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [];
    const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];

    return { score, strengths, missingKeywords, suggestions, mode };
  } catch (error) {
    console.error('Error analyzing resume with Gemini:', error);
    throw new Error('Failed to analyze resume. Please ensure your API key is correct and try again.');
  }
};

/* ------------------------------------------------------------------ */
/*  Prompt builders                                                    */
/* ------------------------------------------------------------------ */

function buildAtsMatchPrompt(resumeText: string, jobDescription: string): string {
  return `You are an ATS (Applicant Tracking System) expert.
Analyse the resume below against the job description below.
Do not use any pre-set keywords or templates.
Extract keywords, scores, strengths, and suggestions
based only on the actual content of these two documents.

Resume:
${resumeText}

Job Description:
${jobDescription}

Generate the following output as a JSON object:

{
  "score": <ATS Compatibility Score out of 100 based on keyword match, formatting, and relevance. Return a number>,
  "strengths": [
    "<List what the resume does well compared to the job description. Be specific to the actual content, not generic.>"
  ],
  "missingKeywords": [
    "<List important keywords from the job description that are absent or underrepresented in the resume. Only list keywords actually present in the job description.>"
  ],
  "suggestions": [
    "<Give 4 to 6 specific, actionable suggestions based on the actual gap between the resume and job description. Do not give generic advice. Every suggestion must reference something specific from either the resume or the job description.>"
  ]
}

Important rules:
- Never use pre-set or hardcoded keywords
- Never show data center, HVAC, or engineering terms unless they are genuinely present in the job description
- Every result must be unique to this specific resume and this specific job description
- Your output must be purely valid JSON matching the schema above.`;
}

function buildResumeQualityPrompt(resumeText: string): string {
  return `You are a professional resume reviewer and career coach.
Analyse the resume below for overall quality and effectiveness.
Do not compare it to any job description.
Evaluate it purely on its own merit.

Resume:
${resumeText}

Generate the following output as a JSON object:

{
  "score": <Resume Quality Score out of 100 based on formatting, writing quality, clarity, impact of bullet points, and overall professionalism. Return a number>,
  "strengths": [
    "<List what this resume does well. Be specific — reference actual sections, bullet points, or phrasing from the resume. Do not give generic praise.>"
  ],
  "missingKeywords": [],
  "suggestions": [
    "<Give 4 to 6 specific, actionable suggestions to make this resume stronger. Every suggestion must reference something specific from the resume. Cover areas like formatting, quantification of achievements, section structure, clarity, and professional tone. Do not give generic advice.>"
  ]
}

Important rules:
- Do not mention job matching or missing keywords — there is no job description to compare against
- The missingKeywords array must always be empty
- Every result must be unique to this specific resume
- Your output must be purely valid JSON matching the schema above.`;
}
