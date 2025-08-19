import OpenAI from "openai";
import { ScrapingService } from "./scrapingService";
import { SearchService } from "./searchService";
import { serpService } from "./serpService";
import { logger } from "@utils/logger";
import { environment } from "@config/environment";

interface CompanyData {
  name: string;
  website?: string;
  industry?: string;
  location?: string;
}

interface AnalysisResult {
  companyName: string;
  riskScore: number;
  indicators: {
    [key: string]: {
      detected: boolean;
      confidence: number;
      evidence: string[];
      details: string;
      riskContribution: number;
      openSourceEvidence?: {
        webResults: any[];
        newsArticles: any[];
        pricingData?: any[];
      };
    };
  };
  summary: string;
  recommendations: string[];
  marketAnalysis?: {
    marketShare?: number;
    competitivePosition?: string;
    pricingStrategy?: string;
    recentDevelopments?: string[];
  };
}

interface CartelRiskAssessment {
  overallRiskScore: number;
  cartelProbability: number;
  keyFindings: string[];
  companiesAnalysis: AnalysisResult[];
  crossCompanyIndicators: {
    priceCorrelation: number;
    marketDivision: number;
    communicationPatterns: number;
    bidCoordination: number;
  };
  recommendations: string[];
  alertLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  results?: any[]; // Frontend-compatible search results
  analysisResults?: any; // Full comprehensive analysis
  comprehensiveAnalysis: {
    marketAnalysis: {
      totalMarketSize?: string;
      marketConcentration?: string;
      competitiveIntensity?: string;
      barrierToEntry?: string;
      regulatoryEnvironment?: string;
    };
    pricingAnalysis: {
      pricingTables?: Array<{
        company: string;
        product: string;
        price: string;
        currency: string;
        source: string;
        date: string;
      }>;
      pricingTrends?: string[];
      pricingAnomalies?: string[];
    };
    openSourceIntelligence: {
      totalSources: number;
      newsArticles: number;
      webResults: number;
      keyFindings: string[];
      suspiciousActivities?: string[];
      regulatoryActions?: string[];
    };
    references: string[];
  };
  analysisCompletedAt: Date;
  evidenceSummary: string;
  indicatorsSummary: {
    [key: string]: {
      detected: boolean;
      confidence: number;
      evidence: string[];
      details: string;
      riskContribution: number;
    };
  };
}

export class CartelAnalysisService {
  private openai: OpenAI;
  private scrapingService: ScrapingService;
  private searchService: SearchService;

  constructor() {
    this.openai = new OpenAI({
      apiKey: environment.OPENAI_API_KEY,
    });
    this.scrapingService = new ScrapingService();
    this.searchService = new SearchService();
  }

