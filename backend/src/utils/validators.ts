import { Request } from "express";
import { User } from "@models/User";
import { logger } from "./logger";
import { config } from "@/config/environment";
import axios from "axios";

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (
  password: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push(
      "Password must contain at least one special character (@$!%*?&)"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateDateRange = (
  from: string,
  to: string
): { isValid: boolean; error?: string } => {
  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (isNaN(fromDate.getTime())) {
    return { isValid: false, error: "Invalid start date" };
  }

  if (isNaN(toDate.getTime())) {
    return { isValid: false, error: "Invalid end date" };
  }

  if (toDate <= fromDate) {
    return { isValid: false, error: "End date must be after start date" };
  }

  return { isValid: true };
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, "");
};

export const validateRecaptcha = async (token: string): Promise<boolean> => {
  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: config.RECAPTCHA_SECRET_KEY,
          response: token,
        },
      }
    );

    const data = response.data as { success: boolean; [key: string]: any };
    return data.success === true;
  } catch (error) {
    logger.error("reCAPTCHA validation error:", error);
    return false;
  }
};

// Alternative fix if the above doesn't work:
export const validateRecaptchaAlt = async (token: string): Promise<boolean> => {
  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: config.RECAPTCHA_SECRET_KEY,
          response: token,
        },
      }
    );

    // Type assertion to fix the unknown type issue
    return (response.data as any)?.success === true;
  } catch (error) {
    logger.error("reCAPTCHA validation error:", error);
    return false;
  }
};

export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    return !!user;
  } catch (error) {
    logger.error("Error checking email existence:", error);
    return false;
  }
};

export const validateCompanyData = (
  companies: any[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!Array.isArray(companies)) {
    return { isValid: false, errors: ["Companies must be an array"] };
  }

  if (companies.length < 2) {
    errors.push("At least 2 companies are required for comparison");
  }

  companies.forEach((company, index) => {
    if (
      !company.name ||
      typeof company.name !== "string" ||
      company.name.trim().length === 0
    ) {
      errors.push(`Company ${index + 1}: Name is required`);
    }

    if (!company.website || typeof company.website !== "string") {
      errors.push(`Company ${index + 1}: Website is required`);
    } else if (!validateUrl(company.website)) {
      errors.push(`Company ${index + 1}: Invalid website URL`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateSearchIndicators = (
  indicators: any[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!Array.isArray(indicators)) {
    return { isValid: false, errors: ["Indicators must be an array"] };
  }

  if (indicators.length === 0) {
    errors.push("At least one indicator must be provided");
  }

  // Check if indicators are strings (IDs) or objects
  const firstIndicator = indicators[0];
  const isStringArray = typeof firstIndicator === "string";

  if (isStringArray) {
    // Handle string array format (indicator IDs from frontend)
    indicators.forEach((indicator, index) => {
      if (typeof indicator !== "string" || indicator.trim().length === 0) {
        errors.push(`Indicator ${index + 1}: Must be a valid indicator ID`);
      }
    });
  } else {
    // Handle object array format (full indicator objects)
    const hasSelectedIndicator = indicators.some(
      (indicator) => indicator.isSelected === true
    );
    if (!hasSelectedIndicator) {
      errors.push("At least one indicator must be selected");
    }

    indicators.forEach((indicator, index) => {
      if (!indicator.category || typeof indicator.category !== "string") {
        errors.push(`Indicator ${index + 1}: Category is required`);
      }

      if (!indicator.indicator || typeof indicator.indicator !== "string") {
        errors.push(`Indicator ${index + 1}: Indicator name is required`);
      }

      if (
        typeof indicator.riskScore !== "number" ||
        indicator.riskScore < 1 ||
        indicator.riskScore > 5
      ) {
        errors.push(
          `Indicator ${index + 1}: Risk score must be between 1 and 5`
        );
      }

      if (typeof indicator.isSelected !== "boolean") {
        errors.push(`Indicator ${index + 1}: isSelected must be a boolean`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
