import { errorResponse, handleOptions, jsonResponse, logError } from "../_shared/cors.ts";
import { generateGeminiContent } from "../_shared/gemini.ts";
import { checkRateLimit, getServiceClient, requireUser } from "../_shared/supabase.ts";

const ATS_MODEL = "gemini-2.5-flash";

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
      items: { type: "STRING" },
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
          title: { type: "STRING" },
          location: { type: "STRING" },
          description: { type: "STRING" },
          highlight: { type: "STRING", description: "The specific text snippet with the issue" },
          suggestion: { type: "STRING", description: "Direct resume edit. Prefer 'Replace ... with ...' or 'Add ...'. Do not give vague advice." },
          severity: { type: "STRING", description: "One of: critical, warning, info" },
        },
        required: ["title", "location", "description", "highlight", "suggestion", "severity"],
      },
      description: "Direct suggestions for CV text changes. If none, return an empty array."
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
    const { resumeText = "", jobDescription = "", jobRole = "", resumeId = null, file = null } = payload;

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

    // Build the system and user prompts
    const systemInstruction = `You are a professional ATS resume scanner and Career Coach.
You perform deep resume analysis, keyword extraction, and skill relevance assessments.

Rules for your analysis:
1. If a Job Description is provided, extract required keywords and skills directly from it. Compare it with the resume text.
2. If ONLY a Job Role is provided, extract keywords and skills that are typically required for that target role. Compare it with the resume text.
3. If NEITHER Job Description nor Job Role is provided, run a general ATS readiness analysis. Infer the candidate's target field from the resume text and list appropriate general keywords/skills.
4. For formatting_issues, check for common ATS hurdles. Identify and list items from: ['complex_tables_detected', 'image_heavy_or_unreadable', 'missing_clear_headings', 'very_long_paragraphs', 'unusual_symbols_or_formatting_noise', 'poor_text_extraction_quality'] if applicable.
5. In achievement_quality, check for measurable numbers, strong action verbs, and impact-based statements in the bullet points. Provide specific examples found.
6. Assess experience_relevance of the resume context to the job role/description, labeling it 'high', 'medium', 'low', or 'not_found'.
7. Provide actionableSuggestions, better bullet points, an improved summary, and section-by-section guidance.

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
      // 4. Send resumeText/file + jobDescription/jobRole to Gemini.
      // 5. Instruct Gemini to return JSON only.
      // 6. Instruct Gemini not to generate or estimate any score.
      const text = await generateGeminiContent({
        model: ATS_MODEL,
        contents: [
          { role: "user", parts }
        ],
        responseMimeType: "application/json",
        responseSchema: analyzeResumeSchema,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        }
      });

      // 7. Safely parse AI JSON.
      aiResult = JSON.parse(text);
    } catch (err) {
      logError("Gemini analysis or JSON parse failed", err, requestId);
      // 8. If Gemini JSON is incomplete, use safe fallback values.
      aiResult = {};
      warning = "Some resume details could not be fully analyzed, so the score confidence is reduced.";
    }

    // Normalize AI results with safe defaults
    const matched_keywords = Array.isArray(aiResult.matched_keywords) ? aiResult.matched_keywords : [];
    const missing_keywords = Array.isArray(aiResult.missing_keywords) ? aiResult.missing_keywords : [];
    const required_keywords = Array.isArray(aiResult.required_keywords) ? aiResult.required_keywords : [];
    const matched_skills = Array.isArray(aiResult.matched_skills) ? aiResult.matched_skills : [];
    const missing_skills = Array.isArray(aiResult.missing_skills) ? aiResult.missing_skills : [];
    const required_skills = Array.isArray(aiResult.required_skills) ? aiResult.required_skills : [];
    
    const resume_sections_found = aiResult.resume_sections_found && typeof aiResult.resume_sections_found === "object" ? aiResult.resume_sections_found : {
      contact: false,
      summary: false,
      skills: false,
      experience: false,
      projects: false,
      education: false,
      certifications: false
    };
    
    const formatting_issues = Array.isArray(aiResult.formatting_issues) ? aiResult.formatting_issues : [];
    
    const achievement_quality = aiResult.achievement_quality && typeof aiResult.achievement_quality === "object" ? aiResult.achievement_quality : {
      has_numbers: false,
      has_action_verbs: false,
      has_impact_statements: false,
      examples_found: []
    };
    
    const experience_relevance = aiResult.experience_relevance && typeof aiResult.experience_relevance === "object" ? aiResult.experience_relevance : {
      label: "not_found",
      reasons: []
    };
    
    const suggestions = Array.isArray(aiResult.suggestions) ? aiResult.suggestions : [];
    const better_bullet_suggestions = Array.isArray(aiResult.better_bullet_suggestions) ? aiResult.better_bullet_suggestions : [];
    const improved_summary_suggestion = typeof aiResult.improved_summary_suggestion === "string" ? aiResult.improved_summary_suggestion : "";
    const section_wise_guidance = Array.isArray(aiResult.section_wise_guidance) ? aiResult.section_wise_guidance : [];
    const issues = Array.isArray(aiResult.issues) ? aiResult.issues : [];

    if (Object.keys(aiResult).length === 0) {
      warning = "Some resume details could not be fully analyzed, so the score confidence is reduced.";
    }

    // 9. Calculate all scores in backend code only using the formula.

    // 1. Keyword Score (30 pts)
    let totalReqKeywords = required_keywords.length;
    if (totalReqKeywords === 0) {
      totalReqKeywords = matched_keywords.length + missing_keywords.length;
    }
    const keyword_score = totalReqKeywords > 0 ? (matched_keywords.length / totalReqKeywords) * 30 : 0;

    // 2. Skills Score (20 pts)
    let totalReqSkills = required_skills.length;
    if (totalReqSkills === 0) {
      totalReqSkills = matched_skills.length + missing_skills.length;
    }
    const skills_score = totalReqSkills > 0 ? (matched_skills.length / totalReqSkills) * 20 : 0;

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

    // 5. ATS Formatting Score (10 pts)
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

    // Final Score Calculation
    const final_score = Math.round(
      keyword_score + 
      skills_score + 
      experience_score + 
      structure_score + 
      formatting_score + 
      achievement_score
    );

    // Calculate projected score
    const issuesCount = issues.length;
    const suggestionsCount = suggestions.length;
    const missingKeywordsCount = missing_keywords.length;
    const hasActionableChanges = issuesCount > 0 || missingKeywordsCount > 0 || suggestionsCount > 0;

    const improvementPotential = Math.min(45, (issuesCount * 5) + (missingKeywordsCount * 4) + (suggestionsCount * 3));
    const floorBoost = final_score < 50 ? 20 : final_score < 70 ? 14 : 8;
    const projected = final_score + floorBoost + improvementPotential;
    const competitiveFloor = hasActionableChanges ? 85 : projected;
    const projected_score = Math.max(0, Math.min(98, Math.max(projected, competitiveFloor)));

    // 10. Save the scan result in Supabase
    const supabase = getServiceClient();
    const scanData = {
      user_id: user.id,
      resume_id: resumeId,
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
      issues
    };

    const { data: dbData, error: dbError } = await supabase
      .from("ats_scans")
      .insert(scanData)
      .select("id, created_at")
      .single();

    if (dbError) {
      logError("Failed to save scan results in database", dbError, requestId);
      // We do not crash the app, but return the result to the user.
      warning = "Scan completed but results could not be saved to your history.";
    }

    // 11. Return the complete result to the frontend.
    const responsePayload = {
      id: dbData?.id || crypto.randomUUID(),
      created_at: dbData?.created_at || new Date().toISOString(),
      ...scanData,
      projected_score,
      warning
    };

    return jsonResponse(responsePayload);
  } catch (error) {
    if (error instanceof Response) return error;
    logError("Resume analysis execution failed", error, requestId);
    return errorResponse("Resume analysis failed. Please try again later.", 500, requestId);
  }
});
