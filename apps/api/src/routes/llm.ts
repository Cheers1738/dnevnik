import type { FastifyInstance } from "fastify";
import { llmRequestSchema } from "@dnevnik/shared";
import { buildStubArtifact } from "../llm/stub.js";
import { generateArtifact } from "../llm/openai.js";

export async function registerLlmRoutes(app: FastifyInstance) {
  app.post("/llm/generate", async (request, reply) => {
    const parsed = llmRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "invalid_request" });
    }

    const useStub = process.env.LLM_STUB === "1" || !process.env.OPENAI_API_KEY;
    const artifact = useStub ? buildStubArtifact(parsed.data) : await generateArtifact(parsed.data);
    reply.send(artifact);
  });
}
