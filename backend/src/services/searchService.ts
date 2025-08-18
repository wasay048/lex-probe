import { SearchRepository } from "@repositories/searchRepository";
import { UserRepository } from "@repositories/userRepository";
import {
  ISearch,
  ICompany,
  ISearchFilters,
  IRiskIndicator,
} from "@models/Search";
import { logger } from "@utils/logger";
import { emailService } from "@utils/email";
import { ServiceResponse } from "./authService";

export interface CreateSearchRequest {
  userId: string;
  companies: ICompany[];
  filters: ISearchFilters;
  selectedIndicators: IRiskIndicator[];
  searchMode: "osint" | "api" | "both";
  description?: string;
}

export interface SearchListOptions {
  page: number;
  limit: number;
  status?: string;
}

// Risk Indicators from the CSV data
const RISK_INDICATORS = [
  {
    category: "Price Fixing",
    indicator: "Identical base prices or surcharges without justification",
    riskScore: 5,
    description:
      "Firms agree to charge the same or nearly identical prices or surcharges, eliminating price competition.",
  },
  {
    category: "Price Fixing",
    indicator: "Coordinated or simultaneous price changes",
    riskScore: 5,
    description:
      "Competitors align price increases or reductions to signal and maintain a collusive pricing regime.",
  },
  {
    category: "Price Fixing",
    indicator: "Exchange of future pricing intentions",
    riskScore: 4,
    description:
      "Firms share non-public future pricing strategies to align decisions and avoid competitive pressure.",
  },
  {
    category: "Price Fixing",
    indicator: "Converging profit margins despite cost differences",
    riskScore: 4,
    description:
      "Despite different costs, firms maintain similar margins, often due to tacit collusion.",
  },
  {
    category: "Market Allocation",
    indicator: "Geographic market division",
    riskScore: 5,
    description:
      "Competitors agree to divide territories and avoid competing in each other's regions.",
  },
  {
    category: "Market Allocation",
    indicator: "Customer allocation agreements",
    riskScore: 5,
    description:
      "Firms divide customers among themselves to eliminate competition.",
  },
  {
    category: "Bid Rigging",
    indicator: "Identical bid amounts or patterns",
    riskScore: 5,
    description:
      "Bidders submit identical or suspiciously similar bids indicating coordination.",
  },
  {
    category: "Bid Rigging",
    indicator: "Rotating winning bidders",
    riskScore: 4,
    description:
      "Pattern of different companies winning bids in turns, suggesting pre-arrangement.",
  },
  {
    category: "Output Restriction",
    indicator: "Coordinated production limitations",
    riskScore: 4,
    description:
      "Competitors agree to limit production to maintain higher prices.",
  },
  {
    category: "Output Restriction",
    indicator: "Synchronized capacity reductions",
    riskScore: 4,
    description:
      "Multiple firms reduce capacity simultaneously without market justification.",
  },
  {
    category: "Information Exchange",
    indicator: "Sharing of sensitive commercial information",
    riskScore: 3,
    description:
      "Exchange of confidential pricing, cost, or strategy information between competitors.",
  },
  {
    category: "Information Exchange",
    indicator: "Joint market research initiatives",
    riskScore: 3,
    description:
      "Competitors collaborate on market intelligence that could facilitate coordination.",
  },
];

export class SearchService {
  private searchRepository: SearchRepository;
  private userRepository: UserRepository;

  constructor() {
    this.searchRepository = new SearchRepository();
    this.userRepository = new UserRepository();
  }

  async createSearch(request: CreateSearchRequest): Promise<ServiceResponse> {
    try {
      const { userId, companies, filters, selectedIndicators, searchMode } =
        request;

      // Verify user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      // Create search document
      const searchData = {
        userId,
        companies,
        filters,
        selectedIndicators,
        searchMode,
        status: "pending" as const,
      };

      const search = await this.searchRepository.create(searchData);

      // Start background search process
      this.processSearchAsync(search._id, user.email, user.firstName);

      return {
        success: true,
        message: "Search created successfully and processing started",
        data: search,
      };
    } catch (error) {
      logger.error("Create search service error:", error);
      throw error;
    }
  }

