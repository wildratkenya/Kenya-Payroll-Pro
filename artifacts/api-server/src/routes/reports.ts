import { Router } from "express";
import { db, payrollRunsTable, payrollEntriesTable, employeesTable, departmentsTable, companySettingsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  GetMonthlyReportQueryParams,
  GetAnnualReportQueryParams,
  GetP9QueryParams,
} from "@workspace/api-zod";

const router = Router();

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// GET /reports/monthly
router.get("/reports/monthly", async (req, res) => {
  try {
    const params = GetMonthlyReportQueryParams.parse({
      month: Number(req.query.month),
      year: Number(req.query.year),
    });

    const [run] = await db.select().from(payrollRunsTable)
      .where(and(eq(payrollRunsTable.month, params.month), eq(payrollRunsTable.year, params.year)))
      .limit(1);

    if (!run) {
      return res.json({
        month: params.month,
        year: params.year,
        status: null,
        totalGross: 0,
        totalPaye: 0,
        totalNssf: 0,
        totalShif: 0,
        totalHousingLevy: 0,
        totalNet: 0,
        employeeCount: 0,
        entries: [],
        departmentSummary: [],
      });
    }

    const entries = await db
      .select({
        id: payrollEntriesTable.id,
        payrollRunId: payrollEntriesTable.payrollRunId,
        employeeId: payrollEntriesTable.employeeId,
        employeeName: sql<string>`concat(${employeesTable.firstName}, ' ', ${employeesTable.lastName})`,
        employeeNumber: employeesTable.employeeNumber,
        departmentName: departmentsTable.name,
        jobTitle: employeesTable.jobTitle,
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
      .innerJoin(employeesTable, eq(payrollEntriesTable.employeeId, employeesTable.id))
      .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id))
      .innerJoin(payrollRunsTable, eq(payrollEntriesTable.payrollRunId, payrollRunsTable.id))
      .where(eq(payrollEntriesTable.payrollRunId, run.id))
      .orderBy(employeesTable.firstName);

    const deptSummary = await db
      .select({
        department: departmentsTable.name,
        employeeCount: sql<number>`count(distinct ${employeesTable.id})::int`,
        totalGross: sql<number>`sum(${payrollEntriesTable.grossSalary}::numeric)`,
      })
      .from(payrollEntriesTable)
      .innerJoin(employeesTable, eq(payrollEntriesTable.employeeId, employeesTable.id))
      .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id))
      .where(eq(payrollEntriesTable.payrollRunId, run.id))
      .groupBy(departmentsTable.id, departmentsTable.name);

    res.json({
      month: run.month,
      year: run.year,
      status: run.status,
      totalGross: Number(run.totalGross),
      totalPaye: Number(run.totalPaye),
      totalNssf: Number(run.totalNssf),
      totalShif: Number(run.totalShif),
      totalHousingLevy: Number(run.totalHousingLevy),
      totalNet: Number(run.totalNet),
      employeeCount: run.employeeCount,
      entries: entries.map(e => ({
        ...e,
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
      })),
      departmentSummary: deptSummary.map(d => ({
        department: d.department ?? "Unassigned",
        employeeCount: d.employeeCount,
        totalGross: Number(d.totalGross ?? 0),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get monthly report");
    res.status(500).json({ error: "Failed to get monthly report" });
  }
});

// GET /reports/annual
router.get("/reports/annual", async (req, res) => {
  try {
    const params = GetAnnualReportQueryParams.parse({ year: Number(req.query.year) });

    const runs = await db.select().from(payrollRunsTable)
      .where(eq(payrollRunsTable.year, params.year))
      .orderBy(payrollRunsTable.month);

    const totalGross = runs.reduce((s, r) => s + Number(r.totalGross), 0);
    const totalPaye = runs.reduce((s, r) => s + Number(r.totalPaye), 0);
    const totalNssf = runs.reduce((s, r) => s + Number(r.totalNssf), 0);
    const totalShif = runs.reduce((s, r) => s + Number(r.totalShif), 0);
    const totalHousingLevy = runs.reduce((s, r) => s + Number(r.totalHousingLevy), 0);
    const totalNet = runs.reduce((s, r) => s + Number(r.totalNet), 0);

    res.json({
      year: params.year,
      totalGross,
      totalPaye,
      totalNssf,
      totalShif,
      totalHousingLevy,
      totalNet,
      monthlyBreakdown: runs.map(r => ({
        month: MONTH_NAMES[(r.month ?? 1) - 1],
        gross: Number(r.totalGross),
        net: Number(r.totalNet),
        paye: Number(r.totalPaye),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get annual report");
    res.status(500).json({ error: "Failed to get annual report" });
  }
});

// GET /reports/p9?employeeId=&year=
router.get("/reports/p9", async (req, res) => {
  try {
    const params = GetP9QueryParams.parse({
      employeeId: req.query.employeeId ? Number(req.query.employeeId) : undefined,
      year: Number(req.query.year),
    });

    const [company] = await db.select().from(companySettingsTable).limit(1);

    const conditions = [eq(payrollRunsTable.year, params.year)];
    if (params.employeeId) {
      conditions.push(eq(payrollEntriesTable.employeeId, params.employeeId));
    }

    const entries = await db
      .select({
        employeeId: payrollEntriesTable.employeeId,
        employeeName: sql<string>`concat(${employeesTable.firstName}, ' ', ${employeesTable.lastName})`,
        employeeNumber: employeesTable.employeeNumber,
        kraPin: employeesTable.kraPin,
        nationalId: employeesTable.nationalId,
        jobTitle: employeesTable.jobTitle,
        departmentName: departmentsTable.name,
        month: payrollRunsTable.month,
        grossSalary: payrollEntriesTable.grossSalary,
        paye: payrollEntriesTable.paye,
      })
      .from(payrollEntriesTable)
      .innerJoin(employeesTable, eq(payrollEntriesTable.employeeId, employeesTable.id))
      .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id))
      .innerJoin(payrollRunsTable, eq(payrollEntriesTable.payrollRunId, payrollRunsTable.id))
      .where(and(...conditions))
      .orderBy(employeesTable.firstName, payrollRunsTable.month);

    const grouped: Record<number, {
      employeeId: number;
      employeeName: string;
      employeeNumber: string;
      kraPin: string | null;
      nationalId: string | null;
      jobTitle: string | null;
      departmentName: string | null;
      monthly: { month: number; grossSalary: number; paye: number }[];
    }> = {};

    for (const e of entries) {
      if (!grouped[e.employeeId]) {
        grouped[e.employeeId] = {
          employeeId: e.employeeId,
          employeeName: e.employeeName,
          employeeNumber: e.employeeNumber,
          kraPin: e.kraPin,
          nationalId: e.nationalId,
          jobTitle: e.jobTitle,
          departmentName: e.departmentName,
          monthly: [],
        };
      }
      grouped[e.employeeId].monthly.push({
        month: e.month ?? 0,
        grossSalary: Number(e.grossSalary),
        paye: Number(e.paye ?? 0),
      });
    }

    const employees = Object.values(grouped).map(emp => {
      let cumulativeGross = 0;
      let cumulativePaye = 0;
      const monthlyEntries = emp.monthly
        .sort((a, b) => a.month - b.month)
        .map(m => {
          cumulativeGross += m.grossSalary;
          cumulativePaye += m.paye;
          return {
            month: m.month,
            grossSalary: m.grossSalary,
            paye: m.paye,
            cumulativeGross,
            cumulativePaye,
          };
        });

      return {
        employeeId: emp.employeeId,
        employeeName: emp.employeeName,
        employeeNumber: emp.employeeNumber,
        kraPin: emp.kraPin,
        nationalId: emp.nationalId,
        jobTitle: emp.jobTitle,
        departmentName: emp.departmentName,
        year: params.year,
        monthlyEntries,
        totalGross: cumulativeGross,
        totalPaye: cumulativePaye,
      };
    });

    res.json({
      company: {
        companyName: company?.companyName ?? "",
        companyAddress: company?.companyAddress ?? null,
        kraPin: company?.kraPin ?? null,
      },
      employees,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get P9 report");
    res.status(500).json({ error: "Failed to get P9 report" });
  }
});

export default router;
