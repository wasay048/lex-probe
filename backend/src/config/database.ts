import mongoose from "mongoose";
import { config } from "./environment";
import { logger } from "@utils/logger";

export class Database {
  async connect(): Promise<void> {
    try {
      const mongoOptions = {
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close connections after 45 seconds of inactivity
        bufferCommands: false, // Disable mongoose buffering
        bufferMaxEntries: 0, // Disable mongoose buffering (deprecated but some versions still use it)
        
        // Remove deprecated options and use current ones
        useNewUrlParser: true,
        useUnifiedTopology: true,
      };

      // Clean options - remove any deprecated ones for newer MongoDB driver versions
      const cleanOptions = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      };

      // Try connection with clean options first
      await mongoose.connect(config.MONGODB_URI, cleanOptions);

      logger.info("✅ Database connected successfully");

      // Handle connection events
      mongoose.connection.on("error", (error) => {
        logger.error("❌ Database connection error:", error);
      });

      mongoose.connection.on("disconnected", () => {
        logger.warn("⚠️ Database disconnected");
      });

      mongoose.connection.on("reconnected", () => {
        logger.info("🔄 Database reconnected");
      });

      // Graceful shutdown
      process.on("SIGINT", async () => {
        await mongoose.connection.close();
        logger.info("📪 Database connection closed through app termination");
        process.exit(0);
      });

    } catch (error) {
      logger.error("❌ Database connection failed:", error);
      
      // If it's specifically the bufferMaxEntries error, try with minimal options
      if (error instanceof Error && error.message.includes('buffermaxentries')) {
        logger.info("🔄 Retrying with minimal connection options...");
        try {
          await mongoose.connect(config.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
          });
          logger.info("✅ Database connected with minimal options");
          return;
        } catch (retryError) {
          logger.error("❌ Retry failed:", retryError);
        }
      }
      
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mongoose.connection.close();
      logger.info("📪 Database disconnected successfully");
    } catch (error) {
      logger.error("❌ Error disconnecting from database:", error);
      throw error;
    }
  }

  isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  async ping(): Promise<boolean> {
    try {
      await mongoose.connection.db.admin().ping();
      return true;
    } catch {
      return false;
    }
  }
}

export const database = new Database();
export default database;