  async getUserSearches(
    userId: string,
    options: SearchListOptions
  ): Promise<ServiceResponse> {
    try {
      const { page, limit, status } = options;

      const filter: any = { userId };
      if (status && status !== "all") {
        filter.status = status;
      }

      const searches = await this.searchRepository.findWithPagination(
        filter,
        { page, limit },
        { createdAt: -1 }
      );

      return {
        success: true,
        message: "Searches fetched successfully",
        data: searches,
      };
    } catch (error) {
      logger.error("Get user searches service error:", error);
      throw error;
    }
  }

  async getSearchById(
    searchId: string,
    userId: string
  ): Promise<ServiceResponse> {
    try {
      const search = await this.searchRepository.findById(searchId);

      if (!search) {
        return {
          success: false,
          message: "Search not found",
        };
      }

      // Check if user owns this search
      if (search.userId !== userId) {
        return {
          success: false,
          message: "Unauthorized access to search",
        };
      }

      return {
        success: true,
        message: "Search fetched successfully",
        data: { search },
      };
    } catch (error) {
      logger.error("Get search by ID service error:", error);
      throw error;
    }
  }

  async deleteSearch(
    searchId: string,
    userId: string
  ): Promise<ServiceResponse> {
    try {
      const search = await this.searchRepository.findById(searchId);

      if (!search) {
        return {
          success: false,
          message: "Search not found",
        };
      }

      // Check if user owns this search
      if (search.userId !== userId) {
        return {
          success: false,
          message: "Unauthorized access to search",
        };
      }

      await this.searchRepository.delete(searchId);

      return {
        success: true,
        message: "Search deleted successfully",
      };
    } catch (error) {
      logger.error("Delete search service error:", error);
      throw error;
    }
  }

  async getSearchStatus(
    searchId: string,
    userId: string
  ): Promise<ServiceResponse> {
    try {
      const search = await this.searchRepository.findById(searchId);

      if (!search) {
        return {
          success: false,
          message: "Search not found",
        };
      }

      // Check if user owns this search
      if (search.userId !== userId) {
        return {
          success: false,
          message: "Unauthorized access to search",
        };
      }

      return {
        success: true,
        message: "Search status fetched successfully",
        data: {
          searchId: search._id,
          status: search.status,
          overallRiskScore: search.overallRiskScore,
          executionTime: search.executionTime,
          createdAt: search.createdAt,
          updatedAt: search.updatedAt,
        },
      };
    } catch (error) {
      logger.error("Get search status service error:", error);
      throw error;
    }
  }

  async getRiskIndicators(): Promise<ServiceResponse> {
    try {
      const categorizedIndicators = RISK_INDICATORS.reduce((acc, indicator) => {
        if (!acc[indicator.category]) {
          acc[indicator.category] = [];
        }
        acc[indicator.category].push(indicator);
        return acc;
      }, {} as Record<string, typeof RISK_INDICATORS>);

      return {
        success: true,
        message: "Risk indicators fetched successfully",
        data: {
          indicators: RISK_INDICATORS,
          categorized: categorizedIndicators,
          categories: Object.keys(categorizedIndicators),
        },
      };
    } catch (error) {
      logger.error("Get risk indicators service error:", error);
      throw error;
    }
  }

  async generateAISummary(
    searchId: string,
    userId: string,
    indicatorCategory?: string
  ): Promise<ServiceResponse> {
    try {
      const search = await this.searchRepository.findById(searchId);

      if (!search) {
        return {
          success: false,
          message: "Search not found",
        };
      }

      // Check if user owns this search
      if (search.userId !== userId) {
        return {
          success: false,
          message: "Unauthorized access to search",
        };
      }

      if (search.status !== "completed") {
        return {
          success: false,
          message: "Search must be completed before generating AI summary",
        };
      }

      if (!search.analysisResults) {
        return {
          success: false,
          message: "No analysis results available for AI summary generation",
        };
      }

      // Generate AI summary from real analysis results
      const realSummary = this.generateRealAISummary(search, indicatorCategory);

      return {
        success: true,
        message: "AI summary generated successfully",
        data: { summary: realSummary },
      };
    } catch (error) {
      logger.error("Generate AI summary service error:", error);
      throw error;
    }
  }

