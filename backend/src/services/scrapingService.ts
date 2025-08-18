import axios, { AxiosResponse } from "axios";
import { logger } from "@utils/logger";
import { config } from "@config/environment";

export interface ScrapingResult {
  url: string;
  content: string;
  title?: string;
  metadata: Record<string, any>;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export interface ScrapingRequest {
  urls: string[];
  searchTerms: string[];
  maxPages?: number;
  timeout?: number;
}

export interface CompanyWebsiteData {
  content: string;
  title: string;
  pricing?: any;
  services?: string[];
  aboutUs?: string;
  contactInfo?: any;
  newsSection?: any;
  metadata: Record<string, any>;
}

export interface NewsData {
  articles: Array<{
    title: string;
    content: string;
    date: string;
    source: string;
    url: string;
  }>;
  totalFound: number;
}

export interface FinancialData {
  revenue?: string;
  marketCap?: string;
  stockPrice?: string;
  financialReports?: any[];
  keyMetrics?: Record<string, any>;
}

export class ScrapingService {
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly userAgents: string[];

  constructor() {
    this.timeout = 10000; // 10 seconds
    this.maxRetries = 3;
    this.userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    ];
  }

  async scrapeData(request: ScrapingRequest): Promise<ScrapingResult[]> {
    try {
      const {
        urls,
        searchTerms,
        maxPages = 10,
        timeout = this.timeout,
      } = request;
      const results: ScrapingResult[] = [];

      for (const url of urls.slice(0, maxPages)) {
        try {
          const result = await this.scrapeUrl(url, searchTerms, timeout);
          results.push(result);

          // Add delay between requests to be respectful
          await this.delay(1000);
        } catch (error) {
          logger.error(`Failed to scrape ${url}:`, error);
          results.push({
            url,
            content: "",
            metadata: {},
            timestamp: new Date(),
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return results;
    } catch (error) {
      logger.error("Scraping service error:", error);
      throw error;
    }
  }

  private async scrapeUrl(
    url: string,
    searchTerms: string[],
    timeout: number
  ): Promise<ScrapingResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.makeRequest(url, timeout);

        if (response.status === 200) {
          const content = this.extractTextContent(response.data);
          const relevantContent = this.filterRelevantContent(
            content,
            searchTerms
          );
          const metadata = this.extractMetadata(
            response.data,
            response.headers
          );

          return {
            url,
            content: relevantContent,
            title: metadata.title,
            metadata,
            timestamp: new Date(),
            success: true,
          };
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        logger.warn(
          `Scraping attempt ${attempt} failed for ${url}:`,
          lastError.message
        );

        if (attempt < this.maxRetries) {
          await this.delay(attempt * 1000); // Exponential backoff
        }
      }
    }

    throw lastError || new Error("All scraping attempts failed");
  }

  private async makeRequest(
    url: string,
    timeout: number
  ): Promise<AxiosResponse> {
    const userAgent =
      this.userAgents[Math.floor(Math.random() * this.userAgents.length)];

    return await axios.get(url, {
      timeout,
      headers: {
        "User-Agent": userAgent,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400,
    });
  }

  private extractTextContent(html: string): string {
    try {
      // Simple HTML to text conversion
      // In production, use a proper HTML parser like Cheerio
      return html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    } catch (error) {
      logger.error("Text extraction error:", error);
      return html;
    }
  }

  private filterRelevantContent(
    content: string,
    searchTerms: string[]
  ): string {
    try {
      if (searchTerms.length === 0) return content;

      const sentences = content.split(/[.!?]+/);
      const relevantSentences = sentences.filter((sentence) => {
        const lowerSentence = sentence.toLowerCase();
        return searchTerms.some((term) =>
          lowerSentence.includes(term.toLowerCase())
        );
      });

      return relevantSentences.length > 0
        ? relevantSentences.join(". ").trim() + "."
        : content.substring(0, 1000) + "..."; // Fallback to first 1000 chars
    } catch (error) {
      logger.error("Content filtering error:", error);
      return content;
    }
  }

  private extractMetadata(html: string, headers: any): Record<string, any> {
    const metadata: Record<string, any> = {
      contentType: headers["content-type"] || "unknown",
      contentLength: headers["content-length"] || html.length,
      lastModified: headers["last-modified"],
      server: headers["server"],
    };

    try {
      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        metadata.title = titleMatch[1].trim();
      }

      // Extract meta description
      const descMatch = html.match(
        /<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i
      );
      if (descMatch) {
        metadata.description = descMatch[1].trim();
      }

      // Extract meta keywords
      const keywordsMatch = html.match(
        /<meta[^>]*name=["\']keywords["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i
      );
      if (keywordsMatch) {
        metadata.keywords = keywordsMatch[1].split(",").map((k) => k.trim());
      }
    } catch (error) {
      logger.error("Metadata extraction error:", error);
    }

    return metadata;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Method for searching news articles about companies
  async searchNews(
    companies: string[],
    keywords: string[] = []
  ): Promise<ScrapingResult[]> {
    try {
      const searchTerms = [...companies, ...keywords];
      const newsUrls = this.generateNewsSearchUrls(companies, keywords);

      return await this.scrapeData({
        urls: newsUrls,
        searchTerms,
        maxPages: 20,
      });
    } catch (error) {
      logger.error("News search error:", error);
      throw error;
    }
  }

  // Method for scraping company websites
  async scrapeCompanyInfo(companies: string[]): Promise<ScrapingResult[]> {
    try {
      const companyUrls = companies.map(
        (company) =>
          `https://www.${company.toLowerCase().replace(/\s+/g, "")}.com`
      );

      return await this.scrapeData({
        urls: companyUrls,
        searchTerms: companies,
        maxPages: companies.length,
      });
    } catch (error) {
      logger.error("Company info scraping error:", error);
      throw error;
    }
  }

  private generateNewsSearchUrls(
    companies: string[],
    keywords: string[]
  ): string[] {
    const allTerms = [...companies, ...keywords].join(" ");
    const encodedTerms = encodeURIComponent(allTerms);

    // For MVP, return mock URLs. In production, use actual news APIs
    return [
      `https://news.google.com/search?q=${encodedTerms}`,
      `https://www.reuters.com/search/news?query=${encodedTerms}`,
      `https://www.bloomberg.com/search?query=${encodedTerms}`,
      `https://www.ft.com/search?q=${encodedTerms}`,
    ];
  }

  // New methods for CartelAnalysisService
  async scrapeCompanyWebsite(url: string): Promise<CompanyWebsiteData | null> {
    try {
      if (!url || url.trim() === "") {
        logger.warn("Empty URL provided for website scraping");
        return null;
      }

      logger.info(`Scraping company website: ${url}`);

      const result = await this.scrapeUrl(url, [], this.timeout);

      if (!result.success) {
        logger.warn(`Failed to scrape website ${url}: ${result.error}`);
        return null;
      }

      // Extract relevant information from the scraped content
      return {
        content: result.content,
        title: result.title || "",
        pricing: this.extractPricingInfo(result.content),
        services: this.extractServices(result.content),
        aboutUs: this.extractAboutUs(result.content),
        contactInfo: this.extractContactInfo(result.content),
        newsSection: this.extractNewsSection(result.content),
        metadata: result.metadata,
      };
    } catch (error) {
      logger.error(`Error scraping company website ${url}:`, error);
      return null;
    }
  }

  async searchCompanyNews(companyName: string): Promise<NewsData | null> {
    try {
      logger.info(`Searching news for company: ${companyName}`);

      // Use Google News search (in production, use proper news APIs)
      const searchQuery = `${companyName} cartel antitrust competition investigation`;
      const newsUrls = [
        `https://news.google.com/search?q=${encodeURIComponent(searchQuery)}`,
        `https://www.reuters.com/search/news?query=${encodeURIComponent(
          companyName
        )}`,
      ];

      const articles = [];

      for (const url of newsUrls.slice(0, 2)) {
        // Limit to avoid rate limiting
        try {
          const result = await this.scrapeUrl(url, [companyName], this.timeout);
          if (result.success) {
            // Extract article data from scraped content
            const extractedArticles = this.extractNewsArticles(
              result.content,
              companyName
            );
            articles.push(...extractedArticles);
          }
        } catch (error) {
          logger.warn(`Failed to scrape news from ${url}:`, error);
        }
      }

      return {
        articles: articles.slice(0, 10), // Limit to 10 articles
        totalFound: articles.length,
      };
    } catch (error) {
      logger.error(`Error searching news for ${companyName}:`, error);
      return null;
    }
  }

  async getFinancialData(companyName: string): Promise<FinancialData | null> {
    try {
      logger.info(`Getting financial data for company: ${companyName}`);

      // In production, use financial APIs like Alpha Vantage, Yahoo Finance, etc.
      // For now, return mock data structure
      const financialUrls = [
        `https://finance.yahoo.com/quote/${companyName}`,
        `https://www.sec.gov/cgi-bin/browse-edgar?company=${encodeURIComponent(
          companyName
        )}`,
      ];

      const financialData: FinancialData = {
        revenue: undefined,
        marketCap: undefined,
        stockPrice: undefined,
        financialReports: [],
        keyMetrics: {},
      };

      // For MVP, return basic structure
      // In production, implement actual financial data scraping
      logger.info(`Financial data collection for ${companyName} completed`);

      return financialData;
    } catch (error) {
      logger.error(`Error getting financial data for ${companyName}:`, error);
      return null;
    }
  }

  // Helper methods for data extraction
  private extractPricingInfo(content: string): any {
    // Extract pricing information from website content
    const pricingKeywords = ["price", "pricing", "cost", "$", "usd", "eur"];
    const sentences = content
      .split(".")
      .filter((sentence) =>
        pricingKeywords.some((keyword) =>
          sentence.toLowerCase().includes(keyword)
        )
      );
    return { found: sentences.length > 0, details: sentences.slice(0, 3) };
  }

  private extractServices(content: string): string[] {
    // Extract services from website content
    const serviceKeywords = ["service", "product", "solution", "offering"];
    const services: string[] = [];

    serviceKeywords.forEach((keyword) => {
      const regex = new RegExp(`${keyword}[s]?[^.]*`, "gi");
      const matches = content.match(regex);
      if (matches) {
        services.push(...matches.slice(0, 2));
      }
    });

    return services.slice(0, 5);
  }

  private extractAboutUs(content: string): string {
    // Extract about us section
    const aboutKeywords = [
      "about us",
      "about",
      "company",
      "our mission",
      "who we are",
    ];

    for (const keyword of aboutKeywords) {
      const regex = new RegExp(`${keyword}[^.]{0,500}`, "gi");
      const match = content.match(regex);
      if (match && match[0]) {
        return match[0].substring(0, 300);
      }
    }

    return "";
  }

  private extractContactInfo(content: string): any {
    // Extract contact information
    const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
    const phoneRegex =
      /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

    return {
      emails: content.match(emailRegex)?.slice(0, 3) || [],
      phones: content.match(phoneRegex)?.slice(0, 3) || [],
    };
  }

  private extractNewsSection(content: string): any {
    // Extract news section from website
    const newsKeywords = ["news", "press release", "announcement", "update"];
    const newsContent: string[] = [];

    newsKeywords.forEach((keyword) => {
      const regex = new RegExp(`${keyword}[^.]{0,200}`, "gi");
      const matches = content.match(regex);
      if (matches) {
        newsContent.push(...matches.slice(0, 2));
      }
    });

    return { found: newsContent.length > 0, content: newsContent.slice(0, 3) };
  }

  private extractNewsArticles(content: string, companyName: string): any[] {
    // Extract news articles from scraped news page content
    // This is a simplified implementation
    const articles: any[] = [];
    const lines = content
      .split("\n")
      .filter((line) => line.toLowerCase().includes(companyName.toLowerCase()));

    lines.slice(0, 5).forEach((line, index) => {
      articles.push({
        title: line.substring(0, 100),
        content: line.substring(0, 300),
        date: new Date().toISOString(),
        source: "Web Search",
        url: `https://example.com/article-${index}`,
      });
    });

    return articles;
  }

  async normalizeData(scrapingResults: ScrapingResult[]): Promise<any[]> {
    try {
      return scrapingResults.map((result) => ({
        source: "web_scraping",
        url: result.url,
        title: result.title || "Untitled",
        content: result.content,
        timestamp: result.timestamp,
        relevanceScore: this.calculateRelevanceScore(result),
        metadata: result.metadata,
      }));
    } catch (error) {
      logger.error("Data normalization error:", error);
      return [];
    }
  }

  private calculateRelevanceScore(result: ScrapingResult): number {
    // Simple relevance scoring based on content length and success
    if (!result.success) return 0;

    const contentLength = result.content.length;
    if (contentLength < 100) return 0.2;
    if (contentLength < 500) return 0.5;
    if (contentLength < 1000) return 0.7;
    return 0.9;
  }
}
