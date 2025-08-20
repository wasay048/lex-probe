import { Response } from "express";
import { reportService } from "@services/reportService";
import { logger } from "@utils/logger";
import { AuthenticatedRequest } from "@middleware/auth";

export class ReportController {
  private reportService = reportService;

  createReport = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { title, description, searchIds, searchId, reportType } = req.body;

      logger.info(`Create report request from user: ${req.user._id}`);
      logger.info(`Request body: ${JSON.stringify(req.body)}`);

      // Handle both searchId (single) and searchIds (array) for backward compatibility
      let finalSearchIds: string[] = [];
      if (searchIds && Array.isArray(searchIds)) {
        finalSearchIds = searchIds;
      } else if (searchId) {
        finalSearchIds = [searchId];
      } else if (searchIds && !Array.isArray(searchIds)) {
        finalSearchIds = [searchIds];
      }

      if (!title || finalSearchIds.length === 0) {
        res.status(400).json({
          success: false,
          message: "Title and at least one searchId are required",
        });
        return;
      }

      const result = await this.reportService.createReport({
        userId: req.user.id, // Ensure userId is a string
        title,
        description: description || "",
        searchIds: finalSearchIds,
        reportType: reportType || "analysis",
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      logger.info(
        `Report created: ${result.data.report._id} by user: ${req.user.email}`
      );
      res.status(201).json(result);
    } catch (error) {
      logger.error("Create report error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while creating report",
      });
    }
  };

  generateReport = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { searchId, searchIds, title, description, sections, format } =
        req.body;

      // Support either searchId or first item of searchIds
      const effectiveSearchId =
        searchId || (Array.isArray(searchIds) ? searchIds[0] : undefined);
      if (!effectiveSearchId) {
        res
          .status(400)
          .json({ success: false, message: "searchId is required" });
        return;
      }

      // Normalize sections (map legacy names)
      const legacyMap: Record<string, string> = {
        summary: "executive_summary",
        appendix: "raw_data",
      };
      const normalizedSections = (
        sections && Array.isArray(sections)
          ? sections
          : ["executive_summary", "methodology", "findings", "recommendations"]
      ).map((s: string) => legacyMap[s] || s);

      const result = await this.reportService.generateReport({
        userId: req.user.id,
        searchId: effectiveSearchId,
        title,
        description,
        sections: normalizedSections,
        format: format || "pdf",
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      logger.info(
        `Report generation started for search: ${effectiveSearchId} by user: ${req.user.email}`
      );
      res.status(201).json(result);
    } catch (error) {
      logger.error("Generate report error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while generating report",
      });
    }
  };

  getUserReports = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const searchId = req.query.searchId as string;

      const result = await this.reportService.getUserReports(req.user.id, {
        page,
        limit,
        searchId,
      });

      res.status(200).json(result);
    } catch (error) {
      logger.error("Get user reports error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while fetching reports",
      });
    }
  };

  getReportById = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { reportId } = req.params;

      if (!reportId) {
        res.status(400).json({
          success: false,
          message: "Report ID is required",
        });
        return;
      }

      const result = await this.reportService.getReportById(
        reportId,
        req.user.id
      );

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      logger.error("Get report by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while fetching report",
      });
    }
  };

  downloadReport = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { reportId } = req.params;

      if (!reportId) {
        res.status(400).json({
          success: false,
          message: "Report ID is required",
        });
        return;
      }

      const result = await this.reportService.downloadReport(
        reportId,
        req.user._id.toString()
      );

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      // ✅ With signed URL, just return JSON
      logger.info(
        `Report download link generated: ${reportId} by user: ${req.user.email}`
      );

      res.json({
        success: true,
        message: result.message,
        data: {
          url: result.data.url, // signed URL
          filename: result.data.filename,
          mimeType: result.data.mimeType,
        },
      });
    } catch (error) {
      logger.error("Download report error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while downloading report",
      });
    }
  };

  updateReport = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.user?._id;
      const { reportId } = req.params;
      const { title, description, isPublic } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      if (!reportId) {
        res.status(400).json({
          success: false,
          message: "Report ID is required",
        });
        return;
      }

      const result = await this.reportService.updateReport(reportId, userId, {
        title,
        description,
        isPublic,
      });

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      logger.info(`Report updated: ${reportId} by user: ${req.user?.email}`);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Update report controller error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update report",
      });
    }
  };

  deleteReport = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { reportId } = req.params;

      if (!reportId) {
        res.status(400).json({
          success: false,
          message: "Report ID is required",
        });
        return;
      }

      const result = await this.reportService.deleteReport(
        reportId,
        req.user.id
      );

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      logger.info(`Report deleted: ${reportId} by user: ${req.user.email}`);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Delete report error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while deleting report",
      });
    }
  };

  shareReport = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { reportId } = req.params;
      const { emails, expiresIn } = req.body;

      if (!reportId) {
        res.status(400).json({
          success: false,
          message: "Report ID is required",
        });
        return;
      }

      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        res.status(400).json({
          success: false,
          message: "At least one email address is required",
        });
        return;
      }

      const result = await this.reportService.shareReport({
        reportId,
        userId: req.user.id,
        emails,
        expiresIn: expiresIn || 7, // 7 days default
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      logger.info(
        `Report shared: ${reportId} by user: ${
          req.user.email
        } with ${emails.join(", ")}`
      );
      res.status(200).json(result);
    } catch (error) {
      logger.error("Share report error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while sharing report",
      });
    }
  };

  getSharedReports = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const userEmail = req.user?.email;

      if (!userEmail) {
        res.status(401).json({
          success: false,
          message: "User not authenticated or email not found",
        });
        return;
      }

      const result = await this.reportService.getSharedReports(userEmail);

      logger.info(`Shared reports fetched for user: ${userEmail}`);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Get shared reports controller error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch shared reports",
      });
    }
  };

  getReportSharing = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.user?._id;
      const { reportId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      if (!reportId) {
        res.status(400).json({
          success: false,
          message: "Report ID is required",
        });
        return;
      }

      const result = await this.reportService.getReportSharing(
        reportId,
        userId
      );

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      logger.error("Get report sharing controller error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch report sharing details",
      });
    }
  };

  getReportStatistics = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.user?._id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const result = await this.reportService.getReportStatistics(userId);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Get report statistics controller error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch report statistics",
      });
    }
  };

  cleanupOldReports = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      // Only allow admin users to cleanup reports
      if (req.user?.role !== "admin") {
        res.status(403).json({
          success: false,
          message: "Insufficient permissions",
        });
        return;
      }

      const { days = 90 } = req.query;
      const result = await this.reportService.cleanupOldReports(
        parseInt(days as string) || 90
      );
      res.status(200).json(result);
    } catch (error) {
      logger.error("Cleanup old reports controller error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to cleanup old reports",
      });
    }
  };
}

export const reportController = new ReportController();
export default reportController;