  // Note: This method is now deprecated in favor of comprehensive analysis workflow
  // Real processing is handled by SearchController.startComprehensiveAnalysis()
  private async processSearchAsync(
    searchId: string,
    userEmail: string,
    firstName: string
  ): Promise<void> {
    // This method is no longer used - comprehensive analysis is handled by SearchController
    logger.warn(
      `processSearchAsync called for ${searchId} - this method is deprecated`
    );
    logger.info(
      `Search ${searchId} will be processed by comprehensive analysis workflow`
    );
  }

  // Real AI summary generation from actual analysis results
  private generateRealAISummary(search: ISearch, category?: string): string {
    const companyNames = search.companies.map((c) => c.name).join(" and ");

    if (!search.analysisResults) {
      return `Analysis for ${companyNames} is not yet available. Please wait for the comprehensive analysis to complete.`;
    }

    const analysisResults = search.analysisResults;

    if (category) {
      // Filter indicators by category from real results
      const categoryIndicators =
        analysisResults.companiesAnalysis?.reduce(
          (acc: any[], companyAnalysis: any) => {
            const companyIndicators = Object.entries(
              companyAnalysis.indicators || {}
            )
              .filter(([key, indicator]: [string, any]) =>
                key
                  .toLowerCase()
                  .includes(category.toLowerCase().replace(/\s+/g, "_"))
              )
              .map(([key, indicator]: [string, any]) => ({
                key,
                ...indicator,
              }));
            return acc.concat(companyIndicators);
          },
          []
        ) || [];

      if (categoryIndicators.length === 0) {
        return `No specific ${category} indicators were detected for ${companyNames} in the current analysis.`;
      }

      const detectedIndicators = categoryIndicators.filter(
        (ind: any) => ind.detected
      );
      const avgConfidence =
        detectedIndicators.length > 0
          ? detectedIndicators.reduce(
              (sum: number, ind: any) => sum + ind.confidence,
              0
            ) / detectedIndicators.length
          : 0;

      return `Based on the analysis of ${category} indicators for ${companyNames}, ${
        detectedIndicators.length
      } out of ${
        categoryIndicators.length
      } indicators were detected with an average confidence of ${(
        avgConfidence * 100
      ).toFixed(1)}%. ${
        detectedIndicators.length > 0
          ? `Key findings include: ${detectedIndicators
              .slice(0, 3)
              .map((ind: any) => ind.details)
              .join("; ")}.`
          : "No significant risk patterns were identified in this category."
      }`;
    }

    // Overall summary from real analysis
    const overallRisk = analysisResults.overallRiskScore || 0;
    const cartelProbability = analysisResults.cartelProbability || 0;
    const keyFindings = analysisResults.keyFindings || [];
    const alertLevel = analysisResults.alertLevel || "LOW";

    return `Comprehensive cartel risk analysis for ${companyNames} reveals an overall risk score of ${overallRisk.toFixed(
      1
    )}/10 with a cartel probability of ${(cartelProbability * 100).toFixed(
      1
    )}%. Alert level: ${alertLevel}. ${
      keyFindings.length > 0
        ? `Key findings include: ${keyFindings.slice(0, 3).join("; ")}.`
        : "Analysis completed with standard risk patterns observed."
    } ${
      analysisResults.recommendations?.length > 0
        ? `Recommendations: ${analysisResults.recommendations
            .slice(0, 2)
            .join("; ")}.`
        : ""
    }`;
  }

  // Methods for CartelAnalysisService integration
  async updateSearchStatus(
    searchId: string,
    status: string,
    errorDetails?: any
  ): Promise<void> {
    try {
      await this.searchRepository.updateSearchStatus(
        searchId,
        status,
        errorDetails
      );
      logger.info(`Search ${searchId} status updated to: ${status}`);
    } catch (error) {
      logger.error(`Failed to update search status for ${searchId}:`, error);
      throw error;
    }
  }

  async updateSearchWithResults(
    searchId: string,
    analysisResults: any
  ): Promise<void> {
    try {
      await this.searchRepository.updateSearchWithResults(
        searchId,
        analysisResults
      );
      logger.info(`Search ${searchId} updated with analysis results`);
    } catch (error) {
      logger.error(`Failed to update search results for ${searchId}:`, error);
      throw error;
    }
  }

  // Method for updating search with results (alias for compatibility)
  async updateSearchResults(searchId: string, results: any): Promise<void> {
    return this.updateSearchWithResults(searchId, results);
  }
}
