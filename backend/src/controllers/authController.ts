import { Request, Response } from "express";
import { AuthService } from "@services/authService";
import { logger } from "@utils/logger";
import { AuthenticatedRequest } from "@middleware/auth";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, firstName, lastName, recaptchaToken } = req.body;

      const result = await this.authService.register({
        email,
        password,
        firstName,
        lastName,
        recaptchaToken,
        req,
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      logger.info(`User registered successfully: ${email}`);
      res.status(201).json(result);
    } catch (error) {
      logger.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error during registration",
      });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, recaptchaToken } = req.body;

      const result = await this.authService.login({
        email,
        password,
        recaptchaToken,
        req,
      });

      if (!result.success) {
        res.status(401).json(result);
        return;
      }

      // Set refresh token as httpOnly cookie
      if (result.refreshToken) {
        res.cookie("refreshToken", result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
      }

      logger.info(`User logged in successfully: ${email}`);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error during login",
      });
    }
  };

  logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }

      res.clearCookie("refreshToken");

      logger.info(`User logged out: ${req.user?.email}`);
      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      logger.error("Logout error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error during logout",
      });
    }
  };

  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        res.status(400).json({
          success: false,
          message: "Verification token is required",
        });
        return;
      }

      const result = await this.authService.verifyEmail(token);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      logger.info(`Email verified successfully for token: ${token}`);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Email verification error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error during email verification",
      });
    }
  };

  resendVerification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      const result = await this.authService.resendVerificationEmail(email);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      logger.info(`Verification email resent to: ${email}`);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Resend verification error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while resending verification",
      });
    }
  };

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      const result = await this.authService.forgotPassword(email);

      // Always return success to prevent email enumeration
      res.status(200).json({
        success: true,
        message:
          "If the email exists in our system, you will receive a password reset link shortly",
      });

      logger.info(`Password reset requested for: ${email}`);
    } catch (error) {
      logger.error("Forgot password error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error during password reset request",
      });
    }
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword } = req.body;

      const result = await this.authService.resetPassword(token, newPassword);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      logger.info(`Password reset successfully for token: ${token}`);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Reset password error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error during password reset",
      });
    }
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          message: "Refresh token is required",
        });
        return;
      }

      const result = await this.authService.refreshToken(refreshToken);

      if (!result.success) {
        res.clearCookie("refreshToken");
        res.status(401).json(result);
        return;
      }

      // Set new refresh token if provided
      if (result.refreshToken) {
        res.cookie("refreshToken", result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
      }

      res.status(200).json(result);
    } catch (error) {
      logger.error("Refresh token error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error during token refresh",
      });
    }
  };

  getProfile = async (
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

      res.status(200).json({
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (error) {
      logger.error("Get profile error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while fetching profile",
      });
    }
  };

  updateProfile = async (
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

      const { firstName, lastName } = req.body;

      const result = await this.authService.updateProfile(req.user._id, {
        firstName,
        lastName,
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      logger.info(`Profile updated for user: ${req.user.email}`);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while updating profile",
      });
    }
  };

  changePassword = async (
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

      const { currentPassword, newPassword } = req.body;

      const result = await this.authService.changePassword(
        req.user._id,
        currentPassword,
        newPassword
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      logger.info(`Password changed for user: ${req.user.email}`);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while changing password",
      });
    }
  };
}
