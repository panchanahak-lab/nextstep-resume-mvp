import { byteLength, generateGeminiContent } from "./gemini.ts";
import { recordUsage } from "./supabase.ts";

export type AiAction =
  | "ats-analysis"
  | "resume-enhancement"
  | "resume-summary"
  | "interview-feedback";

const ATS_MODEL = "gemini-3-pro-preview";
const TEXT_MODEL = "gemini-3-pro-preview";

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
    issues: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          location: { type: "STRING" },
          description: { type: "STRING" },
          highlight: { type: "STRING", description: "The specific text snippet with the issue" },
          suggestion: { type: "STRING" },
          severity: { type: "STRING", description: "One of: critical, warning, info" },
        },
        required: ["title", "location", "description", "highlight", "suggestion", "severity"],
      },
    },
  },
  required: ["overallScore", "sectionScores", "formattingScore", "keywordScore", "detectedKeywords", "missingKeywords", "issues"],
};

const interviewFeedbackSchema = {
  type: "OBJECT",
  properties: {
    score: { type: "NUMBER" },
    summary: { type: "STRING" },
    strengths: { type: "ARRAY", items: { type: "STRING" } },
    weaknesses: { type: "ARRAY", items: { type: "STRING" } },
    suggestions: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["score", "summary", "strengths", "weaknesses", "suggestions"],
};

export async function runAiAction(params: {
  userId: string;
  action: AiAction;
  payload: Record<string, unknown>;
}): Promise<unknown> {
  switch (params.action) {
    case "ats-analysis":
      return runAtsAnalysis(params.userId, params.payload);
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
    ? "Analyze this resume against the provided Job Description. Calculate a Match Score based on semantic similarity and keyword presence. Also perform detailed scoring by section."
    : "Please analyze this resume for ATS compatibility. Provide overall scores and detailed breakdowns for Experience, Education, Summary, and Skills sections.";

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
          Analyze individual sections (Summary, Experience, Education, Skills) and provide specific quality scores (0-100) for each based on content impact, quantification of achievements, clarity, and ATS parsing friendliness.`,
      }],
    },
  };

  const text = await generateGeminiContent(request);
  await recordUsage({
    userId,
    feature: "ats-analysis",
    model: ATS_MODEL,
    inputBytes: byteLength(request),
    outputBytes: byteLength(text),
    metadata: { hasJobDescription: hasJD, fileName: file.name ?? null },
  });

  return JSON.parse(text);
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
        text: `Analyze the following interview for a ${jobRole} position. Provide a score out of 100, a summary, strengths, weaknesses, and specific suggestions for improvement. Return purely JSON.\n\nINTERVIEW LOG:\n${history}`,
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
