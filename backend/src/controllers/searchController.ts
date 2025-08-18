import { Request, Response } from "express";
import { SearchService, CreateSearchRequest } from "@services/searchService";
import { CartelAnalysisService } from "@services/cartelAnalysisService";
import { WebsiteValidationService } from "../services/websiteValidationService";
import { logger } from "@utils/logger";
import { AuthenticatedRequest } from "@middleware/auth";
import {
  validateCompanyData,
  validateSearchIndicators,
  validateDateRange,
} from "@utils/validators";

export class SearchController {
  private searchService: SearchService;
  private cartelAnalysisService: CartelAnalysisService;
  private websiteValidationService: WebsiteValidationService;

  constructor() {
    this.searchService = new SearchService();
    this.cartelAnalysisService = new CartelAnalysisService();
    this.websiteValidationService = new WebsiteValidationService();
  }

  // Helper method to get all available risk indicators from the analysis service
  private getAllAvailableIndicators(): any[] {
    // Complete CSV data with ALL indicators from your uploaded CSV file
    return [
      // Price Fixing Indicators
      {
        id: "price_fixing_identical",
        category: "Price Fixing",
        indicator: "Identical base prices or surcharges without justification",
        riskScore: 5,
        isSelected: true,
      },
      {
        id: "price_fixing_coordinated",
        category: "Price Fixing",
        indicator: "Coordinated or simultaneous price changes",
        riskScore: 5,
        isSelected: true,
      },
      {
        id: "price_fixing_future_intentions",
        category: "Price Fixing",
        indicator: "Exchange of future pricing intentions",
        riskScore: 4,
        isSelected: true,
      },
      {
        id: "price_fixing_converging_margins",
        category: "Price Fixing",
        indicator: "Converging profit margins despite cost differences",
        riskScore: 4,
        isSelected: true,
      },
      {
        id: "price_fixing_industry_norms",
        category: "Price Fixing",
        indicator: "Industry norms to maintain pricing",
        riskScore: 3,
        isSelected: true,
      },
      {
        id: "price_fixing_communications_enforcement",
        category: "Price Fixing",
        indicator: "Communications showing price enforcement",
        riskScore: 5,
        isSelected: true,
      },
      {
        id: "price_fixing_trade_associations",
        category: "Price Fixing",
        indicator: "Use of trade associations to discuss pricing",
        riskScore: 3,
        isSelected: true,
      },
      {
        id: "price_fixing_public_signaling",
        category: "Price Fixing",
        indicator: "Public signaling through media or trade press",
        riskScore: 3,
        isSelected: true,
      },
      {
        id: "price_fixing_cost_margin_exchange",
        category: "Price Fixing",
        indicator: "Exchange of cost or margin data between firms",
        riskScore: 4,
        isSelected: true,
      },
      {
        id: "price_fixing_suspicious_benchmarking",
        category: "Price Fixing",
        indicator: "Suspicious benchmarking or data sharing",
        riskScore: 3,
        isSelected: true,
      },
      {
        id: "price_fixing_pricing_audits",
        category: "Price Fixing",
        indicator: "Pricing audits coordinated by industry bodies",
        riskScore: 2,
        isSelected: true,
      },
      {
        id: "price_fixing_email_arrangements",
        category: "Price Fixing",
        indicator: "Emails referring to price fixing arrangements",
        riskScore: 5,
        isSelected: true,
      },

      // Market Allocation Indicators
      {
        id: "market_allocation_geographic",
        category: "Market Allocation",
        indicator: "Geographic market division agreements",
        riskScore: 5,
        isSelected: true,
      },
      {
        id: "market_allocation_customer",
        category: "Market Allocation",
        indicator: "Customer allocation schemes",
        riskScore: 5,
        isSelected: true,
      },
      {
        id: "market_allocation_product",
        category: "Market Allocation",
        indicator: "Product-based market division",
        riskScore: 4,
        isSelected: true,
      },
      {
        id: "market_allocation_quota",
        category: "Market Allocation",
        indicator: "Market share quota systems",
        riskScore: 4,
        isSelected: true,
      },
      {
        id: "market_allocation_exclusive_territories",
        category: "Market Allocation",
        indicator: "Exclusive territory arrangements",
        riskScore: 4,
        isSelected: true,
      },

      // Bid Rigging Indicators
      {
        id: "bid_rigging_cover_bidding",
        category: "Bid Rigging",
        indicator: "Cover bidding or complementary bidding",
        riskScore: 5,
        isSelected: true,
      },
      {
        id: "bid_rigging_bid_suppression",
        category: "Bid Rigging",
        indicator: "Bid suppression agreements",
        riskScore: 5,
        isSelected: true,
      },
      {
        id: "bid_rigging_bid_rotation",
        category: "Bid Rigging",
        indicator: "Bid rotation or turn-taking",
        riskScore: 5,
        isSelected: true,
      },
      {
        id: "bid_rigging_subcontracting",
        category: "Bid Rigging",
        indicator: "Suspicious subcontracting arrangements",
        riskScore: 4,
        isSelected: true,
      },
      {
        id: "bid_rigging_identical_bids",
        category: "Bid Rigging",
        indicator: "Identical or suspicious bid patterns",
        riskScore: 4,
        isSelected: true,
      },

      // Output Restriction Indicators
      {
        id: "output_restriction_production_limits",
        category: "Output Restriction",
        indicator: "Coordinated production limitations",
        riskScore: 4,
        isSelected: true,
      },
      {
        id: "output_restriction_capacity_coordination",
        category: "Output Restriction",
        indicator: "Capacity coordination agreements",
        riskScore: 4,
        isSelected: true,
      },
      {
        id: "output_restriction_supply_coordination",
        category: "Output Restriction",
        indicator: "Supply coordination mechanisms",
        riskScore: 3,
        isSelected: true,
      },
      {
        id: "output_restriction_inventory_coordination",
        category: "Output Restriction",
        indicator: "Coordinated inventory management",
        riskScore: 3,
        isSelected: true,
      },

      // Information Exchange Indicators
      {
        id: "info_exchange_pricing_data",
        category: "Information Exchange",
        indicator: "Exchange of pricing information",
        riskScore: 4,
        isSelected: true,
      },
      {
        id: "info_exchange_cost_data",
        category: "Information Exchange",
        indicator: "Exchange of cost information",
        riskScore: 4,
        isSelected: true,
      },
      {
        id: "info_exchange_customer_lists",
        category: "Information Exchange",
        indicator: "Sharing customer lists or data",
        riskScore: 4,
        isSelected: true,
      },
      {
        id: "info_exchange_sales_volumes",
        category: "Information Exchange",
        indicator: "Exchange of sales volume data",
        riskScore: 3,
        isSelected: true,
      },
      {
        id: "info_exchange_strategic_plans",
        category: "Information Exchange",
        indicator: "Sharing strategic business plans",
        riskScore: 4,
        isSelected: true,
      },

      // Digital/Modern Collusion Indicators
      {
        id: "digital_algorithmic_coordination",
        category: "Digital Collusion",
        indicator: "Algorithmic price coordination",
        riskScore: 5,
        isSelected: true,
      },
      {
        id: "digital_platform_coordination",
        category: "Digital Collusion",
        indicator: "Platform-mediated coordination",
        riskScore: 4,
        isSelected: true,
      },
      {
        id: "digital_data_sharing",
        category: "Digital Collusion",
        indicator: "Digital data sharing schemes",
        riskScore: 4,
        isSelected: true,
      },
      {
        id: "digital_ai_coordination",
        category: "Digital Collusion",
        indicator: "AI-mediated market coordination",
        riskScore: 4,
        isSelected: true,
      },

      // Communication Pattern Indicators
      {
        id: "communication_regular_meetings",
        category: "Communication Patterns",
        indicator: "Regular competitor meetings",
        riskScore: 3,
        isSelected: true,
      },
      {
        id: "communication_trade_associations",
        category: "Communication Patterns",
        indicator: "Trade association communications",
        riskScore: 2,
        isSelected: true,
      },
      {
        id: "communication_joint_ventures",
        category: "Communication Patterns",
        indicator: "Suspicious joint venture arrangements",
        riskScore: 3,
        isSelected: true,
      },
      {
        id: "communication_informal_contacts",
        category: "Communication Patterns",
        indicator: "Informal competitor contacts",
        riskScore: 2,
        isSelected: true,
      },
    ];
  }

