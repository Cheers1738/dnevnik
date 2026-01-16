import type { Artifact, LlmRequest } from "@dnevnik/shared";
import { artifactSchema } from "@dnevnik/shared";

function buildPrompt(request: LlmRequest) {
  const mode = request.mode;
  const scenario = request.scenarioId ? `Сценарий: ${request.scenarioId}` : "";
  return [
    {
      role: "system",
      content:
        "Ты создаёшь краткий артефакт дневника. Верни JSON с полями chapter_title, chapter_text (1-2 страницы), quotes (ровно 5 цитат)."
    },
    {
      role: "user",
      content: `Режим: ${mode}. ${scenario}. Сообщения: ${JSON.stringify(request.messages)}`
    }
  ];
}

export async function generateArtifact(request: LlmRequest): Promise<Artifact> {
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com";
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: buildPrompt(request),
      temperature: 0.4
    })
  });

  if (!response.ok) {
    throw new Error(`LLM request failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error("LLM response is not JSON");
  }

  return artifactSchema.parse(parsed);
}
