import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  await pool.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (filename text primary key, applied_at timestamptz not null default now())"
  );

  const applied = await pool.query("select filename from schema_migrations");
  const appliedSet = new Set(applied.rows.map((row) => row.filename));

  const migrationsDir = path.resolve(__dirname, "../../migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (appliedSet.has(file)) {
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    await pool.query("begin");
    try {
      await pool.query(sql);
      await pool.query("insert into schema_migrations (filename) values ($1)", [file]);
      await pool.query("commit");
    } catch (error) {
      await pool.query("rollback");
      throw error;
    }
  }
}
