import { errorResponse, handleOptions, jsonResponse, logError } from "../_shared/cors.ts";
import { generateGeminiContent } from "../_shared/gemini.ts";
import { checkRateLimit, getServiceClient, requireUser } from "../_shared/supabase.ts";

const ATS_MODEL = "gemini-2.5-flash";
const SCORING_VERSION = "ats_v1";

// ---------- helpers ----------

/** Normalize a string for hashing: lowercase, collapse whitespace, trim. */
function normalizeForHash(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/** SHA-256 hex digest (Deno/Web Crypto). */
async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Normalize, deduplicate, and sort a string array (case-insensitive). */
function normalizeStringArray(arr: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of arr) {
    const key = String(item).trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(key);
    }
  }
  return result.sort();
}

/** Validate that a string looks like a UUID v4. */
function isValidUUID(s: unknown): boolean {
  return typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

/** Safe number: returns 0 if the value is NaN, null, or undefined. */
function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function uniqStrings(arr: unknown[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of arr) {
    const value = String(item ?? "").trim();
    const key = value.toLowerCase();
    if (value && !seen.has(key)) {
      seen.add(key);
      result.push(value);
    }
  }
  return result;
}

function splitLines(text: string): string[] {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function parseStructuredResume(text: string, aiResult: Record<string, any>) {
  const lines = splitLines(text);
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
  const phone = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() || "";
  const name = lines.find((line) => !line.includes("@") && !/\d{4,}/.test(line) && line.length <= 60) || "Revised Resume";
  const skills = uniqStrings([
    ...(Array.isArray(aiResult.matched_skills) ? aiResult.matched_skills : []),
    ...(Array.isArray(aiResult.matched_keywords) ? aiResult.matched_keywords : []),
  ]).slice(0, 16);
  const bullets = lines
    .filter((line) => /^[-*•]|\b(managed|led|created|designed|developed|implemented|improved|coordinated|handled)\b/i.test(line))
    .map((line) => line.replace(/^[-*•]\s*/, ""))
    .slice(0, 8);

  return {
    contact: { name, email, phone, location: "" },
    headline: "",
    summary: typeof aiResult.improved_summary_suggestion === "string" ? aiResult.improved_summary_suggestion : "",
    skills,
    experience: bullets.length > 0 ? [{
      id: crypto.randomUUID(),
      job_title: "",
      company: "",
      start_date: "",
      end_date: "",
      bullets,
    }] : [],
    education: [],
    projects: [],
    certifications: [],
    additional_information: [],
    languages: [],
  };
}

function issueToPatch(issue: Record<string, any>, index: number) {
  const confidenceText = String(issue.confidence || "medium").toLowerCase();
  const confidence = confidenceText === "high" ? 0.9 : confidenceText === "low" ? 0.35 : 0.65;
  const requiresManualReview = issue.apply_by_default === false || !String(issue.replacement_text || "").trim();

  return {
    patch_id: crypto.randomUUID(),
    target_section: String(issue.target_section || issue.location || "other"),
    target_item_id: "",
    issue_type: String(issue.issue_type || "formatting_issue"),
    operation: "replace",
    anchor_text: String(issue.original_text || issue.highlight || ""),
    original_text: String(issue.original_text || issue.highlight || ""),
    replacement_text: String(issue.replacement_text || ""),
    explanation: String(issue.explanation || issue.description || issue.suggestion || `Suggested resume improvement #${index + 1}.`),
    inserted_keywords: [],
    confidence,
    apply_by_default: !requiresManualReview,
    requires_manual_review: requiresManualReview,
  };
}

function applyTextPatches(text: string, patches: Array<Record<string, any>>) {
  return patches.reduce((draft, patch) => {
    const original = String(patch.original_text || "");
    const replacement = String(patch.replacement_text || "");
    if (!original || !replacement || !draft.includes(original)) return draft;
    return draft.replace(original, replacement);
  }, text);
}

function buildRevisedResumeData(originalText: string, aiResult: Record<string, any>, safePatches: Array<Record<string, any>>, insertedKeywords: string[]) {
  const revisedText = applyTextPatches(originalText, safePatches);
  const parsed = parseStructuredResume(originalText, aiResult);
  const revised = parseStructuredResume(revisedText, aiResult);
  revised.summary = typeof aiResult.improved_summary_suggestion === "string" && aiResult.improved_summary_suggestion.trim()
    ? aiResult.improved_summary_suggestion.trim()
    : parsed.summary;
  revised.skills = uniqStrings([...(revised.skills || []), ...insertedKeywords]).slice(0, 18);

  if (Array.isArray(aiResult.better_bullet_suggestions) && aiResult.better_bullet_suggestions.length > 0) {
    revised.experience = [{
      id: crypto.randomUUID(),
      job_title: parsed.experience?.[0]?.job_title || "",
      company: parsed.experience?.[0]?.company || "",
      start_date: "",
      end_date: "",
      bullets: aiResult.better_bullet_suggestions
        .map((item: Record<string, unknown>) => String(item.improved || "").trim())
        .filter(Boolean)
        .slice(0, 8),
    }];
  }

  return { parsed, revised };
}

async function saveResumeRevision(params: {
  userId: string;
  sourceType: string;
  jobRole: string;
  jobDescription: string;
  parsedResumeData: Record<string, unknown>;
  revisedResumeData: Record<string, unknown>;
  appliedPatches: Array<Record<string, unknown>>;
  manualReviewPatches: Array<Record<string, unknown>>;
  insertedKeywords: string[];
  currentScore: number;
  afterChangesScore: number;
}) {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("resume_revisions")
      .insert({
        user_id: params.userId,
        source_type: params.sourceType,
        target_job_role: params.jobRole || null,
        job_description: params.jobDescription || null,
        original_resume_data: params.parsedResumeData,
        revised_resume_data: params.revisedResumeData,
        applied_patches: params.appliedPatches,
        manual_review_patches: params.manualReviewPatches,
        inserted_keywords: params.insertedKeywords,
        template_id: "nextstep-ats-modern",
        current_score: params.currentScore,
        after_changes_score: params.afterChangesScore,
        scoring_version: SCORING_VERSION,
      })
      .select("id")
      .single();

    if (error) throw error;
    return data?.id as string | undefined;
  } catch (error) {
    logError("Resume revision save failed", error, crypto.randomUUID());
    return undefined;
  }
}

// ---------- Gemini schema ----------

const analyzeResumeSchema = {
  type: "OBJECT",
  properties: {
    matched_keywords: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Keywords from the job description/role that are present in the resume."
    },
    missing_keywords: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Important keywords from the job description/role that are missing or underrepresented in the resume."
    },
    required_keywords: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "All critical keywords required for the job description/role (should be union of matched and missing)."
    },
    matched_skills: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Skills from the job description/role that are present in the resume."
    },
    missing_skills: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Important skills from the job description/role that are missing in the resume."
    },
    required_skills: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "All critical skills required for the job description/role (should be union of matched and missing)."
    },
    resume_sections_found: {
      type: "OBJECT",
      properties: {
        contact: { type: "BOOLEAN", description: "True if contact details section (email, phone, etc.) is found." },
        summary: { type: "BOOLEAN", description: "True if professional summary or objective is found." },
        skills: { type: "BOOLEAN", description: "True if skills section is found." },
        experience: { type: "BOOLEAN", description: "True if work experience section is found." },
        projects: { type: "BOOLEAN", description: "True if projects section is found." },
        education: { type: "BOOLEAN", description: "True if education section is found." },
        certifications: { type: "BOOLEAN", description: "True if certifications or extra sections are found." }
      },
      required: ["contact", "summary", "skills", "experience", "projects", "education", "certifications"]
    },
    formatting_issues: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Formatting issues found in the resume. Must only be items from: ['complex_tables_detected', 'image_heavy_or_unreadable', 'missing_clear_headings', 'very_long_paragraphs', 'unusual_symbols_or_formatting_noise', 'poor_text_extraction_quality']."
    },
    achievement_quality: {
      type: "OBJECT",
      properties: {
        has_numbers: { type: "BOOLEAN", description: "True if measurable numbers, metrics, or percentages are found in achievements." },
        has_action_verbs: { type: "BOOLEAN", description: "True if strong action verbs are used in bullet points." },
        has_impact_statements: { type: "BOOLEAN", description: "True if achievements show clear impact or result-based statements." },
        examples_found: { type: "ARRAY", items: { type: "STRING" }, description: "Examples of good or weak achievements from the resume." }
      },
      required: ["has_numbers", "has_action_verbs", "has_impact_statements", "examples_found"]
    },
    experience_relevance: {
      type: "OBJECT",
      properties: {
        label: { type: "STRING", description: "Relevance of candidate's experience to the target role/job: high, medium, low, not_found" },
        reasons: { type: "ARRAY", items: { type: "STRING" }, description: "Specific observations explaining this relevance rating." }
      },
      required: ["label", "reasons"]
    },
    suggestions: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Specific, actionable improvement suggestions for the resume."
    },
    better_bullet_suggestions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          original: { type: "STRING", description: "The original bullet point text exactly as it appears in the resume." },
          improved: { type: "STRING", description: "The improved and rewritten bullet point text." }
        },
        required: ["original", "improved"]
      },
      description: "Examples of rewritten bullet points showing before/after improvement."
    },
    improved_summary_suggestion: {
      type: "STRING",
      description: "A rewritten professional summary/objective for the resume."
    },
    section_wise_guidance: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Section-wise tips and suggestions for polishing the resume."
    },
    issues: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          target_section: { type: "STRING", description: "Which resume section this issue is in: experience, summary, skills, education, projects, certifications, awards, contact, other." },
          issue_type: { type: "STRING", description: "Category: weak_bullet, missing_keyword, future_date, formatting, grammar, vague_statement, missing_metric, other." },
          original_text: { type: "STRING", description: "The exact text snippet from the resume that needs changing. Must match the resume text exactly." },
          replacement_text: { type: "STRING", description: "The exact replacement text. For date issues where the correct date is unknown, leave this as an empty string." },
          explanation: { type: "STRING", description: "Human-readable explanation of why this change is suggested." },
          confidence: { type: "STRING", description: "How confident this change is correct: high, medium, low." },
          apply_by_default: { type: "BOOLEAN", description: "true if this is a safe, non-destructive change. false for date corrections, uncertain changes, or when the correct replacement is unknown." },
          severity: { type: "STRING", description: "One of: critical, warning, info." },
        },
        required: ["target_section", "issue_type", "original_text", "replacement_text", "explanation", "confidence", "apply_by_default", "severity"],
      },
      description: "Machine-readable patches for CV text changes. Each issue must have exact original_text and replacement_text. For date issues where the correct date is unknown, set replacement_text to empty string and apply_by_default to false. If there are no issues, return an empty array."
    }
  },
  required: [
    "matched_keywords", "missing_keywords", "required_keywords",
    "matched_skills", "missing_skills", "required_skills",
    "resume_sections_found", "formatting_issues", "achievement_quality",
    "experience_relevance", "suggestions", "better_bullet_suggestions",
    "improved_summary_suggestion", "section_wise_guidance", "issues"
  ]
};

