import { errorResponse, handleOptions, jsonResponse, logError } from "../_shared/cors.ts";
import { getServiceClient, requireUser } from "../_shared/supabase.ts";

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  try {
    if (req.method !== "POST") return errorResponse("Method not allowed.", 405, requestId);

    const user = await requireUser(req);
    const body = await req.json();
    const {
      paymentId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keySecret) return errorResponse("Razorpay test credentials are not configured.", 500, requestId);

    const expected = await hmacSha256Hex(keySecret, `${razorpay_order_id}|${razorpay_payment_id}`);
    if (expected !== razorpay_signature) return errorResponse("Invalid payment signature.", 400, requestId);

    const supabase = getServiceClient();
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .update({
        provider_payment_id: razorpay_payment_id,
        provider_signature: razorpay_signature,
        status: "paid",
        raw_response: body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId)
      .eq("user_id", user.id)
      .eq("provider_order_id", razorpay_order_id)
      .select("package_id")
      .single();

    if (paymentError || !payment) return errorResponse("Payment record not found.", 404, requestId);

    await supabase
      .from("package_entitlements")
      .upsert({
        user_id: user.id,
        package_id: payment.package_id,
        source: "purchase",
        active: true,
      }, { onConflict: "user_id,package_id,active" });

    return jsonResponse({ result: { ok: true, packageId: payment.package_id } });
  } catch (error) {
    if (error instanceof Response) return error;
    logError("Razorpay payment verification failed", error, requestId);
    return errorResponse("Could not verify payment.", 500, requestId);
  }
});
