import { Router } from "express";
import { AlertController } from "@controllers/alertController";
import { authenticate } from "@middleware/auth";

const router = Router();
const alertController = new AlertController();

// All alert routes require authentication
router.use(authenticate);

// Get user's alerts with pagination and filtering
router.get("/", alertController.getUserAlerts);

// Get specific alert by ID
router.get("/:alertId", alertController.getAlertById);

// Mark alert as read
router.put("/:alertId/read", alertController.markAsRead);

// Mark alert as unread
router.put("/:alertId/unread", alertController.markAsUnread);

// Delete alert
router.delete("/:alertId", alertController.deleteAlert);

// Mark all alerts as read
router.put("/mark-all-read", alertController.markAllAsRead);

export default router;
