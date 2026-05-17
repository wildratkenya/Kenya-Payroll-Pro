import { Router } from "express";
import { db, taxRatesTable, taxBracketsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

export default router;
