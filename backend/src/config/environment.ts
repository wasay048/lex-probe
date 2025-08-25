import dotenv from "dotenv";
import Joi from "joi";

dotenv.config();

interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  API_VERSION: string;
  MONGODB_URI: string;
  REDIS_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  FROM_EMAIL: string;
  RECAPTCHA_SECRET_KEY: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  BCRYPT_ROUNDS: number;
  CORS_ORIGIN: string | string[];
  OPENAI_API_KEY: string;
  SERP_API_KEY?: string;
  OTP_EXPIRES_MINUTES: number;
}

const envSchema = Joi.object({
  OTP_EXPIRES_MINUTES: Joi.number().default(5),
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().default(5000),
  API_VERSION: Joi.string().default("v1"),
  MONGODB_URI: Joi.string().required(),
  REDIS_URL: Joi.string().default("redis://localhost:6379"),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default("1d"),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default("7d"),
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().email().required(),
  SMTP_PASS: Joi.string().required(),
  FROM_EMAIL: Joi.string().email().required(),
  RECAPTCHA_SECRET_KEY: Joi.string().required(),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  BCRYPT_ROUNDS: Joi.number().default(12),
  CORS_ORIGIN: Joi.alternatives()
    .try(Joi.string(), Joi.array().items(Joi.string()))
    .default(["http://localhost:3000", "http://localhost:3001"]),
  OPENAI_API_KEY: Joi.string().required(),
  SERP_API_KEY: Joi.string().optional(),
}).unknown();

const { error, value } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

export const config: EnvironmentConfig = value;
export const environment: EnvironmentConfig = value;

export const isDevelopment = config.NODE_ENV === "development";
export const isProduction = config.NODE_ENV === "production";
export const isTest = config.NODE_ENV === "test";
