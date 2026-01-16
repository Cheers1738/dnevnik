import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function pingDatabase() {
  const result = await pool.query("select 1 as ok");
  return result.rows[0]?.ok === 1;
}
