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
        nationalId: employeesTable.nationalId,
        dateOfBirth: employeesTable.dateOfBirth,
        gender: employeesTable.gender,
        maritalStatus: employeesTable.maritalStatus,
        dependents: employeesTable.dependents,
        postalAddress: employeesTable.postalAddress,
        nextOfKinName: employeesTable.nextOfKinName,
        nextOfKinPhone: employeesTable.nextOfKinPhone,
        nextOfKinRelationship: employeesTable.nextOfKinRelationship,
        photoUrl: employeesTable.photoUrl,
        probationEndDate: employeesTable.probationEndDate,
        contractEndDate: employeesTable.contractEndDate,
        isDisabled: employeesTable.isDisabled,
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

    res.json(employees.map(e => ({ ...e, grossSalary: Number(e.grossSalary), dependents: e.dependents ?? undefined })));
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
        nationalId: employeesTable.nationalId,
        dateOfBirth: employeesTable.dateOfBirth,
        gender: employeesTable.gender,
        maritalStatus: employeesTable.maritalStatus,
        dependents: employeesTable.dependents,
        postalAddress: employeesTable.postalAddress,
        nextOfKinName: employeesTable.nextOfKinName,
        nextOfKinPhone: employeesTable.nextOfKinPhone,
        nextOfKinRelationship: employeesTable.nextOfKinRelationship,
        photoUrl: employeesTable.photoUrl,
        probationEndDate: employeesTable.probationEndDate,
        contractEndDate: employeesTable.contractEndDate,
        isDisabled: employeesTable.isDisabled,
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

// POST /employees/send-payslip
router.post("/employees/send-payslip", async (req, res) => {
  try {
    const { SendPayslipBody } = await import("@workspace/api-zod");
    const body = SendPayslipBody.parse(req.body);

    const { payrollEntriesTable, payrollRunsTable } = await import("@workspace/db");

    const entries = await db
      .select({
        id: payrollEntriesTable.id,
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
        netPay: payrollEntriesTable.netPay,
        employeeId: payrollEntriesTable.employeeId,
        month: payrollRunsTable.month,
        year: payrollRunsTable.year,
      })
      .from(payrollEntriesTable)
      .innerJoin(payrollRunsTable, eq(payrollEntriesTable.payrollRunId, payrollRunsTable.id))
      .where(eq(payrollEntriesTable.payrollRunId, body.payrollRunId));

    let filteredEntries = entries;
    if (body.employeeIds && body.employeeIds.length > 0) {
      filteredEntries = entries.filter(e => body.employeeIds!.includes(e.employeeId));
    }

    if (filteredEntries.length === 0) {
      return res.status(404).json({ error: "No payroll entries found" });
    }

    const employeeIds = filteredEntries.map(e => e.employeeId);
    const employees = await db
      .select({
        id: employeesTable.id,
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
        email: employeesTable.email,
        employeeNumber: employeesTable.employeeNumber,
      })
      .from(employeesTable)
      .where(sql`${employeesTable.id} = ANY(${employeeIds})`);

    const empMap = new Map(employees.map(e => [e.id, e]));

    const [companyRow] = await db.select().from((await import("@workspace/db")).companySettingsTable).limit(1);

    const { sendPayslipEmail, buildPayslipHtml } = await import("./lib/mail");

    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const entry of filteredEntries) {
      const emp = empMap.get(entry.employeeId);
      if (!emp) { failed++; continue; }

      const to = body.emailOverride || emp.email;
      if (!to) { failed++; errors.push(`No email for ${emp.firstName} ${emp.lastName}`); continue; }

      try {
        const html = buildPayslipHtml({
          employeeName: `${emp.firstName} ${emp.lastName}`,
          employeeNumber: emp.employeeNumber,
          month: months[(entry.month ?? 1) - 1] || "Unknown",
          year: entry.year ?? 0,
          grossSalary: Number(entry.grossSalary),
          basicSalary: Number(entry.basicSalary ?? entry.grossSalary),
          paye: Number(entry.paye ?? 0),
          nssfEmployee: Number(entry.nssfEmployee ?? 0),
          nssfEmployer: Number(entry.nssfEmployer ?? 0),
          shif: Number(entry.shif ?? 0),
          housingLevyEmployee: Number(entry.housingLevyEmployee ?? 0),
          housingLevyEmployer: Number(entry.housingLevyEmployer ?? 0),
          personalRelief: Number(entry.personalRelief ?? 0),
          netPay: Number(entry.netPay),
          companyName: companyRow?.companyName ?? undefined,
          companyAddress: companyRow?.companyAddress ?? undefined,
          kraPin: companyRow?.kraPin ?? undefined,
        });

        await sendPayslipEmail({
          to,
          subject: `Payslip for ${months[(entry.month ?? 1) - 1]} ${entry.year}`,
          html,
        });
        sent++;
      } catch (e) {
        failed++;
        errors.push(`Failed to send to ${emp.email}: ${e instanceof Error ? e.message : "Unknown error"}`);
      }
    }

    res.json({ message: "Payslips processed", sent, failed, errors: errors.length > 0 ? errors : undefined });
  } catch (err) {
    req.log.error({ err }, "Failed to send payslips");
    res.status(500).json({ error: "Failed to send payslips" });
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
        nationalId: employeesTable.nationalId,
        dateOfBirth: employeesTable.dateOfBirth,
        gender: employeesTable.gender,
        maritalStatus: employeesTable.maritalStatus,
        dependents: employeesTable.dependents,
        postalAddress: employeesTable.postalAddress,
        nextOfKinName: employeesTable.nextOfKinName,
        nextOfKinPhone: employeesTable.nextOfKinPhone,
        nextOfKinRelationship: employeesTable.nextOfKinRelationship,
        photoUrl: employeesTable.photoUrl,
        probationEndDate: employeesTable.probationEndDate,
        contractEndDate: employeesTable.contractEndDate,
        isDisabled: employeesTable.isDisabled,
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
