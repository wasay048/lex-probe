import axios from "axios";
import { logger } from "@utils/logger";
import { environment } from "@config/environment";

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
  date?: string;
  relevanceScore: number;
}

interface NewsArticle {
  title: string;
  link: string;
  snippet: string;
  source: string;
  date: string;
  thumbnail?: string;
}

interface PricingData {
  company: string;
  product: string;
  price: string;
  currency: string;
  source: string;
  date: string;
  location?: string;
}

interface ComprehensiveSearchResult {
  query: string;
  webResults: SearchResult[];
  newsResults: NewsArticle[];
  pricingData: PricingData[];
  totalResults: number;
  searchTime: number;
  sources: string[];
}

export class SerpService {
  private serpApiKey: string;
  private baseUrl = "https://serpapi.com/search.json";

  constructor() {
    this.serpApiKey = process.env.SERP_API_KEY || "";
    if (!this.serpApiKey) {
      logger.warn(
        "SERP API key not provided. Open source research will be limited."
      );
    }
  }

  async comprehensiveSearch(
    companies: string[],
    indicator: string,
    searchTerms: string[]
  ): Promise<ComprehensiveSearchResult> {
    const startTime = Date.now();
    const allResults: ComprehensiveSearchResult = {
      query: `${companies.join(" vs ")} ${indicator}`,
      webResults: [],
      newsResults: [],
      pricingData: [],
      totalResults: 0,
      searchTime: 0,
      sources: [],
    };

    try {
      // Generate comprehensive search queries
      const queries = this.generateSearchQueries(
        companies,
        indicator,
        searchTerms
      );

      for (const query of queries) {
        // Web search
        const webResults = await this.performWebSearch(query);
        allResults.webResults.push(...webResults);

        // News search
        const newsResults = await this.performNewsSearch(query);
        allResults.newsResults.push(...newsResults);

        // Pricing search (if relevant to indicator)
        if (this.isPricingRelated(indicator)) {
          const pricingData = await this.searchPricingData(companies, query);
          allResults.pricingData.push(...pricingData);
        }

        // Add delay to respect rate limits
        await this.delay(500);
      }

      // Remove duplicates and sort by relevance
      allResults.webResults = this.deduplicateAndSort(allResults.webResults);
      allResults.newsResults = this.deduplicateNews(allResults.newsResults);
      allResults.pricingData = this.deduplicatePricing(allResults.pricingData);

      // Extract unique sources
      allResults.sources = this.extractUniqueSources([
        ...allResults.webResults,
        ...allResults.newsResults,
      ]);

      allResults.totalResults =
        allResults.webResults.length + allResults.newsResults.length;
      allResults.searchTime = Date.now() - startTime;

      logger.info(
        `SERP search completed: ${allResults.totalResults} results in ${allResults.searchTime}ms`
      );
      return allResults;
    } catch (error) {
      logger.error("SERP search error:", error);
      allResults.searchTime = Date.now() - startTime;
      return allResults;
    }
  }

  private generateSearchQueries(
    companies: string[],
    indicator: string,
    searchTerms: string[]
  ): string[] {
    const queries: string[] = [];
    const companyPairs = this.generateCompanyPairs(companies);

    // Basic queries
    queries.push(`"${companies.join('" "')}" "${indicator}"`);

    // Company vs company queries
    for (const pair of companyPairs) {
      queries.push(`"${pair[0]}" vs "${pair[1]}" ${indicator}`);
      queries.push(`"${pair[0]}" "${pair[1]}" competition ${indicator}`);
    }

    // Industry-specific queries
    queries.push(`${companies.join(" ")} industry ${indicator} analysis`);
    queries.push(`${companies.join(" ")} market share ${indicator}`);

    // News and investigation queries
    queries.push(`${companies.join(" ")} investigation ${indicator}`);
    queries.push(`${companies.join(" ")} lawsuit ${indicator}`);
    queries.push(`${companies.join(" ")} regulatory action ${indicator}`);

    // Pricing queries (if relevant)
    if (this.isPricingRelated(indicator)) {
      for (const company of companies) {
        queries.push(
          `"${company}" pricing strategy ${new Date().getFullYear()}`
        );
        queries.push(`"${company}" price increase ${indicator}`);
      }
    }

    return queries.slice(0, 10); // Limit to prevent rate limiting
  }

  private async performWebSearch(query: string): Promise<SearchResult[]> {
    try {
      if (!this.serpApiKey) {
        // Fallback to basic search without SERP API
        return await this.basicWebSearch(query);
      }

      const response = await axios.get(this.baseUrl, {
        params: {
          q: query,
          api_key: this.serpApiKey,
          engine: "google",
          num: 10,
        },
        timeout: 10000,
      });

      const results: SearchResult[] = [];
      const organicResults = response.data.organic_results || [];

      for (const result of organicResults) {
        results.push({
          title: result.title || "",
          link: result.link || "",
          snippet: result.snippet || "",
          source: this.extractDomain(result.link || ""),
          relevanceScore: this.calculateRelevanceScore(result, query),
        });
      }

      return results;
    } catch (error) {
      logger.error("Web search error:", error);
      return [];
    }
  }

  private async performNewsSearch(query: string): Promise<NewsArticle[]> {
    try {
      if (!this.serpApiKey) {
        return [];
      }

      const response = await axios.get(this.baseUrl, {
        params: {
          q: query,
          api_key: this.serpApiKey,
          engine: "google",
          tbm: "nws",
          num: 10,
        },
        timeout: 10000,
      });

      const results: NewsArticle[] = [];
      const newsResults = response.data.news_results || [];

      for (const result of newsResults) {
        results.push({
          title: result.title || "",
          link: result.link || "",
          snippet: result.snippet || "",
          source: result.source || "",
          date: result.date || new Date().toISOString(),
          thumbnail: result.thumbnail,
        });
      }

      return results;
    } catch (error) {
      logger.error("News search error:", error);
      return [];
    }
  }

