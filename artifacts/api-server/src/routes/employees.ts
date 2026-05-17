import { Router } from "express";
import { db, employeesTable, departmentsTable } from "@workspace/db";
import { eq, ilike, and, or, sql } from "drizzle-orm";
import {
  CreateEmployeeBody,
  UpdateEmployeeBody,
  ListEmployeesQueryParams,
  GetEmployeeParams,
  UpdateEmployeeParams,
  DeleteEmployeeParams,
  GetEmployeePayslipsParams,
} from "@workspace/api-zod";

const router = Router();

function generateEmployeeNumber(): string {
  const prefix = "EMP";
  const num = Math.floor(Math.random() * 90000) + 10000;
  return `${prefix}${num}`;
}

// GET /employees
router.get("/employees", async (req, res) => {
  try {
    const params = ListEmployeesQueryParams.parse(req.query);
    const conditions = [];

    if (params.departmentId) {
      conditions.push(eq(employeesTable.departmentId, params.departmentId));
    }
    if (params.status) {
      conditions.push(eq(employeesTable.status, params.status));
    }
    if (params.search) {
      conditions.push(
        or(
          ilike(employeesTable.firstName, `%${params.search}%`),
          ilike(employeesTable.lastName, `%${params.search}%`),
          ilike(employeesTable.email, `%${params.search}%`),
          ilike(employeesTable.employeeNumber, `%${params.search}%`),
        )
      );
    }

    const employees = await db
      .select({
        id: employeesTable.id,
        employeeNumber: employeesTable.employeeNumber,
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
        email: employeesTable.email,
        phone: employeesTable.phone,
        departmentId: employeesTable.departmentId,
        departmentName: departmentsTable.name,
        jobTitle: employeesTable.jobTitle,
        grossSalary: employeesTable.grossSalary,
        employmentType: employeesTable.employmentType,
        paymentMethod: employeesTable.paymentMethod,
        mpesaNumber: employeesTable.mpesaNumber,
        bankName: employeesTable.bankName,
        bankAccount: employeesTable.bankAccount,
        bankBranch: employeesTable.bankBranch,
        kraPin: employeesTable.kraPin,
        nssfNumber: employeesTable.nssfNumber,
        shifNumber: employeesTable.shifNumber,
        status: employeesTable.status,
        role: employeesTable.role,
        hireDate: employeesTable.hireDate,
        terminationDate: employeesTable.terminationDate,
        clerkUserId: employeesTable.clerkUserId,
        createdAt: employeesTable.createdAt,
      })
      .from(employeesTable)
      .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(employeesTable.firstName);

    res.json(employees.map(e => ({ ...e, grossSalary: Number(e.grossSalary) })));
  } catch (err) {
    req.log.error({ err }, "Failed to list employees");
    res.status(500).json({ error: "Failed to list employees" });
  }
});

// POST /employees
router.post("/employees", async (req, res) => {
  try {
    const body = CreateEmployeeBody.parse(req.body);
    const employeeNumber = generateEmployeeNumber();

    const [employee] = await db.insert(employeesTable).values({
      ...body,
      employeeNumber,
      grossSalary: String(body.grossSalary),
    }).returning();

    const dept = employee.departmentId
      ? await db.select().from(departmentsTable).where(eq(departmentsTable.id, employee.departmentId)).limit(1)
      : [];

    res.status(201).json({ ...employee, grossSalary: Number(employee.grossSalary), departmentName: dept[0]?.name ?? null });
  } catch (err) {
    req.log.error({ err }, "Failed to create employee");
    res.status(500).json({ error: "Failed to create employee" });
  }
});

// GET /employees/:id
router.get("/employees/:id", async (req, res) => {
  try {
    const params = GetEmployeeParams.parse({ id: Number(req.params.id) });
    const [employee] = await db
      .select({
        id: employeesTable.id,
        employeeNumber: employeesTable.employeeNumber,
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
        email: employeesTable.email,
        phone: employeesTable.phone,
        departmentId: employeesTable.departmentId,
        departmentName: departmentsTable.name,
        jobTitle: employeesTable.jobTitle,
        grossSalary: employeesTable.grossSalary,
        employmentType: employeesTable.employmentType,
        paymentMethod: employeesTable.paymentMethod,
        mpesaNumber: employeesTable.mpesaNumber,
        bankName: employeesTable.bankName,
        bankAccount: employeesTable.bankAccount,
        bankBranch: employeesTable.bankBranch,
        kraPin: employeesTable.kraPin,
        nssfNumber: employeesTable.nssfNumber,
        shifNumber: employeesTable.shifNumber,
        status: employeesTable.status,
        role: employeesTable.role,
        hireDate: employeesTable.hireDate,
        terminationDate: employeesTable.terminationDate,
        clerkUserId: employeesTable.clerkUserId,
        createdAt: employeesTable.createdAt,
      })
      .from(employeesTable)
      .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id))
      .where(eq(employeesTable.id, params.id))
      .limit(1);

    if (!employee) return res.status(404).json({ error: "Employee not found" });

    res.json({ ...employee, grossSalary: Number(employee.grossSalary) });
  } catch (err) {
    req.log.error({ err }, "Failed to get employee");
    res.status(500).json({ error: "Failed to get employee" });
  }
});

