import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "@config/environment";
import { User, IUser } from "@models/User";
import { logger } from "@utils/logger";

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Access denied. No token provided or invalid format.",
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;

      const user = await User.findById(decoded.userId).select("+password");

      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: "Invalid token. User not found or inactive.",
        });
        return;
      }

      if (!user.isEmailVerified) {
        res.status(401).json({
          success: false,
          message:
            "Email not verified. Please verify your email before accessing this resource.",
        });
        return;
      }

      req.user = user;
      next();
    } catch (jwtError) {
      logger.warn("JWT verification failed:", jwtError);
      res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
      return;
    }
  } catch (error) {
    logger.error("Authentication middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during authentication.",
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Insufficient permissions.",
      });
      return;
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next();
    return;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
    const user = await User.findById(decoded.userId);

    if (user && user.isActive && user.isEmailVerified) {
      req.user = user;
    }
  } catch (error) {
    // Silently fail for optional auth
    logger.debug("Optional auth failed:", error);
  }

  next();
};
