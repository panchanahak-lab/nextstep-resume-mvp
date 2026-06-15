import { errorResponse, handleOptions, jsonResponse, logError } from "../_shared/cors.ts";
import { getServiceClient, requireUser } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  try {
    if (req.method !== "POST") return errorResponse("Method not allowed.", 405, requestId);

    const user = await requireUser(req);
    const { packageId } = await req.json();
    const supabase = getServiceClient();
    const { data: pkg, error: packageError } = await supabase
      .from("packages")
      .select("id,name,amount_inr")
      .eq("id", packageId)
      .eq("active", true)
      .single();

    if (packageError || !pkg) return errorResponse("Package not found.", 404, requestId);

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) return errorResponse("Razorpay test credentials are not configured.", 500, requestId);

    const amountPaise = Number(pkg.amount_inr) * 100;
    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${keyId}:${keySecret}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: `${user.id.slice(0, 8)}-${pkg.id}-${Date.now()}`,
        notes: { user_id: user.id, package_id: pkg.id },
      }),
    });

    if (!orderResponse.ok) {
      const detail = await orderResponse.text();
      throw new Error(`Razorpay order failed (${orderResponse.status}): ${detail}`);
    }

    const order = await orderResponse.json();
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        package_id: pkg.id,
        provider_order_id: order.id,
        amount_inr: pkg.amount_inr,
        status: "created",
        raw_response: order,
      })
      .select("id")
      .single();

    if (paymentError) throw new Error(paymentError.message);

    return jsonResponse({
      result: {
        paymentId: payment.id,
        keyId,
        orderId: order.id,
        amount: amountPaise,
        currency: "INR",
        name: "NextStep Resume",
        description: pkg.name,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    logError("Razorpay order creation failed", error, requestId);
    return errorResponse("Could not create payment order.", 500, requestId);
  }
});
