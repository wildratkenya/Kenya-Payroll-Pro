import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    "postgresql://postgres.amdeyahavzitbyvnyhgg:SASqBfBCw64xnQay@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
});

async function main() {
  try {
    // Check departments
    const depts = await pool.query("SELECT id, name FROM departments");
    console.log("Departments:", JSON.stringify(depts.rows, null, 2));

    // Check employees to find if swambaa exists
    const emps = await pool.query(
      "SELECT id, first_name, last_name, email, role, clerk_user_id FROM employees WHERE email = 'swambaa@gmail.com'"
    );
    console.log("Existing employee:", JSON.stringify(emps.rows, null, 2));

    // Insert or update employee record for swambaa@gmail.com with admin role
    // First check the max employee_number
    const maxNum = await pool.query(
      "SELECT employee_number FROM employees ORDER BY id DESC LIMIT 1"
    );
    const lastNum = maxNum.rows[0]?.employee_number || "EMP00000";
    const numSuffix = String(parseInt(lastNum.replace("EMP", "")) + 1).padStart(5, "0");
    const newEmpNum = `EMP${numSuffix}`;

    if (emps.rows.length === 0) {
      // Create new employee
      await pool.query(
        `INSERT INTO employees (
          employee_number, first_name, last_name, email, phone,
          department_id, job_title, gross_salary, employment_type,
          payment_method, status, role, hire_date, clerk_user_id
        ) VALUES (
          $1, 'Samuel', 'Wambaa', 'swambaa@gmail.com', '0712345009',
          1, 'Administrator', 200000, 'permanent',
          'bank', 'active', 'admin', '2024-01-01', $2
        )`,
        [newEmpNum, "user_3DqirZ59mxeozYMu6fyWNDbRljv"]
      );
      console.log("Created new employee record for swambaa@gmail.com with admin role");
    } else {
      // Update existing
      await pool.query(
        "UPDATE employees SET role = 'admin', clerk_user_id = $1 WHERE email = 'swambaa@gmail.com'",
        ["user_3DqirZ59mxeozYMu6fyWNDbRljv"]
      );
      console.log("Updated existing employee to admin role");
    }

    // Verify
    const verify = await pool.query(
      "SELECT id, employee_number, first_name, last_name, email, role, clerk_user_id FROM employees WHERE email = 'swambaa@gmail.com'"
    );
    console.log("Result:", JSON.stringify(verify.rows, null, 2));
  } catch (e: any) {
    console.error("Error:", e.message);
  }
  await pool.end();
}

main();
