import { byteLength, generateGeminiContent } from "./gemini.ts";
import { getServiceClient, recordUsage } from "./supabase.ts";

export type AiAction =
  | "ats-analysis"
  | "resume-enhancement"
  | "resume-summary"
  | "interview-feedback";

const ATS_MODEL = "gemini-2.5-flash";
const TEXT_MODEL = "gemini-2.5-flash";

const atsResponseSchema = {
  type: "OBJECT",
  properties: {
    parsed_resume: {
      type: "OBJECT",
      properties: {
        contact: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING" },
            email: { type: "STRING" },
            phone: { type: "STRING" },
            location: { type: "STRING" },
          },
        },
        headline: { type: "STRING" },
        summary: { type: "STRING" },
        skills: { type: "ARRAY", items: { type: "STRING" } },
        experience: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              job_title: { type: "STRING" },
              company: { type: "STRING" },
              start_date: { type: "STRING" },
              end_date: { type: "STRING" },
              bullets: { type: "ARRAY", items: { type: "STRING" } },
            },
          },
        },
        education: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              degree: { type: "STRING" },
              institute: { type: "STRING" },
              year: { type: "STRING" },
            },
          },
        },
        projects: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              name: { type: "STRING" },
              description: { type: "STRING" },
              tools: { type: "ARRAY", items: { type: "STRING" } },
            },
          },
        },
        certifications: { type: "ARRAY", items: { type: "STRING" } },
        additional_information: { type: "ARRAY", items: { type: "STRING" } },
        languages: { type: "ARRAY", items: { type: "STRING" } },
      },
    },
    revised_resume: {
      type: "OBJECT",
      properties: {
        contact: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING" },
            email: { type: "STRING" },
            phone: { type: "STRING" },
            location: { type: "STRING" },
          },
        },
        headline: { type: "STRING" },
        summary: { type: "STRING" },
        skills: { type: "ARRAY", items: { type: "STRING" } },
        experience: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              job_title: { type: "STRING" },
              company: { type: "STRING" },
              start_date: { type: "STRING" },
              end_date: { type: "STRING" },
              bullets: { type: "ARRAY", items: { type: "STRING" } },
            },
          },
        },
        education: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              degree: { type: "STRING" },
              institute: { type: "STRING" },
              year: { type: "STRING" },
            },
          },
        },
        projects: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              name: { type: "STRING" },
              description: { type: "STRING" },
              tools: { type: "ARRAY", items: { type: "STRING" } },
            },
          },
        },
        certifications: { type: "ARRAY", items: { type: "STRING" } },
        additional_information: { type: "ARRAY", items: { type: "STRING" } },
        languages: { type: "ARRAY", items: { type: "STRING" } },
      },
    },
    keyword_analysis: {
      type: "OBJECT",
      properties: {
        required_keywords: { type: "ARRAY", items: { type: "STRING" } },
        matched_keywords: { type: "ARRAY", items: { type: "STRING" } },
        missing_keywords: { type: "ARRAY", items: { type: "STRING" } },
        inserted_keywords: { type: "ARRAY", items: { type: "STRING" } },
        manual_review_keywords: { type: "ARRAY", items: { type: "STRING" } },
      },
    },
    patches: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          patch_id: { type: "STRING" },
          target_section: { type: "STRING" },
          target_item_id: { type: "STRING" },
          issue_type: { type: "STRING" },
          operation: { type: "STRING" },
          anchor_text: { type: "STRING" },
          original_text: { type: "STRING" },
          replacement_text: { type: "STRING" },
          explanation: { type: "STRING" },
          inserted_keywords: { type: "ARRAY", items: { type: "STRING" } },
          confidence: { type: "NUMBER" },
          apply_by_default: { type: "BOOLEAN" },
          requires_manual_review: { type: "BOOLEAN" },
        },
      },
    },
    manual_review_patches: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          patch_id: { type: "STRING" },
          target_section: { type: "STRING" },
          target_item_id: { type: "STRING" },
          issue_type: { type: "STRING" },
          operation: { type: "STRING" },
          anchor_text: { type: "STRING" },
          original_text: { type: "STRING" },
          replacement_text: { type: "STRING" },
          explanation: { type: "STRING" },
          inserted_keywords: { type: "ARRAY", items: { type: "STRING" } },
          confidence: { type: "NUMBER" },
          apply_by_default: { type: "BOOLEAN" },
          requires_manual_review: { type: "BOOLEAN" },
        },
      },
    },
    template_recommendation: {
      type: "OBJECT",
      properties: {
        template_id: { type: "STRING" },
        reason: { type: "STRING" },
      },
    },
    warnings: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["parsed_resume", "revised_resume", "keyword_analysis", "patches", "manual_review_patches", "template_recommendation", "warnings"],
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

