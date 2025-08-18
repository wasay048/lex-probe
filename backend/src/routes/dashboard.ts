import { Router } from "express";
import { dashboardController } from "@controllers/dashboardController";
import { authenticate } from "@middleware/auth";

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// Get dashboard statistics
router.get("/stats", dashboardController.getDashboardStats);

export default router;
