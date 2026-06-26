import { byteLength, generateGeminiContent } from "./gemini.ts";
import { recordUsage } from "./supabase.ts";

export type AiAction =
  | "ats-analysis"
  | "resume-scan"
  | "resume-enhancement"
  | "resume-summary"
  | "interview-feedback";

const ATS_MODEL = "gemini-2.5-flash";
const TEXT_MODEL = "gemini-2.5-flash";

const atsResponseSchema = {
  type: "OBJECT",
  properties: {
    overallScore: { type: "NUMBER", description: "Overall ATS/Quality score from 0-100" },
    matchScore: { type: "NUMBER", description: "Similarity score vs Job Description (0-100). Return 0 if no JD provided." },
    sectionScores: {
      type: "OBJECT",
      properties: {
        summary: { type: "NUMBER", description: "Quality score for the summary section (0-100)" },
        experience: { type: "NUMBER", description: "Quality score for the experience section (0-100)" },
        education: { type: "NUMBER", description: "Quality score for the education section (0-100)" },
        skills: { type: "NUMBER", description: "Quality score for the skills section (0-100)" },
      },
      required: ["summary", "experience", "education", "skills"],
    },
    formattingScore: { type: "NUMBER", description: "Formatting score from 0-100" },
    keywordScore: { type: "NUMBER", description: "Keyword optimization score from 0-100" },
    detectedKeywords: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "List of professional skills/keywords found",
    },
    missingKeywords: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "List of missing high-value keywords (if JD provided, prioritize missing JD keywords)",
    },
    optimizationPlan: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Prioritized resume optimization actions.",
    },
    improvedSummary: {
      type: "STRING",
      description: "A concise, personalized ATS-friendly professional summary.",
    },
    readinessSummary: {
      type: "STRING",
      description: "Plain-English explanation of job-readiness and next steps.",
    },
    issues: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          location: { type: "STRING" },
          description: { type: "STRING" },
          highlight: { type: "STRING", description: "The specific text snippet with the issue" },
          suggestion: { type: "STRING", description: "Direct resume edit. Prefer 'Replace ... with ...' or 'Add ...'. Do not give vague advice." },
          severity: { type: "STRING", description: "One of: critical, warning, info" },
        },
        required: ["title", "location", "description", "highlight", "suggestion", "severity"],
      },
    },
  },
  required: ["overallScore", "sectionScores", "formattingScore", "keywordScore", "detectedKeywords", "missingKeywords", "issues", "optimizationPlan", "improvedSummary", "readinessSummary"],
};

const resumeScanSchema = {
  type: "OBJECT",
  properties: {
    score: { type: "NUMBER", description: "Score out of 100. Return a number." },
    strengths: { type: "ARRAY", items: { type: "STRING" } },
    missingKeywords: { type: "ARRAY", items: { type: "STRING" } },
    suggestions: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["score", "strengths", "missingKeywords", "suggestions"],
};

const interviewFeedbackSchema = {
  type: "OBJECT",
  properties: {
    score: { type: "NUMBER" },
    summary: { type: "STRING" },
    strengths: { type: "ARRAY", items: { type: "STRING" } },
    weaknesses: { type: "ARRAY", items: { type: "STRING" } },
    suggestions: { type: "ARRAY", items: { type: "STRING" } },
    lineFeedback: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          quote: { type: "STRING" },
          feedback: { type: "STRING" },
          improvedAnswer: { type: "STRING" },
        },
        required: ["quote", "feedback", "improvedAnswer"],
      },
    },
    suggestedAnswers: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
  },
  required: ["score", "summary", "strengths", "weaknesses", "suggestions", "lineFeedback", "suggestedAnswers"],
};