const SCORING_VERSION = "ats_v1";

type ResumePatch = {
  patch_id?: string;
  target_section?: string;
  target_item_id?: string;
  issue_type?: string;
  operation?: string;
  anchor_text?: string;
  original_text?: string;
  replacement_text?: string;
  explanation?: string;
  inserted_keywords?: string[];
  confidence?: number;
  apply_by_default?: boolean;
  requires_manual_review?: boolean;
};

type StructuredResume = {
  contact?: { name?: string; email?: string; phone?: string; location?: string };
  headline?: string;
  summary?: string;
  skills?: string[];
  experience?: Array<{
    id?: string;
    job_title?: string;
    company?: string;
    start_date?: string;
    end_date?: string;
    bullets?: string[];
  }>;
  education?: Array<{ id?: string; degree?: string; institute?: string; year?: string }>;
  projects?: Array<{ id?: string; name?: string; description?: string; tools?: string[] }>;
  certifications?: string[];
  additional_information?: string[];
  languages?: string[];
};

type KeywordAnalysis = {
  required_keywords?: string[];
  matched_keywords?: string[];
  missing_keywords?: string[];
  inserted_keywords?: string[];
  manual_review_keywords?: string[];
};

type GeminiAtsResult = {
  parsed_resume?: StructuredResume;
  revised_resume?: StructuredResume;
  keyword_analysis?: KeywordAnalysis;
  patches?: ResumePatch[];
  manual_review_patches?: ResumePatch[];
  template_recommendation?: { template_id?: string; reason?: string };
  warnings?: string[];
};

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const uniq = (items: unknown[]) => Array.from(new Set(
  items
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean),
));

const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const textIncludes = (haystack: string, needle = "") => {
  const normalizedNeedle = needle.replace(/\s+/g, " ").trim().toLowerCase();
  if (!normalizedNeedle) return false;
  return haystack.replace(/\s+/g, " ").toLowerCase().includes(normalizedNeedle);
};

const flattenResumeText = (resume: StructuredResume = {}) => {
  const chunks: string[] = [
    resume.contact?.name,
    resume.contact?.email,
    resume.contact?.phone,
    resume.contact?.location,
    resume.headline,
    resume.summary,
    ...(resume.skills ?? []),
    ...(resume.certifications ?? []),
    ...(resume.additional_information ?? []),
    ...(resume.languages ?? []),
  ].filter((value): value is string => Boolean(value));

  (resume.experience ?? []).forEach((item) => {
    chunks.push(item.job_title ?? "", item.company ?? "", item.start_date ?? "", item.end_date ?? "", ...(item.bullets ?? []));
  });

  (resume.education ?? []).forEach((item) => {
    chunks.push(item.degree ?? "", item.institute ?? "", item.year ?? "");
  });

  (resume.projects ?? []).forEach((item) => {
    chunks.push(item.name ?? "", item.description ?? "", ...(item.tools ?? []));
  });

  return chunks.join("\n");
};

const sanitizePatch = (patch: ResumePatch, index: number): ResumePatch => ({
  patch_id: patch.patch_id || crypto.randomUUID(),
  target_section: patch.target_section || "additional_information",
  target_item_id: patch.target_item_id || "",
  issue_type: patch.issue_type || "formatting_issue",
  operation: patch.operation || "replace",
  anchor_text: patch.anchor_text || patch.original_text || "",
  original_text: patch.original_text || patch.anchor_text || "",
  replacement_text: patch.replacement_text || "",
  explanation: patch.explanation || `Suggested resume improvement #${index + 1}.`,
  inserted_keywords: uniq(asArray(patch.inserted_keywords)),
  confidence: Math.max(0, Math.min(1, Number(patch.confidence ?? 0.6))),
  apply_by_default: patch.apply_by_default !== false,
  requires_manual_review: patch.requires_manual_review === true,
});

