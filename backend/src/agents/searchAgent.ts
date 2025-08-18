import { SearchService } from "@services/searchService";
import { ScrapingService } from "@services/scrapingService";
import { AIService } from "@services/aiService";
import { SearchRepository } from "@repositories/searchRepository";
import {
  ISearch,
  ICompany,
  ISearchFilters,
  IRiskIndicator,
} from "@models/Search";
import { logger } from "@utils/logger";

export interface SearchAgentRequest {
  searchId: string;
  companies: ICompany[];
  filters: ISearchFilters;
  selectedIndicators: IRiskIndicator[];
  searchMode: "osint" | "api" | "both";
}

export interface SearchAgentResult {
  searchId: string;
  results: any[];
  overallRiskScore: number;
  executionTime: number;
  status: "completed" | "failed";
  errorMessage?: string;
}

export class SearchAgent {
  private searchService: SearchService;
  private scrapingService: ScrapingService;
  private aiService: AIService;
  private searchRepository: SearchRepository;

  constructor() {
    this.searchRepository = new SearchRepository();
    this.searchService = new SearchService();
    this.scrapingService = new ScrapingService();
    this.aiService = new AIService();
  }

  async executeSearch(request: SearchAgentRequest): Promise<SearchAgentResult> {
    const startTime = Date.now();

    try {
      const { searchId, companies, filters, selectedIndicators, searchMode } =
        request;

      // Validate input
      if (companies.length < 2) {
        throw new Error(
          "At least two companies must be provided for comparison."
        );
      }

      logger.info(
        `Starting search execution for ${companies.length} companies using ${searchMode} mode`
      );

      // Update search status to in-progress
      await this.searchRepository.updateStatus(searchId, "in-progress");

      let results: any[] = [];

      // Execute different search strategies based on mode
      switch (searchMode) {
        case "osint":
          results = await this.executeOSINTSearch(
            companies,
            selectedIndicators
          );
          break;
        case "api":
          results = await this.executeAPISearch(companies, selectedIndicators);
          break;
        case "both":
          const osintResults = await this.executeOSINTSearch(
            companies,
            selectedIndicators
          );
          const apiResults = await this.executeAPISearch(
            companies,
            selectedIndicators
          );
          results = this.mergeResults(osintResults, apiResults);
          break;
        default:
          throw new Error(`Invalid search mode: ${searchMode}`);
      }

      // Filter results based on date range
      if (filters.dateRange) {
        results = this.filterByDateRange(results, filters.dateRange);
      }

      // Calculate overall risk score
      const overallRiskScore = this.calculateOverallRiskScore(results);

      const executionTime = Date.now() - startTime;

      // Update search with results
      await this.searchRepository.updateResults(searchId, {
        status: "completed",
        results,
        overallRiskScore,
        executionTime,
      });

      logger.info(
        `Search completed for ${searchId} in ${executionTime}ms with risk score ${overallRiskScore}`
      );

      return {
        searchId,
        results,
        overallRiskScore,
        executionTime,
        status: "completed",
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      logger.error(`Search execution failed for ${request.searchId}:`, error);

      // Update search status to failed
      await this.searchRepository.updateStatus(request.searchId, "failed");
      await this.searchRepository.update(request.searchId, { errorMessage });

      return {
        searchId: request.searchId,
        results: [],
        overallRiskScore: 0,
        executionTime,
        status: "failed",
        errorMessage,
      };
    }
  }

  private async executeOSINTSearch(
    companies: ICompany[],
    indicators: IRiskIndicator[]
  ): Promise<any[]> {
    try {
      const companyNames = companies.map((c) => c.name);
      const results: any[] = [];

      // Search for news articles and public information
      const newsResults = await this.scrapingService.searchNews(companyNames, [
        "price",
        "cartel",
        "antitrust",
        "competition",
        "bid",
        "market",
      ]);

      // Scrape company websites for pricing information
      const companyInfoResults = await this.scrapingService.scrapeCompanyInfo(
        companyNames
      );

      // Analyze scraped content for risk indicators
      for (const indicator of indicators) {
        const indicatorResults = await this.analyzeIndicator(
          indicator,
          [...newsResults, ...companyInfoResults],
          companyNames
        );
        results.push(...indicatorResults);
      }

      return results;
    } catch (error) {
      logger.error("OSINT search error:", error);
      return [];
    }
  }

  private async executeAPISearch(
    companies: ICompany[],
    indicators: IRiskIndicator[]
  ): Promise<any[]> {
    try {
      // For MVP, return mock API results
      // In production, this would call actual APIs like regulatory databases, financial APIs, etc.

      const results: any[] = [];
      const companyNames = companies.map((c) => c.name);

      for (const indicator of indicators) {
        const mockResult = {
          indicator: indicator.indicator,
          category: indicator.category,
          riskScore: Math.floor(Math.random() * 5) + 1,
          confidence: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
          evidence: [
            {
              source: "Regulatory Database API",
              url: "https://api.regulatory-db.com/search",
              content: `API data related to ${
                indicator.indicator
              } for companies: ${companyNames.join(", ")}`,
              timestamp: new Date(),
              relevanceScore: Math.random() * 0.5 + 0.5,
            },
          ],
          summary: `API analysis for ${indicator.indicator} shows ${
            Math.random() > 0.5 ? "potential" : "limited"
          } evidence of coordination.`,
        };

        results.push(mockResult);
      }

      return results;
    } catch (error) {
      logger.error("API search error:", error);
      return [];
    }
  }

  private async analyzeIndicator(
    indicator: IRiskIndicator,
    scrapingResults: any[],
    companyNames: string[]
  ): Promise<any[]> {
    try {
      const relevantResults = scrapingResults.filter(
        (result) => result.success && result.content.length > 100
      );

      if (relevantResults.length === 0) {
        return [];
      }

      // Use AI service to analyze the content for this specific indicator
      const analysis = await this.aiService.analyzeData({
        indicator,
        content: relevantResults.map((r) => r.content).join("\n"),
        companies: companyNames,
      });

      // Calculate risk score based on content analysis
      const riskScore = this.calculateIndicatorRiskScore(
        indicator,
        relevantResults,
        companyNames
      );
      const confidence = Math.min(0.9, relevantResults.length * 0.1 + 0.3);

      return [
        {
          indicator: indicator.indicator,
          category: indicator.category,
          riskScore,
          confidence,
          evidence: this.extractEvidence(relevantResults, indicator),
          summary: analysis.insights.join(" "),
          analysisDetails: analysis,
        },
      ];
    } catch (error) {
      logger.error(`Error analyzing indicator ${indicator.indicator}:`, error);
      return [];
    }
  }

  private calculateIndicatorRiskScore(
    indicator: IRiskIndicator,
    results: any[],
    companyNames: string[]
  ): number {
    // Simple heuristic-based risk scoring for MVP
    let score = 0;

    const combinedContent = results
      .map((r) => r.content.toLowerCase())
      .join(" ");

    // Check for key risk phrases
    const riskPhrases = [
      "price fixing",
      "cartel",
      "coordination",
      "collusion",
      "antitrust",
      "identical prices",
      "simultaneous",
      "agreement",
      "bid rigging",
    ];

    const phraseMatches = riskPhrases.filter((phrase) =>
      combinedContent.includes(phrase)
    ).length;

    // Check if multiple companies mentioned together
    const companyMentions = companyNames.filter((name) =>
      combinedContent.includes(name.toLowerCase())
    ).length;

    // Calculate base score
    score = Math.min(5, phraseMatches * 0.8 + companyMentions * 0.3);

    // Adjust based on indicator type
    if (
      indicator.category === "Price Fixing" &&
      combinedContent.includes("price")
    ) {
      score += 0.5;
    }
    if (
      indicator.category === "Bid Rigging" &&
      combinedContent.includes("bid")
    ) {
      score += 0.5;
    }

    return Math.min(5, Math.max(1, Math.round(score * 10) / 10));
  }

  private extractEvidence(results: any[], indicator: IRiskIndicator): any[] {
    return results
      .filter((result) => result.success)
      .slice(0, 5) // Limit to top 5 results
      .map((result) => ({
        source: "Web Scraping",
        url: result.url,
        content: result.content.substring(0, 500) + "...",
        timestamp: result.timestamp,
        relevanceScore: result.relevanceScore || 0.5,
      }));
  }

  private mergeResults(osintResults: any[], apiResults: any[]): any[] {
    const merged = [...osintResults];

    // Add API results that don't duplicate OSINT findings
    for (const apiResult of apiResults) {
      const existingResult = merged.find(
        (r) =>
          r.indicator === apiResult.indicator &&
          r.category === apiResult.category
      );

      if (existingResult) {
        // Merge evidence and take higher risk score
        existingResult.evidence = [
          ...existingResult.evidence,
          ...apiResult.evidence,
        ];
        existingResult.riskScore = Math.max(
          existingResult.riskScore,
          apiResult.riskScore
        );
        existingResult.confidence = Math.max(
          existingResult.confidence,
          apiResult.confidence
        );
      } else {
        merged.push(apiResult);
      }
    }

    return merged;
  }

  private filterByDateRange(results: any[], dateRange: any): any[] {
    if (!dateRange || (!dateRange.from && !dateRange.to)) {
      return results;
    }

    const fromDate = dateRange.from
      ? new Date(dateRange.from)
      : new Date("1900-01-01");
    const toDate = dateRange.to ? new Date(dateRange.to) : new Date();

    return results
      .map((result) => ({
        ...result,
        evidence:
          result.evidence?.filter((evidence: any) => {
            const evidenceDate = new Date(evidence.timestamp);
            return evidenceDate >= fromDate && evidenceDate <= toDate;
          }) || [],
      }))
      .filter((result) => result.evidence.length > 0);
  }

  private calculateOverallRiskScore(results: any[]): number {
    if (results.length === 0) return 0;

    const weightedScore = results.reduce((sum, result) => {
      return sum + result.riskScore * result.confidence;
    }, 0);

    const totalWeight = results.reduce(
      (sum, result) => sum + result.confidence,
      0
    );

    return totalWeight > 0
      ? Math.round((weightedScore / totalWeight) * 100) / 100
      : 0;
  }

  // Public method to validate search parameters
  public validateSearchParameters(
    companies: ICompany[],
    indicators: IRiskIndicator[]
  ): boolean {
    if (companies.length < 2) {
      throw new Error(
        "At least two companies required for cartel detection analysis"
      );
    }

    if (indicators.length === 0) {
      throw new Error("At least one risk indicator must be selected");
    }

    // Validate company data
    for (const company of companies) {
      if (!company.name || company.name.trim().length === 0) {
        throw new Error("All companies must have valid names");
      }
    }

    return true;
  }
}
