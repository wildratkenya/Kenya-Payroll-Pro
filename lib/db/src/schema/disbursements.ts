import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { employeesTable } from "./employees";
import { payrollRunsTable } from "./payroll";

export const disbursementsTable = pgTable("disbursements", {
  id: serial("id").primaryKey(),
  payrollRunId: integer("payroll_run_id").notNull().references(() => payrollRunsTable.id),
  employeeId: integer("employee_id").notNull().references(() => employeesTable.id),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  method: text("method").notNull(),
  reference: text("reference"),
  status: text("status").notNull().default("pending"),
  failureReason: text("failure_reason"),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDisbursementSchema = createInsertSchema(disbursementsTable).omit({ id: true, createdAt: true });
export type InsertDisbursement = z.infer<typeof insertDisbursementSchema>;
export type Disbursement = typeof disbursementsTable.$inferSelect;
