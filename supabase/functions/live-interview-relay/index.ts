import { getServiceClient } from "../_shared/supabase.ts";

const LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";
const MAX_SESSION_MS = 10 * 60 * 1000;

async function authenticate(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("access_token")
    ?? req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return { error: new Response("Authentication required.", { status: 401 }) };
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { error: new Response("Invalid or expired session.", { status: 401 }) };
  }

  return { userId: data.user.id, supabase };
}

function buildGeminiSetup(jobRole: string, language: string) {
  return {
    setup: {
      model: `models/${LIVE_MODEL}`,
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Kore",
            },
          },
        },
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      systemInstruction: {
        parts: [{
          text: `You are a professional, high-pressure interviewer for the position of ${jobRole}. Conduct the interview in ${language}. Ask one question at a time. Be critical but fair. Initial greeting should acknowledge the candidate's resume for ${jobRole}.`,
        }],
      },
    },
  };
}

Deno.serve(async (req) => {
  if (req.headers.get("upgrade")?.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket upgrade.", { status: 426 });
  }

  const auth = await authenticate(req);
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const jobRole = url.searchParams.get("job_role") || "the target role";
  const language = url.searchParams.get("language") || "English";
  const { userId, supabase } = auth;

  const { data: allowed, error: rateLimitError } = await supabase.rpc("check_ai_rate_limit", {
    p_user_id: userId,
    p_feature: "live-interview",
    p_limit: 3,
    p_window_seconds: 60 * 60,
  });

  if (rateLimitError) {
    console.error(rateLimitError);
    return new Response("Rate limit check failed.", { status: 500 });
  }

  if (!allowed) {
    return new Response("Rate limit exceeded.", { status: 429 });
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return new Response("GEMINI_API_KEY is not configured.", { status: 500 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
  const gemini = new WebSocket(geminiUrl);
  const startedAt = Date.now();
  let inputBytes = 0;
  let outputBytes = 0;
  let sessionId: string | null = null;
  let closed = false;
  let persisted = false;

  const closeBoth = (code = 1000, reason = "Session ended") => {
    if (closed) return;
    closed = true;
    try {
      if (socket.readyState === WebSocket.OPEN) socket.close(code, reason);
    } catch (_) {
      // no-op
    }
    try {
      if (gemini.readyState === WebSocket.OPEN || gemini.readyState === WebSocket.CONNECTING) {
        gemini.close(code, reason);
      }
    } catch (_) {
      // no-op
    }
  };

  const timeout = setTimeout(() => closeBoth(1000, "Maximum interview length reached."), MAX_SESSION_MS);

  socket.onopen = async () => {
    const { data, error } = await supabase
      .from("ai_live_sessions")
      .insert({
        user_id: userId,
        model: LIVE_MODEL,
        status: "started",
        metadata: { jobRole, language },
      })
      .select("id")
      .single();

    if (error) {
      console.error(error);
      closeBoth(1011, "Could not start tracked live session.");
      return;
    }

    sessionId = data.id;
  };

  gemini.onopen = () => {
    gemini.send(JSON.stringify(buildGeminiSetup(jobRole, language)));
  };

  socket.onmessage = (event) => {
    const payload = typeof event.data === "string" ? event.data : JSON.stringify(event.data);
    inputBytes += new TextEncoder().encode(payload).length;

    if (gemini.readyState === WebSocket.OPEN) {
      gemini.send(payload);
    }
  };

  gemini.onmessage = (event) => {
    const payload = typeof event.data === "string" ? event.data : JSON.stringify(event.data);
    outputBytes += new TextEncoder().encode(payload).length;

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  };

  gemini.onerror = (event) => {
    console.error("Gemini live relay error", event);
    closeBoth(1011, "Gemini live relay error.");
  };

  socket.onerror = () => closeBoth(1011, "Client WebSocket error.");
  socket.onclose = () => closeBoth();
  gemini.onclose = () => closeBoth();

  const persistEnd = async () => {
    if (persisted) return;
    persisted = true;
    clearTimeout(timeout);
    const durationSeconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000));

    if (sessionId) {
      await supabase
        .from("ai_live_sessions")
        .update({
          status: "ended",
          ended_at: new Date().toISOString(),
          duration_seconds: durationSeconds,
          input_bytes: inputBytes,
          output_bytes: outputBytes,
        })
        .eq("id", sessionId);
    }

    await supabase.rpc("record_ai_usage_event", {
      p_user_id: userId,
      p_feature: "live-interview",
      p_model: LIVE_MODEL,
      p_provider: "google_gemini",
      p_request_units: Math.max(1, Math.ceil(durationSeconds / 60)),
      p_input_bytes: inputBytes,
      p_output_bytes: outputBytes,
      p_estimated_cost_usd: null,
      p_metadata: { sessionId, durationSeconds, jobRole, language },
    });
  };

  socket.addEventListener("close", persistEnd, { once: true });
  gemini.addEventListener("close", persistEnd, { once: true });

  return response;
});
