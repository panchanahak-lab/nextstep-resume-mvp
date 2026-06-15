export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

export function logError(context: string, error: unknown, requestId?: string): void {
  const prefix = requestId ? `[${requestId}] ${context}` : context;

  if (error instanceof Error) {
    console.error(prefix, { name: error.name, message: error.message, stack: error.stack });
    return;
  }

  console.error(prefix, error);
}

export function errorResponse(message: string, status = 500, requestId?: string): Response {
  return jsonResponse({ error: message, requestId }, status);
}

export function handleOptions(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  return null;
}