export async function runAiAction(params: {
  userId: string;
  action: AiAction;
  payload: Record<string, unknown>;
}): Promise<unknown> {
  switch (params.action) {
    case "ats-analysis":
      return runAtsAnalysis(params.userId, params.payload);
    case "resume-scan":
      return runResumeScan(params.userId, params.payload);
    case "resume-enhancement":
      return runResumeEnhancement(params.userId, params.payload);
    case "resume-summary":
      return runResumeSummary(params.userId, params.payload);
    case "interview-feedback":
      return runInterviewFeedback(params.userId, params.payload);
    default:
      throw new Response(JSON.stringify({ error: "Unsupported AI action." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
  }
}

async function runAtsAnalysis(userId: string, payload: Record<string, unknown>) {
  const file = payload.file as { mimeType?: string; data?: string; name?: string } | undefined;
  const jobDescription = typeof payload.jobDescription === "string" ? payload.jobDescription : "";

  if (!file?.data) {
    throw new Response(JSON.stringify({ error: "Resume file data is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const hasJD = jobDescription.trim().length > 0;
  const promptText = hasJD
    ? "Analyze this resume against the provided Job Description. Calculate a Match Score based on semantic similarity and keyword presence. Also perform detailed scoring by section, optimization actions, an improved summary, and a readiness summary. For every issue, provide a direct resume edit, not a generic suggestion."
    : "Please analyze this resume for ATS compatibility. Provide overall scores, section breakdowns, optimization actions, an improved summary, and a readiness summary. For every issue, provide a direct resume edit, not a generic suggestion.";

  const parts: unknown[] = [
    {
      inlineData: {
        mimeType: file.mimeType || "application/pdf",
        data: file.data,
      },
    },
    { text: promptText },
  ];

  if (hasJD) {
    parts.push({ text: `JOB DESCRIPTION:\n${jobDescription}` });
  }

  const request = {
    model: ATS_MODEL,
    contents: [{ role: "user", parts }],
    responseMimeType: "application/json",
    responseSchema: atsResponseSchema,
    systemInstruction: {
      parts: [{
        text: `You are an expert ATS optimization specialist.
          Parse the resume. If a Job Description is present, perform a deep semantic match (like Cosine Similarity) to determine the 'matchScore' and identify 'missingKeywords' strictly relevant to the JD.
          Analyze individual sections (Summary, Experience, Education, Skills) and provide specific quality scores (0-100) for each based on content impact, quantification of achievements, clarity, and ATS parsing friendliness.

          For each issue, the 'highlight' field must quote the exact incorrect or weak resume text.
          The 'suggestion' field must be a direct change the user can apply immediately:
          - Prefer this format: Replace "[exact current text]" with "[corrected text]".
          - For missing content, use: Add "[ready-to-paste text]".
          - For dates, grammar, formatting, title, summary, and bullets, provide the corrected wording directly.
          - If the exact factual correction cannot be known from the resume, say exactly what value is needed, for example: Replace "02-06-2025 - Present" with "[actual start date] - Present".
          - Do not write vague instructions like "Correct the date" or "Ensure this is accurate".`,
      }],
    },
  };

  const text = await generateGeminiContent(request);
  const result = JSON.parse(text);
  await recordUsage({
    userId,
    feature: "ats-analysis",
    model: ATS_MODEL,
    inputBytes: byteLength(request),
    outputBytes: byteLength(text),
    metadata: { hasJobDescription: hasJD, fileName: file.name ?? null },
  });

  return result;
}

async function runResumeScan(userId: string, payload: Record<string, unknown>) {
  const resumeText = typeof payload.resumeText === "string" ? payload.resumeText : "";
  const jobDescription = typeof payload.jobDescription === "string" ? payload.jobDescription : "";

  if (!resumeText.trim()) {
    throw new Response(JSON.stringify({ error: "Resume text is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const hasJD = jobDescription.trim().length > 0;
  const prompt = hasJD
    ? buildAtsMatchPrompt(resumeText, jobDescription)
    : buildResumeQualityPrompt(resumeText);

  const request = {
    model: ATS_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    responseMimeType: "application/json",
    responseSchema: resumeScanSchema,
  };

  const text = await generateGeminiContent(request);
  const result = JSON.parse(text);

  await recordUsage({
    userId,
    feature: "resume-scan",
    model: ATS_MODEL,
    inputBytes: byteLength(request),
    outputBytes: byteLength(text),
    metadata: { hasJobDescription: hasJD },
  });

  return {
    score: typeof result.score === "number" ? result.score : Number(result.score) || 0,
    strengths: Array.isArray(result.strengths) ? result.strengths : [],
    missingKeywords: hasJD && Array.isArray(result.missingKeywords) ? result.missingKeywords : [],
    suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
  };
}

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

async function runResumeEnhancement(userId: string, payload: Record<string, unknown>) {
  const text = typeof payload.text === "string" ? payload.text : "";
  if (!text.trim()) {
    throw new Response(JSON.stringify({ error: "Text is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const contents = [{
    role: "user",
    parts: [{
      text: `Rewrite this resume bullet point professionally. Use the 'Action + Context + Result' framework. Keep it under 25 words. Text: "${text}"`,
    }],
  }];

  const enhancedText = await generateGeminiContent({ model: TEXT_MODEL, contents });
  await recordUsage({
    userId,
    feature: "resume-enhancement",
    model: TEXT_MODEL,
    inputBytes: byteLength(contents),
    outputBytes: byteLength(enhancedText),
  });

  return { text: enhancedText };
}

async function runResumeSummary(userId: string, payload: Record<string, unknown>) {
  const resumeData = payload.resumeData ?? {};
  const targetRole = typeof payload.targetRole === "string" ? payload.targetRole : "the target role";
  const contents = [{
    role: "user",
    parts: [{
      text: `Generate a concise, ATS-friendly professional resume summary for ${targetRole}. Preserve truthful details from this resume data and keep it under 70 words.\n\nRESUME DATA:\n${JSON.stringify(resumeData)}`,
    }],
  }];

  const summary = await generateGeminiContent({ model: TEXT_MODEL, contents });
  await recordUsage({
    userId,
    feature: "resume-summary",
    model: TEXT_MODEL,
    inputBytes: byteLength(contents),
    outputBytes: byteLength(summary),
  });

  return { summary };
}

async function runInterviewFeedback(userId: string, payload: Record<string, unknown>) {
  const jobRole = typeof payload.jobRole === "string" ? payload.jobRole : "the target role";
  const transcripts = Array.isArray(payload.transcripts) ? payload.transcripts : [];
  const history = transcripts
    .map((t: unknown) => {
      const item = t as { role?: string; text?: string };
      return `${String(item.role ?? "").toUpperCase()}: ${item.text ?? ""}`;
    })
    .join("\n");

  const request = {
    model: TEXT_MODEL,
    contents: [{
      role: "user",
      parts: [{
        text: `Analyze the following interview for a ${jobRole} position. Provide a score out of 100, a summary, strengths, weaknesses, specific suggestions, line-by-line feedback for notable answers, and suggested stronger answers. Return purely JSON.\n\nINTERVIEW LOG:\n${history}`,
      }],
    }],
    responseMimeType: "application/json",
    responseSchema: interviewFeedbackSchema,
  };

  const text = await generateGeminiContent(request);
  await recordUsage({
    userId,
    feature: "interview-feedback",
    model: TEXT_MODEL,
    inputBytes: byteLength(request),
    outputBytes: byteLength(text),
    metadata: { transcriptItems: transcripts.length },
  });

  return JSON.parse(text);
}
