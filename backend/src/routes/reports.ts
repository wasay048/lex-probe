import { Router } from "express";
import { reportController } from "@controllers/reportController";
import { authenticate } from "@middleware/auth";
import {
  validateReportGeneration,
  validateReportShare,
  validateReportUpdate,
  handleValidationErrors,
} from "@middleware/validation";

const router = Router();

// All report routes require authentication
router.use(authenticate);

// Create basic report (simplified endpoint)
router.post("/", reportController.createReport);

// Generate report from search
router.post(
  "/generate",
  validateReportGeneration,
  handleValidationErrors,
  reportController.generateReport
);

// Get user's reports with pagination
router.get("/", reportController.getUserReports);

// Get shared reports (must come before /:reportId routes)
router.get("/shared/with-me", reportController.getSharedReports);

// Get report statistics
router.get("/statistics", reportController.getReportStatistics);

// Admin route for cleanup
router.delete("/cleanup", reportController.cleanupOldReports);

// Get specific report by ID
router.get("/:reportId", reportController.getReportById);

// Download report
router.get("/:reportId/download", reportController.downloadReport);

// Update report
router.put(
  "/:reportId",
  validateReportUpdate,
  handleValidationErrors,
  reportController.updateReport
);

// Delete report
router.delete("/:reportId", reportController.deleteReport);

// Share report
router.post(
  "/:reportId/share",
  validateReportShare,
  handleValidationErrors,
  reportController.shareReport
);

// Get report sharing status
router.get("/:reportId/sharing", reportController.getReportSharing);

export default router;
