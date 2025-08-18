import {
  AIService,
  AIAnalysisResult,
  AISummaryRequest,
} from "@services/aiService";
import { logger } from "@utils/logger";

export interface AIAgentRequest {
  searchResults: any[];
  companies: string[];
  indicatorCategory?: string;
  analysisType:
    | "summary"
    | "risk_analysis"
    | "pattern_detection"
    | "recommendation";
}

export interface AIAgentResult {
  success: boolean;
  analysisType: string;
  result: string | AIAnalysisResult;
  confidence: number;
  processingTime: number;
  metadata: {
    companiesAnalyzed: string[];
    indicatorsProcessed: number;
    dataPointsAnalyzed: number;
  };
}

export class AIAgent {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  async generateSummary(request: AIAgentRequest): Promise<AIAgentResult> {
    const startTime = Date.now();

    try {
      const { searchResults, companies, indicatorCategory } = request;

      logger.info(
        `Generating AI summary for ${companies.length} companies with ${searchResults.length} results`
      );

      const summaryRequest: AISummaryRequest = {
        searchResults,
        companies,
        indicatorCategory,
      };

      const summary = await this.aiService.generateSummary(summaryRequest);
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        analysisType: "summary",
        result: summary,
        confidence: this.calculateSummaryConfidence(searchResults),
        processingTime,
        metadata: {
          companiesAnalyzed: companies,
          indicatorsProcessed: searchResults.length,
          dataPointsAnalyzed: this.countDataPoints(searchResults),
        },
      };
    } catch (error) {
      logger.error("AI summary generation error:", error);
      return this.createErrorResponse(
        "summary",
        Date.now() - startTime,
        request
      );
    }
  }

  async analyzeData(request: AIAgentRequest): Promise<AIAgentResult> {
    const startTime = Date.now();

    try {
      const { searchResults, companies } = request;

      logger.info(
        `Performing AI data analysis for ${companies.length} companies`
      );

      const analysisData = {
        results: searchResults,
        companies,
        metadata: {
          totalResults: searchResults.length,
          categories: [...new Set(searchResults.map((r) => r.category))],
          averageConfidence: this.calculateAverageConfidence(searchResults),
        },
      };

      const analysis = await this.aiService.analyzeData(analysisData);
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        analysisType: "risk_analysis",
        result: analysis,
        confidence: analysis.confidence,
        processingTime,
        metadata: {
          companiesAnalyzed: companies,
          indicatorsProcessed: searchResults.length,
          dataPointsAnalyzed: this.countDataPoints(searchResults),
        },
      };
    } catch (error) {
      logger.error("AI data analysis error:", error);
      return this.createErrorResponse(
        "risk_analysis",
        Date.now() - startTime,
        request
      );
    }
  }

  async detectPatterns(request: AIAgentRequest): Promise<AIAgentResult> {
    const startTime = Date.now();

    try {
      const { searchResults, companies } = request;

      logger.info(`Detecting patterns for ${companies.length} companies`);

      // Pattern detection logic
      const patterns = this.identifyPatterns(searchResults, companies);
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        analysisType: "pattern_detection",
        result: patterns,
        confidence: this.calculatePatternConfidence(patterns),
        processingTime,
        metadata: {
          companiesAnalyzed: companies,
          indicatorsProcessed: searchResults.length,
          dataPointsAnalyzed: this.countDataPoints(searchResults),
        },
      };
    } catch (error) {
      logger.error("AI pattern detection error:", error);
      return this.createErrorResponse(
        "pattern_detection",
        Date.now() - startTime,
        request
      );
    }
  }

  async generateRecommendations(
    request: AIAgentRequest
  ): Promise<AIAgentResult> {
    const startTime = Date.now();

    try {
      const { searchResults, companies } = request;

      logger.info(
        `Generating recommendations for ${companies.length} companies`
      );

      const recommendations = this.createRecommendations(
        searchResults,
        companies
      );
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        analysisType: "recommendation",
        result: recommendations,
        confidence: 0.8, // Static confidence for recommendations
        processingTime,
        metadata: {
          companiesAnalyzed: companies,
          indicatorsProcessed: searchResults.length,
          dataPointsAnalyzed: this.countDataPoints(searchResults),
        },
      };
    } catch (error) {
      logger.error("AI recommendation generation error:", error);
      return this.createErrorResponse(
        "recommendation",
        Date.now() - startTime,
        request
      );
    }
  }

  async fetchRiskIndicators(): Promise<any> {
    try {
      return await this.aiService.getRiskIndicators();
    } catch (error) {
      logger.error("Fetch risk indicators error:", error);
      throw error;
    }
  }

  // Main orchestrator method
  async processRequest(request: AIAgentRequest): Promise<AIAgentResult> {
    switch (request.analysisType) {
      case "summary":
        return await this.generateSummary(request);
      case "risk_analysis":
        return await this.analyzeData(request);
      case "pattern_detection":
        return await this.detectPatterns(request);
      case "recommendation":
        return await this.generateRecommendations(request);
      default:
        throw new Error(`Unknown analysis type: ${request.analysisType}`);
    }
  }

  private identifyPatterns(searchResults: any[], companies: string[]): any {
    const patterns = {
      temporalPatterns: this.identifyTemporalPatterns(searchResults),
      behavioralPatterns: this.identifyBehavioralPatterns(
        searchResults,
        companies
      ),
      communicationPatterns: this.identifyCommunicationPatterns(searchResults),
      pricingPatterns: this.identifyPricingPatterns(searchResults),
    };

    return {
      patterns,
      summary: this.summarizePatterns(patterns),
      riskImplications: this.assessPatternRisk(patterns),
    };
  }

  private identifyTemporalPatterns(searchResults: any[]): any {
    // Analyze timing of events/evidence
    const timestamps = searchResults
      .flatMap(
        (result) =>
          result.evidence?.map((e: any) => new Date(e.timestamp)) || []
      )
      .sort((a, b) => a.getTime() - b.getTime());

    const timeGaps = [];
    for (let i = 1; i < timestamps.length; i++) {
      const gap = timestamps[i].getTime() - timestamps[i - 1].getTime();
      timeGaps.push(gap);
    }

    return {
      totalEvents: timestamps.length,
      timeSpan:
        timestamps.length > 0
          ? timestamps[timestamps.length - 1].getTime() -
            timestamps[0].getTime()
          : 0,
      averageGap:
        timeGaps.length > 0
          ? timeGaps.reduce((sum, gap) => sum + gap, 0) / timeGaps.length
          : 0,
      suspiciousSimultaneity: timeGaps.filter(
        (gap) => gap < 24 * 60 * 60 * 1000
      ).length, // Same day events
    };
  }

  private identifyBehavioralPatterns(
    searchResults: any[],
    companies: string[]
  ): any {
    const behaviors = {
      coordinatedActions: 0,
      parallelBehavior: 0,
      informationSharing: 0,
    };

    searchResults.forEach((result) => {
      const content = result.summary?.toLowerCase() || "";

      if (content.includes("coordinated") || content.includes("simultaneous")) {
        behaviors.coordinatedActions++;
      }
      if (content.includes("parallel") || content.includes("similar")) {
        behaviors.parallelBehavior++;
      }
      if (
        content.includes("information") ||
        content.includes("communication")
      ) {
        behaviors.informationSharing++;
      }
    });

    return behaviors;
  }

  private identifyCommunicationPatterns(searchResults: any[]): any {
    return {
      directCommunication: searchResults.filter(
        (r) => r.category === "Information Exchange"
      ).length,
      publicStatements: searchResults.filter((r) =>
        r.evidence?.some((e: any) => e.source?.includes("news"))
      ).length,
      regulatoryFilings: searchResults.filter((r) =>
        r.evidence?.some((e: any) => e.source?.includes("regulatory"))
      ).length,
    };
  }

  private identifyPricingPatterns(searchResults: any[]): any {
    const pricingResults = searchResults.filter(
      (r) =>
        r.category === "Price Fixing" ||
        r.indicator.toLowerCase().includes("price")
    );

    return {
      priceFixingIndicators: pricingResults.length,
      averagePriceRiskScore:
        pricingResults.length > 0
          ? pricingResults.reduce((sum, r) => sum + r.riskScore, 0) /
            pricingResults.length
          : 0,
      highRiskPricing: pricingResults.filter((r) => r.riskScore >= 4).length,
    };
  }

  private summarizePatterns(patterns: any): string {
    const summary = [];

    if (patterns.temporalPatterns.suspiciousSimultaneity > 2) {
      summary.push(
        `High temporal correlation detected (${patterns.temporalPatterns.suspiciousSimultaneity} same-day events)`
      );
    }

    if (patterns.behavioralPatterns.coordinatedActions > 0) {
      summary.push(
        `${patterns.behavioralPatterns.coordinatedActions} instances of coordinated behavior identified`
      );
    }

    if (patterns.pricingPatterns.highRiskPricing > 0) {
      summary.push(
        `${patterns.pricingPatterns.highRiskPricing} high-risk pricing indicators found`
      );
    }

    return summary.length > 0
      ? summary.join(". ")
      : "No significant patterns detected.";
  }

  private assessPatternRisk(patterns: any): string {
    let riskScore = 0;

    // Temporal risk
    if (patterns.temporalPatterns.suspiciousSimultaneity > 2) riskScore += 2;

    // Behavioral risk
    if (patterns.behavioralPatterns.coordinatedActions > 1) riskScore += 2;
    if (patterns.behavioralPatterns.informationSharing > 1) riskScore += 1;

    // Pricing risk
    if (patterns.pricingPatterns.highRiskPricing > 0) riskScore += 3;

    if (riskScore >= 5) return "HIGH - Multiple concerning patterns detected";
    if (riskScore >= 3) return "MEDIUM - Some patterns warrant attention";
    return "LOW - No significant risk patterns identified";
  }

  private createRecommendations(
    searchResults: any[],
    companies: string[]
  ): any {
    const recommendations = {
      immediate: [] as string[],
      shortTerm: [] as string[],
      longTerm: [] as string[],
      regulatory: [] as string[],
    };

    const averageRiskScore =
      searchResults.reduce((sum, r) => sum + r.riskScore, 0) /
      searchResults.length;
    const highRiskResults = searchResults.filter((r) => r.riskScore >= 4);

    // Immediate recommendations
    if (highRiskResults.length > 2) {
      recommendations.immediate.push(
        "Conduct detailed investigation of high-risk indicators"
      );
      recommendations.immediate.push(
        "Document all evidence for potential regulatory action"
      );
    }

    if (averageRiskScore >= 3.5) {
      recommendations.immediate.push(
        "Consider engaging regulatory authorities"
      );
      recommendations.regulatory.push(
        "Prepare preliminary report for competition authority"
      );
    }

    // Short-term recommendations
    recommendations.shortTerm.push(
      "Expand monitoring to include additional data sources"
    );
    recommendations.shortTerm.push("Implement regular re-assessment schedule");

    if (searchResults.some((r) => r.category === "Information Exchange")) {
      recommendations.shortTerm.push(
        "Investigate communication channels between companies"
      );
    }

    // Long-term recommendations
    recommendations.longTerm.push(
      "Develop industry-specific monitoring protocols"
    );
    recommendations.longTerm.push(
      "Establish baseline metrics for future comparisons"
    );

    return {
      recommendations,
      priority:
        averageRiskScore >= 3.5
          ? "HIGH"
          : averageRiskScore >= 2.5
          ? "MEDIUM"
          : "LOW",
      timeline: this.generateTimeline(recommendations),
      expectedOutcomes: this.generateExpectedOutcomes(averageRiskScore),
    };
  }

  private generateTimeline(recommendations: any): any {
    return {
      immediate: "0-7 days",
      shortTerm: "1-4 weeks",
      longTerm: "1-6 months",
      regulatory: "As required by findings",
    };
  }

  private generateExpectedOutcomes(averageRiskScore: number): string[] {
    const outcomes = ["Enhanced understanding of competitive dynamics"];

    if (averageRiskScore >= 3.5) {
      outcomes.push("Potential regulatory investigation");
      outcomes.push("Legal compliance verification");
    } else if (averageRiskScore >= 2.5) {
      outcomes.push("Improved monitoring capabilities");
      outcomes.push("Risk mitigation strategies");
    } else {
      outcomes.push("Continued market surveillance");
      outcomes.push("Baseline establishment for future monitoring");
    }

    return outcomes;
  }

  private calculateSummaryConfidence(searchResults: any[]): number {
    if (searchResults.length === 0) return 0;

    const avgConfidence =
      searchResults.reduce((sum, r) => sum + (r.confidence || 0.5), 0) /
      searchResults.length;
    const dataQuality = Math.min(1, searchResults.length / 10); // More results = higher confidence

    return Math.min(0.95, (avgConfidence + dataQuality) / 2);
  }

  private calculateAverageConfidence(searchResults: any[]): number {
    if (searchResults.length === 0) return 0;
    return (
      searchResults.reduce((sum, r) => sum + (r.confidence || 0.5), 0) /
      searchResults.length
    );
  }

  private calculatePatternConfidence(patterns: any): number {
    // Simple confidence calculation based on pattern strength
    let confidence = 0.3; // Base confidence

    if (patterns.patterns.temporalPatterns.suspiciousSimultaneity > 0)
      confidence += 0.2;
    if (patterns.patterns.behavioralPatterns.coordinatedActions > 0)
      confidence += 0.2;
    if (patterns.patterns.pricingPatterns.highRiskPricing > 0)
      confidence += 0.3;

    return Math.min(0.9, confidence);
  }

  private countDataPoints(searchResults: any[]): number {
    return searchResults.reduce((total, result) => {
      return total + (result.evidence?.length || 0) + 1; // +1 for the result itself
    }, 0);
  }

  private createErrorResponse(
    analysisType: string,
    processingTime: number,
    request: AIAgentRequest
  ): AIAgentResult {
    return {
      success: false,
      analysisType,
      result: "Analysis failed due to processing error",
      confidence: 0,
      processingTime,
      metadata: {
        companiesAnalyzed: request.companies,
        indicatorsProcessed: 0,
        dataPointsAnalyzed: 0,
      },
    };
  }
}
