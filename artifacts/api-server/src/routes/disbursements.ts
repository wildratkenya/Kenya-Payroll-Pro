import { Router } from "express";
import { db, disbursementsTable, employeesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { ListDisbursementsQueryParams } from "@workspace/api-zod";

const router = Router();

// GET /disbursements
router.get("/disbursements", async (req, res) => {
  try {
    const params = ListDisbursementsQueryParams.parse(req.query);
    const conditions = [];
    if (params.payrollRunId) conditions.push(eq(disbursementsTable.payrollRunId, params.payrollRunId));
    if (params.status) conditions.push(eq(disbursementsTable.status, params.status));

    const disbursements = await db
      .select({
        id: disbursementsTable.id,
        payrollRunId: disbursementsTable.payrollRunId,
        employeeId: disbursementsTable.employeeId,
        employeeName: sql<string>`concat(${employeesTable.firstName}, ' ', ${employeesTable.lastName})`,
        amount: disbursementsTable.amount,
        method: disbursementsTable.method,
        reference: disbursementsTable.reference,
        status: disbursementsTable.status,
        failureReason: disbursementsTable.failureReason,
        processedAt: disbursementsTable.processedAt,
      })
      .from(disbursementsTable)
      .innerJoin(employeesTable, eq(disbursementsTable.employeeId, employeesTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(disbursementsTable.id);

    res.json(disbursements.map(d => ({ ...d, amount: Number(d.amount) })));
  } catch (err) {
    req.log.error({ err }, "Failed to list disbursements");
    res.status(500).json({ error: "Failed to list disbursements" });
  }
});

export default router;