  async analyzeCartelRisk(
    searchId: string,
    companies: CompanyData[],
    indicators: string[]
  ): Promise<CartelRiskAssessment> {
    try {
      logger.info(
        `Starting comprehensive cartel analysis for search ${searchId} with ${companies.length} companies`
      );

      // Update search status
      await this.searchService.updateSearchStatus(searchId, "analyzing");

      // Step 1: Perform comprehensive open source intelligence gathering
      const openSourceResults = await this.gatherOpenSourceIntelligence(
        companies,
        indicators
      );

      // Step 2: Scrape and gather company data
      const companiesData = await this.gatherCompanyData(companies);

      // Step 3: Analyze each company individually with open source data
      const companiesAnalysis = await this.analyzeCompaniesWithOSINT(
        companiesData,
        indicators,
        openSourceResults
      );

      // Step 4: Perform cross-company analysis
      const crossAnalysis = await this.performCrossCompanyAnalysis(
        companiesAnalysis,
        indicators
      );

      // Step 5: Generate comprehensive market and pricing analysis
      const comprehensiveAnalysis = await this.generateComprehensiveAnalysis(
        companies,
        openSourceResults,
        companiesAnalysis
      );

      // Step 6: Generate final assessment with all data
      const finalAssessment = await this.generateEnhancedFinalAssessment(
        companiesAnalysis,
        crossAnalysis,
        indicators,
        comprehensiveAnalysis,
        openSourceResults
      );

      // Step 7: Update search with results
      await this.searchService.updateSearchWithResults(
        searchId,
        finalAssessment
      );

      logger.info(
        `Comprehensive cartel analysis completed for search ${searchId}`
      );
      return finalAssessment;
    } catch (error) {
      logger.error(`Cartel analysis failed for search ${searchId}:`, error);
      await this.searchService.updateSearchStatus(searchId, "failed", {
        error: "Analysis failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  private async gatherCompanyData(companies: CompanyData[]): Promise<any[]> {
    const companiesData = [];

    for (const company of companies) {
      try {
        logger.info(`Gathering data for ${company.name}`);

        const scrapedData = await this.scrapingService.scrapeCompanyWebsite(
          company.website || ""
        );
        const newsData = await this.scrapingService.searchCompanyNews(
          company.name
        );
        const financialData = await this.scrapingService.getFinancialData(
          company.name
        );

        companiesData.push({
          ...company,
          scrapedData,
          newsData,
          financialData,
          dataCollectedAt: new Date(),
        });
      } catch (error) {
        logger.warn(`Failed to gather data for ${company.name}:`, error);
        companiesData.push({
          ...company,
          scrapedData: null,
          newsData: null,
          financialData: null,
          error:
            error instanceof Error ? error.message : "Data gathering failed",
        });
      }
    }

    return companiesData;
  }

  private async analyzeCompanies(
    companiesData: any[],
    indicators: string[]
  ): Promise<AnalysisResult[]> {
    const analyses = [];

    for (const companyData of companiesData) {
      try {
        const analysis = await this.analyzeIndividualCompany(
          companyData,
          indicators
        );
        analyses.push(analysis);
      } catch (error) {
        logger.error(`Failed to analyze ${companyData.name}:`, error);
        analyses.push({
          companyName: companyData.name,
          riskScore: 0,
          indicators: {},
          summary: `Analysis failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          recommendations: [],
        });
      }
    }

    return analyses;
  }

  private async analyzeIndividualCompany(
    companyData: any,
    indicators: string[]
  ): Promise<AnalysisResult> {
    const prompt = `
    You are an expert in cartel detection and antitrust analysis. Analyze the following company data to detect potential cartel behavior indicators.

    Company: ${companyData.name}
    Industry: ${companyData.industry || "Unknown"}
    Website Data: ${JSON.stringify(companyData.scrapedData, null, 2)}
    News Data: ${JSON.stringify(companyData.newsData, null, 2)}
    Financial Data: ${JSON.stringify(companyData.financialData, null, 2)}

    Indicators to analyze: ${indicators.join(", ")}

    For each indicator, provide comprehensive analysis including:
    1. detected (boolean): Whether the indicator was detected
    2. confidence (0-1): Confidence level in the detection
    3. evidence (array): Specific pieces of evidence found
    4. details (string): Detailed explanation of what this indicator means, why it's concerning, and specific evidence found
    5. riskContribution (number): How much this indicator contributes to overall cartel risk (0-100)

    IMPORTANT: For the 'details' field, provide comprehensive explanations that include:
    - What this specific risk indicator means in cartel detection context
    - Why this behavior pattern is concerning from an antitrust perspective
    - Specific evidence found in the company data that supports this finding
    - Potential regulatory implications
    - How this relates to known cartel detection methodologies

    Common indicators to analyze in detail:
    - Price Fixing: Coordinated pricing strategies, identical price points, simultaneous price changes
    - Market Division: Geographic territories, customer allocation, exclusive dealing arrangements
    - Bid Rigging: Suspicious bidding patterns, cover bidding, complementary bidding
    - Output Restrictions: Production quotas, capacity limitations, supply constraints
    - Information Exchange: Sharing of sensitive commercial information, joint ventures
    - Suspicious Communication: Regular meetings, trade association activities, cross-shareholdings

    Also provide:
    - Overall risk score (0-100)
    - Summary of findings
    - Specific recommendations

    Respond in JSON format:
    {
      "riskScore": number,
      "indicators": {
        "indicatorName": {
          "detected": boolean,
          "confidence": number,
          "evidence": ["evidence1", "evidence2"],
          "details": "comprehensive detailed explanation including definition, evidence, and regulatory implications",
          "riskContribution": number
        }
      },
      "summary": "overall summary",
      "recommendations": ["recommendation1", "recommendation2"]
    }
    `;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert antitrust analyst specializing in cartel detection. Provide thorough, evidence-based analysis.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const analysisText = response.choices[0]?.message?.content;
    if (!analysisText) {
      throw new Error("No analysis response from OpenAI");
    }

    try {
      const analysis = JSON.parse(analysisText);
      return {
        companyName: companyData.name,
        ...analysis,
      };
    } catch (error) {
      logger.error("Failed to parse OpenAI analysis response:", error);
      throw new Error("Invalid analysis response format");
    }
  }

  private async performCrossCompanyAnalysis(
    companiesAnalysis: AnalysisResult[],
    indicators: string[]
  ): Promise<any> {
    const prompt = `
    You are an expert in cartel detection. Analyze the following companies collectively to identify cross-company patterns that indicate potential cartel behavior.

    Companies Analysis:
    ${JSON.stringify(companiesAnalysis, null, 2)}

    Focus on:
    1. Price correlation patterns
    2. Market division indicators
    3. Communication patterns between companies
    4. Bid coordination signs
    5. Similar business practices or timing
    6. Geographic market division
    7. Customer allocation patterns

    Provide analysis in JSON format:
    {
      "priceCorrelation": number (0-100),
      "marketDivision": number (0-100),
      "communicationPatterns": number (0-100),
      "bidCoordination": number (0-100),
      "keyFindings": ["finding1", "finding2"],
      "evidenceStrength": number (0-100),
      "crossCompanyIndicators": ["indicator1", "indicator2"]
    }
    `;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert antitrust analyst. Focus on identifying patterns across multiple companies that indicate cartel behavior.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 1500,
    });

    const analysisText = response.choices[0]?.message?.content;
    if (!analysisText) {
      throw new Error("No cross-analysis response from OpenAI");
    }

    return JSON.parse(analysisText);
  }

  private async generateFinalAssessment(
    companiesAnalysis: AnalysisResult[],
    crossAnalysis: any,
    indicators: string[]
  ): Promise<CartelRiskAssessment> {
    const prompt = `
    You are an expert antitrust analyst. Generate a final cartel risk assessment based on individual company analyses and cross-company patterns.

    Individual Company Analyses:
    ${JSON.stringify(companiesAnalysis, null, 2)}

    Cross-Company Analysis:
    ${JSON.stringify(crossAnalysis, null, 2)}

    Provide a comprehensive final assessment in JSON format:
    {
      "overallRiskScore": number (0-100),
      "cartelProbability": number (0-100),
      "keyFindings": ["finding1", "finding2"],
      "crossCompanyIndicators": {
        "priceCorrelation": number (0-100),
        "marketDivision": number (0-100),
        "communicationPatterns": number (0-100),
        "bidCoordination": number (0-100)
      },
      "recommendations": ["recommendation1", "recommendation2"],
      "alertLevel": "LOW|MEDIUM|HIGH|CRITICAL",
      "confidenceLevel": number (0-100),
      "nextSteps": ["step1", "step2"]
    }

    Alert Level Guidelines:
    - LOW (0-25): Minimal cartel indicators
    - MEDIUM (26-50): Some concerning patterns
    - HIGH (51-75): Strong cartel indicators
    - CRITICAL (76-100): Very high probability of cartel behavior
    `;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a senior antitrust analyst providing final risk assessments for regulatory authorities.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const assessmentText = response.choices[0]?.message?.content;
    if (!assessmentText) {
      throw new Error("No final assessment response from OpenAI");
    }

    const assessment = JSON.parse(assessmentText);

    return {
      ...assessment,
      companiesAnalysis,
      analysisCompletedAt: new Date(),
      totalCompaniesAnalyzed: companiesAnalysis.length,
      indicatorsAnalyzed: indicators.length,
    };
  }

  // Enhanced comprehensive website scraping method with detailed logging
  async comprehensiveWebsiteScraping(companies: any[]): Promise<any> {
    try {
      logger.info(
        `Starting comprehensive scraping for ${companies.length} companies`
      );
      logger.info(
        `Companies to scrape: ${companies
          .map((c) => `${c.name} (${c.website})`)
          .join(", ")}`
      );

      const scrapingResults = await Promise.all(
        companies.map(async (company) => {
          logger.info(`🌐 Scraping website: ${company.website}`);

          // Use existing scraping service to get comprehensive data
          const websiteData = await this.scrapingService.scrapeCompanyWebsite(
            company.website
          );

          // Log website scraping results
          if (websiteData) {
            logger.info(`✅ Website data scraped for ${company.name}:`);
            logger.info(
              `   - Content length: ${
                JSON.stringify(websiteData).length
              } characters`
            );
            logger.info(
              `   - Data structure: ${Object.keys(websiteData).join(", ")}`
            );

            if (websiteData.content) {
              logger.info(
                `   - Website content preview: ${websiteData.content.substring(
                  0,
                  200
                )}...`
              );
            }
            if (websiteData.metadata) {
              logger.info(
                `   - Website metadata: ${JSON.stringify(websiteData.metadata)}`
              );
            }
          } else {
            logger.warn(
              `⚠️  No website data retrieved for ${company.name} from ${company.website}`
            );
          }

          logger.info(`📰 Searching news for company: ${company.name}`);
          const newsData = await this.scrapingService.searchCompanyNews(
            company.name
          );

          // Log news scraping results
          if (newsData && newsData.articles) {
            logger.info(`✅ News data scraped for ${company.name}:`);
            logger.info(`   - Articles found: ${newsData.articles.length}`);
            newsData.articles.forEach((article: any, index: number) => {
              logger.info(
                `   - Article ${index + 1}: ${article.title || "No title"}`
              );
              logger.info(`     URL: ${article.url || "No URL"}`);
              logger.info(
                `     Content preview: ${(article.content || "").substring(
                  0,
                  150
                )}...`
              );
            });
          } else {
            logger.warn(`⚠️  No news articles found for ${company.name}`);
          }

          const result = {
            company: company.name,
            website: company.website,
            websiteData,
            newsData,
            scrapedAt: new Date(),
            scrapingStats: {
              websiteContentSize: websiteData
                ? JSON.stringify(websiteData).length
                : 0,
              newsArticlesCount: newsData?.articles?.length || 0,
              totalContentSize:
                (websiteData ? JSON.stringify(websiteData).length : 0) +
                (newsData ? JSON.stringify(newsData).length : 0),
            },
          };

          logger.info(
            `📊 Scraping completed for ${company.name}: Website content ${result.scrapingStats.websiteContentSize} chars, ${result.scrapingStats.newsArticlesCount} news articles, total ${result.scrapingStats.totalContentSize} chars`
          );

          return result;
        })
      );

      // Log comprehensive scraping summary
      const totalWebsiteContent = scrapingResults.reduce(
        (sum, r) => sum + r.scrapingStats.websiteContentSize,
        0
      );
      const totalNewsArticles = scrapingResults.reduce(
        (sum, r) => sum + r.scrapingStats.newsArticlesCount,
        0
      );
      const totalContent = scrapingResults.reduce(
        (sum, r) => sum + r.scrapingStats.totalContentSize,
        0
      );

      logger.info(`✅ Comprehensive scraping completed for all companies`);
      logger.info(`📈 Scraping Summary:`);
      logger.info(`   - Total companies processed: ${scrapingResults.length}`);
      logger.info(
        `   - Total website content: ${totalWebsiteContent} characters`
      );
      logger.info(`   - Total news articles: ${totalNewsArticles}`);
      logger.info(`   - Total scraped content: ${totalContent} characters`);
      logger.info(
        `   - Average content per company: ${Math.round(
          totalContent / scrapingResults.length
        )} characters`
      );

      return scrapingResults;
    } catch (error) {
      logger.error("Comprehensive website scraping failed:", error);
      throw error;
    }
  }

  // Enhanced AI data formatting agent with detailed logging
  async formatScrapedDataWithAI(scrapingResults: any[]): Promise<any> {
    try {
      logger.info("Starting AI-powered data formatting...");
      logger.info(
        `📋 Processing ${scrapingResults.length} companies for AI formatting`
      );

      // Process each company's data with chunking for token management
      const formattedResults = await Promise.all(
        scrapingResults.map(async (result, index) => {
          logger.info(
            `🤖 Formatting data for company ${index + 1}/${
              scrapingResults.length
            }: ${result.company}`
          );
          const formatted = await this.formatSingleCompanyData(result);
          logger.info(`✅ AI formatting completed for ${result.company}`);
          return formatted;
        })
      );

      logger.info("✅ AI data formatting completed");
      logger.info(`📊 Formatting Summary:`);
      logger.info(`   - Companies processed: ${formattedResults.length}`);
      formattedResults.forEach((result, index) => {
        const contentSize = JSON.stringify(result).length;
        logger.info(
          `   - ${result.company}: ${contentSize} characters formatted`
        );
      });

      return formattedResults;
    } catch (error) {
      logger.error("AI data formatting failed:", error);
      throw error;
    }
  }

  // Enhanced helper method to format single company data with detailed logging
  private async formatSingleCompanyData(companyResult: any): Promise<any> {
    const { company, websiteData, newsData } = companyResult;

    logger.info(`🔍 Starting AI formatting for ${company}`);

    // Prepare content with chunking for token limits
    const content = this.prepareContentForAI(websiteData, newsData);
    logger.info(
      `📝 Content prepared for ${company}: ${content.length} characters`
    );

    const chunks = this.chunkContent(content, 15000); // Limit chunks to ~15k tokens
    logger.info(`🧩 Content split into ${chunks.length} chunks for ${company}`);

    const formattedChunks = await Promise.all(
      chunks.map(async (chunk, index) => {
        logger.info(
          `🤖 Processing chunk ${index + 1}/${chunks.length} for ${company} (${
            chunk.length
          } chars)`
        );

        const prompt = `
You are a data formatting agent specialized in extracting structured information from web content for legal analysis.

Company: ${company}
Content Chunk ${index + 1}/${chunks.length}:
${chunk}

Extract and format the following information into JSON:
{
  "companyInfo": {
    "name": "company name",
    "industry": "industry sector",
    "description": "business description"
  },
  "pricing": {
    "pricingModel": "description of pricing approach",
    "prices": ["list of any prices found"],
    "pricingChanges": ["any mentions of price changes"]
  },
  "businessPractices": {
    "marketStrategy": "market approach",
    "competitorMentions": ["competitors mentioned"],
    "partnerships": ["business partnerships"]
  },
  "news": {
    "recentNews": ["relevant news items"],
    "announcements": ["company announcements"],
    "marketEvents": ["market-related events"]
  },
  "keyTopics": ["main business topics and themes"]
}

Return only valid JSON without markdown formatting.`;

        try {
          const response = await this.openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are a data extraction expert. Extract structured information and return valid JSON only.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.1,
            max_tokens: 2000,
          });

          const formattedText = response.choices[0]?.message?.content;
          if (!formattedText) {
            logger.warn(
              `No response from OpenAI for ${company} chunk ${index + 1}`
            );
            return {
              error: "No AI response",
              rawChunk: chunk.substring(0, 500),
            };
          }

          logger.info(
            `✅ AI response received for ${company} chunk ${index + 1}: ${
              formattedText.length
            } chars`
          );

          try {
            let jsonContent = formattedText;

            // Clean up markdown formatting if present
            if (formattedText.includes("```json")) {
              jsonContent = formattedText
                .replace(/```json\s*/g, "")
                .replace(/\s*```/g, "");
            }

            const parsedData = JSON.parse(jsonContent);
            logger.info(
              `📋 Successfully parsed JSON for ${company} chunk ${index + 1}`
            );
            return parsedData;
          } catch (parseError) {
            logger.warn(
              `❌ Failed to parse JSON for ${company} chunk ${index + 1}:`,
              parseError
            );
            logger.warn(`Raw AI response: ${formattedText}`);
            return { error: "JSON parse failed", rawContent: formattedText };
          }
        } catch (aiError) {
          logger.error(
            `❌ OpenAI API error for ${company} chunk ${index + 1}:`,
            aiError
          );
          return { error: "AI API failed", rawChunk: chunk.substring(0, 500) };
        }
      })
    );

    // Merge all chunks for this company
    logger.info(
      `🔗 Merging ${formattedChunks.length} formatted chunks for ${company}`
    );
    const mergedResult = this.mergeFormattedChunks(company, formattedChunks);
    logger.info(
      `✅ Data formatting completed for ${company}: ${
        JSON.stringify(mergedResult).length
      } chars`
    );

    return mergedResult;
  }

  // Enhanced comprehensive cartel analysis method with detailed logging and complete indicator support
  async performCartelAnalysis(
    formattedData: any[],
    selectedIndicators: any[],
    description: string,
    companies: any[]
  ): Promise<any> {
    try {
      logger.info("🔍 Starting comprehensive cartel analysis...");
      logger.info(`📊 Analysis Parameters:`);
      logger.info(`   - Companies: ${companies.map((c) => c.name).join(", ")}`);
      logger.info(`   - Selected Indicators: ${selectedIndicators.length}`);
      logger.info(`   - Description: ${description || "None provided"}`);
      logger.info(`   - Formatted Data Chunks: ${formattedData.length}`);

      // Log selected indicators for verification
      logger.info(`🎯 Selected Indicators for Analysis:`);
      selectedIndicators.forEach((indicator, index) => {
        logger.info(
          `   ${index + 1}. ${indicator.id || indicator} - ${
            indicator.category || "No category"
          }`
        );
      });

      // Load CSV indicator data for enhanced analysis
      const indicatorData = this.loadIndicatorDataFromCSV(selectedIndicators);
      logger.info(
        `📋 Loaded ${indicatorData.length} indicator definitions from knowledge base`
      );

      // Perform analysis with chunking for token management
      const analysisPrompt = this.buildComprehensiveAnalysisPrompt(
        formattedData,
        indicatorData,
        description,
        companies
      );
      logger.info(
        `📝 Built comprehensive analysis prompt: ${analysisPrompt.length} characters`
      );

      // Split analysis into manageable chunks if needed
      const chunks = this.chunkAnalysisPrompt(analysisPrompt, 20000);
      logger.info(
        `🧩 Analysis split into ${chunks.length} chunks for processing`
      );

      const chunkResults = await Promise.all(
        chunks.map(async (chunk, index) => {
          logger.info(
            `🤖 Processing analysis chunk ${index + 1}/${chunks.length}`
          );

          const response = await this.openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a senior antitrust expert conducting cartel risk analysis. 
                Analyze the provided data for cartel indicators and provide detailed findings.
                This is chunk ${index + 1}/${chunks.length} of the analysis.
                
                IMPORTANT: Check for ALL indicators mentioned in the prompt and provide complete analysis.
                For each indicator, determine:
                - Whether it was detected (true/false)
                - Confidence level (0.0-1.0)  
                - Specific evidence found
                - Detailed explanation
                
                Return comprehensive JSON with all requested indicators analyzed.`,
              },
              {
                role: "user",
                content: chunk,
              },
            ],
            temperature: 0.1,
            max_tokens: 4000,
          });

          const analysisText = response.choices[0]?.message?.content;
          if (!analysisText) {
            logger.error(`❌ No analysis response for chunk ${index + 1}`);
            throw new Error(`No analysis response for chunk ${index + 1}`);
          }

          logger.info(
            `✅ Analysis response received for chunk ${index + 1}: ${
              analysisText.length
            } chars`
          );

          try {
            let jsonContent = analysisText;

            // Clean up markdown formatting if present
            if (analysisText.includes("```json")) {
              jsonContent = analysisText
                .replace(/```json\s*/g, "")
                .replace(/\s*```/g, "")
                .trim();
              logger.info(
                `🧹 Cleaned markdown formatting from analysis response`
              );
            }

            const parsedResult = JSON.parse(jsonContent);
            logger.info(
              `📋 Successfully parsed analysis JSON for chunk ${index + 1}`
            );

            // Log what indicators were analyzed in this chunk
            if (parsedResult.indicators) {
              const analyzedIndicators = Object.keys(parsedResult.indicators);
              logger.info(
                `   - Indicators analyzed: ${
                  analyzedIndicators.length
                } (${analyzedIndicators.join(", ")})`
              );
            }

            return parsedResult;
          } catch (parseError) {
            logger.warn(
              `❌ Failed to parse analysis JSON for chunk ${index + 1}:`,
              parseError
            );
            logger.warn(
              `Raw analysis response: ${analysisText.substring(0, 500)}...`
            );
            return {
              chunkIndex: index + 1,
              error: "JSON parse failed",
              chunkAnalysis: analysisText,
              rawResponse: true,
            };
          }
        })
      );

      logger.info(
        `🔗 Merging ${chunkResults.length} chunk results into final analysis`
      );

      // Merge chunk results into final analysis
      const finalAnalysis = this.mergeFinalAnalysis(
        chunkResults,
        selectedIndicators,
        companies
      );

      // Log final analysis summary
      logger.info(`✅ Comprehensive cartel analysis completed`);
      logger.info(`📊 Final Analysis Summary:`);
      logger.info(
        `   - Overall Risk Score: ${finalAnalysis.overallRiskScore || 0}`
      );
      logger.info(
        `   - Cartel Probability: ${(
          (finalAnalysis.cartelProbability || 0) * 100
        ).toFixed(1)}%`
      );
      logger.info(`   - Alert Level: ${finalAnalysis.alertLevel || "UNKNOWN"}`);
      logger.info(
        `   - Companies Analyzed: ${
          finalAnalysis.companiesAnalysis?.length || 0
        }`
      );
      logger.info(
        `   - Key Findings: ${finalAnalysis.keyFindings?.length || 0}`
      );
      logger.info(
        `   - Recommendations: ${finalAnalysis.recommendations?.length || 0}`
      );

      // Convert to frontend-compatible results format
      const frontendResults = this.convertToFrontendResultsFormat(
        finalAnalysis,
        selectedIndicators
      );

      logger.info(
        `🎯 Generated ${frontendResults.length} frontend result items`
      );

      // Return both comprehensive analysis and frontend-compatible results
      return {
        ...finalAnalysis,
        results: frontendResults, // Frontend expects this field
        analysisResults: finalAnalysis, // Keep comprehensive data for advanced features
      };
    } catch (error) {
      logger.error("❌ Comprehensive cartel analysis failed:", error);
      throw error;
    }
  }

  // Enhanced content preparation for comprehensive cartel analysis
  private prepareContentForAI(websiteData: any, newsData: any): string {
    logger.info(
      `🔧 Preparing content for AI analysis - Website: ${
        websiteData ? "Present" : "Missing"
      }, News: ${newsData?.articles?.length || 0} articles`
    );

    let content = "";

    if (websiteData) {
      // Website content sections relevant for cartel analysis
      content += `=== WEBSITE CONTENT ANALYSIS ===\n`;

      if (websiteData.title) {
        content += `Website Title: ${websiteData.title}\n`;
      }

      if (websiteData.content) {
        // Extract pricing-related content
        const pricingKeywords = [
          "price",
          "pricing",
          "cost",
          "fee",
          "charge",
          "rate",
          "tariff",
          "discount",
          "promotion",
        ];
        const pricingContent = this.extractRelevantContent(
          websiteData.content,
          pricingKeywords
        );
        if (pricingContent) {
          content += `\nPRICING INFORMATION:\n${pricingContent}\n`;
        }

        // Extract business strategy content
        const strategyKeywords = [
          "strategy",
          "market",
          "competition",
          "competitor",
          "industry",
          "partnership",
          "alliance",
          "cooperation",
        ];
        const strategyContent = this.extractRelevantContent(
          websiteData.content,
          strategyKeywords
        );
        if (strategyContent) {
          content += `\nBUSINESS STRATEGY:\n${strategyContent}\n`;
        }

        // General website content (truncated to avoid token limits)
        content += `\nGENERAL WEBSITE CONTENT:\n${websiteData.content.substring(
          0,
          3000
        )}${websiteData.content.length > 3000 ? "..." : ""}\n`;
      }

      if (websiteData.pricing) {
        content += `\nPRICING DATA: ${JSON.stringify(websiteData.pricing)}\n`;
      }

      if (websiteData.services) {
        content += `\nSERVICES: ${JSON.stringify(websiteData.services)}\n`;
      }

      if (websiteData.aboutUs) {
        content += `\nABOUT US: ${websiteData.aboutUs}\n`;
      }

      if (websiteData.contactInfo) {
        content += `\nCONTACT INFORMATION: ${JSON.stringify(
          websiteData.contactInfo
        )}\n`;
      }

      if (websiteData.newsSection) {
        content += `\nCOMPANY NEWS SECTION: ${websiteData.newsSection}\n`;
      }

      if (websiteData.metadata) {
        content += `\nMETADATA: ${JSON.stringify(websiteData.metadata)}\n`;
      }
    } else {
      content += `=== WEBSITE CONTENT ANALYSIS ===\nNo website data available.\n`;
    }

    if (newsData?.articles && newsData.articles.length > 0) {
      content += `\n=== NEWS ARTICLES ANALYSIS ===\n`;
      content += `Total Articles Found: ${newsData.articles.length}\n\n`;

      // Process up to 15 articles for better coverage
      newsData.articles.slice(0, 15).forEach((article: any, index: number) => {
        content += `ARTICLE ${index + 1}:\n`;
        content += `Title: ${article.title || "No title"}\n`;
        content += `URL: ${article.url || "No URL"}\n`;
        content += `Content: ${(article.content || "No content").substring(
          0,
          1000
        )}${(article.content || "").length > 1000 ? "..." : ""}\n`;
        if (article.publishedAt) {
          content += `Published: ${article.publishedAt}\n`;
        }
        content += `\n`;
      });
    } else {
      content += `\n=== NEWS ARTICLES ANALYSIS ===\nNo news articles found.\n`;
    }

    logger.info(`✅ Content prepared: ${content.length} characters total`);
    return content;
  }

  // Helper method to extract content relevant to specific keywords
  private extractRelevantContent(
    fullContent: string,
    keywords: string[]
  ): string {
    const sentences = fullContent.split(/[.!?]+/);
    const relevantSentences: string[] = [];

    sentences.forEach((sentence) => {
      const lowerSentence = sentence.toLowerCase();
      if (
        keywords.some((keyword) =>
          lowerSentence.includes(keyword.toLowerCase())
        )
      ) {
        relevantSentences.push(sentence.trim());
      }
    });

    // Return up to 10 most relevant sentences to avoid token overflow
    return relevantSentences.slice(0, 10).join(". ");
  }

  private chunkContent(content: string, maxTokens: number): string[] {
    const words = content.split(" ");
    const chunks: string[] = [];
    let currentChunk = "";

    for (const word of words) {
      const testChunk = currentChunk + " " + word;
      // Rough token estimation: ~4 characters per token
      if (testChunk.length > maxTokens * 4) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = word;
        } else {
          chunks.push(word);
        }
      } else {
        currentChunk = testChunk;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  private chunkAnalysisPrompt(prompt: string, maxTokens: number): string[] {
    return this.chunkContent(prompt, maxTokens);
  }

  private mergeFormattedChunks(company: string, chunks: any[]): any {
    // Merge multiple chunks for a single company
    const merged = {
      company,
      companyInfo: {},
      pricing: {
        pricingModel: "",
        prices: [] as string[],
        pricingChanges: [] as string[],
      },
      businessPractices: {
        marketStrategy: "",
        competitorMentions: [] as string[],
        partnerships: [] as string[],
      },
      news: {
        recentNews: [] as string[],
        announcements: [] as string[],
        marketEvents: [] as string[],
      },
      keyTopics: [] as string[],
    };

    chunks.forEach((chunk) => {
      if (chunk.companyInfo)
        Object.assign(merged.companyInfo, chunk.companyInfo);
      if (chunk.pricing) {
        merged.pricing.pricingModel += " " + (chunk.pricing.pricingModel || "");
        if (chunk.pricing.prices)
          merged.pricing.prices.push(...chunk.pricing.prices);
        if (chunk.pricing.pricingChanges)
          merged.pricing.pricingChanges.push(...chunk.pricing.pricingChanges);
      }
      if (chunk.businessPractices) {
        merged.businessPractices.marketStrategy +=
          " " + (chunk.businessPractices.marketStrategy || "");
        if (chunk.businessPractices.competitorMentions)
          merged.businessPractices.competitorMentions.push(
            ...chunk.businessPractices.competitorMentions
          );
        if (chunk.businessPractices.partnerships)
          merged.businessPractices.partnerships.push(
            ...chunk.businessPractices.partnerships
          );
      }
      if (chunk.news) {
        if (chunk.news.recentNews)
          merged.news.recentNews.push(...chunk.news.recentNews);
        if (chunk.news.announcements)
          merged.news.announcements.push(...chunk.news.announcements);
        if (chunk.news.marketEvents)
          merged.news.marketEvents.push(...chunk.news.marketEvents);
      }
      if (chunk.keyTopics) {
        merged.keyTopics.push(...chunk.keyTopics);
      }
    });

    return merged;
  }

  // Enhanced method to load complete CSV indicator data for comprehensive analysis
  private loadIndicatorDataFromCSV(selectedIndicators: any[]): any[] {
    logger.info(
      `📋 Loading complete CSV indicator data for ${selectedIndicators.length} selected indicators`
    );

    // Complete CSV data with ALL columns from your uploaded CSV file
    const csvIndicators = [
      {
        id: "price_fixing_identical",
        category: "Price Fixing",
        indicator: "Identical base prices or surcharges without justification",
        riskScore: 5,
        modusOperandi:
          "Firms agree to charge the same or nearly identical prices or surcharges, eliminating price competition.",
        evidenceTypes:
          "Price lists, invoices, or contracts showing identical pricing across competitors.",
        modernDigitalCollusion:
          "Algorithmic pricing tools synced across competitors can align prices without direct communication.",
        digitalEvidenceTypes:
          "Audit algorithm settings, shared API access logs, and metadata from pricing software.",
        agenticAISearchStrategy:
          "Program agent to scrape e-commerce platforms and compare prices using clustering and anomaly detection models.",
        webResources:
          "Google Shopping: https://shopping.google.com, Amazon: https://www.amazon.com",
        topInternetSources:
          "Amazon (https://www.amazon.com), Google Shopping (https://shopping.google.com), PriceRunner (https://www.pricerunner.com)",
        openSourceTools: "Amazon, Google Shopping, PriceRunner",
        apiIntelligenceTools: "SerpAPI, Bright Data, Diffbot",
        mvp: "Y",
      },
      {
        id: "price_fixing_coordinated",
        category: "Price Fixing",
        indicator: "Coordinated or simultaneous price changes",
        riskScore: 5,
        modusOperandi:
          "Competitors align price increases or reductions to signal and maintain a collusive pricing regime.",
        evidenceTypes:
          "Internal emails, press releases, or price change notices with aligned timing.",
        modernDigitalCollusion:
          "Firms use shared price-tracking bots or monitor AI-generated market signals to time changes together.",
        digitalEvidenceTypes:
          "Scrape logs from price-tracking bots, platform notifications, or digital pricing triggers.",
        agenticAISearchStrategy:
          "Train agent to track competitor websites and news sources for synchronized price updates using time-series correlation.",
        webResources:
          "PriceSpy: https://www.pricespy.co.za, Wayback Machine: https://archive.org/web",
        topInternetSources:
          "Wayback Machine (https://archive.org), Company Newsrooms, BusinessWire (https://www.businesswire.com)",
        openSourceTools: "Wayback Machine, BusinessWire, Company News Sites",
        apiIntelligenceTools: "Factiva, AlphaSense, ShadowDragon",
        mvp: "Y",
      },
      {
        id: "price_fixing_future_intentions",
        category: "Price Fixing",
        indicator: "Exchange of future pricing intentions",
        riskScore: 4,
        modusOperandi:
          "Firms share non-public future pricing strategies to align decisions and avoid competitive pressure.",
        evidenceTypes:
          "Emails, meeting records, or chat logs discussing planned price changes.",
        modernDigitalCollusion:
          "Encrypted collaboration platforms or AI bots may summarize and relay pricing trends indirectly.",
        digitalEvidenceTypes:
          "Encrypted chat logs, collaboration notes, AI-generated pricing insights shared via platforms.",
        agenticAISearchStrategy:
          "Monitor encrypted forums or press releases for predictive language or future pricing references using NLP models.",
        webResources:
          "Reddit: https://www.reddit.com, LinkedIn: https://www.linkedin.com",
        topInternetSources:
          "Reddit (https://www.reddit.com), LinkedIn (https://www.linkedin.com), Seeking Alpha (https://seekingalpha.com)",
        openSourceTools: "Reddit, LinkedIn, Seeking Alpha",
        apiIntelligenceTools: "ShadowDragon, AlphaSense, Meltwater",
        mvp: "Y",
      },
      {
        id: "price_fixing_converging_margins",
        category: "Price Fixing",
        indicator: "Converging profit margins despite cost differences",
        riskScore: 4,
        modusOperandi:
          "Despite different costs, firms maintain similar margins, often due to tacit collusion.",
        evidenceTypes:
          "Internal margin reports, competitor benchmarking data, and cost structure analysis.",
        modernDigitalCollusion:
          "Analytics tools benchmark performance, potentially leading to alignment via optimization algorithms.",
        digitalEvidenceTypes:
          "Shared analytics dashboards, BI tools' usage logs, or integrated cost analysis sheets.",
        agenticAISearchStrategy:
          "Instruct agent to cross-check financial statements or scraped pricing/cost data to calculate margin alignment.",
        webResources:
          "MarketWatch: https://www.marketwatch.com, Google Finance: https://www.google.com/finance",
        topInternetSources:
          "Morningstar (https://www.morningstar.com), SEC EDGAR (https://www.sec.gov/edgar.shtml), Yahoo Finance",
        openSourceTools: "Yahoo Finance, Morningstar, Public EDGAR filings",
        apiIntelligenceTools: "Bloomberg API, Xignite, Refinitiv",
        mvp: "Y",
      },
      {
        id: "price_fixing_industry_norms",
        category: "Price Fixing",
        indicator: "Industry norms to maintain pricing",
        riskScore: 3,
        modusOperandi:
          "Market players enforce 'rules' or unwritten agreements to sustain coordinated pricing.",
        evidenceTypes:
          "Meeting minutes, trade association discussions, or memos referencing 'industry rules'.",
        modernDigitalCollusion:
          "AI-based sentiment tracking in forums or industry webinars can reinforce informal price discipline.",
        digitalEvidenceTypes:
          "Webinar recordings, industry sentiment tools, or AI analytics from forum discussions.",
        agenticAISearchStrategy:
          "Mine trade association sites, public discussions, and conference agendas for collusive themes using semantic analysis.",
        webResources:
          "OECD iLibrary: https://www.oecd-ilibrary.org, TradePub: https://www.tradepub.com",
        topInternetSources:
          "OECD (https://www.oecd.org/competition/), Trade Associations, Conference Websites",
        openSourceTools: "OECD Library, Trade Conferences, Webinar Recordings",
        apiIntelligenceTools: "Meltwater, AlphaSense, LexisNexis API",
        mvp: "Y",
      },
      {
        id: "price_fixing_communications_enforcement",
        category: "Price Fixing",
        indicator: "Communications showing price enforcement",
        riskScore: 5,
        modusOperandi:
          "Internal messages reveal monitoring or reprimanding rivals for price undercutting.",
        evidenceTypes:
          "Emails warning competitors about undercutting or requesting price alignment.",
        modernDigitalCollusion:
          "Anonymous web forums or private channels (e.g., Discord, Telegram) allow covert monitoring.",
        digitalEvidenceTypes:
          "Telegram/Signal logs, admin activity on private forums, or warnings in group chats.",
        agenticAISearchStrategy:
          "Scrape industry chats or support forums for posts warning against undercutting or reinforcing pricing discipline.",
        webResources:
          "Telegram: https://web.telegram.org, Discord: https://discord.com",
        topInternetSources:
          "Telegram Channels, Discord Forums, Pastebin (https://pastebin.com)",
        openSourceTools: "Pastebin, Telegram (public channels), Discord",
        apiIntelligenceTools: "SocialGist, Echosec, ShadowDragon",
        mvp: "Y",
      },
      {
        id: "price_fixing_trade_associations",
        category: "Price Fixing",
        indicator: "Use of trade associations to discuss pricing",
        riskScore: 3,
        modusOperandi:
          "Trade bodies act as forums to align or signal price changes informally.",
        evidenceTypes:
          "Trade meeting agendas, attendance records, or minutes documenting sensitive topics.",
        modernDigitalCollusion:
          "Virtual roundtables or webinars with backchannel chat tools enable indirect pricing discussions.",
        digitalEvidenceTypes:
          "Webinar chat logs, calendar invites, video call platforms' metadata.",
        agenticAISearchStrategy:
          "Track webinars, panel recordings, or association events and extract pricing-relevant transcript sections.",
        webResources:
          "Eventbrite: https://www.eventbrite.com, Zoom Events: https://events.zoom.us",
        topInternetSources:
          "Eventbrite (https://www.eventbrite.com), YouTube (conference videos), Association Websites",
        openSourceTools:
          "Eventbrite, YouTube (conference uploads), Public Association Pages",
        apiIntelligenceTools: "Event Registry API, LexisNexis, AlphaSense",
        mvp: "Y",
      },
      {
        id: "price_fixing_public_signaling",
        category: "Price Fixing",
        indicator: "Public signaling through media or trade press",
        riskScore: 3,
        modusOperandi:
          "Companies announce pricing changes publicly to signal intentions to rivals.",
        evidenceTypes:
          "News articles, press releases, or speeches indicating price intentions.",
        modernDigitalCollusion:
          "Social media and influencer marketing can be leveraged to publicly signal pricing intentions.",
        digitalEvidenceTypes:
          "Web archives, coordinated press releases, LinkedIn post analytics.",
        agenticAISearchStrategy:
          "Deploy agents to scan news feeds and social media for strategic posts or announcements hinting at pricing changes.",
        webResources:
          "PR Newswire: https://www.prnewswire.com, Business Wire: https://www.businesswire.com",
        topInternetSources:
          "PR Newswire (https://www.prnewswire.com), Twitter (https://twitter.com), LinkedIn",
        openSourceTools: "Twitter, LinkedIn, PR Newswire",
        apiIntelligenceTools: "Factiva, GDELT, Meltwater",
        mvp: "Y",
      },
      {
        id: "price_fixing_cost_margin_exchange",
        category: "Price Fixing",
        indicator: "Exchange of cost or margin data between firms",
        riskScore: 4,
        modusOperandi:
          "Competitors share sensitive financial data to align profitability and prices.",
        evidenceTypes:
          "Shared spreadsheets, benchmarking studies, or internal emails with margin details.",
        modernDigitalCollusion:
          "Shared data lakes, dashboards, or scraped web analytics can be exploited to align performance.",
        digitalEvidenceTypes:
          "Shared dashboards, cloud folder sharing logs, anonymized survey participation records.",
        agenticAISearchStrategy:
          "Use crawlers to detect shared benchmarking portals, comparison tools, or unprotected dashboards.",
        webResources:
          "Benchmarks Online: https://www.benchmarksgame.org, Kaggle: https://www.kaggle.com",
        topInternetSources:
          "Benchmarking Portals, Gartner (https://www.gartner.com), Industry Surveys",
        openSourceTools: "Public survey results, news summaries, SlideShare",
        apiIntelligenceTools: "PitchBook, FactSet, CB Insights",
        mvp: "Y",
      },
      {
        id: "price_fixing_suspicious_benchmarking",
        category: "Price Fixing",
        indicator: "Suspicious benchmarking or data sharing",
        riskScore: 3,
        modusOperandi:
          "Joint benchmarking exercises disguise coordination under the guise of best practices.",
        evidenceTypes:
          "Third-party reports or communications between participants discussing data benchmarks.",
        modernDigitalCollusion:
          "Third-party platforms anonymize data but still allow participants to reverse-engineer peers.",
        digitalEvidenceTypes:
          "Benchmark access reports, SaaS logs showing repeated peer access.",
        agenticAISearchStrategy:
          "Program agent to monitor repeated access to anonymized data platforms by identified competitors.",
        webResources:
          "Statista: https://www.statista.com, Datawrapper: https://www.datawrapper.de",
        topInternetSources:
          "Kaggle Datasets (https://www.kaggle.com), Shared PowerBI dashboards, Datawrapper (https://www.datawrapper.de)",
        openSourceTools: "Kaggle, Google Data Studio Public Dashboards, GitHub",
        apiIntelligenceTools:
          "Gartner (API access partners), Bright Data, ShadowDragon",
        mvp: "Y",
      },
      {
        id: "price_fixing_pricing_audits",
        category: "Price Fixing",
        indicator: "Pricing audits coordinated by industry bodies",
        riskScore: 2,
        modusOperandi:
          "Industry bodies conduct pricing audits that facilitate implicit collusion.",
        evidenceTypes:
          "Audit reports, association memos, or firm submissions showing pricing comparisons.",
        modernDigitalCollusion:
          "Automated auditing tools accessed via portals can synchronize audit outcomes across members.",
        digitalEvidenceTypes:
          "Portal activity logs, shared audit dashboards, report distribution metadata.",
        agenticAISearchStrategy:
          "Scrape industry portals for audit tools, download history, or shared pricing evaluations.",
        webResources:
          "ICAEW: https://www.icaew.com, Deloitte Insights: https://www2.deloitte.com",
        topInternetSources:
          "Industry Portals, ISO Certification Sites, Audit Platform Demos",
        openSourceTools:
          "ISO Sites, Industry Org Websites, Certification Portals",
        apiIntelligenceTools: "Certik, Bright Data, DataMiner APIs",
        mvp: "Y",
      },
      {
        id: "price_fixing_email_arrangements",
        category: "Price Fixing",
        indicator: "Emails referring to price fixing arrangements",
        riskScore: 5,
        modusOperandi:
          "Internal communications explicitly discuss price-fixing agreements or expectations.",
        evidenceTypes:
          "Direct messages, email threads, or attachments outlining the cartel agreement.",
        modernDigitalCollusion:
          "Cartels increasingly use disappearing messages, private cloud folders, or collaborative docs.",
        digitalEvidenceTypes:
          "Recovered draft emails, cloud doc version history, disappearing message traces.",
        agenticAISearchStrategy:
          "Set agent to flag leaked email dumps, exposed cloud drives, or whistleblower platforms for pricing coordination content.",
        webResources:
          "Pastebin: https://pastebin.com, BreachForums (archived): https://web.archive.org",
        topInternetSources:
          "WikiLeaks (https://wikileaks.org), Pastebin, DocumentCloud (https://www.documentcloud.org)",
        openSourceTools: "WikiLeaks, Pastebin, DocumentCloud",
        apiIntelligenceTools: "ShadowDragon, Intel 471, DomainTools",
        mvp: "Y",
      },
    ];

    const matchedIndicators = csvIndicators.filter((indicator) =>
      selectedIndicators.some(
        (selected) =>
          selected.id === indicator.id ||
          selected.indicator === indicator.indicator
      )
    );

    logger.info(
      `✅ Loaded ${matchedIndicators.length} complete indicator definitions from CSV knowledge base`
    );
    matchedIndicators.forEach((indicator) => {
      logger.info(
        `   - ${indicator.category}: ${indicator.indicator} (Risk: ${indicator.riskScore}/5)`
      );
    });

    return matchedIndicators;
  }

  // Enhanced analysis prompt builder with complete CSV indicator data
  private buildComprehensiveAnalysisPrompt(
    formattedData: any[],
    indicatorData: any[],
    description: string,
    companies: any[]
  ): string {
    logger.info(
      `🏗️  Building comprehensive analysis prompt with ${indicatorData.length} indicators and ${formattedData.length} company datasets`
    );

    return `
COMPREHENSIVE CARTEL RISK ANALYSIS - EXPERT SYSTEM

USER CONTEXT: ${description || "No specific description provided"}

COMPANIES BEING ANALYZED:
${companies
  .map(
    (c, i) =>
      `${i + 1}. ${c.name} - ${c.website} (Industry: ${
        c.industry || "Unknown"
      })`
  )
  .join("\n")}

SCRAPED AND FORMATTED COMPANY DATA:
${JSON.stringify(formattedData, null, 2)}

COMPLETE CARTEL RISK INDICATORS TO ANALYZE:
${indicatorData
  .map(
    (indicator, index) => `
${index + 1}. INDICATOR ID: ${indicator.id}
   Category: ${indicator.category}
   Indicator: ${indicator.indicator}
   Risk Score: ${indicator.riskScore}/5
   
   Modus Operandi: ${indicator.modusOperandi}
   
   Traditional Evidence Types: ${indicator.evidenceTypes}
   
   Modern Digital Collusion Techniques: ${indicator.modernDigitalCollusion}
   
   Digital Evidence to Investigate: ${indicator.digitalEvidenceTypes}
   
   AI Search Strategy: ${indicator.agenticAISearchStrategy}
   
   Web Resources: ${indicator.webResources}
   
   Top Internet Sources: ${indicator.topInternetSources}
   
   Open Source Tools: ${indicator.openSourceTools}
   
   API Intelligence Tools: ${indicator.apiIntelligenceTools}
`
  )
  .join("\n")}

ANALYSIS REQUIREMENTS:
You are a senior antitrust investigator with 20+ years of experience in cartel detection. Using the complete indicator knowledge base above and the scraped company data, perform the following analysis:

1. INDIVIDUAL COMPANY ANALYSIS:
   - Analyze each company's data against ALL ${indicatorData.length} indicators
   - Look for pricing patterns, market behavior, communications, and business practices
   - Assess evidence quality and strength for each indicator
   - Calculate individual risk scores based on detected patterns

2. CROSS-COMPANY COMPARISON:
   - Compare pricing strategies, timing of changes, and market behaviors
   - Identify coordination patterns across companies
   - Look for synchronized actions or parallel conduct
   - Assess communication patterns and potential information exchange

3. EVIDENCE ASSESSMENT:
   - Evaluate strength and credibility of found evidence
   - Classify evidence as direct, circumstantial, or inferential
   - Consider alternative explanations for observed patterns
   - Apply the "balance of probabilities" standard

4. RISK SCORING METHODOLOGY:
   - Use the provided risk scores (1-5) as base weights
   - Multiply by confidence level (0-100%) for detected indicators
   - Aggregate individual scores into overall company risk assessment
   - Calculate cross-company coordination risk

REQUIRED OUTPUT FORMAT (STRICT JSON):
{
  "overallRiskScore": 0-100,
  "cartelProbability": 0.0-1.0,
  "alertLevel": "LOW|MEDIUM|HIGH|CRITICAL",
  "companiesAnalysis": [
    {
      "company": "Company Name",
      "individualRiskScore": 0-100,
      "indicators": {
        "${indicatorData.map((ind) => ind.id).join('": {...}, "')}"
        : {
          "detected": true/false,
          "confidence": 0.0-1.0,
          "evidence": ["specific evidence from scraped data"],
          "analysis": "detailed explanation of findings",
          "riskContribution": 0-100
        }
      }
    }
  ],
  "crossCompanyIndicators": {
    "priceCorrelation": 0-100,
    "marketDivision": 0-100,
    "communicationPatterns": 0-100,
    "bidCoordination": 0-100
  },
  "keyFindings": ["most significant findings with specific evidence"],
  "recommendations": ["actionable next steps for investigation"],
  "evidenceSummary": "comprehensive summary of all evidence found",
  "methodologyNotes": "explanation of analysis approach and limitations"
}

CRITICAL: Analyze ALL ${
      indicatorData.length
    } indicators provided. Return detailed findings for each indicator with specific evidence from the scraped data.`;
  }

  // Enhanced method to merge analysis chunks with comprehensive indicator validation
  private mergeFinalAnalysis(
    chunkResults: any[],
    selectedIndicators: any[],
    companies: any[]
  ): any {
    logger.info(`🔗 Merging ${chunkResults.length} analysis chunks`);

    // Initialize comprehensive analysis structure
    const finalAnalysis = {
      overallRiskScore: 0,
      cartelProbability: 0,
      alertLevel: "LOW" as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      companiesAnalysis: [] as any[],
      crossCompanyIndicators: {
        priceCorrelation: 0,
        marketDivision: 0,
        communicationPatterns: 0,
        bidCoordination: 0,
      },
      keyFindings: [] as string[],
      recommendations: [] as string[],
      evidenceSummary: "",
      analysisCompletedAt: new Date(),
      indicatorsSummary: {} as any,
    };

    // Track all indicators that should have been analyzed
    const expectedIndicators = selectedIndicators.map((ind) => ind.id || ind);
    logger.info(
      `📋 Expected indicators to be analyzed: ${expectedIndicators.join(", ")}`
    );

    // Merge logic for combining chunk results with validation
    chunkResults.forEach((chunk, chunkIndex) => {
      logger.info(`🔍 Processing chunk ${chunkIndex + 1} results`);

      if (chunk.error) {
        logger.warn(`⚠️  Chunk ${chunkIndex + 1} had errors: ${chunk.error}`);
        return;
      }

      // Merge risk scores (use maximum)
      if (chunk.overallRiskScore) {
        finalAnalysis.overallRiskScore = Math.max(
          finalAnalysis.overallRiskScore,
          chunk.overallRiskScore
        );
        logger.info(`   - Risk score: ${chunk.overallRiskScore}`);
      }

      // Merge cartel probability
      if (chunk.cartelProbability) {
        finalAnalysis.cartelProbability = Math.max(
          finalAnalysis.cartelProbability,
          chunk.cartelProbability
        );
      }

      // Merge key findings
      if (chunk.keyFindings && Array.isArray(chunk.keyFindings)) {
        finalAnalysis.keyFindings.push(...chunk.keyFindings);
        logger.info(`   - Added ${chunk.keyFindings.length} key findings`);
      }

      // Merge recommendations
      if (chunk.recommendations && Array.isArray(chunk.recommendations)) {
        finalAnalysis.recommendations.push(...chunk.recommendations);
        logger.info(
          `   - Added ${chunk.recommendations.length} recommendations`
        );
      }

      // Merge company analyses
      if (chunk.companiesAnalysis && Array.isArray(chunk.companiesAnalysis)) {
        finalAnalysis.companiesAnalysis.push(...chunk.companiesAnalysis);
        logger.info(
          `   - Added analysis for ${chunk.companiesAnalysis.length} companies`
        );
      }

      // Merge cross-company indicators
      if (chunk.crossCompanyIndicators) {
        const validKeys = [
          "priceCorrelation",
          "marketDivision",
          "communicationPatterns",
          "bidCoordination",
        ];
        validKeys.forEach((key) => {
          if (chunk.crossCompanyIndicators[key] !== undefined) {
            (finalAnalysis.crossCompanyIndicators as any)[key] = Math.max(
              (finalAnalysis.crossCompanyIndicators as any)[key],
              chunk.crossCompanyIndicators[key]
            );
          }
        });
      }

      // Enhanced indicator coverage tracking - process both chunk-level and company-level indicators
      if (chunk.indicators) {
        Object.keys(chunk.indicators).forEach((indicatorId) => {
          finalAnalysis.indicatorsSummary[indicatorId] =
            chunk.indicators[indicatorId];
        });
      }

      // Also extract indicators from company analyses in chunks
      if (chunk.companiesAnalysis && Array.isArray(chunk.companiesAnalysis)) {
        chunk.companiesAnalysis.forEach((companyAnalysis: any) => {
          if (companyAnalysis.indicators) {
            Object.keys(companyAnalysis.indicators).forEach((indicatorId) => {
              if (!finalAnalysis.indicatorsSummary[indicatorId]) {
                finalAnalysis.indicatorsSummary[indicatorId] =
                  companyAnalysis.indicators[indicatorId];
              } else {
                // Merge indicator results if found in multiple places
                const existing = finalAnalysis.indicatorsSummary[indicatorId];
                const newData = companyAnalysis.indicators[indicatorId];

                finalAnalysis.indicatorsSummary[indicatorId] = {
                  detected: existing.detected || newData.detected,
                  confidence: Math.max(
                    existing.confidence || 0,
                    newData.confidence || 0
                  ),
                  evidence: [
                    ...(existing.evidence || []),
                    ...(newData.evidence || []),
                  ],
                  details: `${existing.details || ""}; ${
                    newData.details || ""
                  }`.trim(),
                  riskContribution: Math.max(
                    existing.riskContribution || 0,
                    newData.riskContribution || 0
                  ),
                };
              }
            });
          }
        });
      }

      // Process raw response chunks that failed JSON parsing
      if (chunk.rawResponse && chunk.chunkAnalysis) {
        logger.info(
          `🔍 Processing raw analysis chunk ${
            chunkIndex + 1
          } for additional insights`
        );

        // Extract key findings from raw text using basic text analysis
        const rawText = chunk.chunkAnalysis.toLowerCase();

        // Look for price-related patterns
        if (
          rawText.includes("price") &&
          (rawText.includes("coordination") ||
            rawText.includes("fixing") ||
            rawText.includes("manipulation"))
        ) {
          finalAnalysis.keyFindings.push(
            "Potential price coordination patterns detected in content"
          );
        }

        // Look for collusion patterns
        if (
          rawText.includes("collusion") ||
          rawText.includes("cartel") ||
          rawText.includes("conspiracy")
        ) {
          finalAnalysis.keyFindings.push("Explicit collusion references found");
        }

        // Look for market division
        if (
          rawText.includes("market") &&
          (rawText.includes("division") || rawText.includes("allocation"))
        ) {
          finalAnalysis.keyFindings.push("Market division indicators present");
        }

        // Extract basic risk level from text
        if (rawText.includes("high risk") || rawText.includes("critical")) {
          finalAnalysis.overallRiskScore = Math.max(
            finalAnalysis.overallRiskScore,
            7
          );
        } else if (
          rawText.includes("medium risk") ||
          rawText.includes("concerning")
        ) {
          finalAnalysis.overallRiskScore = Math.max(
            finalAnalysis.overallRiskScore,
            5
          );
        }
      }
    });

    // Validate indicator coverage
    const analyzedIndicators = Object.keys(finalAnalysis.indicatorsSummary);
    const missingIndicators = expectedIndicators.filter(
      (id) => !analyzedIndicators.includes(id)
    );

    if (missingIndicators.length > 0) {
      logger.warn(
        `⚠️  Missing analysis for indicators: ${missingIndicators.join(", ")}`
      );

      // Add placeholder results for missing indicators
      missingIndicators.forEach((indicatorId) => {
        finalAnalysis.indicatorsSummary[indicatorId] = {
          detected: false,
          confidence: 0,
          evidence: [],
          details: `Analysis not completed for this indicator due to processing limitations`,
        };
      });
    }

    // Determine alert level based on risk score
    if (finalAnalysis.overallRiskScore >= 8) {
      finalAnalysis.alertLevel = "CRITICAL";
    } else if (finalAnalysis.overallRiskScore >= 6) {
      finalAnalysis.alertLevel = "HIGH";
    } else if (finalAnalysis.overallRiskScore >= 4) {
      finalAnalysis.alertLevel = "MEDIUM";
    }

    // Deduplicate arrays
    finalAnalysis.keyFindings = [...new Set(finalAnalysis.keyFindings)];
    finalAnalysis.recommendations = [...new Set(finalAnalysis.recommendations)];

    // Generate evidence summary
    finalAnalysis.evidenceSummary = `Analysis of ${companies.length} companies using ${selectedIndicators.length} indicators. ${analyzedIndicators.length}/${expectedIndicators.length} indicators successfully analyzed.`;

    logger.info(
      `✅ Final analysis merged: Risk ${finalAnalysis.overallRiskScore}, Alert ${finalAnalysis.alertLevel}, ${finalAnalysis.keyFindings.length} findings`
    );

    return finalAnalysis;
  }

  // New comprehensive analysis methods

  private async gatherOpenSourceIntelligence(
    companies: CompanyData[],
    indicators: string[]
  ) {
    logger.info("Gathering open source intelligence...");

    const companyNames = companies.map((c) => c.name);
    const searchTerms = indicators.concat([
      "cartel",
      "price fixing",
      "market manipulation",
      "competition",
      "investigation",
      "lawsuit",
      "regulatory action",
      "antitrust",
    ]);

    const allResults = [];
    for (const indicator of indicators) {
      const result = await serpService.comprehensiveSearch(
        companyNames,
        indicator,
        searchTerms
      );
      allResults.push({
        indicator,
        ...result,
      });
    }

    return allResults;
  }

  private async analyzeCompaniesWithOSINT(
    companiesData: any[],
    indicators: string[],
    openSourceResults: any[]
  ): Promise<AnalysisResult[]> {
    const analysis: AnalysisResult[] = [];

    for (const company of companiesData) {
      logger.info(`Analyzing ${company.name} with OSINT data`);

      const companyAnalysis: AnalysisResult = {
        companyName: company.name,
        riskScore: 0,
        indicators: {},
        summary: "",
        recommendations: [],
        marketAnalysis: {
          competitivePosition: "Unknown",
          pricingStrategy: "Unknown",
          recentDevelopments: [],
        },
      };

      // Analyze each indicator with open source data
      for (const indicator of indicators) {
        const osintForIndicator = openSourceResults.find(
          (r) => r.indicator === indicator
        );
        const indicatorAnalysis = await this.analyzeIndicatorWithOSINT(
          company,
          indicator,
          osintForIndicator || {
            webResults: [],
            newsResults: [],
            pricingData: [],
          }
        );

        companyAnalysis.indicators[indicator] = indicatorAnalysis;
        companyAnalysis.riskScore += indicatorAnalysis.riskContribution || 0;
      }

      // Generate enhanced summary and recommendations
      companyAnalysis.summary = await this.generateEnhancedCompanySummary(
        company,
        companyAnalysis
      );
      companyAnalysis.recommendations =
        await this.generateCompanyRecommendations(company, companyAnalysis);

      analysis.push(companyAnalysis);
    }

    return analysis;
  }

  private async analyzeIndicatorWithOSINT(
    company: any,
    indicator: string,
    osintData: any
  ) {
    const analysis = {
      detected: false,
      confidence: 0,
      evidence: [] as string[],
      details: "",
      riskContribution: 0,
      openSourceEvidence: {
        webResults: osintData.webResults || [],
        newsArticles: osintData.newsResults || [],
        pricingData: osintData.pricingData || [],
      },
    };

    // Analyze web results for evidence
    for (const webResult of osintData.webResults || []) {
      if (this.isRelevantEvidence(webResult, company.name, indicator)) {
        analysis.evidence.push(
          `Web: ${webResult.title} - ${webResult.snippet} (${webResult.source})`
        );
        analysis.confidence += 0.1;
      }
    }

    // Analyze news articles for evidence
    for (const newsArticle of osintData.newsResults || []) {
      if (this.isRelevantEvidence(newsArticle, company.name, indicator)) {
        analysis.evidence.push(
          `News: ${newsArticle.title} - ${newsArticle.snippet} (${newsArticle.source}, ${newsArticle.date})`
        );
        analysis.confidence += 0.2; // News articles have higher weight
      }
    }

    // Analyze pricing data
    if (osintData.pricingData && osintData.pricingData.length > 0) {
      const companyPricing = osintData.pricingData.filter((p: any) =>
        p.company.toLowerCase().includes(company.name.toLowerCase())
      );

      if (companyPricing.length > 0) {
        analysis.evidence.push(
          `Pricing data found: ${companyPricing.length} entries`
        );
        analysis.confidence += 0.15;
      }
    }

    // Determine detection and risk contribution
    analysis.detected = analysis.confidence > 0.3;
    analysis.riskContribution = Math.min(analysis.confidence * 10, 5); // Cap at 5

    // Generate detailed analysis
    analysis.details = await this.generateIndicatorAnalysisDetails(
      company,
      indicator,
      analysis
    );

    return analysis;
  }

  private async generateComprehensiveAnalysis(
    companies: CompanyData[],
    openSourceResults: any[],
    companiesAnalysis: AnalysisResult[]
  ) {
    const analysis = {
      marketAnalysis: {
        totalMarketSize: "Unknown",
        marketConcentration: "Unknown",
        competitiveIntensity: "High",
        barrierToEntry: "Medium",
        regulatoryEnvironment: "Unknown",
      },
      pricingAnalysis: {
        pricingTables: [] as any[],
        pricingTrends: [] as string[],
        pricingAnomalies: [] as string[],
      },
      openSourceIntelligence: {
        totalSources: 0,
        newsArticles: 0,
        webResults: 0,
        keyFindings: [] as string[],
        suspiciousActivities: [] as string[],
        regulatoryActions: [] as string[],
      },
      references: [] as string[],
    };

    // Aggregate open source data
    for (const osResult of openSourceResults) {
      analysis.openSourceIntelligence.webResults += (
        osResult.webResults || []
      ).length;
      analysis.openSourceIntelligence.newsArticles += (
        osResult.newsResults || []
      ).length;

      if (osResult.pricingData) {
        analysis.pricingAnalysis.pricingTables.push(...osResult.pricingData);
      }

      // Extract key findings from news articles
      for (const news of osResult.newsResults || []) {
        if (this.isSuspiciousActivity(news)) {
          analysis.openSourceIntelligence.suspiciousActivities.push(
            `${news.title} (${news.source}, ${news.date})`
          );
        }

        if (this.isRegulatoryAction(news)) {
          analysis.openSourceIntelligence.regulatoryActions.push(
            `${news.title} (${news.source}, ${news.date})`
          );
        }
      }

      // Collect sources for references
      if (osResult.sources) {
        analysis.references.push(...osResult.sources);
      }
    }

    analysis.openSourceIntelligence.totalSources = new Set(
      analysis.references
    ).size;
    analysis.references = Array.from(new Set(analysis.references));

    // Generate market analysis insights
    analysis.marketAnalysis = await this.generateMarketAnalysisInsights(
      companies,
      openSourceResults
    );

    // Generate pricing analysis
    analysis.pricingAnalysis = await this.generatePricingAnalysis(
      analysis.pricingAnalysis.pricingTables
    );

    return analysis;
  }

  private async generateEnhancedFinalAssessment(
    companiesAnalysis: AnalysisResult[],
    crossAnalysis: any,
    indicators: string[],
    comprehensiveAnalysis: any,
    openSourceResults: any[]
  ): Promise<CartelRiskAssessment> {
    // Generate base assessment
    const baseAssessment = await this.generateFinalAssessment(
      companiesAnalysis,
      crossAnalysis,
      indicators
    );

    // Enhance with comprehensive analysis
    const enhancedAssessment: CartelRiskAssessment = {
      ...baseAssessment,
      comprehensiveAnalysis,
      analysisCompletedAt: new Date(),
      evidenceSummary: `Comprehensive analysis of ${companiesAnalysis.length} companies using ${indicators.length} indicators with ${comprehensiveAnalysis.openSourceIntelligence.totalSources} open source references.`,
    };

    // Add comprehensive findings
    if (
      comprehensiveAnalysis.openSourceIntelligence.suspiciousActivities.length >
      0
    ) {
      enhancedAssessment.keyFindings.push(
        `${comprehensiveAnalysis.openSourceIntelligence.suspiciousActivities.length} suspicious activities detected in news sources`
      );
    }

    if (
      comprehensiveAnalysis.openSourceIntelligence.regulatoryActions.length > 0
    ) {
      enhancedAssessment.keyFindings.push(
        `${comprehensiveAnalysis.openSourceIntelligence.regulatoryActions.length} regulatory actions found`
      );
    }

    if (comprehensiveAnalysis.pricingAnalysis.pricingAnomalies.length > 0) {
      enhancedAssessment.keyFindings.push(
        `Pricing anomalies detected: ${comprehensiveAnalysis.pricingAnalysis.pricingAnomalies.join(
          ", "
        )}`
      );
    }

    // Generate frontend-compatible search results
    const searchResults =
      this.convertAnalysisToSearchResults(enhancedAssessment);

    // Debug logging
    logger.info(`Generated ${searchResults.length} search results`);
    if (searchResults.length > 0) {
      logger.info(
        `First result has detailedDescription: ${!!searchResults[0]
          .detailedDescription}`
      );
      logger.info(
        `First result detailedDescription length: ${
          searchResults[0].detailedDescription?.length || 0
        }`
      );
    }

    // Return enhanced assessment with proper results format
    return {
      ...enhancedAssessment,
      results: searchResults, // Frontend-compatible results
      analysisResults: enhancedAssessment, // Full analysis for detailed view
    };
  }

  private isRelevantEvidence(
    item: any,
    companyName: string,
    indicator: string
  ): boolean {
    const text = `${item.title} ${item.snippet}`.toLowerCase();
    const company = companyName.toLowerCase();
    const indicatorWords = indicator.toLowerCase().split(" ");

    const hasCompany = text.includes(company);
    const hasIndicator = indicatorWords.some((word) => text.includes(word));
    const hasCartelKeywords = [
      "cartel",
      "price fixing",
      "collusion",
      "antitrust",
      "monopoly",
    ].some((keyword) => text.includes(keyword));

    return hasCompany && (hasIndicator || hasCartelKeywords);
  }

  private isSuspiciousActivity(news: any): boolean {
    const suspiciousKeywords = [
      "investigation",
      "lawsuit",
      "fine",
      "penalty",
      "violation",
      "price fixing",
      "cartel",
      "collusion",
      "antitrust",
    ];

    const text = `${news.title} ${news.snippet}`.toLowerCase();
    return suspiciousKeywords.some((keyword) => text.includes(keyword));
  }

  private isRegulatoryAction(news: any): boolean {
    const regulatoryKeywords = [
      "regulatory",
      "commission",
      "authority",
      "court",
      "ruling",
      "investigation",
      "enforcement",
      "violation",
      "compliance",
    ];

    const text = `${news.title} ${news.snippet}`.toLowerCase();
    return regulatoryKeywords.some((keyword) => text.includes(keyword));
  }

  private async generateMarketAnalysisInsights(
    companies: CompanyData[],
    openSourceResults: any[]
  ) {
    // This would typically involve more sophisticated analysis
    return {
      totalMarketSize: "Analysis based on available data",
      marketConcentration:
        companies.length <= 3
          ? "High"
          : companies.length <= 5
          ? "Medium"
          : "Low",
      competitiveIntensity: "High",
      barrierToEntry: "Medium",
      regulatoryEnvironment: "Active monitoring recommended",
    };
  }

  /**
   * Convert comprehensive analysis results to frontend-compatible search results format
   */
  private convertAnalysisToSearchResults(
    assessment: CartelRiskAssessment
  ): any[] {
    const searchResults = [];

    logger.info(
      `Converting analysis to search results. Companies: ${
        assessment.companiesAnalysis?.length || 0
      }`
    );

    // Process each company's analysis
    for (const companyAnalysis of assessment.companiesAnalysis || []) {
      logger.info(`Processing company: ${companyAnalysis.companyName}`);
      logger.info(
        `Company indicators:`,
        JSON.stringify(companyAnalysis.indicators, null, 2)
      );

      if (companyAnalysis.indicators) {
        // Process each indicator for this company
        for (const [indicatorName, indicatorData] of Object.entries(
          companyAnalysis.indicators
        )) {
          if (typeof indicatorData === "object" && indicatorData !== null) {
            const indicator = indicatorData as any;

            logger.info(
              `Processing indicator: ${indicatorName}, detected: ${indicator.detected}`
            );

            // Only include detected indicators
            if (indicator.detected) {
              const detailedDescription = this.generateDetailedDescription(
                indicatorName,
                indicator,
                companyAnalysis.companyName
              );

              logger.info(
                `Generated detailed description length: ${detailedDescription.length}`
              );

              searchResults.push({
                indicator: indicatorName,
                category: this.getIndicatorCategory(indicatorName),
                riskScore: Math.min(
                  5,
                  Math.max(
                    1,
                    Math.round((indicator.riskContribution || 50) / 20)
                  )
                ), // Convert 0-100 to 1-5 scale
                confidence: indicator.confidence,
                evidence: this.formatEvidenceForFrontend(
                  indicator.evidence,
                  companyAnalysis.companyName
                ),
                summary:
                  indicator.details ||
                  `${indicatorName} detected for ${companyAnalysis.companyName}`,
                detailedDescription,
                companyName: companyAnalysis.companyName,
                riskContribution: indicator.riskContribution || 50,
              });
            }
          }
        }
      }
    }

    logger.info(`Total search results generated: ${searchResults.length}`);

    // Sort by risk score and confidence
    return searchResults.sort((a, b) => {
      if (a.riskScore !== b.riskScore) {
        return b.riskScore - a.riskScore; // Higher risk first
      }
      return b.confidence - a.confidence; // Higher confidence first
    });
  }

  /**
   * Generate detailed descriptions for each risk indicator
   */
  private generateDetailedDescription(
    indicatorName: string,
    indicatorData: any,
    companyName: string
  ): string {
    const baseDescriptions: { [key: string]: string } = {
      "Price Fixing": `Price fixing involves coordination between competitors to set, raise, or maintain prices at artificial levels. This cartel behavior eliminates price competition and harms consumers by keeping prices higher than they would be in a competitive market.`,

      "Market Division": `Market division occurs when competitors divide up customers, territories, or product lines among themselves to avoid competition. This practice reduces consumer choice and can lead to higher prices and reduced innovation.`,

      "Bid Rigging": `Bid rigging is a form of fraud where competitors conspire to manipulate the bidding process. Common schemes include cover bidding, bid suppression, and complementary bidding, all designed to predetermine the winning bid.`,

      "Output Restrictions": `Output restrictions involve agreements to limit production or supply to maintain higher prices. This cartel behavior artificially creates scarcity in the market, leading to inflated prices and reduced consumer welfare.`,

      "Information Exchange": `Suspicious information exchange between competitors can facilitate cartel coordination. When companies share sensitive commercial data like prices, costs, or strategic plans, it can enable price fixing and market allocation.`,

      "Suspicious Communication": `Regular communication patterns between competitors, especially through trade associations or informal meetings, can indicate cartel coordination. Such communication may facilitate price fixing, market division, or other anti-competitive practices.`,

      "Suspicious benchmarking": `While legitimate benchmarking is normal, suspicious benchmarking involves coordinated price setting or strategic alignment that goes beyond normal competitive intelligence. This can indicate underlying cartel agreements.`,

      "Geographic clustering": `Geographic clustering combined with market division can indicate territorial allocation agreements between competitors. This practice reduces competition within specific regions and can lead to localized price inflation.`,
    };

    const baseDescription =
      baseDescriptions[indicatorName] ||
      `${indicatorName} represents a potential cartel risk indicator that requires further investigation and regulatory attention.`;

    const specificEvidence =
      indicatorData.evidence && indicatorData.evidence.length > 0
        ? `\n\nSpecific Evidence Found for ${companyName}:\n• ${indicatorData.evidence.join(
            "\n• "
          )}`
        : "";

    const confidenceNote = `\n\nDetection Confidence: ${Math.round(
      indicatorData.confidence * 100
    )}%`;

    const riskNote = indicatorData.riskContribution
      ? `\nRisk Contribution: This indicator contributes ${indicatorData.riskContribution}% to the overall cartel risk assessment.`
      : "";

    const regulatoryImplication = this.getRegulatoryImplication(indicatorName);

    return `${baseDescription}${specificEvidence}${confidenceNote}${riskNote}\n\n${regulatoryImplication}`;
  }

  /**
   * Get regulatory implications for each indicator type
   */
  private getRegulatoryImplication(indicatorName: string): string {
    const implications: { [key: string]: string } = {
      "Price Fixing":
        "Regulatory Implications: Price fixing is illegal under antitrust laws in most jurisdictions and can result in significant fines, criminal prosecution for individuals, and civil liability. Companies found guilty may face penalties up to 10% of annual turnover.",

      "Market Division":
        "Regulatory Implications: Market division agreements violate competition laws and can lead to substantial fines, forced divestitures, and ongoing regulatory oversight. Such practices are typically treated as per se violations in many jurisdictions.",

      "Bid Rigging":
        "Regulatory Implications: Bid rigging constitutes both antitrust violation and fraud, potentially resulting in criminal prosecution, debarment from government contracts, civil damages, and significant financial penalties.",

      "Output Restrictions":
        "Regulatory Implications: Output restriction agreements are serious antitrust violations that can result in hefty fines, structural remedies to restore competition, and potential criminal sanctions for involved executives.",

      "Information Exchange":
        "Regulatory Implications: While some information sharing may be legitimate, suspicious patterns can violate antitrust laws. Regulators may impose compliance programs, monitoring requirements, and penalties depending on the scope and intent.",

      "Suspicious Communication":
        "Regulatory Implications: Regular coordination between competitors can constitute evidence of broader cartel activity. Regulators may launch dawn raids, request extensive documentation, and impose behavioral remedies.",

      "Suspicious benchmarking":
        "Regulatory Implications: Coordinated benchmarking that facilitates price alignment may violate competition laws. Regulators may require transparency measures and independent oversight of benchmarking activities.",

      "Geographic clustering":
        "Regulatory Implications: Geographic market division can result in market allocation violations, leading to structural remedies, behavioral constraints, and ongoing regulatory monitoring of market activities.",
    };

    return (
      implications[indicatorName] ||
      "Regulatory Implications: This indicator warrants regulatory investigation and may result in enforcement action if cartel behavior is confirmed."
    );
  }

  /**
   * Format evidence for frontend display
   */
  private formatEvidenceForFrontend(
    evidence: string[] | undefined,
    companyName: string
  ): any[] {
    if (!evidence || !Array.isArray(evidence)) {
      return [];
    }

    return evidence.map((item, index) => ({
      source: `Analysis Evidence ${index + 1}`,
      url: "#", // Placeholder - could link to detailed analysis
      content: item,
      timestamp: new Date(),
      relevanceScore: 0.8, // Default relevance score
    }));
  }

  /**
   * Get category for indicator
   */
  private getIndicatorCategory(indicatorName: string): string {
    const categories: { [key: string]: string } = {
      "Price Fixing": "Pricing Coordination",
      "Market Division": "Market Allocation",
      "Bid Rigging": "Bidding Manipulation",
      "Output Restrictions": "Supply Control",
      "Information Exchange": "Communication",
      "Suspicious Communication": "Communication",
      "Suspicious benchmarking": "Pricing Coordination",
      "Geographic clustering": "Market Allocation",
    };

    return categories[indicatorName] || "Other";
  }

  private async generatePricingAnalysis(pricingData: any[]) {
    const analysis = {
      pricingTables: pricingData,
      pricingTrends: [] as string[],
      pricingAnomalies: [] as string[],
    };

    // Detect pricing patterns and anomalies
    if (pricingData.length > 0) {
      analysis.pricingTrends.push("Pricing data available for analysis");

      // Simple anomaly detection
      const prices = pricingData
        .map((p) => parseFloat(p.price.replace(/[^\d.]/g, "")))
        .filter((p) => !isNaN(p));
      if (prices.length > 1) {
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        const std = Math.sqrt(
          prices.reduce((a, b) => a + (b - avg) ** 2, 0) / prices.length
        );

        if (std < avg * 0.1) {
          analysis.pricingAnomalies.push(
            "Unusually similar pricing detected across sources"
          );
        }
      }
    }

    return analysis;
  }

  private async generateEnhancedCompanySummary(
    company: any,
    analysis: AnalysisResult
  ): Promise<string> {
    const indicatorCount = Object.keys(analysis.indicators).length;
    const detectedCount = Object.values(analysis.indicators).filter(
      (i) => i.detected
    ).length;

    return `Analysis of ${
      company.name
    }: ${detectedCount}/${indicatorCount} indicators detected. Risk score: ${analysis.riskScore.toFixed(
      1
    )}/10. Market position appears ${
      analysis.marketAnalysis?.competitivePosition || "unknown"
    }.`;
  }

  private async generateCompanyRecommendations(
    company: any,
    analysis: AnalysisResult
  ): Promise<string[]> {
    const recommendations = [];

    if (analysis.riskScore > 7) {
      recommendations.push("Immediate detailed investigation recommended");
      recommendations.push("Monitor all pricing and communication activities");
    } else if (analysis.riskScore > 4) {
      recommendations.push("Enhanced monitoring recommended");
      recommendations.push("Regular competitive intelligence gathering");
    } else {
      recommendations.push("Routine monitoring sufficient");
    }

    return recommendations;
  }

  private async generateIndicatorAnalysisDetails(
    company: any,
    indicator: string,
    analysis: any
  ): Promise<string> {
    const evidenceCount = analysis.evidence.length;
    const confidence = (analysis.confidence * 100).toFixed(0);

    if (analysis.detected) {
      return `${indicator} detected for ${company.name} with ${confidence}% confidence. Found ${evidenceCount} pieces of supporting evidence from open source research.`;
    } else {
      return `No clear evidence of ${indicator} found for ${company.name}. Analyzed ${evidenceCount} sources with ${confidence}% confidence level.`;
    }
  }

  // Convert comprehensive analysis to frontend-compatible search results format
  private convertToFrontendResultsFormat(
    analysisResults: any,
    selectedIndicators: any[]
  ): any[] {
    const frontendResults: any[] = [];

    // Convert each indicator analysis to frontend format
    Object.keys(analysisResults.indicatorsSummary || {}).forEach(
      (indicatorId) => {
        const indicatorAnalysis =
          analysisResults.indicatorsSummary[indicatorId];
        const indicatorDefinition = selectedIndicators.find(
          (ind: any) => ind.id === indicatorId
        );

        if (indicatorDefinition) {
          frontendResults.push({
            indicator: indicatorDefinition.indicator,
            category: indicatorDefinition.category,
            riskScore: indicatorDefinition.riskScore,
            confidence: indicatorAnalysis.confidence / 100 || 0, // Convert to decimal
            summary:
              indicatorAnalysis.details ||
              "No specific findings for this indicator",
            evidence:
              indicatorAnalysis.evidence?.map((e: string, index: number) => ({
                source: `Source ${index + 1}`,
                url: "https://example.com", // Placeholder - should be actual source URLs
                content: e,
                timestamp: new Date(),
                relevanceScore: 0.8,
              })) || [],
          });
        }
      }
    );

    // If no indicator-specific results, create summary results from key findings
    if (
      frontendResults.length === 0 &&
      analysisResults.keyFindings?.length > 0
    ) {
      analysisResults.keyFindings.forEach((finding: string, index: number) => {
        frontendResults.push({
          indicator: `Finding ${index + 1}`,
          category: "General Analysis",
          riskScore: Math.ceil(analysisResults.overallRiskScore / 10), // Scale to 1-5
          confidence: 0.8,
          summary: finding,
          evidence: [
            {
              source: "Comprehensive Analysis",
              url: "https://example.com",
              content: finding,
              timestamp: new Date(),
              relevanceScore: 0.9,
            },
          ],
        });
      });
    }

    return frontendResults;
  }
}
