import { errorResponse, handleOptions, jsonResponse, logError } from "../_shared/cors.ts";
import { getServiceClient, requireUser } from "../_shared/supabase.ts";

async function requireAdmin(userId: string) {
  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc("is_app_admin", { p_user_id: userId });
  if (error || !data) {
    throw new Response(JSON.stringify({ error: "Admin access required." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return supabase;
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  try {
    const user = await requireUser(req);
    const supabase = await requireAdmin(user.id);

    if (req.method === "GET") {
      const [
        users,
        resumes,
        atsReports,
        interviews,
        usage,
        errors,
        payments,
      ] = await Promise.all([
        supabase.from("user_profiles").select("user_id,full_name,is_admin,created_at").limit(50),
        supabase.from("resume_drafts").select("id,user_id,title,ats_score,updated_at").order("updated_at", { ascending: false }).limit(50),
        supabase.from("ats_reports").select("id,user_id,resume_name,overall_score,readiness_score,created_at").order("created_at", { ascending: false }).limit(50),
        supabase.from("ai_live_sessions").select("id,user_id,status,duration_seconds,started_at").order("started_at", { ascending: false }).limit(50),
        supabase.from("ai_usage_events").select("id,user_id,feature,model,request_units,input_bytes,output_bytes,created_at").order("created_at", { ascending: false }).limit(100),
        supabase.from("error_logs").select("id,user_id,source,message,created_at").order("created_at", { ascending: false }).limit(50),
        supabase.from("payments").select("id,user_id,package_id,amount_inr,status,created_at").order("created_at", { ascending: false }).limit(50),
      ]);

      return jsonResponse({
        result: {
          counts: {
            users: users.data?.length ?? 0,
            resumes: resumes.data?.length ?? 0,
            atsReports: atsReports.data?.length ?? 0,
            interviews: interviews.data?.length ?? 0,
            usageEvents: usage.data?.length ?? 0,
            errors: errors.data?.length ?? 0,
            payments: payments.data?.length ?? 0,
          },
          users: users.data ?? [],
          resumes: resumes.data ?? [],
          atsReports: atsReports.data ?? [],
          interviews: interviews.data ?? [],
          usage: usage.data ?? [],
          errors: errors.data ?? [],
          payments: payments.data ?? [],
        },
      });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { action, targetUserId, packageId } = body;

      if (!targetUserId) return errorResponse("targetUserId is required.", 400, requestId);

      if (action === "grant-package") {
        await supabase.from("package_entitlements").upsert({
          user_id: targetUserId,
          package_id: packageId,
          granted_by: user.id,
          source: "admin",
          active: true,
        }, { onConflict: "user_id,package_id,active" });
        return jsonResponse({ result: { ok: true } });
      }

      if (action === "revoke-package") {
        await supabase
          .from("package_entitlements")
          .update({ active: false, revoked_at: new Date().toISOString() })
          .eq("user_id", targetUserId)
          .eq("package_id", packageId)
          .eq("active", true);
        return jsonResponse({ result: { ok: true } });
      }

      if (action === "grant-admin") {
        await supabase.from("user_profiles").upsert({ user_id: targetUserId, is_admin: true });
        return jsonResponse({ result: { ok: true } });
      }

      return errorResponse("Unsupported admin action.", 400, requestId);
    }

    return errorResponse("Method not allowed.", 405, requestId);
  } catch (error) {
    if (error instanceof Response) return error;
    logError("Admin dashboard request failed", error, requestId);
    return errorResponse("Admin request failed.", 500, requestId);
  }
});
