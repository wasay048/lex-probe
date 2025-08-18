import { Request, Response } from "express";
import { alertService } from "@services/alertService";
import { AuthenticatedRequest } from "@middleware/auth";
import { logger } from "@utils/logger";
import { AlertType } from "@models/Alert";

export class AlertController {
  async createAlert(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        type,
        title,
        message,
        relatedSearchId,
        relatedProjectId,
        metadata,
      } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const result = await alertService.createAlert({
        userId,
        type,
        title,
        message,
        relatedSearchId,
        relatedProjectId,
        metadata,
      });

      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      logger.error("Create alert controller error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create alert",
      });
    }
  }

  async getUserAlerts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 10, type, isRead } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      // Validate and cast the type parameter
      const validAlertTypes: AlertType[] = [
        "search_complete",
        "high_risk_detected",
        "project_shared",
        "system",
        "warning",
        "error",
        "info",
      ];

      let validatedType: AlertType | undefined;
      if (type && typeof type === "string") {
        if (validAlertTypes.includes(type as AlertType)) {
          validatedType = type as AlertType;
        } else {
          res.status(400).json({
            success: false,
            message: `Invalid alert type. Must be one of: ${validAlertTypes.join(
              ", "
            )}`,
          });
          return;
        }
      }

      const options = {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 10,
        type: validatedType,
        isRead: isRead !== undefined ? isRead === "true" : undefined,
      };

      const result = await alertService.getUserAlerts(userId, options);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Get user alerts controller error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch alerts",
      });
    }
  }

  async getAlertById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const result = await alertService.getAlertById(alertId, userId);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error("Get alert by ID controller error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch alert",
      });
    }
  }

  async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const result = await alertService.markAsRead(alertId, userId);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error("Mark alert as read controller error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to mark alert as read",
      });
    }
  }

  async markAsUnread(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const result = await alertService.markAsUnread(alertId, userId);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error("Mark alert as unread controller error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to mark alert as unread",
      });
    }
  }

  async deleteAlert(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const result = await alertService.deleteAlert(alertId, userId);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error("Delete alert controller error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete alert",
      });
    }
  }

  async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const result = await alertService.markAllAsRead(userId);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Mark all alerts as read controller error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to mark all alerts as read",
      });
    }
  }

  async getUnreadCount(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const result = await alertService.getUnreadCount(userId);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Get unread count controller error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get unread count",
      });
    }
  }

  async getAlertStatistics(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const result = await alertService.getAlertStatistics(userId);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Get alert statistics controller error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get alert statistics",
      });
    }
  }

  async deleteMultipleAlerts(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { alertIds } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      if (!Array.isArray(alertIds) || alertIds.length === 0) {
        res.status(400).json({
          success: false,
          message: "alertIds must be a non-empty array",
        });
        return;
      }

      const result = await alertService.deleteMultipleAlerts(alertIds, userId);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Delete multiple alerts controller error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete multiple alerts",
      });
    }
  }

  async cleanupOldAlerts(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { days = 90 } = req.query;

      // Only allow admin users to cleanup alerts
      if (req.user?.role !== "admin") {
        res.status(403).json({
          success: false,
          message: "Insufficient permissions",
        });
        return;
      }

      const result = await alertService.cleanupOldAlerts(
        parseInt(days as string) || 90
      );
      res.status(200).json(result);
    } catch (error) {
      logger.error("Cleanup old alerts controller error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to cleanup old alerts",
      });
    }
  }
}

export const alertController = new AlertController();
export default alertController;
