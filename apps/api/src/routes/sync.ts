import type { FastifyInstance } from "fastify";
import { pool } from "../db/pool.js";

export async function registerSyncRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request, reply) => {
    if (request.routerPath?.startsWith("/sync")) {
      try {
        await request.jwtVerify();
      } catch (error) {
        return reply.status(401).send({ error: "unauthorized" });
      }
    }
  });

  app.post("/sync/push", async (request, reply) => {
    const body = request.body as { encryptedBlob?: string; version?: number };
    if (!body.encryptedBlob || typeof body.version !== "number") {
      return reply.status(400).send({ error: "invalid_payload" });
    }

    const userId = (request.user as { sub: string }).sub;
    await pool.query(
      `insert into sync_snapshots (user_id, version, encrypted_blob)
       values ($1, $2, $3)
       on conflict (user_id)
       do update set version = excluded.version, encrypted_blob = excluded.encrypted_blob, updated_at = now()`,
      [userId, body.version, body.encryptedBlob]
    );

    reply.send({ ok: true });
  });

  app.post("/sync/pull", async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const result = await pool.query(
      "select version, encrypted_blob from sync_snapshots where user_id = $1",
      [userId]
    );
    const snapshot = result.rows[0];
    reply.send({
      version: snapshot?.version ?? 0,
      encryptedBlob: snapshot?.encrypted_blob ?? null
    });
  });
}