  private async searchPricingData(
    companies: string[],
    query: string
  ): Promise<PricingData[]> {
    try {
      const pricingData: PricingData[] = [];

      for (const company of companies) {
        const pricingQuery = `"${company}" price list ${new Date().getFullYear()}`;
        const response = await this.performWebSearch(pricingQuery);

        for (const result of response) {
          // Extract pricing information from snippets
          const extractedPrices = this.extractPricingFromText(
            result.snippet,
            company
          );
          pricingData.push(...extractedPrices);
        }
      }

      return pricingData;
    } catch (error) {
      logger.error("Pricing search error:", error);
      return [];
    }
  }

  private async basicWebSearch(query: string): Promise<SearchResult[]> {
    // Fallback search using DuckDuckGo or other free APIs
    try {
      const response = await axios.get(`https://api.duckduckgo.com/`, {
        params: {
          q: query,
          format: "json",
          no_html: "1",
          skip_disambig: "1",
        },
        timeout: 5000,
      });

      const results: SearchResult[] = [];
      const relatedTopics = response.data.RelatedTopics || [];

      for (const topic of relatedTopics.slice(0, 5)) {
        if (topic.FirstURL && topic.Text) {
          results.push({
            title: topic.Text.split(" - ")[0] || topic.Text,
            link: topic.FirstURL,
            snippet: topic.Text,
            source: this.extractDomain(topic.FirstURL),
            relevanceScore: 0.5,
          });
        }
      }

      return results;
    } catch (error) {
      logger.error("Basic web search error:", error);
      return [];
    }
  }

  private generateCompanyPairs(companies: string[]): string[][] {
    const pairs: string[][] = [];
    for (let i = 0; i < companies.length; i++) {
      for (let j = i + 1; j < companies.length; j++) {
        pairs.push([companies[i], companies[j]]);
      }
    }
    return pairs;
  }

  private isPricingRelated(indicator: string): boolean {
    const pricingKeywords = [
      "price",
      "pricing",
      "cost",
      "fee",
      "rate",
      "tariff",
      "charge",
    ];
    return pricingKeywords.some((keyword) =>
      indicator.toLowerCase().includes(keyword)
    );
  }

  private extractPricingFromText(text: string, company: string): PricingData[] {
    const pricingData: PricingData[] = [];

    // Regular expressions for price extraction
    const priceRegex =
      /[\$€£¥][\d,]+(?:\.\d{2})?|\b\d+(?:\.\d{2})?\s*(?:USD|EUR|GBP|JPY|dollars?|euros?|pounds?)\b/gi;
    const matches = text.match(priceRegex);

    if (matches) {
      for (const match of matches) {
        pricingData.push({
          company,
          product: "Product/Service", // Could be enhanced with NLP
          price: match,
          currency: this.extractCurrency(match),
          source: "Web Search",
          date: new Date().toISOString(),
        });
      }
    }

    return pricingData;
  }

  private extractCurrency(priceText: string): string {
    if (
      priceText.includes("$") ||
      priceText.toLowerCase().includes("usd") ||
      priceText.toLowerCase().includes("dollar")
    )
      return "USD";
    if (
      priceText.includes("€") ||
      priceText.toLowerCase().includes("eur") ||
      priceText.toLowerCase().includes("euro")
    )
      return "EUR";
    if (
      priceText.includes("£") ||
      priceText.toLowerCase().includes("gbp") ||
      priceText.toLowerCase().includes("pound")
    )
      return "GBP";
    if (priceText.includes("¥") || priceText.toLowerCase().includes("jpy"))
      return "JPY";
    return "USD"; // Default
  }

  private calculateRelevanceScore(result: any, query: string): number {
    let score = 0.5; // Base score

    const queryWords = query.toLowerCase().split(" ");
    const titleWords = (result.title || "").toLowerCase();
    const snippetWords = (result.snippet || "").toLowerCase();

    // Check title relevance
    for (const word of queryWords) {
      if (titleWords.includes(word)) score += 0.2;
    }

    // Check snippet relevance
    for (const word of queryWords) {
      if (snippetWords.includes(word)) score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  private deduplicateAndSort(results: SearchResult[]): SearchResult[] {
    const unique = results.filter(
      (result, index, self) =>
        index === self.findIndex((r) => r.link === result.link)
    );

    return unique
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20); // Top 20 results
  }

  private deduplicateNews(results: NewsArticle[]): NewsArticle[] {
    const unique = results.filter(
      (result, index, self) =>
        index === self.findIndex((r) => r.link === result.link)
    );

    return unique
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 15); // Top 15 news articles
  }

  private deduplicatePricing(results: PricingData[]): PricingData[] {
    const unique = results.filter(
      (result, index, self) =>
        index ===
        self.findIndex(
          (r) => r.company === result.company && r.price === result.price
        )
    );

    return unique.slice(0, 50); // Top 50 pricing entries
  }

  private extractUniqueSources(
    results: (SearchResult | NewsArticle)[]
  ): string[] {
    const sources = new Set<string>();

    for (const result of results) {
      if (result.source) {
        sources.add(result.source);
      }
    }

    return Array.from(sources).slice(0, 20); // Top 20 unique sources
  }

  private extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace("www.", "");
    } catch {
      return url;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const serpService = new SerpService();
