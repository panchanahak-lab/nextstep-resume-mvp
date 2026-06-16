import { errorResponse, handleOptions, jsonResponse, logError } from "../_shared/cors.ts";
import { byteLength, generateGeminiContent } from "../_shared/gemini.ts";
import { checkRateLimit, recordUsage, requireUser } from "../_shared/supabase.ts";

const TRANSCRIPTION_MODEL = "gemini-2.5-flash";

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  const optionsResponse = handleOptions(req);
  if (optionsResponse) return optionsResponse;

  try {
    if (req.method !== "POST") return errorResponse("Method not allowed.", 405, requestId);
    const user = await requireUser(req);
    await checkRateLimit(user.id, "interview-transcription", 60, 60 * 60);

    const payload = await req.json();
    const language = typeof payload.language === "string" ? payload.language : "English";
    const audio = payload.audio as { mimeType?: string; data?: string } | undefined;

    if (!audio?.data) {
      return errorResponse("Audio data is required.", 400, requestId);
    }

    const request = {
      model: TRANSCRIPTION_MODEL,
      contents: [{
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: audio.mimeType || "audio/wav",
              data: audio.data,
            },
          },
          {
            text: `Transcribe this interview candidate answer exactly in ${language}.
Return only the spoken words. Do not translate unless the speaker clearly mixed languages.
Do not add explanations, labels, punctuation-only text, or guesses.
If the audio has no clear speech, return an empty string.`,
          },
        ],
      }],
    };

    const transcript = (await generateGeminiContent(request)).trim();
    await recordUsage({
      userId: user.id,
      feature: "interview-transcription",
      model: TRANSCRIPTION_MODEL,
      inputBytes: byteLength(request),
      outputBytes: byteLength(transcript),
      metadata: { language },
    });

    return jsonResponse({ result: { transcript } });
  } catch (error) {
    if (error instanceof Response) return error;
    logError("Interview transcription failed", error, requestId);
    return errorResponse("Interview transcription failed.", 500, requestId);
  }
});
