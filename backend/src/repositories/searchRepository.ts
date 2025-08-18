import { Search, ISearch } from "@models/Search";
import { logger } from "@utils/logger";

export class SearchRepository {
  async create(searchData: Partial<ISearch>): Promise<ISearch> {
    try {
      const search = new Search(searchData);
      return await search.save();
    } catch (error) {
      logger.error("Search repository create error:", error);
      throw error;
    }
  }

  async findById(id: string): Promise<ISearch | null> {
    try {
      return await Search.findById(id);
    } catch (error) {
      logger.error("Search repository findById error:", error);
      throw error;
    }
  }

  async findByIds(ids: string[]): Promise<ISearch[]> {
    try {
      return await Search.find({ _id: { $in: ids } });
    } catch (error) {
      logger.error("Search repository findByIds error:", error);
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<ISearch[]> {
    try {
      return await Search.find({ userId }).sort({ createdAt: -1 });
    } catch (error) {
      logger.error("Search repository findByUserId error:", error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<ISearch>): Promise<ISearch | null> {
    try {
      return await Search.findByIdAndUpdate(id, updates, { new: true });
    } catch (error) {
      logger.error("Search repository update error:", error);
      throw error;
    }
  }

  async updateStatus(
    id: string,
    status: ISearch["status"]
  ): Promise<ISearch | null> {
    try {
      return await Search.findByIdAndUpdate(
        id,
        { status, updatedAt: new Date() },
        { new: true }
      );
    } catch (error) {
      logger.error("Search repository updateStatus error:", error);
      throw error;
    }
  }

  async updateResults(
    id: string,
    updates: {
      status: ISearch["status"];
      results: ISearch["results"];
      overallRiskScore: number;
      executionTime: number;
    }
  ): Promise<ISearch | null> {
    try {
      return await Search.findByIdAndUpdate(
        id,
        {
          ...updates,
          updatedAt: new Date(),
        },
        { new: true }
      );
    } catch (error) {
      logger.error("Search repository updateResults error:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await Search.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      logger.error("Search repository delete error:", error);
      throw error;
    }
  }

  async findWithPagination(
    filter: any = {},
    options: { page: number; limit: number } = { page: 1, limit: 10 },
    sort: any = { createdAt: -1 }
  ) {
    try {
      const skip = (options.page - 1) * options.limit;

      const [searches, total] = await Promise.all([
        Search.find(filter).sort(sort).skip(skip).limit(options.limit),
        Search.countDocuments(filter),
      ]);

      return {
        searches,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          pages: Math.ceil(total / options.limit),
        },
      };
    } catch (error) {
      logger.error("Search repository findWithPagination error:", error);
      throw error;
    }
  }

  async findByCompanyName(companyName: string): Promise<ISearch[]> {
    try {
      return await Search.find({
        "companies.name": { $regex: companyName, $options: "i" },
      }).sort({ createdAt: -1 });
    } catch (error) {
      logger.error("Search repository findByCompanyName error:", error);
      throw error;
    }
  }

  async findByStatus(status: ISearch["status"]): Promise<ISearch[]> {
    try {
      return await Search.find({ status }).sort({ createdAt: -1 });
    } catch (error) {
      logger.error("Search repository findByStatus error:", error);
      throw error;
    }
  }

  async getSearchStats(userId: string): Promise<any> {
    try {
      const searches = await Search.find({ userId });

      return searches.reduce(
        (stats, search) => ({
          ...stats,
          totalSearches: stats.totalSearches + 1,
          completedSearches:
            stats.completedSearches + (search.status === "completed" ? 1 : 0),
          pendingSearches:
            stats.pendingSearches + (search.status === "pending" ? 1 : 0),
          inProgressSearches:
            stats.inProgressSearches +
            (search.status === "in-progress" ? 1 : 0),
          failedSearches:
            stats.failedSearches + (search.status === "failed" ? 1 : 0),
          averageRiskScore:
            stats.averageRiskScore + (search.overallRiskScore || 0),
          averageExecutionTime: stats.averageExecutionTime,
        }),
        {
          totalSearches: 0,
          completedSearches: 0,
          pendingSearches: 0,
          inProgressSearches: 0,
          failedSearches: 0,
          averageRiskScore: 0,
          averageExecutionTime: 0,
        }
      );
    } catch (error) {
      logger.error("Search repository getSearchStats error:", error);
      throw error;
    }
  }

  // Methods for CartelAnalysisService integration
  async updateSearchStatus(
    searchId: string,
    status: string,
    errorDetails?: any
  ): Promise<ISearch | null> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      if (errorDetails) {
        updateData.errorDetails = errorDetails;
      }

      return await Search.findByIdAndUpdate(searchId, updateData, {
        new: true,
      });
    } catch (error) {
      logger.error(`Failed to update search status for ${searchId}:`, error);
      throw error;
    }
  }

  async updateSearchWithResults(
    searchId: string,
    analysisResults: any
  ): Promise<ISearch | null> {
    try {
      const updateData = {
        status: "completed",
        results: analysisResults.results || [], // Frontend-compatible results
        analysisResults: analysisResults.analysisResults || analysisResults, // Comprehensive analysis
        overallRiskScore: analysisResults.overallRiskScore,
        completedAt: new Date(),
        updatedAt: new Date(),
      };

      return await Search.findByIdAndUpdate(searchId, updateData, {
        new: true,
      });
    } catch (error) {
      logger.error(
        `Failed to update search with results for ${searchId}:`,
        error
      );
      throw error;
    }
  }
}
