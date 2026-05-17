import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const sql = `
CREATE TABLE IF NOT EXISTS "departments" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "description" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "employees" (
  "id" serial PRIMARY KEY,
  "employee_number" text NOT NULL UNIQUE,
  "first_name" text NOT NULL,
  "last_name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "phone" text,
  "department_id" integer REFERENCES "departments"("id"),
  "job_title" text,
  "gross_salary" numeric(14,2) NOT NULL,
  "employment_type" text NOT NULL DEFAULT 'permanent',
  "payment_method" text NOT NULL DEFAULT 'bank',
  "mpesa_number" text,
  "bank_name" text,
  "bank_account" text,
  "bank_branch" text,
  "kra_pin" text,
  "nssf_number" text,
  "shif_number" text,
  "status" text NOT NULL DEFAULT 'active',
  "role" text NOT NULL DEFAULT 'employee',
  "hire_date" text NOT NULL,
  "termination_date" text,
  "clerk_user_id" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "leave_types" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "days_allowed" integer NOT NULL,
  "description" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "payroll_runs" (
  "id" serial PRIMARY KEY,
  "month" integer NOT NULL,
  "year" integer NOT NULL,
  "status" text NOT NULL DEFAULT 'draft',
  "total_gross" numeric(16,2) DEFAULT '0',
  "total_paye" numeric(16,2) DEFAULT '0',
  "total_nssf" numeric(16,2) DEFAULT '0',
  "total_shif" numeric(16,2) DEFAULT '0',
  "total_housing_levy" numeric(16,2) DEFAULT '0',
  "total_net" numeric(16,2) DEFAULT '0',
  "employee_count" integer DEFAULT 0,
  "processed_at" timestamp with time zone,
  "approved_at" timestamp with time zone,
  "disbursed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "leave_requests" (
  "id" serial PRIMARY KEY,
  "employee_id" integer NOT NULL REFERENCES "employees"("id"),
  "leave_type_id" integer NOT NULL REFERENCES "leave_types"("id"),
  "start_date" text NOT NULL,
  "end_date" text NOT NULL,
  "days" integer NOT NULL,
  "reason" text,
  "status" text NOT NULL DEFAULT 'pending',
  "approver_id" integer REFERENCES "employees"("id"),
  "approved_at" timestamp with time zone,
  "rejection_reason" text,
  "applied_at" timestamp with time zone NOT NULL DEFAULT now(),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "payroll_entries" (
  "id" serial PRIMARY KEY,
  "payroll_run_id" integer NOT NULL REFERENCES "payroll_runs"("id"),
  "employee_id" integer NOT NULL REFERENCES "employees"("id"),
  "gross_salary" numeric(14,2) NOT NULL,
  "basic_salary" numeric(14,2) NOT NULL,
  "paye" numeric(14,2) NOT NULL DEFAULT '0',
  "nssf_employee" numeric(14,2) NOT NULL DEFAULT '0',
  "nssf_employer" numeric(14,2) NOT NULL DEFAULT '0',
  "shif" numeric(14,2) NOT NULL DEFAULT '0',
  "housing_levy_employee" numeric(14,2) NOT NULL DEFAULT '0',
  "housing_levy_employer" numeric(14,2) NOT NULL DEFAULT '0',
  "personal_relief" numeric(14,2) NOT NULL DEFAULT '2400',
  "insurance_relief" numeric(14,2) NOT NULL DEFAULT '0',
  "other_deductions" numeric(14,2) NOT NULL DEFAULT '0',
  "net_pay" numeric(14,2) NOT NULL,
  "payment_method" text NOT NULL DEFAULT 'bank',
  "disbursement_status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "disbursements" (
  "id" serial PRIMARY KEY,
  "payroll_run_id" integer NOT NULL REFERENCES "payroll_runs"("id"),
  "employee_id" integer NOT NULL REFERENCES "employees"("id"),
  "amount" numeric(14,2) NOT NULL,
  "method" text NOT NULL,
  "reference" text,
  "status" text NOT NULL DEFAULT 'pending',
  "failure_reason" text,
  "processed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "tax_rates" (
  "id" serial PRIMARY KEY,
  "key" text NOT NULL UNIQUE,
  "label" text NOT NULL,
  "value" numeric(12,2) NOT NULL,
  "description" text
);

CREATE TABLE IF NOT EXISTS "tax_brackets" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL DEFAULT 'PAYE',
  "min_amount" numeric(12,2) NOT NULL DEFAULT '0',
  "max_amount" numeric(12,2) NOT NULL,
  "rate" numeric(5,4) NOT NULL,
  "priority" integer NOT NULL DEFAULT 0
);
`;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await pool.query(sql);
    console.log("All tables created successfully!");

    // Seed default tax rates
    const seedTaxRates = [
      { key: "nssf_tier1_limit", label: "NSSF Tier I Limit", value: 7000, description: "Upper earnings limit for NSSF Tier I" },
      { key: "nssf_tier2_limit", label: "NSSF Tier II Limit", value: 36000, description: "Upper earnings limit for NSSF Tier II" },
      { key: "nssf_tier1_rate", label: "NSSF Tier I Rate", value: 6.00, description: "NSSF Tier I contribution rate (%)" },
      { key: "nssf_tier2_rate", label: "NSSF Tier II Rate", value: 6.00, description: "NSSF Tier II contribution rate (%)" },
      { key: "shif_rate", label: "SHIF Rate", value: 2.75, description: "Social Health Insurance Fund rate (%)" },
      { key: "shif_minimum", label: "SHIF Minimum", value: 300, description: "Minimum SHIF monthly contribution (KES)" },
      { key: "housing_levy_rate", label: "Housing Levy Rate", value: 1.50, description: "Affordable Housing Levy rate (%)" },
      { key: "personal_relief", label: "Personal Relief", value: 2400, description: "Monthly personal tax relief (KES)" },
      { key: "insurance_relief_rate", label: "Insurance Relief Rate", value: 15.00, description: "Insurance relief as % of SHIF contribution" },
    ];

    for (const r of seedTaxRates) {
      await pool.query(
        `INSERT INTO tax_rates (key, label, value, description) VALUES ($1, $2, $3, $4) ON CONFLICT (key) DO NOTHING`,
        [r.key, r.label, r.value, r.description]
      );
    }

    // Seed default PAYE tax brackets
    const seedBrackets = [
      { name: "PAYE", minAmount: 0, maxAmount: 24000, rate: 0.10, priority: 1 },
      { name: "PAYE", minAmount: 24000, maxAmount: 32333, rate: 0.25, priority: 2 },
      { name: "PAYE", minAmount: 32333, maxAmount: 500000, rate: 0.30, priority: 3 },
      { name: "PAYE", minAmount: 500000, maxAmount: 800000, rate: 0.325, priority: 4 },
      { name: "PAYE", minAmount: 800000, maxAmount: 999999999, rate: 0.35, priority: 5 },
    ];

    for (const b of seedBrackets) {
      const existing = await pool.query("SELECT id FROM tax_brackets WHERE name = $1 AND min_amount = $2", [b.name, b.minAmount]);
      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO tax_brackets (name, min_amount, max_amount, rate, priority) VALUES ($1, $2, $3, $4, $5)`,
          [b.name, b.minAmount, b.maxAmount, b.rate, b.priority]
        );
      }
    }

    console.log("Default tax rates and brackets seeded!");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Failed to create tables:", err);
  process.exit(1);
});
