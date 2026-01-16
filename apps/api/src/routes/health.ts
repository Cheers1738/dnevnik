import type { FastifyInstance } from "fastify";
import { pingDatabase } from "../db/pool.js";

export async function registerHealthRoute(app: FastifyInstance) {
  app.get("/health", async () => {
    const dbOk = await pingDatabase();
    return { ok: true, db: dbOk };
  });
}
