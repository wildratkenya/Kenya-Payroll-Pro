import { Router } from "express";
import { db, leaveTypesTable, leaveRequestsTable, employeesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  CreateLeaveTypeBody,
  ListLeaveRequestsQueryParams,
  CreateLeaveRequestBody,
  GetLeaveRequestParams,
  UpdateLeaveRequestParams,
  UpdateLeaveRequestBody,
  GetLeaveBalanceParams,
} from "@workspace/api-zod";

const router = Router();

// GET /leave/types
router.get("/leave/types", async (req, res) => {
  try {
    const types = await db.select().from(leaveTypesTable).orderBy(leaveTypesTable.name);
    res.json(types);
  } catch (err) {
    req.log.error({ err }, "Failed to list leave types");
    res.status(500).json({ error: "Failed to list leave types" });
  }
});

// POST /leave/types
router.post("/leave/types", async (req, res) => {
  try {
    const body = CreateLeaveTypeBody.parse(req.body);
    const [type] = await db.insert(leaveTypesTable).values(body).returning();
    res.status(201).json(type);
  } catch (err) {
    req.log.error({ err }, "Failed to create leave type");
    res.status(500).json({ error: "Failed to create leave type" });
  }
});

// GET /leave/requests
router.get("/leave/requests", async (req, res) => {
  try {
    const params = ListLeaveRequestsQueryParams.parse(req.query);
    const conditions = [];
    if (params.employeeId) conditions.push(eq(leaveRequestsTable.employeeId, params.employeeId));
    if (params.status) conditions.push(eq(leaveRequestsTable.status, params.status));

    const requests = await db
      .select({
        id: leaveRequestsTable.id,
        employeeId: leaveRequestsTable.employeeId,
        employeeName: sql<string>`concat(${employeesTable.firstName}, ' ', ${employeesTable.lastName})`,
        leaveTypeId: leaveRequestsTable.leaveTypeId,
        leaveTypeName: leaveTypesTable.name,
        startDate: leaveRequestsTable.startDate,
        endDate: leaveRequestsTable.endDate,
        days: leaveRequestsTable.days,
        reason: leaveRequestsTable.reason,
        status: leaveRequestsTable.status,
        approverId: leaveRequestsTable.approverId,
        approvedAt: leaveRequestsTable.approvedAt,
        rejectionReason: leaveRequestsTable.rejectionReason,
        appliedAt: leaveRequestsTable.appliedAt,
      })
      .from(leaveRequestsTable)
      .innerJoin(employeesTable, eq(leaveRequestsTable.employeeId, employeesTable.id))
      .innerJoin(leaveTypesTable, eq(leaveRequestsTable.leaveTypeId, leaveTypesTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(leaveRequestsTable.appliedAt);

    res.json(requests.map(r => ({ ...r, approverName: null })));
  } catch (err) {
    req.log.error({ err }, "Failed to list leave requests");
    res.status(500).json({ error: "Failed to list leave requests" });
  }
});

// POST /leave/requests
router.post("/leave/requests", async (req, res) => {
  try {
    const body = CreateLeaveRequestBody.parse(req.body);
    const start = new Date(body.startDate);
    const end = new Date(body.endDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const [request] = await db.insert(leaveRequestsTable).values({
      ...body,
      days,
    }).returning();

    const [emp] = await db.select().from(employeesTable).where(eq(employeesTable.id, body.employeeId)).limit(1);
    const [type] = await db.select().from(leaveTypesTable).where(eq(leaveTypesTable.id, body.leaveTypeId)).limit(1);

    res.status(201).json({
      ...request,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "",
      leaveTypeName: type?.name ?? "",
      approverName: null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create leave request");
    res.status(500).json({ error: "Failed to create leave request" });
  }
});

// GET /leave/requests/:id
router.get("/leave/requests/:id", async (req, res) => {
  try {
    const params = GetLeaveRequestParams.parse({ id: Number(req.params.id) });
    const [request] = await db
      .select({
        id: leaveRequestsTable.id,
        employeeId: leaveRequestsTable.employeeId,
        employeeName: sql<string>`concat(${employeesTable.firstName}, ' ', ${employeesTable.lastName})`,
        leaveTypeId: leaveRequestsTable.leaveTypeId,
        leaveTypeName: leaveTypesTable.name,
        startDate: leaveRequestsTable.startDate,
        endDate: leaveRequestsTable.endDate,
        days: leaveRequestsTable.days,
        reason: leaveRequestsTable.reason,
        status: leaveRequestsTable.status,
        approverId: leaveRequestsTable.approverId,
        approvedAt: leaveRequestsTable.approvedAt,
        rejectionReason: leaveRequestsTable.rejectionReason,
        appliedAt: leaveRequestsTable.appliedAt,
      })
      .from(leaveRequestsTable)
      .innerJoin(employeesTable, eq(leaveRequestsTable.employeeId, employeesTable.id))
      .innerJoin(leaveTypesTable, eq(leaveRequestsTable.leaveTypeId, leaveTypesTable.id))
      .where(eq(leaveRequestsTable.id, params.id))
      .limit(1);

    if (!request) return res.status(404).json({ error: "Leave request not found" });
    res.json({ ...request, approverName: null });
  } catch (err) {
    req.log.error({ err }, "Failed to get leave request");
    res.status(500).json({ error: "Failed to get leave request" });
  }
});

// PATCH /leave/requests/:id
router.patch("/leave/requests/:id", async (req, res) => {
  try {
    const params = UpdateLeaveRequestParams.parse({ id: Number(req.params.id) });
    const body = UpdateLeaveRequestBody.parse(req.body);

    const updateData: Record<string, unknown> = { status: body.status };
    if (body.approverId) updateData.approverId = body.approverId;
    if (body.rejectionReason) updateData.rejectionReason = body.rejectionReason;
    if (body.status === "approved" || body.status === "rejected") updateData.approvedAt = new Date();

    const [request] = await db.update(leaveRequestsTable).set(updateData).where(eq(leaveRequestsTable.id, params.id)).returning();
    if (!request) return res.status(404).json({ error: "Leave request not found" });

    const [emp] = await db.select().from(employeesTable).where(eq(employeesTable.id, request.employeeId)).limit(1);
    const [type] = await db.select().from(leaveTypesTable).where(eq(leaveTypesTable.id, request.leaveTypeId)).limit(1);

    res.json({
      ...request,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "",
      leaveTypeName: type?.name ?? "",
      approverName: null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update leave request");
    res.status(500).json({ error: "Failed to update leave request" });
  }
});

// GET /leave/balance/:employeeId
router.get("/leave/balance/:employeeId", async (req, res) => {
  try {
    const params = GetLeaveBalanceParams.parse({ employeeId: Number(req.params.employeeId) });

    const types = await db.select().from(leaveTypesTable);
    const currentYear = new Date().getFullYear();

    const balances = await Promise.all(types.map(async (type) => {
      const [usedResult] = await db
        .select({ total: sql<number>`coalesce(sum(${leaveRequestsTable.days}), 0)::int` })
        .from(leaveRequestsTable)
        .where(and(
          eq(leaveRequestsTable.employeeId, params.employeeId),
          eq(leaveRequestsTable.leaveTypeId, type.id),
          eq(leaveRequestsTable.status, "approved"),
          sql`extract(year from ${leaveRequestsTable.appliedAt}) = ${currentYear}`,
        ));

      const daysUsed = usedResult.total;
      const daysRemaining = Math.max(0, type.daysAllowed - daysUsed);

      return {
        leaveTypeId: type.id,
        leaveTypeName: type.name,
        daysAllowed: type.daysAllowed,
        daysUsed,
        daysRemaining,
      };
    }));

    res.json(balances);
  } catch (err) {
    req.log.error({ err }, "Failed to get leave balance");
    res.status(500).json({ error: "Failed to get leave balance" });
  }
});

export default router;