// ---------- main handler ----------

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  try {
    if (req.method !== "POST") {
      return errorResponse("Method not allowed.", 405, requestId);
    }

    // 1. Validate the authenticated user.
    const user = await requireUser(req);

    // Rate Limit Check
    await checkRateLimit(user.id, "ats-analysis", 10, 60 * 60);

    const payload = await req.json();
    const {
      resumeText = "",
      jobDescription = "",
      jobRole = "",
      resumeId = null,
      file = null,
      retry_save = false,
      retry_payload = null,
    } = payload;

    // ---------- RETRY SAVE PATH ----------
    // If the frontend is retrying a failed save, we skip Gemini and just re-save.
    if (retry_save && retry_payload) {
      const supabase = getServiceClient();
      const retryData = {
        ...retry_payload,
        user_id: user.id, // always enforce the authenticated user
      };
      // Remove fields that aren't DB columns
      delete retryData.warning;
      delete retryData.save_failed;
      delete retryData.id;
      delete retryData.created_at;
      delete retryData.score;
      delete retryData.projectedScore;
      delete retryData.strengths;
      delete retryData.missingKeywords;
      delete retryData.improvedSummary;
      delete retryData.mode;

      const { data: dbData, error: dbError } = await supabase
        .from("ats_scans")
        .insert(retryData)
        .select("id, created_at")
        .single();

      if (dbError) {
        logError("Retry save failed", { message: dbError.message, code: dbError.code, details: dbError.details, hint: dbError.hint }, requestId);
        return jsonResponse({ save_failed: true, error: dbError.message }, 200);
      }

      return jsonResponse({ save_failed: false, id: dbData.id, created_at: dbData.created_at });
    }

    // ---------- NORMAL ANALYSIS PATH ----------

    // 2. Validate that resumeText or file exists.
    if ((!resumeText || typeof resumeText !== "string" || resumeText.trim().length === 0) && !file?.data) {
      return errorResponse("Resume text or file payload is required.", 400, requestId);
    }

    // Determine Confidence Level
    let confidence_level = "Low";
    if (jobDescription.trim().length > 0) {
      confidence_level = "High";
    } else if (jobRole.trim().length > 0) {
      confidence_level = "Medium";
    }

    // 3. Generate scan hash for caching / determinism.
    const hashInput = [
      normalizeForHash(resumeText || ""),
      normalizeForHash(jobDescription || ""),
      normalizeForHash(jobRole || ""),
      SCORING_VERSION,
    ].join("|");
    const scan_hash = file?.data ? null : await sha256(hashInput); // skip cache for file uploads (binary content varies)

    // 3b. Check cache: if same user + same hash already exists, return saved result.
    if (scan_hash) {
      const supabase = getServiceClient();
      const { data: cached } = await supabase
        .from("ats_scans")
        .select("*")
        .eq("user_id", user.id)
        .eq("scan_hash", scan_hash)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cached) {
        return jsonResponse({
          ...cached,
          projected_score: cached.projected_score ?? cached.final_score,
          scoring_version: cached.scoring_version ?? SCORING_VERSION,
          cached: true,
          warning: undefined,
          save_failed: false,
        });
      }
    }

    // 4. Build the system and user prompts.
    const todayISO = new Date().toISOString().split("T")[0]; // e.g. "2026-06-29"

    const systemInstruction = `You are a professional ATS resume scanner and Career Coach.
You perform deep resume analysis, keyword extraction, and skill relevance assessments.

TODAY'S DATE: ${todayISO}

Rules for your analysis:
1. If a Job Description is provided, extract required keywords and skills directly from it. Compare it with the resume text.
2. If ONLY a Job Role is provided, extract keywords and skills that are typically required for that target role. Compare it with the resume text.
3. If NEITHER Job Description nor Job Role is provided, run a general ATS readiness analysis. Infer the candidate's target field from the resume text and list appropriate general keywords/skills.
4. For formatting_issues, check for common ATS hurdles. Identify and list items from: ['complex_tables_detected', 'image_heavy_or_unreadable', 'missing_clear_headings', 'very_long_paragraphs', 'unusual_symbols_or_formatting_noise', 'poor_text_extraction_quality'] if applicable.
5. In achievement_quality, check for measurable numbers, strong action verbs, and impact-based statements in the bullet points. Provide specific examples found.
6. Assess experience_relevance of the resume context to the job role/description, labeling it 'high', 'medium', 'low', or 'not_found'.
7. Provide actionable suggestions, better bullet points, an improved summary, and section-by-section guidance.

DATE HANDLING RULES — VERY IMPORTANT:
- The current date is ${todayISO}. Only flag a date as a "future date" if it is STRICTLY AFTER ${todayISO}.
- For ambiguous numeric dates like 02-06-2025, assume DD-MM-YYYY format (day-month-year, Indian/European convention) unless context clearly indicates otherwise.
- If an employment entry says "StartDate – Present" and the start date is NOT in the future, this is valid. Do NOT flag it as a future date issue.
- If a start date IS in the future (after ${todayISO}), flag it, but do NOT invent a replacement date. Set replacement_text to an empty string and apply_by_default to false.
- For future-dated awards: flag them but do NOT suggest a fake past year. Set replacement_text to an empty string and apply_by_default to false.
- NEVER invent or guess the correct date. If the correct date is unknown, leave replacement_text empty.

ISSUES RULES:
- Each issue must have original_text that exactly matches text in the resume.
- replacement_text must be the exact drop-in replacement. For uncertain changes (dates, context-dependent), set replacement_text to empty string.
- Set apply_by_default to true ONLY for safe, non-destructive text improvements (grammar fixes, keyword additions, bullet rewrites). Set it to false for date corrections, removals, or any change where the correct value is uncertain.
- Do NOT output an issue if original_text equals replacement_text (no actual change).

Do not generate the final score. Do not estimate any score. Do not assign points. Only return structured analysis data. The backend scoring engine will calculate all scores. Do not remove any useful AI capability. Only prevent AI from inventing the final score.`;

    const parts: unknown[] = [];
    if (file?.data) {
      parts.push({
        inlineData: {
          mimeType: file.mimeType || "application/pdf",
          data: file.data,
        },
      });
    }

    const detailsPrompt = `Below are the details for analysis.
${jobDescription.trim() ? `JOB DESCRIPTION:\n${jobDescription.trim()}\n\n` : ""}${jobRole.trim() ? `JOB ROLE: ${jobRole.trim()}\n\n` : ""}${!file?.data ? `RESUME TEXT:\n${resumeText.trim()}\n\n` : ""}Analyze this resume and return the structured JSON object adhering exactly to the schema.`;

    parts.push({ text: detailsPrompt });

    let aiResult: Record<string, any>;
    let warning: string | undefined;

    try {
      // 5. Send to Gemini with temperature=0 for deterministic output.
      const text = await generateGeminiContent({
        model: ATS_MODEL,
        contents: [
          { role: "user", parts }
        ],
        responseMimeType: "application/json",
        responseSchema: analyzeResumeSchema,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        temperature: 0,
      });

      // 6. Safely parse AI JSON.
      aiResult = JSON.parse(text);
    } catch (err) {
      logError("Gemini analysis or JSON parse failed", err, requestId);
      aiResult = {};
      warning = "Some resume details could not be fully analyzed, so the score confidence is reduced.";
    }

    // 7. Normalize AI results with safe defaults, then normalize arrays for consistency.
    const matched_keywords = normalizeStringArray(
      Array.isArray(aiResult.matched_keywords) ? aiResult.matched_keywords : []
    );
    const missing_keywords = normalizeStringArray(
      Array.isArray(aiResult.missing_keywords) ? aiResult.missing_keywords : []
    );
    const required_keywords = normalizeStringArray(
      Array.isArray(aiResult.required_keywords) ? aiResult.required_keywords : []
    );
    const matched_skills = normalizeStringArray(
      Array.isArray(aiResult.matched_skills) ? aiResult.matched_skills : []
    );
    const missing_skills = normalizeStringArray(
      Array.isArray(aiResult.missing_skills) ? aiResult.missing_skills : []
    );
    const required_skills = normalizeStringArray(
      Array.isArray(aiResult.required_skills) ? aiResult.required_skills : []
    );

    const resume_sections_found = aiResult.resume_sections_found && typeof aiResult.resume_sections_found === "object" ? aiResult.resume_sections_found : {
      contact: false, summary: false, skills: false, experience: false, projects: false, education: false, certifications: false
    };

    const formatting_issues = Array.isArray(aiResult.formatting_issues) ? aiResult.formatting_issues : [];

    const achievement_quality = aiResult.achievement_quality && typeof aiResult.achievement_quality === "object" ? aiResult.achievement_quality : {
      has_numbers: false, has_action_verbs: false, has_impact_statements: false, examples_found: []
    };

    const experience_relevance = aiResult.experience_relevance && typeof aiResult.experience_relevance === "object" ? aiResult.experience_relevance : {
      label: "not_found", reasons: []
    };

    const suggestions = Array.isArray(aiResult.suggestions) ? aiResult.suggestions : [];
    const better_bullet_suggestions = Array.isArray(aiResult.better_bullet_suggestions) ? aiResult.better_bullet_suggestions : [];
    const improved_summary_suggestion = typeof aiResult.improved_summary_suggestion === "string" ? aiResult.improved_summary_suggestion : "";
    const section_wise_guidance = Array.isArray(aiResult.section_wise_guidance) ? aiResult.section_wise_guidance : [];

    // 7b. Post-process issues: filter out no-op and AI-invented-date issues.
    const rawIssues: any[] = Array.isArray(aiResult.issues) ? aiResult.issues : [];
    const issues = rawIssues.filter((issue) => {
      if (!issue || typeof issue !== "object") return false;
      const orig = String(issue.original_text || "").trim();
      const repl = String(issue.replacement_text || "").trim();
      // Guard: skip if original equals replacement (no actual change)
      if (orig && repl && orig === repl) return false;
      // Guard: for date issues, if AI invented a specific year not in the resume,
      // and apply_by_default is true, force it to false (safety)
      if (issue.issue_type === "future_date") {
        issue.apply_by_default = false;
        // If replacement_text has a specific year that looks invented, clear it
        if (repl && !resumeText.includes(repl)) {
          issue.replacement_text = "";
        }
      }
      return true;
    });

    if (Object.keys(aiResult).length === 0) {
      warning = "Some resume details could not be fully analyzed, so the score confidence is reduced.";
    }

    // ---------- SCORING (all backend, 6 categories, 100 pts total) ----------

    // 1. Keyword Score (30 pts)
    let totalReqKeywords = required_keywords.length;
    if (totalReqKeywords === 0) {
      totalReqKeywords = matched_keywords.length + missing_keywords.length;
    }
    const keyword_score = safeNum(totalReqKeywords > 0 ? (matched_keywords.length / totalReqKeywords) * 30 : 0);

    // 2. Skills Score (20 pts)
    let totalReqSkills = required_skills.length;
    if (totalReqSkills === 0) {
      totalReqSkills = matched_skills.length + missing_skills.length;
    }
    const skills_score = safeNum(totalReqSkills > 0 ? (matched_skills.length / totalReqSkills) * 20 : 0);

    // 3. Experience Score (15 pts)
    const expLabel = String(experience_relevance.label || "not_found").toLowerCase().trim();
    let experience_score = 0;
    if (expLabel === "high") experience_score = 15;
    else if (expLabel === "medium") experience_score = 9;
    else if (expLabel === "low") experience_score = 4;
    else experience_score = 0;

    // 4. Resume Structure Score (15 pts)
    let structure_score = 0;
    if (resume_sections_found.contact) structure_score += 3;
    if (resume_sections_found.summary) structure_score += 2;
    if (resume_sections_found.skills) structure_score += 3;
    if (resume_sections_found.experience || resume_sections_found.projects) structure_score += 3;
    if (resume_sections_found.education) structure_score += 2;
    if (resume_sections_found.certifications) structure_score += 2;

    // 5. ATS Formatting Score (10 pts) — starts at 10, deducts for issues
    let formatting_score = 10;
    const hasIssue = (pattern: string) =>
      formatting_issues.some((issue: string) => typeof issue === "string" && issue.toLowerCase().includes(pattern));
    if (hasIssue("table")) formatting_score -= 2;
    if (hasIssue("image") || hasIssue("unreadable")) formatting_score -= 3;
    if (hasIssue("heading")) formatting_score -= 2;
    if (hasIssue("paragraph")) formatting_score -= 1;
    if (hasIssue("symbol") || hasIssue("noise") || hasIssue("unusual")) formatting_score -= 1;
    if (hasIssue("extraction") || hasIssue("poor text")) formatting_score -= 3;
    formatting_score = Math.max(0, formatting_score);

    // 6. Achievement Quality Score (10 pts)
    let achievement_score = 0;
    if (achievement_quality.has_numbers) achievement_score += 4;
    if (achievement_quality.has_action_verbs) achievement_score += 3;
    if (achievement_quality.has_impact_statements) achievement_score += 3;

    // Final Score = sum of all 6 (max 100)
    const final_score = Math.round(
      safeNum(keyword_score) +
      safeNum(skills_score) +
      safeNum(experience_score) +
      safeNum(structure_score) +
      safeNum(formatting_score) +
      safeNum(achievement_score)
    );

    // Projected Score calculation
    const issuesCount = issues.length;
    const suggestionsCount = suggestions.length;
    const missingKeywordsCount = missing_keywords.length;
    const hasActionableChanges = issuesCount > 0 || missingKeywordsCount > 0 || suggestionsCount > 0;

    const improvementPotential = Math.min(45, (issuesCount * 5) + (missingKeywordsCount * 4) + (suggestionsCount * 3));
    const floorBoost = final_score < 50 ? 20 : final_score < 70 ? 14 : 8;
    const projected = final_score + floorBoost + improvementPotential;
    const competitiveFloor = hasActionableChanges ? 85 : projected;
    const projected_score = Math.max(0, Math.min(98, Math.max(projected, competitiveFloor)));

    const normalizedPatches = issues.map(issueToPatch);
    const safePatches = normalizedPatches.filter((patch) => {
      const original = String(patch.original_text || "");
      const replacement = String(patch.replacement_text || "");
      return patch.apply_by_default && original && replacement && original !== replacement && (resumeText || "").includes(original);
    });
    const manualReviewPatches = normalizedPatches
      .filter((patch) => !safePatches.some((safePatch) => safePatch.patch_id === patch.patch_id))
      .map((patch) => ({ ...patch, apply_by_default: false, requires_manual_review: true }));
    const inserted_keywords = uniqStrings([
      ...safePatches.flatMap((patch) => patch.inserted_keywords || []),
      ...matched_keywords.filter((keyword) => !(resumeText || "").toLowerCase().includes(keyword.toLowerCase())).slice(0, 6),
    ]);
    const manual_review_keywords = missing_keywords.slice(0, 12);
    const { parsed: parsed_resume_data, revised: revised_resume_data } = buildRevisedResumeData(
      resumeText || file?.name || "",
      {
        ...aiResult,
        matched_keywords,
        matched_skills,
        better_bullet_suggestions,
        improved_summary_suggestion,
      },
      safePatches,
      inserted_keywords,
    );
    const revision_id = await saveResumeRevision({
      userId: user.id,
      sourceType: file?.mimeType?.includes("pdf") ? "uploaded_pdf" : file?.mimeType?.includes("word") ? "uploaded_docx" : "pasted_text",
      jobRole,
      jobDescription,
      parsedResumeData: parsed_resume_data,
      revisedResumeData: revised_resume_data,
      appliedPatches: safePatches,
      manualReviewPatches,
      insertedKeywords: inserted_keywords,
      currentScore: final_score,
      afterChangesScore: projected_score,
    });

    // ---------- 8. Save the scan result in Supabase (with retry) ----------

    const supabase = getServiceClient();
    const scanData: Record<string, unknown> = {
      user_id: user.id,
      resume_id: isValidUUID(resumeId) ? resumeId : null,
      job_role: jobRole || null,
      job_description: jobDescription || null,
      final_score,
      confidence_level,
      keyword_score,
      skills_score,
      experience_score,
      structure_score,
      formatting_score,
      achievement_score,
      matched_keywords,
      missing_keywords,
      required_keywords,
      matched_skills,
      missing_skills,
      required_skills,
      resume_sections_found,
      formatting_issues,
      achievement_quality,
      experience_relevance,
      suggestions,
      better_bullet_suggestions,
      improved_summary_suggestion: improved_summary_suggestion || null,
      section_wise_guidance,
      issues,
      parsed_resume_data,
      revised_resume_data,
      patches: safePatches,
      manual_review_patches: manualReviewPatches,
      inserted_keywords,
      manual_review_keywords,
      revision_id: revision_id || null,
      template_id: "nextstep-ats-modern",
      scoring_version: SCORING_VERSION,
      scan_hash: scan_hash || null,
      projected_score,
    };

    let dbData: { id: string; created_at: string } | null = null;
    let save_failed = false;

    // Attempt 1
    const attempt1 = await supabase
      .from("ats_scans")
      .insert(scanData)
      .select("id, created_at")
      .single();

    if (attempt1.error) {
      logError("DB save attempt 1 failed", {
        message: attempt1.error.message,
        code: attempt1.error.code,
        details: attempt1.error.details,
        hint: attempt1.error.hint,
      }, requestId);

      // Wait 500ms and retry once
      await new Promise((r) => setTimeout(r, 500));

      const attempt2 = await supabase
        .from("ats_scans")
        .insert(scanData)
        .select("id, created_at")
        .single();

      if (attempt2.error) {
        logError("DB save attempt 2 failed", {
          message: attempt2.error.message,
          code: attempt2.error.code,
          details: attempt2.error.details,
          hint: attempt2.error.hint,
        }, requestId);
        save_failed = true;
        warning = "Your analysis is ready, but we could not save it to history. Please retry saving.";
      } else {
        dbData = attempt2.data;
      }
    } else {
      dbData = attempt1.data;
    }

    // 9. Return the complete result to the frontend.
    const responsePayload = {
      id: dbData?.id || crypto.randomUUID(),
      created_at: dbData?.created_at || new Date().toISOString(),
      ...scanData,
      projected_score,
      scoring_version: SCORING_VERSION,
      save_failed,
      warning,
    };

    return jsonResponse(responsePayload);
  } catch (error) {
    if (error instanceof Response) return error;
    logError("Resume analysis execution failed", error, requestId);
    return errorResponse("Resume analysis failed. Please try again later.", 500, requestId);
  }
});
