import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

export function getServiceClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase service credentials are not configured.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function requireUser(req: Request): Promise<AuthenticatedUser> {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");

  if (!token) {
    throw new Response(JSON.stringify({ error: "Authentication required." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new Response(JSON.stringify({ error: "Invalid or expired session." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return {
    id: data.user.id,
    email: data.user.email ?? undefined,
  };
}

export async function checkRateLimit(
  userId: string,
  feature: string,
  limit: number,
  windowSeconds: number,
): Promise<void> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc("check_ai_rate_limit", {
    p_user_id: userId,
    p_feature: feature,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    throw new Error(`Rate limit check failed: ${error.message}`);
  }

  if (!data) {
    throw new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function recordUsage(params: {
  userId: string;
  feature: string;
  model: string;
  inputBytes?: number;
  outputBytes?: number;
  requestUnits?: number;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getServiceClient();
  await supabase.rpc("record_ai_usage_event", {
    p_user_id: params.userId,
    p_feature: params.feature,
    p_model: params.model,
    p_provider: "google_gemini",
    p_request_units: params.requestUnits ?? 1,
    p_input_bytes: params.inputBytes ?? 0,
    p_output_bytes: params.outputBytes ?? 0,
    p_estimated_cost_usd: null,
    p_metadata: params.metadata ?? {},
  });
}
