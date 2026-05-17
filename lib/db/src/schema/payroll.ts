import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { employeesTable } from "./employees";

export const payrollRunsTable = pgTable("payroll_runs", {
  id: serial("id").primaryKey(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  status: text("status").notNull().default("draft"),
  totalGross: numeric("total_gross", { precision: 16, scale: 2 }).default("0"),
  totalPaye: numeric("total_paye", { precision: 16, scale: 2 }).default("0"),
  totalNssf: numeric("total_nssf", { precision: 16, scale: 2 }).default("0"),
  totalShif: numeric("total_shif", { precision: 16, scale: 2 }).default("0"),
  totalHousingLevy: numeric("total_housing_levy", { precision: 16, scale: 2 }).default("0"),
  totalNet: numeric("total_net", { precision: 16, scale: 2 }).default("0"),
  employeeCount: integer("employee_count").default(0),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  disbursedAt: timestamp("disbursed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const payrollEntriesTable = pgTable("payroll_entries", {
  id: serial("id").primaryKey(),
  payrollRunId: integer("payroll_run_id").notNull().references(() => payrollRunsTable.id),
  employeeId: integer("employee_id").notNull().references(() => employeesTable.id),
  grossSalary: numeric("gross_salary", { precision: 14, scale: 2 }).notNull(),
  basicSalary: numeric("basic_salary", { precision: 14, scale: 2 }).notNull(),
  paye: numeric("paye", { precision: 14, scale: 2 }).notNull().default("0"),
  nssfEmployee: numeric("nssf_employee", { precision: 14, scale: 2 }).notNull().default("0"),
  nssfEmployer: numeric("nssf_employer", { precision: 14, scale: 2 }).notNull().default("0"),
  shif: numeric("shif", { precision: 14, scale: 2 }).notNull().default("0"),
  housingLevyEmployee: numeric("housing_levy_employee", { precision: 14, scale: 2 }).notNull().default("0"),
  housingLevyEmployer: numeric("housing_levy_employer", { precision: 14, scale: 2 }).notNull().default("0"),
  personalRelief: numeric("personal_relief", { precision: 14, scale: 2 }).notNull().default("2400"),
  insuranceRelief: numeric("insurance_relief", { precision: 14, scale: 2 }).notNull().default("0"),
  otherDeductions: numeric("other_deductions", { precision: 14, scale: 2 }).notNull().default("0"),
  netPay: numeric("net_pay", { precision: 14, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull().default("bank"),
  disbursementStatus: text("disbursement_status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPayrollRunSchema = createInsertSchema(payrollRunsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPayrollRun = z.infer<typeof insertPayrollRunSchema>;
export type PayrollRun = typeof payrollRunsTable.$inferSelect;

export const insertPayrollEntrySchema = createInsertSchema(payrollEntriesTable).omit({ id: true, createdAt: true });
export type InsertPayrollEntry = z.infer<typeof insertPayrollEntrySchema>;
export type PayrollEntry = typeof payrollEntriesTable.$inferSelect;
