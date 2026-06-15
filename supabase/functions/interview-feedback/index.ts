import { errorResponse, handleOptions, jsonResponse, logError } from "../_shared/cors.ts";
import { runAiAction } from "../_shared/ai-router.ts";
import { checkRateLimit, requireUser } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  try {
    if (req.method !== "POST") return errorResponse("Method not allowed.", 405, requestId);
    const user = await requireUser(req);
    await checkRateLimit(user.id, "interview-feedback", 10, 60 * 60);
    const payload = await req.json();
    const result = await runAiAction({ userId: user.id, action: "interview-feedback", payload });
    return jsonResponse({ result });
  } catch (error) {
    if (error instanceof Response) return error;
    logError("Interview feedback failed", error, requestId);
    return errorResponse("Interview feedback failed.", 500, requestId);
  }
});