// PATCH /employees/:id
router.patch("/employees/:id", async (req, res) => {
  try {
    const params = UpdateEmployeeParams.parse({ id: Number(req.params.id) });
    const body = UpdateEmployeeBody.parse(req.body);

    const updateData: Record<string, unknown> = { ...body };
    if (body.grossSalary !== undefined) updateData.grossSalary = String(body.grossSalary);

    const [employee] = await db.update(employeesTable).set(updateData).where(eq(employeesTable.id, params.id)).returning();
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    const dept = employee.departmentId
      ? await db.select().from(departmentsTable).where(eq(departmentsTable.id, employee.departmentId)).limit(1)
      : [];

    res.json({ ...employee, grossSalary: Number(employee.grossSalary), departmentName: dept[0]?.name ?? null });
  } catch (err) {
    req.log.error({ err }, "Failed to update employee");
    res.status(500).json({ error: "Failed to update employee" });
  }
});

// DELETE /employees/:id
router.delete("/employees/:id", async (req, res) => {
  try {
    const params = DeleteEmployeeParams.parse({ id: Number(req.params.id) });
    await db.delete(employeesTable).where(eq(employeesTable.id, params.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete employee");
    res.status(500).json({ error: "Failed to delete employee" });
  }
});

// GET /employees/:id/payslips
router.get("/employees/:id/payslips", async (req, res) => {
  try {
    const params = GetEmployeePayslipsParams.parse({ id: Number(req.params.id) });

    const { payrollEntriesTable, payrollRunsTable } = await import("@workspace/db");

    const entries = await db
      .select({
        id: payrollEntriesTable.id,
        payrollRunId: payrollEntriesTable.payrollRunId,
        employeeId: payrollEntriesTable.employeeId,
        grossSalary: payrollEntriesTable.grossSalary,
        basicSalary: payrollEntriesTable.basicSalary,
        paye: payrollEntriesTable.paye,
        nssfEmployee: payrollEntriesTable.nssfEmployee,
        nssfEmployer: payrollEntriesTable.nssfEmployer,
        shif: payrollEntriesTable.shif,
        housingLevyEmployee: payrollEntriesTable.housingLevyEmployee,
        housingLevyEmployer: payrollEntriesTable.housingLevyEmployer,
        personalRelief: payrollEntriesTable.personalRelief,
        insuranceRelief: payrollEntriesTable.insuranceRelief,
        otherDeductions: payrollEntriesTable.otherDeductions,
        netPay: payrollEntriesTable.netPay,
        paymentMethod: payrollEntriesTable.paymentMethod,
        disbursementStatus: payrollEntriesTable.disbursementStatus,
        month: payrollRunsTable.month,
        year: payrollRunsTable.year,
      })
      .from(payrollEntriesTable)
      .innerJoin(payrollRunsTable, eq(payrollEntriesTable.payrollRunId, payrollRunsTable.id))
      .where(eq(payrollEntriesTable.employeeId, params.id))
      .orderBy(payrollRunsTable.year, payrollRunsTable.month);

    res.json(entries.map(e => ({
      ...e,
      employeeName: "",
      employeeNumber: "",
      departmentName: null,
      jobTitle: null,
      grossSalary: Number(e.grossSalary),
      basicSalary: Number(e.basicSalary),
      paye: Number(e.paye),
      nssfEmployee: Number(e.nssfEmployee),
      nssfEmployer: Number(e.nssfEmployer),
      shif: Number(e.shif),
      housingLevyEmployee: Number(e.housingLevyEmployee),
      housingLevyEmployer: Number(e.housingLevyEmployer),
      personalRelief: Number(e.personalRelief),
      insuranceRelief: Number(e.insuranceRelief),
      otherDeductions: Number(e.otherDeductions),
      netPay: Number(e.netPay),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to get employee payslips");
    res.status(500).json({ error: "Failed to get payslips" });
  }
});

// GET /me
router.get("/me", async (req, res) => {
  try {
    const auth = req.auth;
    const userId = auth?.userId;
    if (!userId) return res.status(404).json({ error: "Not authenticated" });

    const [employee] = await db
      .select({
        id: employeesTable.id,
        employeeNumber: employeesTable.employeeNumber,
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
        email: employeesTable.email,
        phone: employeesTable.phone,
        departmentId: employeesTable.departmentId,
        departmentName: departmentsTable.name,
        jobTitle: employeesTable.jobTitle,
        grossSalary: employeesTable.grossSalary,
        employmentType: employeesTable.employmentType,
        paymentMethod: employeesTable.paymentMethod,
        mpesaNumber: employeesTable.mpesaNumber,
        bankName: employeesTable.bankName,
        bankAccount: employeesTable.bankAccount,
        bankBranch: employeesTable.bankBranch,
        kraPin: employeesTable.kraPin,
        nssfNumber: employeesTable.nssfNumber,
        shifNumber: employeesTable.shifNumber,
        status: employeesTable.status,
        role: employeesTable.role,
        hireDate: employeesTable.hireDate,
        terminationDate: employeesTable.terminationDate,
        clerkUserId: employeesTable.clerkUserId,
        createdAt: employeesTable.createdAt,
      })
      .from(employeesTable)
      .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id))
      .where(eq(employeesTable.clerkUserId, userId))
      .limit(1);

    if (!employee) return res.status(404).json({ error: "Employee profile not found" });
    res.json({ ...employee, grossSalary: Number(employee.grossSalary) });
  } catch (err) {
    req.log.error({ err }, "Failed to get current user");
    res.status(500).json({ error: "Failed to get current user" });
  }
});

export default router;
