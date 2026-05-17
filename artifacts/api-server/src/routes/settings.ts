import { Router } from "express";
import { db, taxRatesTable, taxBracketsTable, companySettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CompanySettings, UpdateCompanySettingsBody } from "@workspace/api-zod";

const router = Router();

// GET /settings/tax-rates
router.get("/settings/tax-rates", async (req, res) => {
  try {
    const rates = await db.select().from(taxRatesTable).orderBy(taxRatesTable.key);
    res.json(rates.map(r => ({ ...r, value: Number(r.value) })));
  } catch (err) {
    req.log.error({ err }, "Failed to list tax rates");
    res.status(500).json({ error: "Failed to list tax rates" });
  }
});

// PUT /settings/tax-rates/:id
router.put("/settings/tax-rates/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { value } = req.body;
    if (typeof value !== "number") {
      return res.status(400).json({ error: "value must be a number" });
    }
    const [rate] = await db.update(taxRatesTable).set({ value: String(value) }).where(eq(taxRatesTable.id, id)).returning();
    if (!rate) return res.status(404).json({ error: "Tax rate not found" });
    res.json({ ...rate, value: Number(rate.value) });
  } catch (err) {
    req.log.error({ err }, "Failed to update tax rate");
    res.status(500).json({ error: "Failed to update tax rate" });
  }
});

// GET /settings/tax-brackets
router.get("/settings/tax-brackets", async (req, res) => {
  try {
    const brackets = await db.select().from(taxBracketsTable).orderBy(taxBracketsTable.priority);
    res.json(brackets.map(b => ({ ...b, minAmount: Number(b.minAmount), maxAmount: Number(b.maxAmount), rate: Number(b.rate) })));
  } catch (err) {
    req.log.error({ err }, "Failed to list tax brackets");
    res.status(500).json({ error: "Failed to list tax brackets" });
  }
});

// PUT /settings/tax-brackets/:id
router.put("/settings/tax-brackets/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { minAmount, maxAmount, rate } = req.body;
    const updateData: Record<string, string> = {};
    if (minAmount !== undefined) updateData.minAmount = String(minAmount);
    if (maxAmount !== undefined) updateData.maxAmount = String(maxAmount);
    if (rate !== undefined) updateData.rate = String(rate);
    const [bracket] = await db.update(taxBracketsTable).set(updateData).where(eq(taxBracketsTable.id, id)).returning();
    if (!bracket) return res.status(404).json({ error: "Tax bracket not found" });
    res.json({ ...bracket, minAmount: Number(bracket.minAmount), maxAmount: Number(bracket.maxAmount), rate: Number(bracket.rate) });
  } catch (err) {
    req.log.error({ err }, "Failed to update tax bracket");
    res.status(500).json({ error: "Failed to update tax bracket" });
  }
});

// GET /settings/company
router.get("/settings/company", async (req, res) => {
  try {
    const [settings] = await db.select().from(companySettingsTable).limit(1);
    if (!settings) {
      return res.json({
        id: 0,
        companyName: "",
        companyAddress: null,
        companyPhone: null,
        companyEmail: null,
        companyLogoUrl: null,
        kraPin: null,
        payrollFooter: null,
        createdAt: new Date().toISOString(),
      });
    }
    const { updatedAt, ...rest } = settings;
    res.json(rest);
  } catch (err) {
    req.log.error({ err }, "Failed to get company settings");
    res.status(500).json({ error: "Failed to get company settings" });
  }
});

// PUT /settings/company
router.put("/settings/company", async (req, res) => {
  try {
    const body = UpdateCompanySettingsBody.parse(req.body);
    const [existing] = await db.select({ id: companySettingsTable.id }).from(companySettingsTable).limit(1);

    let settings;
    if (existing) {
      [settings] = await db.update(companySettingsTable).set(body).where(eq(companySettingsTable.id, existing.id)).returning();
    } else {
      [settings] = await db.insert(companySettingsTable).values({
        companyName: body.companyName ?? "",
        companyAddress: body.companyAddress,
        companyPhone: body.companyPhone,
        companyEmail: body.companyEmail,
        companyLogoUrl: body.companyLogoUrl,
        kraPin: body.kraPin,
        payrollFooter: body.payrollFooter,
      }).returning();
    }

    if (!settings) return res.status(500).json({ error: "Failed to save company settings" });
    const { updatedAt, ...rest } = settings;
    res.json(rest);
  } catch (err) {
    req.log.error({ err }, "Failed to update company settings");
    res.status(500).json({ error: "Failed to update company settings" });
  }
});

export default router;
