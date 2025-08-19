const {
  CartelAnalysisService,
} = require("./dist/services/cartelAnalysisService");
const logger = require("./dist/utils/logger").default;

async function debugAnalysis() {
  try {
    logger.info("Starting debug analysis...");

    const analysisService = new CartelAnalysisService();

    // Mock companies data
    const companies = [
      {
        name: "Company A",
        website: "https://example.com",
        industry: "Technology",
      },
      {
        name: "Company B",
        website: "https://example2.com",
        industry: "Technology",
      },
    ];

    // Mock indicators
    const indicators = [
      "Price Fixing",
      "Market Division",
      "Suspicious benchmarking",
    ];

    logger.info("Companies:", JSON.stringify(companies, null, 2));
    logger.info("Indicators:", JSON.stringify(indicators, null, 2));

    // Test the analysis
    const results = await analysisService.analyzeCartelRisk(
      "test-search-id",
      companies,
      indicators
    );

    logger.info("Analysis Results:", JSON.stringify(results, null, 2));

    if (results.results && results.results.length > 0) {
      logger.info(
        "First result detailedDescription:",
        results.results[0].detailedDescription
      );
    } else {
      logger.info("No results found in the analysis");
    }
  } catch (error) {
    logger.error("Debug analysis failed:", error);
  }
}

debugAnalysis();
