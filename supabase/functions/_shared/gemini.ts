export interface GeminiRequest {
  model: string;
  contents: unknown;
  systemInstruction?: unknown;
  responseSchema?: unknown;
  responseMimeType?: string;
}

export async function generateGeminiContent(request: GeminiRequest): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in Supabase Secrets.");
  }

  const generationConfig: Record<string, unknown> = {};
  if (request.responseMimeType) generationConfig.responseMimeType = request.responseMimeType;
  if (request.responseSchema) generationConfig.responseSchema = request.responseSchema;

  const body: Record<string, unknown> = {
    contents: request.contents,
  };

  if (Object.keys(generationConfig).length > 0) {
    body.generationConfig = generationConfig;
  }

  if (request.systemInstruction) {
    body.systemInstruction = request.systemInstruction;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent?key=${apiKey}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${detail}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}

export function byteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}