  // Helper method to convert string indicator IDs to full indicator objects
  private processSelectedIndicators(selectedIndicators: any[]): any[] {
    // If already objects, return as is
    if (
      selectedIndicators.length > 0 &&
      typeof selectedIndicators[0] === "object"
    ) {
      return selectedIndicators;
    }

    // Get all available indicators
    const allIndicators = this.getAllAvailableIndicators();
    const indicatorMap = allIndicators.reduce((map, indicator) => {
      map[indicator.id] = indicator;
      return map;
    }, {} as any);

    // Convert string IDs to objects
    return selectedIndicators
      .filter((id) => typeof id === "string" && indicatorMap[id])
      .map((id) => indicatorMap[id]);
  }

  createSearch = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const {
        companies,
        filters,
        selectedIndicators,
        searchMode,
        description,
      } = req.body;

      // Validate exactly 2 companies
      if (!companies || companies.length !== 2) {
        res.status(400).json({
          success: false,
          message: "Exactly 2 companies are required for analysis",
        });
        return;
      }

      // Step 1: Validate websites exist
      logger.info("Step 1: Validating company websites...");

      const websiteValidationResults = await Promise.all(
        companies.map(async (company: any) => {
          const validation =
            await this.websiteValidationService.validateWebsite(
              company.website
            );
          return {
            company: company.name,
            website: company.website,
            isValid: validation.isValid,
            error: validation.error,
          };
        })
      );

