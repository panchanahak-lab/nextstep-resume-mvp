import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { runAiAction, type AiAction } from "../_shared/ai-router.ts";
import { checkRateLimit, requireUser } from "../_shared/supabase.ts";

const FEATURE_LIMITS: Record<AiAction, { limit: number; windowSeconds: number }> = {
  "ats-analysis": { limit: 10, windowSeconds: 60 * 60 },
  "resume-enhancement": { limit: 30, windowSeconds: 60 * 60 },
  "resume-summary": { limit: 20, windowSeconds: 60 * 60 },
  "interview-feedback": { limit: 10, windowSeconds: 60 * 60 },
};

Deno.serve(async (req) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed." }, 405);
    }

    const user = await requireUser(req);
    const body = await req.json();
    const action = body.action as AiAction;
    const limits = FEATURE_LIMITS[action];

    if (!limits) {
      return jsonResponse({ error: "Unsupported AI action." }, 400);
    }

    await checkRateLimit(user.id, action, limits.limit, limits.windowSeconds);
    const result = await runAiAction({
      userId: user.id,
      action,
      payload: body.payload ?? {},
    });

    return jsonResponse({ result });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error(error);
    return jsonResponse({ error: "AI request failed." }, 500);
  }
});
