import axios from "axios";
import { logger } from "@utils/logger";

interface WebsiteValidationResult {
  isValid: boolean;
  error?: string;
  statusCode?: number;
  responseTime?: number;
}

export class WebsiteValidationService {
  private readonly timeout = 10000; // 10 seconds timeout

  async validateWebsite(website: string): Promise<WebsiteValidationResult> {
    try {
      // Normalize URL
      let url = website.trim();
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`;
      }

      logger.info(`Validating website: ${url}`);

      const startTime = Date.now();

      // Make HEAD request first (faster than GET)
      const response = await axios.head(url, {
        timeout: this.timeout,
        validateStatus: (status) => status < 500, // Accept any status < 500
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        maxRedirects: 5,
      });

      const responseTime = Date.now() - startTime;

      // Consider status codes 200-399 as valid
      if (response.status >= 200 && response.status < 400) {
        logger.info(
          `✅ Website ${url} is valid (${response.status}) - ${responseTime}ms`
        );
        return {
          isValid: true,
          statusCode: response.status,
          responseTime,
        };
      } else {
        logger.warn(`⚠️ Website ${url} returned status ${response.status}`);
        return {
          isValid: false,
          error: `Website returned status code ${response.status}`,
          statusCode: response.status,
          responseTime,
        };
      }
    } catch (error: any) {
      logger.error(
        `❌ Website validation failed for ${website}:`,
        error.message
      );

      // Handle different types of errors
      if (error.code === "ENOTFOUND") {
        return {
          isValid: false,
          error: "Website domain not found (DNS resolution failed)",
        };
      } else if (error.code === "ECONNREFUSED") {
        return {
          isValid: false,
          error: "Connection refused by the website",
        };
      } else if (
        error.code === "ETIMEDOUT" ||
        error.message.includes("timeout")
      ) {
        return {
          isValid: false,
          error: "Website request timed out",
        };
      } else if (error.response?.status >= 500) {
        return {
          isValid: false,
          error: `Website server error (${error.response.status})`,
          statusCode: error.response.status,
        };
      } else {
        return {
          isValid: false,
          error: `Website validation failed: ${error.message}`,
        };
      }
    }
  }

  async validateMultipleWebsites(
    websites: string[]
  ): Promise<WebsiteValidationResult[]> {
    logger.info(`Validating ${websites.length} websites...`);

    const results = await Promise.all(
      websites.map((website) => this.validateWebsite(website))
    );

    const validCount = results.filter((r) => r.isValid).length;
    logger.info(
      `Website validation complete: ${validCount}/${websites.length} valid`
    );

    return results;
  }
}
