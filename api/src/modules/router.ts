import {Router} from "express";
import authRoutes from "./auth/auth.routes";
import authenticate from "../middleware/auth.middleware";
import projectRoutes from "./project/project.routes";
import workerRoutes from "./worker/worker.routes";
import expenseRoutes from "./expense/expense.routes";
import materialRoutes from "./material/material.routes";
import reportRoutes from "./report/report.routes";
import userRoutes from "./user/user.routes";

const router = Router();

// ── API routes ────────────────────────────────────────────────────────────────
router.use('/auth',      authRoutes)
router.use('/users',     authenticate, userRoutes)
router.use('/projects',  authenticate, projectRoutes)
router.use('/workers',   authenticate, workerRoutes)
router.use('/expenses',  authenticate, expenseRoutes)
router.use('/materials', authenticate, materialRoutes)
router.use('/reports',   authenticate, reportRoutes)

export default router;
