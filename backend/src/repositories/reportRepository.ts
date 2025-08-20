import { Report, IReport } from "@models/Report";
import { logger } from "@utils/logger";
import { FilterQuery } from "mongoose";

export interface IReportRepository {
  create(reportData: Partial<IReport>): Promise<IReport>;
  findById(reportId: string): Promise<IReport | null>;
  findByUserId(
    userId: string,
    options?: { page: number; limit: number }
  ): Promise<{
    reports: IReport[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>;
  update(
    reportId: string,
    updateData: Partial<IReport>
  ): Promise<IReport | null>;
  delete(reportId: string): Promise<boolean>;
  findSharedReports(email: string): Promise<IReport[]>;
  updateDownloadCount(reportId: string): Promise<void>;
  findBySearchId(searchId: string): Promise<IReport[]>;
  findWithPagination(
    filter: FilterQuery<IReport>,
    options: { page: number; limit: number },
    sort?: any
  ): Promise<{
    reports: IReport[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>;
  addSharedWith(reportId: string, sharedWith: any[]): Promise<IReport | null>;
  removeExpiredShares(): Promise<{ modifiedCount: number }>;
}

export class ReportRepository implements IReportRepository {
  async create(reportData: Partial<IReport>): Promise<IReport> {
    try {
      const report = new Report(reportData);
      const savedReport = await report.save();
      logger.info(`Report created successfully: ${savedReport._id}`);
      return savedReport;
    } catch (error) {
      logger.error("Report repository create error:", error);
      throw error;
    }
  }

  async findById(reportId: string): Promise<IReport | null> {
    try {
      const report = await Report.findById(reportId)
        .populate("userId", "firstName lastName email _id")
        .populate({
          path: "searchId",
          select: "companies overallRiskScore status createdAt",
        })
        .lean();

      if (!report) return null;

      // Transform the data to match frontend expectations
      const { searchId, ...reportWithoutSearchId } = report;
      const transformedSearch = searchId
        ? {
            ...(searchId as any),
            companyNames:
              (searchId as any).companies?.map(
                (company: any) => company.name
              ) || [],
          }
        : null;

      const transformedReport = {
        ...reportWithoutSearchId,
        search: transformedSearch, // Add search field for frontend compatibility
      };

      return transformedReport as any; // Use any to bypass strict typing for this transformation
    } catch (error) {
      logger.error("Report repository findById error:", error);
      throw error;
    }
  }

  async findByUserId(
    userId: string,
    options: { page: number; limit: number } = { page: 1, limit: 10 }
  ) {
    try {
      const { page, limit } = options;
      const skip = (page - 1) * limit;

      const [reports, total] = await Promise.all([
        Report.find({ userId })
          .populate({
            path: "searchId",
            select: "companies overallRiskScore status createdAt",
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Report.countDocuments({ userId }),
      ]);

      // Transform the data to match frontend expectations
      const transformedReports = reports.map((report: any) => {
        const { searchId, ...reportWithoutSearchId } = report;
        const transformedSearch = searchId
          ? {
              ...(searchId as any),
              companyNames:
                (searchId as any).companies?.map(
                  (company: any) => company.name
                ) || [],
            }
          : null;

        return {
          ...reportWithoutSearchId,
          search: transformedSearch, // Add search field for frontend compatibility
        };
      });

      return {
        reports: transformedReports as IReport[],
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("Report repository findByUserId error:", error);
      throw error;
    }
  }

  async findBySearchId(searchId: string): Promise<IReport[]> {
    try {
      return await Report.find({ searchId })
        .populate("userId", "firstName lastName email")
        .sort({ createdAt: -1 });
    } catch (error) {
      logger.error("Report repository findBySearchId error:", error);
      throw error;
    }
  }

  async update(
    reportId: string,
    updateData: Partial<IReport>
  ): Promise<IReport | null> {
    try {
      const updatedReport = await Report.findByIdAndUpdate(
        reportId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      )
        .populate("userId", "firstName lastName email")
        .populate("searchId", "companyNames searchDate status riskScore");

      if (updatedReport) {
        logger.info(`Report updated successfully: ${reportId}`);
      }

      return updatedReport;
    } catch (error) {
      logger.error("Report repository update error:", error);
      throw error;
    }
  }

  async delete(reportId: string): Promise<boolean> {
    try {
      const deletedReport = await Report.findByIdAndDelete(reportId);

      if (deletedReport) {
        logger.info(`Report deleted successfully: ${reportId}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Report repository delete error:", error);
      throw error;
    }
  }

  async findWithPagination(
    filter: FilterQuery<IReport> = {},
    options: { page: number; limit: number } = { page: 1, limit: 10 },
    sort: any = { createdAt: -1 }
  ) {
    try {
      const skip = (options.page - 1) * options.limit;

      const [reports, total] = await Promise.all([
        Report.find(filter)
          .populate("userId", "firstName lastName email")
          .populate("searchId", "companyNames searchDate status riskScore")
          .sort(sort)
          .skip(skip)
          .limit(options.limit)
          .lean(),
        Report.countDocuments(filter),
      ]);

      return {
        reports: reports as IReport[],
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          pages: Math.ceil(total / options.limit),
        },
      };
    } catch (error) {
      logger.error("Report repository findWithPagination error:", error);
      throw error;
    }
  }

  async addSharedWith(
    reportId: string,
    sharedWith: any[]
  ): Promise<IReport | null> {
    try {
      return await Report.findByIdAndUpdate(
        reportId,
        {
          $push: { sharedWith: { $each: sharedWith } },
          updatedAt: new Date(),
        },
        { new: true }
      )
        .populate("userId", "firstName lastName email")
        .populate("searchId", "companyNames searchDate status riskScore");
    } catch (error) {
      logger.error("Report repository addSharedWith error:", error);
      throw error;
    }
  }

  async removeExpiredShares(): Promise<{ modifiedCount: number }> {
    try {
      const result = await Report.updateMany(
        { "sharedWith.expiresAt": { $lt: new Date() } },
        {
          $pull: { sharedWith: { expiresAt: { $lt: new Date() } } },
          updatedAt: new Date(),
        }
      );

      logger.info(
        `Removed expired shares: ${result.modifiedCount} reports updated`
      );
      return { modifiedCount: result.modifiedCount || 0 };
    } catch (error) {
      logger.error("Report repository removeExpiredShares error:", error);
      throw error;
    }
  }

  async findSharedReports(email: string): Promise<IReport[]> {
    try {
      return await Report.find({
        "sharedWith.email": email,
        $or: [
          { "sharedWith.expiresAt": { $gt: new Date() } },
          { "sharedWith.expiresAt": { $exists: false } },
        ],
      })
        .populate("userId", "firstName lastName email")
        .populate("searchId", "companyNames searchDate status riskScore")
        .sort({ "sharedWith.sharedAt": -1 });
    } catch (error) {
      logger.error("Report repository findSharedReports error:", error);
      throw error;
    }
  }

  async updateDownloadCount(reportId: string): Promise<void> {
    try {
      await Report.findByIdAndUpdate(reportId, { $inc: { downloadCount: 1 } });
      logger.info(`Download count updated for report: ${reportId}`);
    } catch (error) {
      logger.error("Report repository updateDownloadCount error:", error);
      throw error;
    }
  }

  async getReportStatistics(userId: string): Promise<{
    total: number;
    byFormat: Record<string, number>;
    byStatus: Record<string, number>;
    totalDownloads: number;
    sharedCount: number;
  }> {
    try {
      const [total, formatStats, statusStats, downloadStats, sharedStats] =
        await Promise.all([
          Report.countDocuments({ userId }),
          Report.aggregate([
            { $match: { userId } },
            { $group: { _id: "$format", count: { $sum: 1 } } },
          ]),
          Report.aggregate([
            { $match: { userId } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ]),
          Report.aggregate([
            { $match: { userId } },
            {
              $group: { _id: null, totalDownloads: { $sum: "$downloadCount" } },
            },
          ]),
          Report.countDocuments({ userId, "sharedWith.0": { $exists: true } }),
        ]);

      const byFormat: Record<string, number> = {};
      formatStats.forEach((stat: any) => {
        byFormat[stat._id] = stat.count;
      });

      const byStatus: Record<string, number> = {};
      statusStats.forEach((stat: any) => {
        byStatus[stat._id] = stat.count;
      });

      return {
        total,
        byFormat,
        byStatus,
        totalDownloads: downloadStats[0]?.totalDownloads || 0,
        sharedCount: sharedStats,
      };
    } catch (error) {
      logger.error("Report repository getReportStatistics error:", error);
      throw error;
    }
  }

  async cleanupOldReports(
    days: number = 90
  ): Promise<{ deletedCount: number }> {
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

      const result = await Report.deleteMany({
        createdAt: { $lt: dateThreshold },
        status: "failed",
      });

      logger.info(
        `Old reports cleanup: ${result.deletedCount} reports deleted`
      );
      return { deletedCount: result.deletedCount || 0 };
    } catch (error) {
      logger.error("Report repository cleanupOldReports error:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const reportRepository = new ReportRepository();
export default reportRepository;
