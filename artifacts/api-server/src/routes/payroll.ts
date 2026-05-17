import { Router } from "express";
import { db, employeesTable, departmentsTable, payrollRunsTable, payrollEntriesTable, taxRatesTable, taxBracketsTable } from "@workspace/db";
import { eq, sql, and, desc, inArray } from "drizzle-orm";
import { calculateAll, getDefaultTaxSettings, type TaxSettings } from "../lib/kenyaTax";

async function loadTaxSettings(): Promise<TaxSettings> {
  const defaults = getDefaultTaxSettings();
  try {
    const rates = await db.select().from(taxRatesTable);
    const rateMap: Record<string, number> = {};
    for (const r of rates) {
      rateMap[r.key] = Number(r.value);
    }
    const brackets = await db.select().from(taxBracketsTable).orderBy(taxBracketsTable.priority);
    return {
      nssfTier1Limit: rateMap.nssf_tier1_limit ?? defaults.nssfTier1Limit,
      nssfTier2Limit: rateMap.nssf_tier2_limit ?? defaults.nssfTier2Limit,
      nssfTier1Rate: rateMap.nssf_tier1_rate ?? defaults.nssfTier1Rate,
      nssfTier2Rate: rateMap.nssf_tier2_rate ?? defaults.nssfTier2Rate,
      shifRate: rateMap.shif_rate ?? defaults.shifRate,
      shifMinimum: rateMap.shif_minimum ?? defaults.shifMinimum,
      housingLevyRate: rateMap.housing_levy_rate ?? defaults.housingLevyRate,
      personalRelief: rateMap.personal_relief ?? defaults.personalRelief,
      insuranceReliefRate: rateMap.insurance_relief_rate ?? defaults.insuranceReliefRate,
      payeBands: brackets.length > 0
        ? brackets.map(b => ({ minAmount: Number(b.minAmount), maxAmount: Number(b.maxAmount), rate: Number(b.rate) }))
        : defaults.payeBands,
    };
  } catch {
    return defaults;
  }
}
import {
  CreatePayrollRunBody,
  GetPayrollRunParams,
  ListPayrollEntriesParams,
  ApprovePayrollRunParams,
  ApprovePayrollRunBody,
  DisbursePayrollRunParams,
  DisbursePayrollRunBody,
  PreviewTaxCalculationBody,
} from "@workspace/api-zod";

const router = Router();

