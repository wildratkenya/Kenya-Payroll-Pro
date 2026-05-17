import { Router } from "express";
import { db, departmentsTable, employeesTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import {
  CreateDepartmentBody,
  UpdateDepartmentBody,
  UpdateDepartmentParams,
  DeleteDepartmentParams,
} from "@workspace/api-zod";

const router = Router();

// GET /departments
router.get("/departments", async (req, res) => {
  try {
    const departments = await db
      .select({
        id: departmentsTable.id,
        name: departmentsTable.name,
        description: departmentsTable.description,
        employeeCount: count(employeesTable.id),
      })
      .from(departmentsTable)
      .leftJoin(employeesTable, eq(departmentsTable.id, employeesTable.departmentId))
      .groupBy(departmentsTable.id)
      .orderBy(departmentsTable.name);

    res.json(departments);
  } catch (err) {
    req.log.error({ err }, "Failed to list departments");
    res.status(500).json({ error: "Failed to list departments" });
  }
});

// POST /departments
router.post("/departments", async (req, res) => {
  try {
    const body = CreateDepartmentBody.parse(req.body);
    const [dept] = await db.insert(departmentsTable).values(body).returning();
    res.status(201).json({ ...dept, employeeCount: 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to create department");
    res.status(500).json({ error: "Failed to create department" });
  }
});

// PATCH /departments/:id
router.patch("/departments/:id", async (req, res) => {
  try {
    const params = UpdateDepartmentParams.parse({ id: Number(req.params.id) });
    const body = UpdateDepartmentBody.parse(req.body);
    const [dept] = await db.update(departmentsTable).set(body).where(eq(departmentsTable.id, params.id)).returning();
    if (!dept) return res.status(404).json({ error: "Department not found" });

    const [{ empCount }] = await db.select({ empCount: count(employeesTable.id) })
      .from(employeesTable)
      .where(eq(employeesTable.departmentId, dept.id));

    res.json({ ...dept, employeeCount: empCount });
  } catch (err) {
    req.log.error({ err }, "Failed to update department");
    res.status(500).json({ error: "Failed to update department" });
  }
});

// DELETE /departments/:id
router.delete("/departments/:id", async (req, res) => {
  try {
    const params = DeleteDepartmentParams.parse({ id: Number(req.params.id) });
    await db.delete(departmentsTable).where(eq(departmentsTable.id, params.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete department");
    res.status(500).json({ error: "Failed to delete department" });
  }
});

export default router;
