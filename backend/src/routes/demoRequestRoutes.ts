import { Router } from "express";
import { demoRequestController } from "@controllers/demoRequestController";
import { authenticate } from "@middleware/auth";
import { authLimiter } from "@middleware/rateLimiter";
import rateLimit from "express-rate-limit";

const router = Router();

// Create custom rate limiters for demo requests
const demoSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message:
      "Too many demo requests from this IP, please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const demoEligibilityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message:
      "Too many eligibility checks from this IP, please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const demoManagementLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    success: false,
    message:
      "Too many demo management requests, please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route POST /api/demo-requests
 * @desc Submit a new demo request
 * @access Public (no auth required for initial submission)
 * @body { firstName, lastName, email, company, jobTitle, phoneNumber?, companySize?, industry?, message? }
 */
router.post(
  "/",
  demoSubmissionLimiter,
  demoRequestController.createDemoRequest
);

/**
 * @route GET /api/demo-requests
 * @desc Get all demo requests (admin only)
 * @access Private (Admin)
 * @query { page?, limit?, status? }
 */
router.get("/", authenticate, demoRequestController.getAllDemoRequests);

/**
 * @route GET /api/demo-requests/stats
 * @desc Get demo request statistics (admin only)
 * @access Private (Admin)
 */
router.get("/stats", authenticate, demoRequestController.getDemoRequestStats);

/**
 * @route GET /api/demo-requests/check-eligibility
 * @desc Check if an email is eligible for signup
 * @access Public
 * @query { email }
 */
router.get(
  "/check-eligibility",
  demoEligibilityLimiter,
  demoRequestController.checkEmailEligibility
);

/**
 * @route GET /api/demo-requests/:id
 * @desc Get a specific demo request by ID (admin only)
 * @access Private (Admin)
 */
router.get("/:id", authenticate, demoRequestController.getDemoRequestById);

/**
 * @route PUT /api/demo-requests/:id
 * @desc Update a demo request (approve/reject) (admin only)
 * @access Private (Admin)
 * @body { status?, rejectionReason?, signupAllowed? }
 */
router.put(
  "/:id",
  authenticate,
  demoManagementLimiter,
  demoRequestController.updateDemoRequest
);

export default router;
