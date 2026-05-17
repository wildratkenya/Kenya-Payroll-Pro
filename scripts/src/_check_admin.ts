import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    "postgresql://postgres.amdeyahavzitbyvnyhgg:SASqBfBCw64xnQay@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
});

async function main() {
  try {
    const cols = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'employees' ORDER BY ordinal_position"
    );
    console.log("Columns:", JSON.stringify(cols.rows, null, 2));

    const rows = await pool.query("SELECT * FROM employees LIMIT 20");
    console.log("Employees:", JSON.stringify(rows.rows, null, 2));
  } catch (e: any) {
    console.error("Error:", e.message);
  }
  await pool.end();
}

main();
