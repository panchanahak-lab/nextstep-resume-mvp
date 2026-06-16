import { logError } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

const LIVE_MODEL = "gemini-3.1-flash-live-preview";
const LIVE_VOICE_NAME = "Kore";
const MAX_SESSION_MS = 10 * 60 * 1000;

async function normalizeSocketData(data: unknown): Promise<string> {
  if (typeof data === "string") return data;
  if (data instanceof ArrayBuffer) return new TextDecoder().decode(data);
  if (ArrayBuffer.isView(data)) {
    return new TextDecoder().decode(data);
  }
  if (data && typeof (data as { text?: unknown }).text === "function") {
    return await (data as { text: () => Promise<string> }).text();
  }

  return JSON.stringify(data);
}

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
  console.log("[live-interview-relay] Gemini Live setup", {
    selectedModel: LIVE_MODEL,
    selectedVoiceName: LIVE_VOICE_NAME,
    selectedInterviewLanguage: language,
    fallbackTtsOrBrowserSpeechSynthesis: false,
    inputAudio: "raw 16-bit PCM, 16kHz, mono, little-endian",
    outputAudioPlayback: "raw 16-bit PCM, 24kHz, mono, little-endian",
  });

  return {
    setup: {
      model: `models/${LIVE_MODEL}`,
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: LIVE_VOICE_NAME,
          },
        },
      },
      outputAudioTranscription: {},
      inputAudioTranscription: {},
      realtimeInputConfig: {
        automaticActivityDetection: {
          disabled: false,
          prefixPaddingMs: 120,
          silenceDurationMs: 700,
        },
      },
      systemInstruction: {
        parts: [{
          text: `You are Sarah, a professional, high-pressure interviewer for the position of ${jobRole}. Conduct the entire interview only in ${language}. Keep this selected interview language fixed for the whole session unless the user explicitly asks to change language. Ask one question at a time. Be critical but fair. Use the configured Gemini voice and do not switch voices. Start with one concise greeting and first question for ${jobRole}.`,
        }],
      },
    },
  };
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
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
    p_limit: 30,
    p_window_seconds: 60 * 60,
  });

  if (rateLimitError) {
    logError("Live interview rate limit check failed", rateLimitError, requestId);
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
  let geminiSetupComplete = false;
  const pendingClientMessages: string[] = [];

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

  const flushPendingClientMessages = () => {
    while (
      pendingClientMessages.length > 0
      && gemini.readyState === WebSocket.OPEN
      && geminiSetupComplete
    ) {
      gemini.send(pendingClientMessages.shift()!);
    }
  };

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
      logError("Could not start tracked live session", error, requestId);
      closeBoth(1011, "Could not start tracked live session.");
      return;
    }

    sessionId = data.id;
  };

  gemini.onopen = () => {
    gemini.send(JSON.stringify(buildGeminiSetup(jobRole, language)));
  };

  socket.onmessage = async (event) => {
    const payload = await normalizeSocketData(event.data);
    inputBytes += new TextEncoder().encode(payload).length;

    if (gemini.readyState === WebSocket.OPEN && geminiSetupComplete) {
      gemini.send(payload);
    } else {
      pendingClientMessages.push(payload);
    }
  };

  gemini.onmessage = async (event) => {
    const payload = await normalizeSocketData(event.data);
    outputBytes += new TextEncoder().encode(payload).length;

    try {
      const message = JSON.parse(payload);
      if (message.setupComplete || Object.keys(message).length === 0) {
        geminiSetupComplete = true;
        flushPendingClientMessages();
      }
    } catch (_) {
      // Non-JSON payloads are still forwarded to the browser below.
    }

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  };

  gemini.onerror = (event) => {
    logError("Gemini live relay error", event, requestId);
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
      const { error } = await supabase
        .from("ai_live_sessions")
        .update({
          status: "ended",
          ended_at: new Date().toISOString(),
          duration_seconds: durationSeconds,
          input_bytes: inputBytes,
          output_bytes: outputBytes,
        })
        .eq("id", sessionId);

      if (error) {
        logError("Could not persist live session end", error, requestId);
      }
    }

    const { error } = await supabase.rpc("record_ai_usage_event", {
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

    if (error) {
      logError("Could not record live interview usage", error, requestId);
    }
  };

  socket.addEventListener("close", persistEnd, { once: true });
  gemini.addEventListener("close", persistEnd, { once: true });

  return response;
});
