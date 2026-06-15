import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { runAiAction } from "../_shared/ai-router.ts";
import { checkRateLimit, requireUser } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  try {
    if (req.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);
    const user = await requireUser(req);
    await checkRateLimit(user.id, "ats-analysis", 10, 60 * 60);
    const payload = await req.json();
    const result = await runAiAction({ userId: user.id, action: "ats-analysis", payload });
    return jsonResponse({ result });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error(error);
    return jsonResponse({ error: "ATS analysis failed." }, 500);
  }
});
