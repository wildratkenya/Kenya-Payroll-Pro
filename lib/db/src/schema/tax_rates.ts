import { pgTable, serial, text, numeric, integer } from "drizzle-orm/pg-core";

export const taxRatesTable = pgTable("tax_rates", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  value: numeric("value", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
});

export const taxBracketsTable = pgTable("tax_brackets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("PAYE"),
  minAmount: numeric("min_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  maxAmount: numeric("max_amount", { precision: 12, scale: 2 }).notNull(),
  rate: numeric("rate", { precision: 5, scale: 4 }).notNull(),
  priority: integer("priority").notNull().default(0),
});
