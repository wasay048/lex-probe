import { alertRepository } from "@repositories/alertRepository";
import { userRepository } from "@repositories/userRepository";
import type { AlertType, IAlert } from "@models/Alert";
import { logger } from "@utils/logger";
import { ServiceResponse } from "./authService";

export interface AlertListOptions {
  page: number;
  limit: number;
  type?: AlertType;
  isRead?: boolean;
}

export interface CreateAlertRequest {
  userId: string;
  type: IAlert["type"];
  title: string;
  message: string;
  relatedSearchId?: string;
  relatedProjectId?: string;
  metadata?: Record<string, any>;
}

export class AlertService {
  private alertRepository = alertRepository;
  private userRepository = userRepository;

  private isValidAlertType(type: string): type is AlertType {
    const validTypes: AlertType[] = [
      "search_complete",
      "high_risk_detected",
      "project_shared",
      "system",
      "warning",
      "error",
      "info",
    ];
    return validTypes.includes(type as AlertType);
  }

  async createAlert(request: CreateAlertRequest): Promise<ServiceResponse> {
    try {
      const {
        userId,
        type,
        title,
        message,
        relatedSearchId,
        relatedProjectId,
        metadata,
      } = request;

      // Verify user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      const alertData = {
        userId,
        type,
        title,
        message,
        relatedSearchId,
        relatedProjectId,
        metadata,
        isRead: false,
      };

      const alert = await this.alertRepository.create(alertData as any);

      return {
        success: true,
        message: "Alert created successfully",
        data: { alert },
      };
    } catch (error) {
      logger.error("Create alert service error:", error);
      throw error;
    }
  }

  async getUserAlerts(
    userId: string,
    options: AlertListOptions
  ): Promise<ServiceResponse> {
    try {
      const { page, limit, type, isRead } = options;

      // Validate type if provided
      let validatedType: AlertType | undefined;
      if (type) {
        if (!this.isValidAlertType(type)) {
          return {
            success: false,
            message: `Invalid alert type: ${type}`,
          };
        }
        validatedType = type as AlertType;
      }

      const filter: any = { userId };
      if (validatedType) filter.type = validatedType;
      if (typeof isRead === "boolean") filter.isRead = isRead;

      const alerts = await this.alertRepository.findWithPagination(
        filter,
        { page, limit },
        { createdAt: -1 }
      );

      return {
        success: true,
        message: "Alerts fetched successfully",
        data: alerts,
      };
    } catch (error) {
      logger.error("Get user alerts service error:", error);
      throw error;
    }
  }
  async getAlertById(
    alertId: string,
    userId: string
  ): Promise<ServiceResponse> {
    try {
      const alert = await this.alertRepository.findById(alertId);

      if (!alert) {
        return {
          success: false,
          message: "Alert not found",
        };
      }

      // Check if user owns this alert
      if (alert.userId.toString() !== userId) {
        return {
          success: false,
          message: "Unauthorized access to alert",
        };
      }

      return {
        success: true,
        message: "Alert fetched successfully",
        data: { alert },
      };
    } catch (error) {
      logger.error("Get alert by ID service error:", error);
      throw error;
    }
  }

  async markAsRead(alertId: string, userId: string): Promise<ServiceResponse> {
    try {
      const alert = await this.alertRepository.findById(alertId);

      if (!alert) {
        return {
          success: false,
          message: "Alert not found",
        };
      }

      // Check if user owns this alert
      if (alert.userId.toString() !== userId) {
        return {
          success: false,
          message: "Unauthorized access to alert",
        };
      }

      const updatedAlert = await this.alertRepository.update(alertId, {
        isRead: true,
        readAt: new Date(),
      });

      return {
        success: true,
        message: "Alert marked as read",
        data: { alert: updatedAlert },
      };
    } catch (error) {
      logger.error("Mark alert as read service error:", error);
      throw error;
    }
  }

  async markAsUnread(
    alertId: string,
    userId: string
  ): Promise<ServiceResponse> {
    try {
      const alert = await this.alertRepository.findById(alertId);

      if (!alert) {
        return {
          success: false,
          message: "Alert not found",
        };
      }

      // Check if user owns this alert
      if (alert.userId.toString() !== userId) {
        return {
          success: false,
          message: "Unauthorized access to alert",
        };
      }

      const updatedAlert = await this.alertRepository.update(alertId, {
        isRead: false,
        readAt: undefined,
      });

      return {
        success: true,
        message: "Alert marked as unread",
        data: { alert: updatedAlert },
      };
    } catch (error) {
      logger.error("Mark alert as unread service error:", error);
      throw error;
    }
  }

  async deleteAlert(alertId: string, userId: string): Promise<ServiceResponse> {
    try {
      const alert = await this.alertRepository.findById(alertId);

      if (!alert) {
        return {
          success: false,
          message: "Alert not found",
        };
      }

      // Check if user owns this alert
      if (alert.userId.toString() !== userId) {
        return {
          success: false,
          message: "Unauthorized access to alert",
        };
      }

      await this.alertRepository.delete(alertId);

      return {
        success: true,
        message: "Alert deleted successfully",
      };
    } catch (error) {
      logger.error("Delete alert service error:", error);
      throw error;
    }
  }

  async markAllAsRead(userId: string): Promise<ServiceResponse> {
    try {
      const result = await this.alertRepository.updateMany(
        { userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );

      return {
        success: true,
        message: `${result.modifiedCount} alerts marked as read`,
        data: { updatedCount: result.modifiedCount },
      };
    } catch (error) {
      logger.error("Mark all alerts as read service error:", error);
      throw error;
    }
  }

  async getUnreadCount(userId: string): Promise<ServiceResponse> {
    try {
      const count = await this.alertRepository.countUnreadAlerts(userId);

      return {
        success: true,
        message: "Unread count fetched successfully",
        data: { unreadCount: count },
      };
    } catch (error) {
      logger.error("Get unread count service error:", error);
      throw error;
    }
  }

  async getAlertStatistics(userId: string): Promise<ServiceResponse> {
    try {
      const stats = await this.alertRepository.getAlertStatistics(userId);

      return {
        success: true,
        message: "Alert statistics fetched successfully",
        data: stats,
      };
    } catch (error) {
      logger.error("Get alert statistics service error:", error);
      throw error;
    }
  }

  async deleteMultipleAlerts(
    alertIds: string[],
    userId: string
  ): Promise<ServiceResponse> {
    try {
      // Verify all alerts belong to the user
      const alerts = await Promise.all(
        alertIds.map((id) => this.alertRepository.findById(id))
      );

      const invalidAlerts = alerts.filter(
        (alert, index) => !alert || alert.userId.toString() !== userId
      );

      if (invalidAlerts.length > 0) {
        return {
          success: false,
          message: "Some alerts not found or unauthorized",
        };
      }

      const result = await this.alertRepository.deleteMany({
        _id: { $in: alertIds },
        userId,
      });

      return {
        success: true,
        message: `${result.deletedCount} alerts deleted successfully`,
        data: { deletedCount: result.deletedCount },
      };
    } catch (error) {
      logger.error("Delete multiple alerts service error:", error);
      throw error;
    }
  }

  // Helper method to create system alerts
  async createSystemAlert(
    userId: string,
    type: IAlert["type"],
    title: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await this.createAlert({
        userId,
        type,
        title,
        message,
        metadata,
      });
    } catch (error) {
      logger.error("Create system alert error:", error);
      // Don't throw - system alerts should not break main functionality
    }
  }

  async createSearchCompleteAlert(
    userId: string,
    searchId: string,
    companyNames: string[]
  ): Promise<void> {
    await this.createSystemAlert(
      userId,
      "search_complete",
      "Search Completed",
      `Your cartel detection search for ${companyNames.join(
        " and "
      )} has been completed successfully.`,
      { searchId, companyNames }
    );
  }

  async createHighRiskAlert(
    userId: string,
    searchId: string,
    riskScore: number,
    companyNames: string[]
  ): Promise<void> {
    await this.createSystemAlert(
      userId,
      "high_risk_detected",
      "High Risk Detected",
      `High cartel risk detected (${riskScore}/5) in analysis of ${companyNames.join(
        " and "
      )}.`,
      { searchId, riskScore, companyNames }
    );
  }

  async createProjectSharedAlert(
    userId: string,
    projectId: string,
    projectName: string,
    sharedBy: string
  ): Promise<void> {
    await this.createSystemAlert(
      userId,
      "project_shared",
      "Project Shared",
      `${sharedBy} has shared the project "${projectName}" with you.`,
      { projectId, projectName, sharedBy }
    );
  }

  // Cleanup method for old alerts
  async cleanupOldAlerts(days: number = 90): Promise<ServiceResponse> {
    try {
      const result = await this.alertRepository.deleteOldAlerts(days);

      return {
        success: true,
        message: `Cleanup completed: ${result.deletedCount} old alerts deleted`,
        data: { deletedCount: result.deletedCount },
      };
    } catch (error) {
      logger.error("Cleanup old alerts service error:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const alertService = new AlertService();
export default alertService;
