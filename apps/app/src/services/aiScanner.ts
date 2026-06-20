import { GoogleGenerativeAI } from '@google/generative-ai';

type ViteImportMeta = ImportMeta & {
  env?: Record<string, string | undefined>;
};

const env = (import.meta as ViteImportMeta).env ?? {};
const apiKey = env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export interface ATSScanResult {
  score: number;
  strengths: string[];
  missingKeywords: string[];
  suggestions: string[];
}

export const analyzeResume = async (resumeText: string, jobDescription: string): Promise<ATSScanResult> => {
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env.local file.');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are an ATS (Applicant Tracking System) expert.
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

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extract JSON from markdown if necessary
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr) as ATSScanResult;
    
    // Fallback parsing just in case
    if (typeof parsed.score !== 'number') parsed.score = parseInt(parsed.score as any, 10) || 0;
    if (!Array.isArray(parsed.strengths)) parsed.strengths = [];
    if (!Array.isArray(parsed.missingKeywords)) parsed.missingKeywords = [];
    if (!Array.isArray(parsed.suggestions)) parsed.suggestions = [];

    return parsed;
  } catch (error) {
    console.error('Error analyzing resume with Gemini:', error);
    throw new Error('Failed to analyze resume. Please ensure your API key is correct and try again.');
  }
};
