import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { pool } from "../db/pool.js";
import { serialize } from "cookie";

const accessTokenTtl = "15m";
const refreshTokenTtlSeconds = 60 * 60 * 24 * 7;

function getJwtSecret() {
  return process.env.JWT_SECRET ?? "dev-secret";
}

function buildRefreshCookie(token: string) {
  return serialize("refresh_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: refreshTokenTtlSeconds
  });
}

function clearRefreshCookie() {
  return serialize("refresh_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

function parseRefreshToken(header?: string) {
  if (!header) {
    return null;
  }
  const parts = header.split(";");
  for (const part of parts) {
    const [name, ...valueParts] = part.trim().split("=");
    if (name === "refresh_token") {
      return valueParts.join("=");
    }
  }
  return null;
}

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (request, reply) => {
    const body = request.body as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return reply.status(400).send({ error: "missing_fields" });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    try {
      const result = await pool.query(
        "insert into users (email, password_hash) values ($1, $2) returning id",
        [body.email, passwordHash]
      );
      const userId = result.rows[0]?.id as string;
      const accessToken = app.jwt.sign({ sub: userId }, { expiresIn: accessTokenTtl, secret: getJwtSecret() });
      reply.send({ accessToken });
    } catch (error) {
      request.log.error(error, "register failed");
      reply.status(409).send({ error: "email_exists" });
    }
  });

  app.post("/auth/login", async (request, reply) => {
    const body = request.body as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return reply.status(400).send({ error: "missing_fields" });
    }

    const userResult = await pool.query("select id, password_hash from users where email = $1", [body.email]);
    const user = userResult.rows[0];
    if (!user) {
      return reply.status(401).send({ error: "invalid_credentials" });
    }

    const isValid = await bcrypt.compare(body.password, user.password_hash as string);
    if (!isValid) {
      return reply.status(401).send({ error: "invalid_credentials" });
    }

    const refreshToken = crypto.randomUUID();
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await pool.query("update users set refresh_token_hash = $1 where id = $2", [refreshHash, user.id]);
    const accessToken = app.jwt.sign({ sub: user.id }, { expiresIn: accessTokenTtl, secret: getJwtSecret() });

    reply.header("Set-Cookie", buildRefreshCookie(refreshToken));
    reply.send({ accessToken });
  });

  app.post("/auth/refresh", async (request, reply) => {
    const refreshToken = parseRefreshToken(request.headers.cookie);
    if (!refreshToken) {
      return reply.status(401).send({ error: "missing_refresh" });
    }

    const userResult = await pool.query("select id, refresh_token_hash from users where refresh_token_hash is not null");
    const user = userResult.rows.find((row) => row.refresh_token_hash);
    if (!user) {
      return reply.status(401).send({ error: "invalid_refresh" });
    }

    const matches = await bcrypt.compare(refreshToken, user.refresh_token_hash as string);
    if (!matches) {
      return reply.status(401).send({ error: "invalid_refresh" });
    }

    const newRefreshToken = crypto.randomUUID();
    const newRefreshHash = await bcrypt.hash(newRefreshToken, 10);
    await pool.query("update users set refresh_token_hash = $1 where id = $2", [newRefreshHash, user.id]);

    const accessToken = app.jwt.sign({ sub: user.id }, { expiresIn: accessTokenTtl, secret: getJwtSecret() });
    reply.header("Set-Cookie", buildRefreshCookie(newRefreshToken));
    reply.send({ accessToken });
  });

  app.post("/auth/logout", async (request, reply) => {
    const refreshToken = parseRefreshToken(request.headers.cookie);
    if (refreshToken) {
      const userResult = await pool.query("select id, refresh_token_hash from users where refresh_token_hash is not null");
      const user = userResult.rows.find((row) => row.refresh_token_hash);
      if (user) {
        const matches = await bcrypt.compare(refreshToken, user.refresh_token_hash as string);
        if (matches) {
          await pool.query("update users set refresh_token_hash = null where id = $1", [user.id]);
        }
      }
    }

    reply.header("Set-Cookie", clearRefreshCookie());
    reply.send({ ok: true });
  });
}
