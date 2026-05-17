import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { departmentsTable } from "./departments";

export const employeesTable = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeNumber: text("employee_number").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  departmentId: integer("department_id").references(() => departmentsTable.id),
  jobTitle: text("job_title"),
  grossSalary: numeric("gross_salary", { precision: 14, scale: 2 }).notNull(),
  employmentType: text("employment_type").notNull().default("permanent"),
  paymentMethod: text("payment_method").notNull().default("bank"),
  mpesaNumber: text("mpesa_number"),
  bankName: text("bank_name"),
  bankAccount: text("bank_account"),
  bankBranch: text("bank_branch"),
  kraPin: text("kra_pin"),
  nssfNumber: text("nssf_number"),
  shifNumber: text("shif_number"),
  status: text("status").notNull().default("active"),
  role: text("role").notNull().default("employee"),
  hireDate: text("hire_date").notNull(),
  terminationDate: text("termination_date"),
  clerkUserId: text("clerk_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEmployeeSchema = createInsertSchema(employeesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employeesTable.$inferSelect;
