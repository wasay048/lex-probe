import { Router } from "express";
import { AuthController } from "@controllers/authController";
import { authenticate } from "@middleware/auth";
import { authLimiter, passwordResetLimiter } from "@middleware/rateLimiter";
import {
  validateUserRegistration,
  validateUserLogin,
  validatePasswordReset,
  validatePasswordChange,
  handleValidationErrors,
} from "@middleware/validation";

const router = Router();
const authController = new AuthController();

// Public routes with rate limiting
router.post(
  "/register",
  authLimiter,
  validateUserRegistration,
  handleValidationErrors,
  authController.register
);

router.post(
  "/login",
  authLimiter,
  validateUserLogin,
  handleValidationErrors,
  authController.login
);

router.get("/verify-email", authController.verifyEmail);

router.post(
  "/resend-verification",
  authLimiter,
  validatePasswordReset,
  handleValidationErrors,
  authController.resendVerification
);

router.post(
  "/forgot-password",
  passwordResetLimiter,
  validatePasswordReset,
  handleValidationErrors,
  authController.forgotPassword
);

router.post(
  "/reset-password",
  passwordResetLimiter,
  validatePasswordChange,
  handleValidationErrors,
  authController.resetPassword
);

router.post("/refresh-token", authController.refreshToken);

router.post("/verify", authController.verifyOtp);

// Protected routes
router.post("/logout", authenticate, authController.logout);

router.get("/profile", authenticate, authController.getProfile);

router.put("/profile", authenticate, authController.updateProfile);

router.put("/change-password", authenticate, authController.changePassword);

export default router;