const splitPatchesBySafety = (patches: ResumePatch[] = [], resume: StructuredResume = {}) => {
  const resumeText = flattenResumeText(resume);
  const safe: ResumePatch[] = [];
  const manual: ResumePatch[] = [];

  patches.map(sanitizePatch).forEach((patch) => {
    const replacement = patch.replacement_text?.trim() || "";
    const original = patch.original_text?.trim() || "";
    const anchor = patch.anchor_text?.trim() || original;
    const sameText = original && replacement && original.toLowerCase() === replacement.toLowerCase();
    const anchorFound = textIncludes(resumeText, original) || textIncludes(resumeText, anchor);
    const dateNeedsReview = patch.issue_type === "date_issue" && /\[|actual|unknown|verify|confirm/i.test(replacement);
    const shouldApply = patch.apply_by_default && !patch.requires_manual_review && replacement && !sameText && anchorFound && !dateNeedsReview;

    if (shouldApply) {
      safe.push({ ...patch, requires_manual_review: false });
    } else {
      manual.push({ ...patch, apply_by_default: false, requires_manual_review: true });
    }
  });

  return { safe, manual };
};

const scoreResume = (resume: StructuredResume = {}, keywordAnalysis: KeywordAnalysis = {}, hasJD: boolean) => {
  const resumeText = flattenResumeText(resume).toLowerCase();
  let score = 0;

  const contact = resume.contact ?? {};
  if (contact.name) score += 8;
  if (contact.email && /@/.test(contact.email)) score += 7;
  if (contact.phone) score += 5;
  if (contact.location) score += 4;
  if ((resume.headline ?? "").trim().length >= 3) score += 6;
  if ((resume.summary ?? "").trim().split(/\s+/).length >= 25) score += 12;

  const experience = resume.experience ?? [];
  const bulletCount = experience.reduce((total, item) => total + (item.bullets ?? []).filter((bullet) => bullet.trim().length >= 20).length, 0);
  if (experience.length > 0) score += 10;
  score += Math.min(16, bulletCount * 3);

  if ((resume.skills ?? []).length >= 6) score += 12;
  else score += Math.min(8, (resume.skills ?? []).length * 2);
  if ((resume.education ?? []).length > 0) score += 8;
  if ((resume.projects ?? []).length > 0) score += 5;
  if ((resume.certifications ?? []).length > 0) score += 3;
  if ((resume.languages ?? []).length > 0) score += 2;

  const requiredKeywords = uniq(asArray(keywordAnalysis.required_keywords));
  if (hasJD && requiredKeywords.length > 0) {
    const matched = requiredKeywords.filter((keyword) => resumeText.includes(keyword.toLowerCase()));
    score += Math.min(20, Math.round((matched.length / requiredKeywords.length) * 20));
  } else {
    score += Math.min(10, uniq([...(resume.skills ?? []), ...asArray(keywordAnalysis.matched_keywords)]).length);
  }

  return clampScore(score);
};

const buildSectionScores = (resume: StructuredResume = {}) => ({
  summary: clampScore(((resume.summary ?? "").trim().split(/\s+/).length / 45) * 100),
  experience: clampScore(((resume.experience ?? []).reduce((total, item) => total + (item.bullets ?? []).length, 0) / 8) * 100),
  education: clampScore((resume.education ?? []).length > 0 ? 90 : 20),
  skills: clampScore(((resume.skills ?? []).length / 10) * 100),
});

const buildOptimizationPlan = (patches: ResumePatch[], manualPatches: ResumePatch[], keywordAnalysis: KeywordAnalysis = {}) => {
  return uniq([
    ...patches.map((patch) => patch.explanation ?? ""),
    ...manualPatches.map((patch) => patch.explanation ?? ""),
    ...(keywordAnalysis.manual_review_keywords ?? []).map((keyword) => `Manual review required: add ${keyword} only if you have real experience.`),
  ]).slice(0, 8);
};

const buildIssues = (patches: ResumePatch[]) => patches.slice(0, 8).map((patch) => ({
  title: patch.issue_type?.replace(/_/g, " ") || "Resume improvement",
  location: patch.target_section || "resume",
  description: patch.explanation || "Suggested resume improvement.",
  highlight: patch.original_text || patch.anchor_text || "",
  suggestion: patch.replacement_text
    ? `Replace "${patch.original_text || patch.anchor_text}" with "${patch.replacement_text}".`
    : patch.explanation || "Review this item manually.",
  severity: patch.requires_manual_review ? "warning" : "info",
}));

const saveResumeRevision = async (userId: string, params: {
  sourceType: string;
  jobDescription: string;
  originalResumeData: StructuredResume;
  revisedResumeData: StructuredResume;
  appliedPatches: ResumePatch[];
  manualReviewPatches: ResumePatch[];
  insertedKeywords: string[];
  currentScore: number;
  afterChangesScore: number;
  templateId: string;
}) => {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("resume_revisions")
      .insert({
        user_id: userId,
        source_type: params.sourceType,
        job_description: params.jobDescription || null,
        original_resume_data: params.originalResumeData,
        revised_resume_data: params.revisedResumeData,
        applied_patches: params.appliedPatches,
        manual_review_patches: params.manualReviewPatches,
        inserted_keywords: params.insertedKeywords,
        template_id: params.templateId,
        current_score: params.currentScore,
        after_changes_score: params.afterChangesScore,
        scoring_version: SCORING_VERSION,
      })
      .select("id")
      .single();

    if (error) throw error;
    return data?.id as string | undefined;
  } catch (error) {
    console.error("Could not save resume revision", error);
    return undefined;
  }
};

