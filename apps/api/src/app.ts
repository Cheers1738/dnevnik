import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import { registerHealthRoute } from "./routes/health.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerLlmRoutes } from "./routes/llm.js";
import { registerSyncRoutes } from "./routes/sync.js";

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET ?? "dev-secret"
  });

  app.register(registerHealthRoute);
  app.register(registerAuthRoutes);
  app.register(registerLlmRoutes);
  app.register(registerSyncRoutes);

  return app;
}
