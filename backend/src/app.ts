import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import { config, isDevelopment } from "@config/environment";
import database from "@config/database";
import { logger } from "@utils/logger";
import { generalLimiter } from "@middleware/rateLimiter";
import apiRoutes from "@routes/index";

class App {
  public app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = config.PORT;

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.connectDatabase();
  }

  private initializeMiddleware(): void {
    console.log("security middleware");
    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
        crossOriginEmbedderPolicy: false,
      })
    );

    // CORS configuration
    const corsOrigins = isDevelopment
      ? ["http://localhost:3000", "http://localhost:3001"]
      : config.CORS_ORIGIN;

    console.log("isDevelopment:", isDevelopment);
    console.log("config.CORS_ORIGIN raw:", config.CORS_ORIGIN);
    console.log("corsOrigins type:", typeof corsOrigins);
    console.log("corsOrigins value:", corsOrigins);

    // Convert to array if it's a string
    const originsArray =
      typeof corsOrigins === "string"
        ? corsOrigins.split(",").map((origin) => origin.trim())
        : corsOrigins;

    console.log("Final origins array:", originsArray);
    // this.app.use(
    //   cors({
    //     origin: "*",
    //     credentials: true,
    //     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    //     allowedHeaders: [
    //       "Content-Type",
    //       "Authorization",
    //       "X-Requested-With",
    //       "Origin",
    //       "Accept",
    //     ],
    //   })
    // );

    this.app.use(
      cors({
        origin: (origin, callback) => {
          console.log(`Incoming origin: ${origin}`);

          // Allow requests with no origin (mobile apps, Postman, etc.)
          if (!origin) {
            console.log("No origin - allowing request");
            return callback(null, true);
          }

          if (originsArray.includes(origin)) {
            console.log(`Origin allowed: ${origin}`);
            return callback(null, true);
          } else {
            console.log(`Origin blocked: ${origin}`);
            console.log(`Allowed origins: ${originsArray.join(", ")}`);
            return callback(new Error("Not allowed by CORS"), false);
          }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: [
          "Content-Type",
          "Authorization",
          "X-Requested-With",
          "Origin",
          "Accept",
        ],
      })
    );

    // General middleware

    this.app.use(
      cors({
        origin: true, // Allow all origins temporarily
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: ["*"],
      })
    );

    this.app.use(compression() as any);
    this.app.use(cookieParser());
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Logging middleware
    if (isDevelopment) {
      this.app.use(morgan("dev"));
    } else {
      this.app.use(
        morgan("combined", {
          stream: {
            write: (message: string) => {
              logger.info(message.trim());
            },
          },
        })
      );
    }

    // Rate limiting
    this.app.use(generalLimiter);

    // Request logging for debugging
    if (isDevelopment) {
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        logger.debug(`${req.method} ${req.path}`, {
          query: req.query,
          body: req.method !== "GET" ? req.body : undefined,
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        });
        next();
      });
    }
  }

  private initializeRoutes(): void {
    // Root endpoint
    this.app.get("/", (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: "Welcome to Cartel Detection Platform API",
        version: config.API_VERSION,
        documentation: "/api/health",
        timestamp: new Date().toISOString(),
      });
    });

    // API routes
    this.app.use(`/api/${config.API_VERSION}`, apiRoutes);

    // Backward compatibility - redirect /api to /api/v1
    this.app.use("/api", (req: Request, res: Response, next: NextFunction) => {
      if (req.path === "/") {
        res.redirect(`/api/${config.API_VERSION}`);
      } else {
        res.redirect(`/api/${config.API_VERSION}${req.path}`);
      }
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler for non-API routes
    this.app.use("*", (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        suggestions: [
          "Check the URL spelling",
          "Visit /api/v1/health for API status",
          "Refer to API documentation",
        ],
      });
    });

    // Global error handler
    this.app.use(
      (error: Error, req: Request, res: Response, next: NextFunction) => {
        logger.error("Unhandled error:", {
          error: error.message,
          stack: error.stack,
          url: req.originalUrl,
          method: req.method,
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        });

        // MongoDB duplicate key error
        if (error.name === "MongoError" && (error as any).code === 11000) {
          return res.status(400).json({
            success: false,
            message: "Duplicate entry found",
            error: isDevelopment ? error.message : "Data conflict",
          });
        }

        // Validation errors
        if (error.name === "ValidationError") {
          return res.status(400).json({
            success: false,
            message: "Validation failed",
            error: isDevelopment ? error.message : "Invalid data provided",
          });
        }

        // JWT errors
        if (error.name === "JsonWebTokenError") {
          return res.status(401).json({
            success: false,
            message: "Invalid token",
          });
        }

        if (error.name === "TokenExpiredError") {
          return res.status(401).json({
            success: false,
            message: "Token expired",
          });
        }

        // Default error response
        res.status(500).json({
          success: false,
          message: "Internal server error",
          error: isDevelopment ? error.message : "Something went wrong",
          requestId: req.headers["x-request-id"] || "unknown",
        });
      }
    );

    // Graceful shutdown handlers
    process.on("SIGTERM", this.gracefulShutdown.bind(this));
    process.on("SIGINT", this.gracefulShutdown.bind(this));

    // Handle uncaught exceptions
    process.on("uncaughtException", (error: Error) => {
      logger.error("Uncaught Exception:", error);
      this.gracefulShutdown();
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
      logger.error("Unhandled Rejection at:", promise, "reason:", reason);
      this.gracefulShutdown();
    });
  }

  private async connectDatabase(): Promise<void> {
    try {
      await database.connect();
      logger.info("Database connected successfully");
    } catch (error) {
      logger.error("Database connection failed:", error);
      process.exit(1);
    }
  }

  private gracefulShutdown(): void {
    logger.info("Received shutdown signal, starting graceful shutdown...");

    // Close server
    if (this.server) {
      this.server.close(async () => {
        logger.info("HTTP server closed");

        // Close database connection
        try {
          await database.disconnect();
          logger.info("Database connection closed");
        } catch (error) {
          logger.error("Error closing database connection:", error);
        }

        // Exit process
        process.exit(0);
      });
    } else {
      process.exit(0);
    }

    // Force exit after 30 seconds
    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 30000);
  }

  private server: any;

  public listen(): void {
    this.server = this.app.listen(this.port, () => {
      logger.info(`🚀 Cartel Detection Platform API started successfully!`);
      logger.info(`📡 Server running on port ${this.port}`);
      logger.info(`🌍 Environment: ${config.NODE_ENV}`);
      logger.info(
        `📚 API Documentation: http://localhost:${this.port}/api/${config.API_VERSION}/health`
      );
      logger.info(`🔗 CORS enabled for: ${config.CORS_ORIGIN}`);

      if (isDevelopment) {
        logger.info(`🔧 Development mode: Enhanced logging enabled`);
        logger.info(`📋 Available endpoints:`);
        logger.info(`   GET  / - Welcome message`);
        logger.info(`   GET  /api/${config.API_VERSION}/health - Health check`);
        logger.info(
          `   POST /api/${config.API_VERSION}/auth/register - User registration`
        );
        logger.info(
          `   POST /api/${config.API_VERSION}/auth/login - User login`
        );
        logger.info(
          `   GET  /api/${config.API_VERSION}/searches - List searches`
        );
        logger.info(
          `   POST /api/${config.API_VERSION}/searches - Create search`
        );
        logger.info(
          `   GET  /api/${config.API_VERSION}/projects - List projects`
        );
        logger.info(
          `   POST /api/${config.API_VERSION}/projects - Create project`
        );
      }
    });

    this.server.on("error", (error: any) => {
      if (error.syscall !== "listen") {
        throw error;
      }

      const bind =
        typeof this.port === "string"
          ? "Pipe " + this.port
          : "Port " + this.port;

      switch (error.code) {
        case "EACCES":
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case "EADDRINUSE":
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
  }
}

// Initialize and start the application
const app = new App();
app.listen();

export default app;
