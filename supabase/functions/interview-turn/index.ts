import { errorResponse, handleOptions, jsonResponse, logError } from "../_shared/cors.ts";
import { byteLength, generateGeminiContent } from "../_shared/gemini.ts";
import { checkRateLimit, recordUsage, requireUser } from "../_shared/supabase.ts";

const TURN_MODEL = "gemini-2.5-flash";

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  try {
    if (req.method !== "POST") return errorResponse("Method not allowed.", 405, requestId);
    const user = await requireUser(req);
    await checkRateLimit(user.id, "interview-turn", 80, 60 * 60);

    const payload = await req.json();
    const jobRole = typeof payload.jobRole === "string" ? payload.jobRole : "the target role";
    const language = typeof payload.language === "string" ? payload.language : "English";
    const transcripts = Array.isArray(payload.transcripts) ? payload.transcripts : [];
    const history = transcripts
      .map((t: unknown) => {
        const item = t as { role?: string; text?: string };
        return `${String(item.role ?? "").toUpperCase()}: ${item.text ?? ""}`;
      })
      .join("\n");

    const request = {
      model: TURN_MODEL,
      contents: [{
        role: "user",
        parts: [{
          text: `You are Sarah, a professional AI interviewer for a ${jobRole} mock interview.
Conduct the full interview in ${language}.
Ask exactly one concise interview question.
If there is no history, greet briefly and ask the first question.
If the candidate answered, ask a relevant follow-up or the next strong interview question.
Do not give feedback yet. Do not include labels like "Sarah:".

INTERVIEW SO FAR:
${history || "(no previous turns)"}`,
        }],
      }],
    };

    const question = (await generateGeminiContent(request)).trim();
    await recordUsage({
      userId: user.id,
      feature: "interview-turn",
      model: TURN_MODEL,
      inputBytes: byteLength(request),
      outputBytes: byteLength(question),
      metadata: { language, jobRole, transcriptItems: transcripts.length },
    });

    return jsonResponse({ result: { question } });
  } catch (error) {
    if (error instanceof Response) return error;
    logError("Interview turn failed", error, requestId);
    return errorResponse("Interview turn failed.", 500, requestId);
  }
});
