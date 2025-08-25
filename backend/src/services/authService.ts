import { Request } from "express";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { User, IUser } from "@models/User";
import { config } from "@config/environment";
import { sendOtpEmail } from "@utils/email";
import crypto from "crypto";
import {
  validateRecaptcha,
  validatePassword,
  checkEmailExists,
} from "@utils/validators";
import { logger } from "@utils/logger";

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organization?: string;
  recaptchaToken?: string;
  req: Request;
}

export interface LoginRequest {
  email: string;
  password: string;
  recaptchaToken?: string;
  req: Request;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface AuthResponse {
  success: boolean;
  message: string;
  errors?: string[];
  data?: {
    user: {
      _id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      isEmailVerified: boolean;
      isActive: boolean;
      lastLogin?: Date;
      organization?: string;
      createdAt: Date;
      updatedAt: Date;
    };
    accessToken: string;
  };
  refreshToken?: string;
}

export class AuthService {
  async register(request: RegisterRequest): Promise<AuthResponse> {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        organization,
        recaptchaToken,
        req,
      } = request;

      // Skip reCAPTCHA validation in development
      if (recaptchaToken && process.env.NODE_ENV === "production") {
        const isRecaptchaValid = await validateRecaptcha(recaptchaToken);
        if (!isRecaptchaValid) {
          return {
            success: false,
            message: "Invalid reCAPTCHA. Please try again.",
          };
        }
      }

