import { buildApp } from "./app.js";
import { runMigrations } from "./db/migrate.js";

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

async function start() {
  await runMigrations();
  const app = buildApp();
  await app.listen({ port, host });
  app.log.info(`API listening on ${host}:${port}`);
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
