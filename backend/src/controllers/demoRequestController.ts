import { Response } from "express";
import { demoRequestService } from "@services/demoRequestService";
import { logger } from "@utils/logger";
import { AuthenticatedRequest } from "@middleware/auth";

export class DemoRequestController {
  private demoRequestService = demoRequestService;

  createDemoRequest = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const {
        firstName,
        lastName,
        email,
        company,
        jobTitle,
        phoneNumber,
        companySize,
        industry,
        message,
      } = req.body;

      logger.info(`Demo request submission from: ${email}`);

      if (!firstName || !lastName || !email || !company || !jobTitle) {
        res.status(400).json({
          success: false,
          message:
            "First name, last name, email, company, and job title are required",
        });
        return;
      }

      const result = await this.demoRequestService.createDemoRequest({
        firstName,
        lastName,
        email,
        company,
        jobTitle,
        phoneNumber,
        companySize,
        industry,
        message,
      });

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error("Create demo request controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while processing demo request",
      });
    }
  };

  getAllDemoRequests = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user || req.user.role !== "admin") {
        res.status(403).json({
          success: false,
          message: "Access denied. Admin rights required.",
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;

      const result = await this.demoRequestService.getAllDemoRequests(
        page,
        limit,
        status
      );

      res.status(200).json(result);
    } catch (error) {
      logger.error("Get all demo requests controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while retrieving demo requests",
      });
    }
  };

  getDemoRequestById = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user || req.user.role !== "admin") {
        res.status(403).json({
          success: false,
          message: "Access denied. Admin rights required.",
        });
        return;
      }

      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: "Demo request ID is required",
        });
        return;
      }

      const result = await this.demoRequestService.getDemoRequestById(id);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      logger.error("Get demo request by ID controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while retrieving demo request",
      });
    }
  };

  updateDemoRequest = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user || req.user.role !== "admin") {
        res.status(403).json({
          success: false,
          message: "Access denied. Admin rights required.",
        });
        return;
      }

      const { id } = req.params;
      const { status, rejectionReason, signupAllowed } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: "Demo request ID is required",
        });
        return;
      }

      if (status && !["pending", "approved", "rejected"].includes(status)) {
        res.status(400).json({
          success: false,
          message:
            "Invalid status. Must be 'pending', 'approved', or 'rejected'",
        });
        return;
      }

      if (status === "rejected" && !rejectionReason) {
        res.status(400).json({
          success: false,
          message: "Rejection reason is required when rejecting a demo request",
        });
        return;
      }

      const result = await this.demoRequestService.updateDemoRequest(
        id,
        { status, rejectionReason, signupAllowed },
        req.user._id.toString()
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      logger.error("Update demo request controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while updating demo request",
      });
    }
  };

  checkEmailEligibility = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const { email } = req.query;

      if (!email || typeof email !== "string") {
        res.status(400).json({
          success: false,
          message: "Email is required",
        });
        return;
      }

      const result = await this.demoRequestService.checkEmailEligibility(email);

      res.status(200).json(result);
    } catch (error) {
      logger.error("Check email eligibility controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while checking email eligibility",
      });
    }
  };

  getDemoRequestStats = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user || req.user.role !== "admin") {
        res.status(403).json({
          success: false,
          message: "Access denied. Admin rights required.",
        });
        return;
      }

      // Get stats for each status
      const [pending, approved, rejected] = await Promise.all([
        this.demoRequestService.getAllDemoRequests(1, 1, "pending"),
        this.demoRequestService.getAllDemoRequests(1, 1, "approved"),
        this.demoRequestService.getAllDemoRequests(1, 1, "rejected"),
      ]);

      res.status(200).json({
        success: true,
        message: "Demo request statistics retrieved successfully",
        data: {
          pending: pending.data?.pagination?.total || 0,
          approved: approved.data?.pagination?.total || 0,
          rejected: rejected.data?.pagination?.total || 0,
          total:
            (pending.data?.pagination?.total || 0) +
            (approved.data?.pagination?.total || 0) +
            (rejected.data?.pagination?.total || 0),
        },
      });
    } catch (error) {
      logger.error("Get demo request stats controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while retrieving statistics",
      });
    }
  };
}

export const demoRequestController = new DemoRequestController();