// GET /payroll/runs
router.get("/payroll/runs", async (req, res) => {
  try {
    const runs = await db.select().from(payrollRunsTable).orderBy(desc(payrollRunsTable.year), desc(payrollRunsTable.month));
    res.json(runs.map(r => ({
      ...r,
      totalGross: Number(r.totalGross),
      totalPaye: Number(r.totalPaye),
      totalNssf: Number(r.totalNssf),
      totalShif: Number(r.totalShif),
      totalHousingLevy: Number(r.totalHousingLevy),
      totalNet: Number(r.totalNet),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list payroll runs");
    res.status(500).json({ error: "Failed to list payroll runs" });
  }
});

// POST /payroll/runs
router.post("/payroll/runs", async (req, res) => {
  try {
    const body = CreatePayrollRunBody.parse(req.body);

    // Check for duplicate
    const existing = await db.select().from(payrollRunsTable)
      .where(and(eq(payrollRunsTable.month, body.month), eq(payrollRunsTable.year, body.year)))
      .limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Payroll run already exists for this month and year" });
    }

    // Fetch active employees
    const employees = await db
      .select({
        id: employeesTable.id,
        grossSalary: employeesTable.grossSalary,
        paymentMethod: employeesTable.paymentMethod,
        departmentId: employeesTable.departmentId,
        departmentName: departmentsTable.name,
        jobTitle: employeesTable.jobTitle,
      })
      .from(employeesTable)
      .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id))
      .where(eq(employeesTable.status, "active"));

    let totalGross = 0, totalPaye = 0, totalNssf = 0, totalShif = 0, totalHousingLevy = 0, totalNet = 0;

    // Load dynamic tax settings
    const settings = await loadTaxSettings();

    // Create the run
    const [run] = await db.insert(payrollRunsTable).values({
      month: body.month,
      year: body.year,
      status: "processing",
      processedAt: new Date(),
    }).returning();

    // Calculate and insert entries
    const entries = employees.map(emp => {
      const gross = Number(emp.grossSalary);
      const tax = calculateAll(gross, settings);

      totalGross += gross;
      totalPaye += tax.netPaye;
      totalNssf += tax.nssfEmployee;
      totalShif += tax.shif;
      totalHousingLevy += tax.housingLevyEmployee;
      totalNet += tax.netPay;

      return {
        payrollRunId: run.id,
        employeeId: emp.id,
        grossSalary: String(gross),
        basicSalary: String(gross),
        paye: String(tax.netPaye),
        nssfEmployee: String(tax.nssfEmployee),
        nssfEmployer: String(tax.nssfEmployer),
        shif: String(tax.shif),
        housingLevyEmployee: String(tax.housingLevyEmployee),
        housingLevyEmployer: String(tax.housingLevyEmployer),
        personalRelief: String(tax.personalRelief),
        insuranceRelief: String(tax.insuranceRelief),
        netPay: String(tax.netPay),
        paymentMethod: emp.paymentMethod,
        disbursementStatus: "pending",
      };
    });

    if (entries.length > 0) {
      await db.insert(payrollEntriesTable).values(entries);
    }

    // Update run with totals
    const [updatedRun] = await db.update(payrollRunsTable).set({
      status: "approved",
      totalGross: String(totalGross),
      totalPaye: String(totalPaye),
      totalNssf: String(totalNssf),
      totalShif: String(totalShif),
      totalHousingLevy: String(totalHousingLevy),
      totalNet: String(totalNet),
      employeeCount: employees.length,
    }).where(eq(payrollRunsTable.id, run.id)).returning();

    res.status(201).json({
      ...updatedRun,
      totalGross: Number(updatedRun.totalGross),
      totalPaye: Number(updatedRun.totalPaye),
      totalNssf: Number(updatedRun.totalNssf),
      totalShif: Number(updatedRun.totalShif),
      totalHousingLevy: Number(updatedRun.totalHousingLevy),
      totalNet: Number(updatedRun.totalNet),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create payroll run");
    res.status(500).json({ error: "Failed to create payroll run" });
  }
});

// GET /payroll/summary
router.get("/payroll/summary", async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const [totalEmployeesResult] = await db.select({ count: sql<number>`count(*)::int` }).from(employeesTable);
    const [activeEmployeesResult] = await db.select({ count: sql<number>`count(*)::int` }).from(employeesTable).where(eq(employeesTable.status, "active"));

    // Last payroll run
    const [lastRun] = await db.select().from(payrollRunsTable).orderBy(desc(payrollRunsTable.year), desc(payrollRunsTable.month)).limit(1);

    // Current month run
    const [currentRun] = await db.select().from(payrollRunsTable)
      .where(and(eq(payrollRunsTable.month, currentMonth), eq(payrollRunsTable.year, currentYear)))
      .limit(1);

    // Last 6 months trend
    const monthlyTrend = await db.select({
      month: payrollRunsTable.month,
      year: payrollRunsTable.year,
      gross: payrollRunsTable.totalGross,
      net: payrollRunsTable.totalNet,
      paye: payrollRunsTable.totalPaye,
    }).from(payrollRunsTable)
      .orderBy(desc(payrollRunsTable.year), desc(payrollRunsTable.month))
      .limit(6);

    // Department breakdown (from current or last run)
    const { leaveRequestsTable } = await import("@workspace/db");
    const [pendingLeaveResult] = await db.select({ count: sql<number>`count(*)::int` })
      .from(leaveRequestsTable)
      .where(eq(leaveRequestsTable.status, "pending"));

    const deptBreakdown = await db
      .select({
        department: departmentsTable.name,
        employeeCount: sql<number>`count(distinct ${employeesTable.id})::int`,
        totalGross: sql<number>`sum(${employeesTable.grossSalary}::numeric)`,
      })
      .from(departmentsTable)
      .leftJoin(employeesTable, and(eq(employeesTable.departmentId, departmentsTable.id), eq(employeesTable.status, "active")))
      .groupBy(departmentsTable.id, departmentsTable.name)
      .orderBy(departmentsTable.name);

    const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    res.json({
      totalEmployees: totalEmployeesResult.count,
      activeEmployees: activeEmployeesResult.count,
      currentMonthGross: currentRun ? Number(currentRun.totalGross) : 0,
      currentMonthNet: currentRun ? Number(currentRun.totalNet) : 0,
      currentMonthPaye: currentRun ? Number(currentRun.totalPaye) : 0,
      currentMonthNssf: currentRun ? Number(currentRun.totalNssf) : 0,
      currentMonthShif: currentRun ? Number(currentRun.totalShif) : 0,
      currentMonthHousingLevy: currentRun ? Number(currentRun.totalHousingLevy) : 0,
      pendingLeaveRequests: pendingLeaveResult.count,
      lastPayrollStatus: lastRun?.status ?? null,
      monthlyTrend: monthlyTrend.reverse().map(r => ({
        month: `${MONTH_NAMES[(r.month ?? 1) - 1]} ${r.year}`,
        gross: Number(r.gross),
        net: Number(r.net),
        paye: Number(r.paye),
      })),
      departmentBreakdown: deptBreakdown.map(d => ({
        department: d.department,
        employeeCount: d.employeeCount,
        totalGross: Number(d.totalGross ?? 0),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get payroll summary");
    res.status(500).json({ error: "Failed to get payroll summary" });
  }
});

// GET /payroll/tax-preview
router.post("/payroll/tax-preview", async (req, res) => {
  try {
    const body = PreviewTaxCalculationBody.parse(req.body);
    const settings = await loadTaxSettings();
    const tax = calculateAll(body.grossSalary, settings);
    res.json({
      grossSalary: tax.grossSalary,
      nssfEmployee: tax.nssfEmployee,
      nssfEmployer: tax.nssfEmployer,
      shif: tax.shif,
      housingLevyEmployee: tax.housingLevyEmployee,
      housingLevyEmployer: tax.housingLevyEmployer,
      taxableIncome: tax.taxableIncome,
      paye: tax.grossPaye,
      personalRelief: tax.personalRelief,
      insuranceRelief: tax.insuranceRelief,
      netPaye: tax.netPaye,
      netPay: tax.netPay,
      totalEmployerCost: tax.totalEmployerCost,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to preview tax");
    res.status(500).json({ error: "Failed to preview tax" });
  }
});

// GET /payroll/runs/:id
router.get("/payroll/runs/:id", async (req, res) => {
  try {
    const params = GetPayrollRunParams.parse({ id: Number(req.params.id) });
    const [run] = await db.select().from(payrollRunsTable).where(eq(payrollRunsTable.id, params.id)).limit(1);
    if (!run) return res.status(404).json({ error: "Payroll run not found" });
    res.json({
      ...run,
      totalGross: Number(run.totalGross),
      totalPaye: Number(run.totalPaye),
      totalNssf: Number(run.totalNssf),
      totalShif: Number(run.totalShif),
      totalHousingLevy: Number(run.totalHousingLevy),
      totalNet: Number(run.totalNet),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get payroll run");
    res.status(500).json({ error: "Failed to get payroll run" });
  }
});

// GET /payroll/runs/:id/entries
router.get("/payroll/runs/:id/entries", async (req, res) => {
  try {
    const params = ListPayrollEntriesParams.parse({ id: Number(req.params.id) });

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
      .where(eq(payrollEntriesTable.payrollRunId, params.id))
      .orderBy(employeesTable.firstName);

    res.json(entries.map(e => ({
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
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list payroll entries");
    res.status(500).json({ error: "Failed to list payroll entries" });
  }
});

// PATCH /payroll/runs/:id/approve
router.patch("/payroll/runs/:id/approve", async (req, res) => {
  try {
    const params = ApprovePayrollRunParams.parse({ id: Number(req.params.id) });
    ApprovePayrollRunBody.parse(req.body);
    const [run] = await db.update(payrollRunsTable).set({ status: "approved", approvedAt: new Date() })
      .where(eq(payrollRunsTable.id, params.id)).returning();
    if (!run) return res.status(404).json({ error: "Payroll run not found" });
    res.json({ ...run, totalGross: Number(run.totalGross), totalPaye: Number(run.totalPaye), totalNssf: Number(run.totalNssf), totalShif: Number(run.totalShif), totalHousingLevy: Number(run.totalHousingLevy), totalNet: Number(run.totalNet) });
  } catch (err) {
    req.log.error({ err }, "Failed to approve payroll run");
    res.status(500).json({ error: "Failed to approve payroll run" });
  }
});

// PATCH /payroll/runs/:id/disburse
router.patch("/payroll/runs/:id/disburse", async (req, res) => {
  try {
    const params = DisbursePayrollRunParams.parse({ id: Number(req.params.id) });
    DisbursePayrollRunBody.parse(req.body);

    const { disbursementsTable } = await import("@workspace/db");

    const entries = await db.select().from(payrollEntriesTable).where(eq(payrollEntriesTable.payrollRunId, params.id));

    // Create disbursement records
    if (entries.length > 0) {
      const empIds = entries.map(e => e.employeeId);
      const emps = await db.select({ id: employeesTable.id, paymentMethod: employeesTable.paymentMethod })
        .from(employeesTable)
        .where(inArray(employeesTable.id, empIds));

      const empMap = new Map(emps.map(e => [e.id, e.paymentMethod]));

      const disbursements = entries.map(entry => ({
        payrollRunId: params.id,
        employeeId: entry.employeeId,
        amount: entry.netPay,
        method: empMap.get(entry.employeeId) ?? "bank",
        reference: `PAY-${params.id}-${entry.employeeId}-${Date.now()}`,
        status: "success",
        processedAt: new Date(),
      }));

      await db.insert(disbursementsTable).values(disbursements);

      // Mark entries as disbursed
      await db.update(payrollEntriesTable).set({ disbursementStatus: "success" })
        .where(eq(payrollEntriesTable.payrollRunId, params.id));
    }

    const [run] = await db.update(payrollRunsTable).set({ status: "disbursed", disbursedAt: new Date() })
      .where(eq(payrollRunsTable.id, params.id)).returning();
    if (!run) return res.status(404).json({ error: "Payroll run not found" });

    res.json({ ...run, totalGross: Number(run.totalGross), totalPaye: Number(run.totalPaye), totalNssf: Number(run.totalNssf), totalShif: Number(run.totalShif), totalHousingLevy: Number(run.totalHousingLevy), totalNet: Number(run.totalNet) });
  } catch (err) {
    req.log.error({ err }, "Failed to disburse payroll run");
    res.status(500).json({ error: "Failed to disburse payroll run" });
  }
});

export default router;