      // Check if user already exists
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        return {
          success: false,
          message: "User with this email already exists",
        };
      }

      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: "Password does not meet requirements",
          errors: passwordValidation.errors,
        };
      }

      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + config.OTP_EXPIRES_MINUTES * 60 * 1000); // configurable

      // Create user
      const user = new User({
        email: email.toLowerCase(),
        password,
        firstName,
        lastName,
        organization,
        otpCode: otp,
        otpExpires,
        isEmailVerified: false,
        isActive: true,
      });

      await user.save();

      // Send OTP email (always, even in development)
      try {
        await sendOtpEmail(user.email, otp);
      } catch (emailError) {
        logger.error("Failed to send OTP email:", emailError);
      }

      return {
        success: true,
        message: "Registration successful. Please check your email for the verification code.",
      };
    } catch (error) {
      logger.error("Registration service error:", error);
      return {
        success: false,
        message: "Registration failed. Please try again.",
      };
    }
  }

  async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      const { email, password, recaptchaToken, req } = request;

      // Skip reCAPTCHA validation in development
      if (recaptchaToken && process.env.NODE_ENV === "production") {
        const isRecaptchaValid = await validateRecaptcha(recaptchaToken);
        if (!isRecaptchaValid) {
          return {
            success: false,
            message: "Invalid reCAPTCHA. Please try again.",
          };
        }
      }

      // Find user with password field
      const user = await User.findOne({ email: email.toLowerCase() }).select(
        "+password"
      );
      if (!user) {
        return {
          success: false,
          message: "Invalid email or password",
        };
      }

      // Check if user is active
      if (!user.isActive) {
        return {
          success: false,
          message: "Account is deactivated. Please contact support.",
        };
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: "Invalid email or password",
        };
      }

      // Check if email is verified (skip in development)
      if (process.env.NODE_ENV === "production" && !user.isEmailVerified) {
        return {
          success: false,
          message: "Please verify your email before logging in",
        };
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      return {
        success: true,
        message: "Login successful",
        data: {
          user: {
            _id: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            organization: user.organization,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          accessToken,
        },
        refreshToken,
      };
    } catch (error) {
      logger.error("Login service error:", error);
      return {
        success: false,
        message: "Login failed. Please try again.",
      };
    }
  }

  async logout(refreshToken: string): Promise<ServiceResponse> {
    try {
      // In a production app, you might want to maintain a blacklist of refresh tokens
      // For now, we'll just return success
      return {
        success: true,
        message: "Logged out successfully",
      };
    } catch (error) {
      logger.error("Logout service error:", error);
      throw error;
    }
  }

  async verifyEmail(token: string): Promise<ServiceResponse> {
    try {
      const user = await User.findOne({ emailVerificationToken: token });

      if (!user) {
        return {
          success: false,
          message: "Invalid or expired verification token",
        };
      }

      if (user.isEmailVerified) {
        return {
          success: false,
          message: "Email is already verified",
        };
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      await user.save();

      return {
        success: true,
        message: "Email verified successfully",
      };
    } catch (error) {
      logger.error("Email verification service error:", error);
      throw error;
    }
  }

  async resendVerificationEmail(email: string): Promise<ServiceResponse> {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      if (user.isEmailVerified) {
        return {
          success: false,
          message: "Email is already verified",
        };
      }

      // Generate new OTP and expiration
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + config.OTP_EXPIRES_MINUTES * 60 * 1000);
      user.otpCode = otp;
      user.otpExpires = otpExpires;
      await user.save();

      // Send OTP email
      try {
        await sendOtpEmail(email, otp);
      } catch (emailError) {
        logger.error("Failed to send OTP email:", emailError);
        return {
          success: false,
          message: "Failed to send OTP email",
        };
      }
      return {
        success: true,
        message: "OTP sent successfully",
      };
    } catch (error) {
      logger.error("Resend verification email service error:", error);
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<ServiceResponse> {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        // Don't reveal if email exists
        return {
          success: true,
          message: "Password reset email sent if account exists",
        };
      }

      // Generate password reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      user.passwordResetToken = resetToken;
      user.passwordResetExpires = resetExpires;
      await user.save();

      // Send password reset email
      try {
        await sendOtpEmail(email, resetToken);
      } catch (emailError) {
        logger.warn(`Failed to send password reset email to: ${email}`);
      }

      return {
        success: true,
        message: "Password reset email sent if account exists",
      };
    } catch (error) {
      logger.error("Forgot password service error:", error);
      throw error;
    }
  }

  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<ServiceResponse> {
    try {
      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
      });

      if (!user) {
        return {
          success: false,
          message: "Invalid or expired reset token",
        };
      }

      // Validate new password
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: "Password does not meet requirements",
          errors: passwordValidation.errors,
        };
      }

      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      return {
        success: true,
        message: "Password reset successful",
      };
    } catch (error) {
      logger.error("Reset password service error:", error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const decoded = jwt.verify(
        refreshToken,
        config.JWT_REFRESH_SECRET
      ) as any;
      const user = await User.findById(decoded.userId);

      if (!user || !user.isActive) {
        return {
          success: false,
          message: "Invalid refresh token",
        };
      }

      const accessToken = this.generateAccessToken(user);

      return {
        success: true,
        message: "Token refreshed successfully",
        data: {
          user: {
            _id: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            organization: user.organization,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          accessToken,
        },
      };
    } catch (error) {
      logger.error("Refresh token service error:", error);
      return {
        success: false,
        message: "Invalid refresh token",
      };
    }
  }

  async updateProfile(
    userId: string,
    updates: { firstName?: string; lastName?: string }
  ): Promise<ServiceResponse> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      if (updates.firstName) user.firstName = updates.firstName;
      if (updates.lastName) user.lastName = updates.lastName;

      await user.save();

      return {
        success: true,
        message: "Profile updated successfully",
        data: {
          user: {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          },
        },
      };
    } catch (error) {
      logger.error("Update profile service error:", error);
      throw error;
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<ServiceResponse> {
    try {
      const user = await User.findById(userId).select("+password");
      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(
        currentPassword
      );
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          message: "Current password is incorrect",
        };
      }

      // Validate new password
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: "New password does not meet requirements",
          errors: passwordValidation.errors,
        };
      }

      user.password = newPassword;
      await user.save();

      return {
        success: true,
        message: "Password changed successfully",
      };
    } catch (error) {
      logger.error("Change password service error:", error);
      throw error;
    }
  }

  private generateAccessToken(user: IUser): string {
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, config.JWT_SECRET as Secret, {
      expiresIn: (config.JWT_EXPIRES_IN as SignOptions["expiresIn"]) || "24h",
    });
  }

  private generateRefreshToken(user: IUser): string {
    const payload = {
      userId: user._id.toString(),
      email: user.email,
    };

    return jwt.sign(payload, config.JWT_REFRESH_SECRET as Secret, {
      expiresIn:
        (config.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"]) || "7d",
    });
  }
}
