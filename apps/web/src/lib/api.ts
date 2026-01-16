import type { Artifact, LlmRequest } from "@dnevnik/shared";

const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

export async function generateArtifact(request: LlmRequest): Promise<Artifact> {
  const response = await fetch(`${apiBase}/llm/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error("Не удалось сгенерировать артефакт");
  }

  return response.json() as Promise<Artifact>;
}
