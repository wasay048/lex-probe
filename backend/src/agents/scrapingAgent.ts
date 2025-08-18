import { ScrapingService, ScrapingResult } from "@services/scrapingService";
import { logger } from "@utils/logger";

export interface ScrapingAgentRequest {
  companies: string[];
  keywords: string[];
  sources: string[];
  maxResults?: number;
}

export interface ScrapingAgentResult {
  success: boolean;
  results: ScrapingResult[];
  normalizedData: any[];
  summary: {
    totalSources: number;
    successfulScrapes: number;
    failedScrapes: number;
    averageRelevanceScore: number;
  };
}

export class ScrapingAgent {
  private scrapingService: ScrapingService;

  constructor() {
    this.scrapingService = new ScrapingService();
  }

  async scrapeData(
    request: ScrapingAgentRequest
  ): Promise<ScrapingAgentResult> {
    try {
      const { companies, keywords, sources, maxResults = 50 } = request;

      logger.info(
        `Starting scraping for companies: ${companies.join(
          ", "
        )} with keywords: ${keywords.join(", ")}`
      );

      let allResults: ScrapingResult[] = [];

      // Scrape news sources
      if (sources.includes("news") || sources.length === 0) {
        const newsResults = await this.scrapingService.searchNews(
          companies,
          keywords
        );
        allResults = [...allResults, ...newsResults];
      }

      // Scrape company websites
      if (sources.includes("websites") || sources.length === 0) {
        const companyResults = await this.scrapingService.scrapeCompanyInfo(
          companies
        );
        allResults = [...allResults, ...companyResults];
      }

      // Scrape custom URLs if provided
      if (sources.some((source) => source.startsWith("http"))) {
        const customUrls = sources.filter((source) =>
          source.startsWith("http")
        );
        const customResults = await this.scrapingService.scrapeData({
          urls: customUrls,
          searchTerms: [...companies, ...keywords],
          maxPages: Math.min(customUrls.length, maxResults),
        });
        allResults = [...allResults, ...customResults];
      }

      // Limit results
      const limitedResults = allResults.slice(0, maxResults);

      // Normalize the data
      const normalizedData = await this.scrapingService.normalizeData(
        limitedResults
      );

      // Generate summary
      const summary = this.generateSummary(limitedResults);

      logger.info(
        `Scraping completed: ${summary.successfulScrapes}/${summary.totalSources} successful`
      );

      return {
        success: true,
        results: limitedResults,
        normalizedData,
        summary,
      };
    } catch (error) {
      logger.error("Scraping agent error:", error);
      return {
        success: false,
        results: [],
        normalizedData: [],
        summary: {
          totalSources: 0,
          successfulScrapes: 0,
          failedScrapes: 0,
          averageRelevanceScore: 0,
        },
      };
    }
  }

  async extractRelevantData(
    rawData: ScrapingResult[],
    searchTerms: string[]
  ): Promise<any[]> {
    try {
      return rawData
        .filter((result) => result.success)
        .map((result) => ({
          url: result.url,
          title: result.title,
          content: this.extractKeyPhrases(result.content, searchTerms),
          timestamp: result.timestamp,
          relevanceScore: this.calculateRelevance(result.content, searchTerms),
          metadata: result.metadata,
        }))
        .filter((item) => item.relevanceScore > 0.3) // Filter out low-relevance content
        .sort((a, b) => b.relevanceScore - a.relevanceScore); // Sort by relevance
    } catch (error) {
      logger.error("Extract relevant data error:", error);
      return [];
    }
  }

  private extractKeyPhrases(content: string, searchTerms: string[]): string {
    try {
      const sentences = content.split(/[.!?]+/);
      const relevantSentences = sentences.filter((sentence) => {
        const lowerSentence = sentence.toLowerCase();
        return searchTerms.some((term) =>
          lowerSentence.includes(term.toLowerCase())
        );
      });

      return relevantSentences.slice(0, 5).join(". ").trim() + ".";
    } catch (error) {
      logger.error("Key phrase extraction error:", error);
      return content.substring(0, 500) + "...";
    }
  }

  private calculateRelevance(content: string, searchTerms: string[]): number {
    try {
      const lowerContent = content.toLowerCase();
      let score = 0;

      for (const term of searchTerms) {
        const lowerTerm = term.toLowerCase();
        const occurrences = (
          lowerContent.match(new RegExp(lowerTerm, "g")) || []
        ).length;
        score += occurrences * 0.1;
      }

      // Bonus for multiple terms appearing together
      const proximityScore = this.calculateProximityScore(
        lowerContent,
        searchTerms
      );
      score += proximityScore;

      return Math.min(1.0, score);
    } catch (error) {
      logger.error("Relevance calculation error:", error);
      return 0.5;
    }
  }

  private calculateProximityScore(
    content: string,
    searchTerms: string[]
  ): number {
    let proximityScore = 0;
    const words = content.split(/\s+/);

    for (let i = 0; i < words.length - 1; i++) {
      for (let j = i + 1; j < Math.min(i + 10, words.length); j++) {
        const term1 = searchTerms.find((term) =>
          words[i].includes(term.toLowerCase())
        );
        const term2 = searchTerms.find((term) =>
          words[j].includes(term.toLowerCase())
        );

        if (term1 && term2 && term1 !== term2) {
          proximityScore += 0.2 / (j - i); // Closer terms get higher scores
        }
      }
    }

    return Math.min(0.5, proximityScore);
  }

  private generateSummary(results: ScrapingResult[]): {
    totalSources: number;
    successfulScrapes: number;
    failedScrapes: number;
    averageRelevanceScore: number;
  } {
    const totalSources = results.length;
    const sucessfulScrapes = results.filter((r) => r.success).length;
    const failedScrapes = totalSources - sucessfulScrapes;

    const relevanceScores = results
      .filter((r) => r.success)
      .map((r) => r.metadata?.relevanceScore || 0.5);

    const averageRelevanceScore =
      relevanceScores.length > 0
        ? relevanceScores.reduce((sum, score) => sum + score, 0) /
          relevanceScores.length
        : 0;

    return {
      totalSources,
      successfulScrapes: sucessfulScrapes,
      failedScrapes,
      averageRelevanceScore: Math.round(averageRelevanceScore * 100) / 100,
    };
  }

  // Helper method to validate URLs
  public isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Method to get recommended sources for specific industries
  public getRecommendedSources(industry?: string): string[] {
    const generalSources = ["news", "websites"];

    const industrySpecific: Record<string, string[]> = {
      financial: [
        "https://www.reuters.com/business/finance",
        "https://www.bloomberg.com/markets",
        "https://www.ft.com/markets",
      ],
      technology: [
        "https://techcrunch.com",
        "https://www.wired.com/business",
        "https://arstechnica.com/tech-policy",
      ],
      healthcare: [
        "https://www.fiercehealthcare.com",
        "https://www.modernhealthcare.com",
        "https://www.statnews.com",
      ],
    };

    return industry && industrySpecific[industry]
      ? [...generalSources, ...industrySpecific[industry]]
      : generalSources;
  }
}
