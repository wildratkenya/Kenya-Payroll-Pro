import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const tables = [
  "departments",
  "employees",
  "leave_types",
  "payroll_runs",
  "leave_requests",
  "payroll_entries",
  "disbursements",
];

async function migrate() {
  const oldUrl = process.env.OLD_DATABASE_URL;
  if (!oldUrl) throw new Error("OLD_DATABASE_URL is required");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

  const oldPool = new Pool({ connectionString: oldUrl });
  const newPool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    for (const table of tables) {
      const { rows } = await oldPool.query(
        `SELECT * FROM "${table}" ORDER BY "id"`,
      );
      if (rows.length === 0) {
        console.log(`  ${table}: no data`);
        continue;
      }

      const columns = Object.keys(rows[0]);
      const colNames = columns.map((c) => `"${c}"`).join(", ");
      const params = columns.map((_, i) => `$${i + 1}`).join(", ");

      for (const row of rows) {
        const values = columns.map((c) => row[c]);
        await newPool.query(
          `INSERT INTO "${table}" (${colNames}) VALUES (${params})`,
          values,
        );
      }

      const maxId = Math.max(...rows.map((r: any) => r.id));
      await newPool.query(
        `SELECT setval('${table}_id_seq', $1, true)`,
        [maxId],
      );

      console.log(`  ${table}: ${rows.length} rows migrated`);
    }

    console.log("Migration complete!");
  } finally {
    await oldPool.end();
    await newPool.end();
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
