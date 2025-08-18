import { Router } from "express";
import { config } from "@config/environment";
import authRoutes from "./auth";
import searchRoutes from "./search";
import projectRoutes from "./projects";
import alertRoutes from "./alerts";
import reportRoutes from "./reports";
import dashboardRoutes from "./dashboard";

const router = Router();

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Cartel Detection Platform API is running",
    version: config.API_VERSION,
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

// API routes
router.use("/auth", authRoutes);
router.use("/searches", searchRoutes);
router.use("/projects", projectRoutes);
router.use("/alerts", alertRoutes);
router.use("/reports", reportRoutes);
router.use("/dashboard", dashboardRoutes);

// 404 handler for API routes
router.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
    availableEndpoints: [
      "GET /api/health",
      "POST /api/auth/register",
      "POST /api/auth/login",
      "GET /api/searches",
      "POST /api/searches",
      "GET /api/projects",
      "POST /api/projects",
      "GET /api/alerts",
      "GET /api/reports",
      "GET /api/dashboard/stats",
    ],
  });
});

export default router;