async function runAtsAnalysis(userId: string, payload: Record<string, unknown>) {
  const file = payload.file as { mimeType?: string; data?: string; name?: string } | undefined;
  const jobDescription = typeof payload.jobDescription === "string" ? payload.jobDescription : "";
  const jobRole = typeof payload.jobRole === "string" ? payload.jobRole : "";
  const generateRevisedDraft = payload.generateRevisedDraft !== false;

  if (!file?.data) {
    throw new Response(JSON.stringify({ error: "Resume file data is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const hasJD = jobDescription.trim().length > 0;
  const hasRole = jobRole.trim().length > 0;
  const confidenceLevel = hasJD ? "High" : hasRole ? "Medium" : "Low";
  const promptText = `Analyze this resume and return a structured NextStep resume enhancement payload.

Required workflow:
- Parse the original resume into structured JSON.
- Generate a complete revised ATS-friendly CV draft only from real resume facts.
- Return machine-readable patch objects for every proposed change.
- Include keywords naturally only when supported by the resume. Unproven keywords must go to manual_review_keywords and manual_review_patches.
- Do not assign final scores, scoring points, readiness numbers, or numeric grades. Backend code will calculate all scores.
- Do not invent employers, dates, degrees, certifications, achievements, metrics, or tools.
- Do not remove useful resume facts.
- Do not return markdown. Return JSON only.`;

  const parts: unknown[] = [
    {
      inlineData: {
        mimeType: file.mimeType || "application/pdf",
        data: file.data,
      },
    },
    { text: promptText },
  ];

  if (hasRole) {
    parts.push({ text: `TARGET JOB ROLE:\n${jobRole}` });
  }

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
        text: `You are NextStep's resume enhancement engine. Return JSON only. Do not assign final scores or numeric scoring points. Do not invent facts. Do not invent dates, employers, degrees, certifications, achievements, or metrics. Only use the user's resume, job role, and job description. You may improve wording, formatting, keyword placement, summary, and bullet clarity. If a correction requires unknown information, mark it as manual review. Do not remove any useful AI capability. Only prevent AI from inventing the final score.

Patch rules:
- Each patch must include patch_id, target_section, issue_type, operation, anchor_text, original_text, replacement_text, explanation, inserted_keywords, confidence, apply_by_default, and requires_manual_review.
- Do not create a patch when replacement_text is the same as original_text.
- Date corrections must require manual review unless the correct date is explicitly present in the resume.
- If a keyword is not clearly supported by the resume, do not insert it automatically; add it to manual_review_keywords and create a manual_review_patch.
- Use template_id "nextstep-ats-modern" unless there is a strong reason not to.
- generateRevisedDraft=${generateRevisedDraft ? "true" : "false"}.`,
      }],
    },
  };

  const text = await generateGeminiContent(request);
  const aiResult = JSON.parse(text) as GeminiAtsResult;
  const parsedResume = aiResult.parsed_resume ?? {};
  const keywordAnalysis = aiResult.keyword_analysis ?? {};
  const generatedPatches = Array.isArray(aiResult.patches) ? aiResult.patches : [];
  const { safe: appliedPatches, manual: unsafePatches } = splitPatchesBySafety(generatedPatches, parsedResume);
  const manualReviewPatches = [
    ...unsafePatches,
    ...(Array.isArray(aiResult.manual_review_patches) ? aiResult.manual_review_patches.map(sanitizePatch) : []),
  ];
  const revisedResume = generateRevisedDraft ? (aiResult.revised_resume ?? parsedResume) : parsedResume;
  const currentScore = scoreResume(parsedResume, keywordAnalysis, hasJD);
  const afterChangesScore = Math.max(currentScore, scoreResume(revisedResume, keywordAnalysis, hasJD));
  const sectionScores = buildSectionScores(parsedResume);
  const revisedSectionScores = buildSectionScores(revisedResume);
  const insertedKeywords = uniq([
    ...asArray(keywordAnalysis.inserted_keywords),
    ...appliedPatches.flatMap((patch) => patch.inserted_keywords ?? []),
  ]);
  const templateId = aiResult.template_recommendation?.template_id || "nextstep-ats-modern";
  const revisionId = await saveResumeRevision(userId, {
    sourceType: file.mimeType?.includes("pdf") ? "uploaded_pdf" : file.mimeType?.includes("word") ? "uploaded_docx" : "pasted_text",
    jobDescription,
    originalResumeData: parsedResume,
    revisedResumeData: revisedResume,
    appliedPatches,
    manualReviewPatches,
    insertedKeywords,
    currentScore,
    afterChangesScore,
    templateId,
  });

  const result = {
    overallScore: currentScore,
    matchScore: hasJD ? currentScore : 0,
    currentScore,
    afterChangesScore,
    projectedScore: afterChangesScore,
    confidenceLevel,
    scoringVersion: SCORING_VERSION,
    sectionScores,
    revisedSectionScores,
    formattingScore: Math.round((sectionScores.summary + sectionScores.experience + sectionScores.skills) / 3),
    keywordScore: hasJD ? clampScore(((keywordAnalysis.matched_keywords ?? []).length / Math.max(1, (keywordAnalysis.required_keywords ?? []).length)) * 100) : sectionScores.skills,
    detectedKeywords: uniq([...(keywordAnalysis.matched_keywords ?? []), ...((parsedResume.skills ?? []) as string[])]).slice(0, 20),
    missingKeywords: uniq(keywordAnalysis.missing_keywords ?? []),
    suggestedKeywords: uniq(keywordAnalysis.required_keywords ?? []),
    insertedKeywords,
    manualReviewKeywords: uniq(keywordAnalysis.manual_review_keywords ?? []),
    optimizationPlan: buildOptimizationPlan(appliedPatches, manualReviewPatches, keywordAnalysis),
    improvedSummary: revisedResume.summary ?? "",
    readinessSummary: hasJD
      ? "NextStep compared the resume with the target job description and prepared a revised ATS-friendly draft."
      : "NextStep reviewed the resume for ATS structure and prepared a general revised ATS-friendly draft.",
    issues: buildIssues([...appliedPatches, ...manualReviewPatches]),
    parsedResumeData: parsedResume,
    revisedResumeData: revisedResume,
    patches: appliedPatches,
    manualReviewPatches,
    templateId,
    templateRecommendation: aiResult.template_recommendation ?? { template_id: templateId, reason: "Clean ATS-friendly NextStep template." },
    warnings: aiResult.warnings ?? [],
    revisionId,
  };

  await recordUsage({
    userId,
    feature: "ats-analysis",
    model: ATS_MODEL,
    inputBytes: byteLength(request),
    outputBytes: byteLength(text),
    metadata: { hasJobDescription: hasJD, hasJobRole: hasRole, fileName: file.name ?? null, generatedRevisedDraft, revisionId: revisionId ?? null },
  });

  return result;
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
