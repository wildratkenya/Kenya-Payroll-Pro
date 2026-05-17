import { Router, type IRouter } from "express";
import healthRouter from "./health";
import employeesRouter from "./employees";
import departmentsRouter from "./departments";
import payrollRouter from "./payroll";
import leaveRouter from "./leave";
import reportsRouter from "./reports";
import disbursementsRouter from "./disbursements";

const router: IRouter = Router();

router.use(healthRouter);
router.use(employeesRouter);
router.use(departmentsRouter);
router.use(payrollRouter);
router.use(leaveRouter);
router.use(reportsRouter);
router.use(disbursementsRouter);

export default router;
