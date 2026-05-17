const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.amdeyahavzitbyvnyhgg:SASqBfBCw64xnQay@aws-0-eu-west-1.pooler.supabase.com:6543/postgres'
});
(async () => {
  try {
    const r = await pool.query("SELECT id, name, email, role, clerk_user_id FROM employees WHERE email LIKE '%swambaa%' OR clerk_user_id IS NOT NULL ORDER BY clerk_user_id NULLS LAST");
    console.log(JSON.stringify(r.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
})();
