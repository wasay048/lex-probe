import { Request, Response, NextFunction } from "express";
import { body, validationResult, ValidationChain } from "express-validator";
import { logger } from "@utils/logger";

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: "path" in error ? error.path : error.type,
      message: error.msg,
    }));

    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formattedErrors,
    });
    return;
  }

  next();
};

// User validation rules
export const validateUserRegistration = [
  body("firstName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),

  body("lastName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),

  // body('confirmPassword')
  //   .custom((value, { req }) => {
  //     if (value !== req.body.password) {
  //       throw new Error('Password confirmation does not match password');
  //     }
  //     return true;
  //   }),

  // Make reCAPTCHA optional for development
  body("recaptchaToken")
    .optional()
    .isString()
    .withMessage("Invalid reCAPTCHA token"),
];

export const validateUserLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("password").notEmpty().withMessage("Password is required"),

  // Make reCAPTCHA optional for development
  body("recaptchaToken")
    .optional()
    .isString()
    .withMessage("Invalid reCAPTCHA token"),
];

export const validatePasswordReset = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
];

export const validatePasswordChange = [
  body("token").notEmpty().withMessage("Reset token is required"),

  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
];

// Search validation rules
export const validateSearchRequest = [
  // Validate companies
  body("companies")
    .isArray({ min: 2 })
    .withMessage("At least 2 companies are required for comparison")
    .custom((companies) => {
      if (companies.length > 10) {
        throw new Error("Maximum 10 companies allowed per search");
      }
      return true;
    }),

  // Validate company structure
  body("companies.*.name").notEmpty().withMessage("Company name is required"),

  body("companies.*.website")
    .optional()
    .isURL()
    .withMessage("Company website must be a valid URL"),

  // Validate filters
  body("filters.dateRange.from")
    .isISO8601()
    .withMessage("Please provide a valid start date"),

  body("filters.dateRange.to")
    .isISO8601()
    .withMessage("Please provide a valid end date"),

  body("filters.searchType")
    .isIn(["past", "future", "real-time"])
    .withMessage("Search type must be one of: past, future, real-time"),

  // Validate selected indicators
  body("selectedIndicators")
    .isArray({ min: 1 })
    .withMessage("At least one risk indicator must be selected"),

  // Validate search mode
  body("searchMode")
    .isIn(["osint", "api", "both"])
    .withMessage("Search mode must be one of: osint, api, both"),
];

// Project validation rules
export const validateProjectCreation: ValidationChain[] = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Project name must be between 1 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  body("tags").optional().isArray().withMessage("Tags must be an array"),

  body("tags.*")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Each tag cannot exceed 50 characters"),
];

export const validateReportGeneration = [
  body("searchId")
    .optional() // make optional if searchIds is provided
    .isMongoId()
    .withMessage("Invalid search ID format"),

  body("searchIds")
    .optional()
    .isArray({ min: 1 })
    .withMessage("searchIds must be a non-empty array"),

  body("searchIds.*")
    .optional()
    .isMongoId()
    .withMessage("Each searchId must be a valid Mongo ID"),

  body().custom((value) => {
    if (!value.searchId && !value.searchIds) {
      throw new Error("Either searchId or searchIds must be provided");
    }
    return true;
  }),

  body("title")
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters")
    .trim(),

  body("description")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters")
    .trim(),

  body("includeCharts")
    .optional()
    .isBoolean()
    .withMessage("includeCharts must be a boolean"),

  body("includeRawData")
    .optional()
    .isBoolean()
    .withMessage("includeRawData must be a boolean"),

  body("sections")
    .optional()
    .isArray()
    .withMessage("Sections must be an array"),

  body("sections.*")
    .optional()
    .isIn([
      "executive_summary",
      "methodology",
      "findings",
      "recommendations",
      "raw_data",
      // legacy names mapping
      "summary",
      "appendix",
    ])
    .withMessage("Invalid section type"),

  body("format")
    .optional()
    .isIn(["pdf", "html", "json"])
    .withMessage("Format must be pdf, html, or json"),
];

export const validateReportShare = [
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),

  body("message")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Message must not exceed 500 characters")
    .trim(),

  body("permissions")
    .optional()
    .isIn(["view", "download"])
    .withMessage("Permissions must be view or download"),
];

export const validateReportUpdate = [
  body("title")
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters")
    .trim(),

  body("description")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters")
    .trim(),

  body("isPublic")
    .optional()
    .isBoolean()
    .withMessage("isPublic must be a boolean"),
];