      // Check if any website validation failed
      const invalidWebsites = websiteValidationResults.filter(
        (result) => !result.isValid
      );
      if (invalidWebsites.length > 0) {
        res.status(400).json({
          success: false,
          message: "Website validation failed",
          errors: invalidWebsites.map((result) => ({
            field: "companies",
            message: `Website ${result.website} for ${result.company} is not accessible: ${result.error}`,
          })),
        });
        return;
      }

      logger.info("✅ All websites validated successfully");

      // Process selected indicators (convert string IDs to objects if needed)
      const processedIndicators =
        this.processSelectedIndicators(selectedIndicators);

      // Validate processed indicators
      const indicatorsValidation =
        validateSearchIndicators(processedIndicators);
      if (!indicatorsValidation.isValid) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors:
            indicatorsValidation.errors?.map((error) => ({
              field: "selectedIndicators",
              message: error,
            })) || [],
        });
        return;
      }

      // Create search record first
      const result = await this.searchService.createSearch({
        userId: req.user.id,
        companies,
        filters,
        selectedIndicators: processedIndicators,
        searchMode: searchMode || "osint",
        description: description || "",
      });

      if (result.success && result.data) {
        // Return search ID immediately and start background processing
        res.status(201).json({
          success: true,
          data: {
            searchId: result.data._id,
            status: "processing",
            message:
              "Search created successfully. Analysis started in background.",
          },
        });

        // Start comprehensive analysis workflow in background
        this.startComprehensiveAnalysis(
          result.data._id,
          companies,
          processedIndicators,
          description || "",
          req.user.id
        ).catch((error) => {
          logger.error("Background analysis failed:", error);
          // Update search status to failed
          this.searchService.updateSearchStatus(
            result.data._id,
            "failed",
            error.message
          );
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message || "Failed to create search",
        });
      }
    } catch (error) {
      logger.error("Error in createSearch:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  // Comprehensive analysis workflow method
  private async startComprehensiveAnalysis(
    searchId: string,
    companies: any[],
    selectedIndicators: any[],
    description: string,
    userId: string
  ): Promise<void> {
    try {
      // Update status to scraping
      await this.searchService.updateSearchStatus(
        searchId,
        "scraping",
        "Starting website scraping..."
      );

      // Step 2: Scrape websites comprehensively
      logger.info("Step 2: Starting comprehensive website scraping...");
      const scrapingResults =
        await this.cartelAnalysisService.comprehensiveWebsiteScraping(
          companies
        );

      // Update status to formatting
      await this.searchService.updateSearchStatus(
        searchId,
        "formatting",
        "Formatting scraped data with AI..."
      );

      // Step 3: Format scraped data using OpenAI agent
      logger.info("Step 3: Formatting scraped data with OpenAI...");
      const formattedData =
        await this.cartelAnalysisService.formatScrapedDataWithAI(
          scrapingResults
        );

      // Update status to analyzing
      await this.searchService.updateSearchStatus(
        searchId,
        "analyzing",
        "Performing cartel risk analysis..."
      );

      // Step 4: Perform comprehensive cartel analysis
      logger.info("Step 4: Performing comprehensive cartel analysis...");
      const analysisResult =
        await this.cartelAnalysisService.performCartelAnalysis(
          formattedData,
          selectedIndicators,
          description,
          companies
        );

      // Update status to complete
      await this.searchService.updateSearchResults(searchId, analysisResult);
      await this.searchService.updateSearchStatus(
        searchId,
        "completed",
        "Analysis completed successfully"
      );

      logger.info(`✅ Comprehensive analysis completed for search ${searchId}`);
    } catch (error) {
      logger.error("Comprehensive analysis failed:", error);
      throw error;
    }
  }

  getUserSearches = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { page = 1, limit = 10, status } = req.query;

      const result = await this.searchService.getUserSearches(req.user.id, {
        page: Number(page),
        limit: Number(limit),
        status: status as string,
      });

      res.status(200).json(result);
    } catch (error) {
      logger.error("Get user searches controller error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch searches",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  getSearchById = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { searchId } = req.params;
      const result = await this.searchService.getSearchById(
        searchId,
        req.user.id
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      logger.error("Get search by ID controller error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch search",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  getRiskIndicators = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.searchService.getRiskIndicators();
      res.status(200).json(result);
    } catch (error) {
      logger.error("Get risk indicators controller error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch risk indicators",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  getSearchStatus = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { searchId } = req.params;
      const result = await this.searchService.getSearchStatus(
        searchId,
        req.user.id
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      logger.error("Get search status controller error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch search status",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  deleteSearch = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { searchId } = req.params;
      const result = await this.searchService.deleteSearch(
        searchId,
        req.user.id
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      logger.error("Delete search controller error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete search",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  generateAISummary = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { searchId } = req.params;
      const { indicatorCategory } = req.body;

      const result = await this.searchService.generateAISummary(
        searchId,
        req.user.id,
        indicatorCategory
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      logger.error("Generate AI summary controller error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate AI summary",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}
