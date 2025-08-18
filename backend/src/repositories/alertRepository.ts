import { Alert, IAlert } from "@models/Alert";
import { logger } from "@utils/logger";
import { FilterQuery } from "mongoose";

export interface IAlertRepository {
  create(alertData: Partial<IAlert>): Promise<IAlert>;
  findById(alertId: string): Promise<IAlert | null>;
  findByUserId(userId: string): Promise<IAlert[]>;
  update(alertId: string, updateData: Partial<IAlert>): Promise<IAlert | null>;
  delete(alertId: string): Promise<boolean>;
  findWithPagination(
    filter: FilterQuery<IAlert>,
    options: { page: number; limit: number },
    sort?: any
  ): Promise<{
    alerts: IAlert[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>;
  updateMany(
    filter: FilterQuery<IAlert>,
    updateData: Partial<IAlert>
  ): Promise<{ modifiedCount: number }>;
  deleteMany(filter: FilterQuery<IAlert>): Promise<{ deletedCount: number }>;
  countUnreadAlerts(userId: string): Promise<number>;
  findRecentAlerts(userId: string, days: number): Promise<IAlert[]>;
}

export class AlertRepository implements IAlertRepository {
  async create(alertData: Partial<IAlert>): Promise<IAlert> {
    try {
      const alert = new Alert(alertData);
      const savedAlert = await alert.save();
      logger.info(`Alert created successfully for user: ${savedAlert.userId}`);
      return savedAlert;
    } catch (error) {
      logger.error("Alert repository create error:", error);
      throw error;
    }
  }

  async findById(alertId: string): Promise<IAlert | null> {
    try {
      return await Alert.findById(alertId)
        .populate("relatedSearchId", "companyNames searchDate status")
        .populate("relatedProjectId", "name description");
    } catch (error) {
      logger.error("Alert repository findById error:", error);
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<IAlert[]> {
    try {
      return await Alert.find({ userId })
        .sort({ createdAt: -1 })
        .populate("relatedSearchId", "companyNames searchDate status")
        .populate("relatedProjectId", "name description");
    } catch (error) {
      logger.error("Alert repository findByUserId error:", error);
      throw error;
    }
  }

  async update(
    alertId: string,
    updateData: Partial<IAlert>
  ): Promise<IAlert | null> {
    try {
      const updatedAlert = await Alert.findByIdAndUpdate(
        alertId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (updatedAlert) {
        logger.info(`Alert updated successfully: ${alertId}`);
      }

      return updatedAlert;
    } catch (error) {
      logger.error("Alert repository update error:", error);
      throw error;
    }
  }

  async delete(alertId: string): Promise<boolean> {
    try {
      const deletedAlert = await Alert.findByIdAndDelete(alertId);

      if (deletedAlert) {
        logger.info(`Alert deleted successfully: ${alertId}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Alert repository delete error:", error);
      throw error;
    }
  }

  async findWithPagination(
    filter: FilterQuery<IAlert> = {},
    options: { page: number; limit: number } = { page: 1, limit: 10 },
    sort: any = { createdAt: -1 }
  ) {
    try {
      const skip = (options.page - 1) * options.limit;

      const [alerts, total] = await Promise.all([
        Alert.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(options.limit)
          .populate("relatedSearchId", "companyNames searchDate status")
          .populate("relatedProjectId", "name description")
          .lean(),
        Alert.countDocuments(filter),
      ]);

      return {
        alerts: alerts as IAlert[],
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          pages: Math.ceil(total / options.limit),
        },
      };
    } catch (error) {
      logger.error("Alert repository findWithPagination error:", error);
      throw error;
    }
  }

  async updateMany(
    filter: FilterQuery<IAlert>,
    updateData: Partial<IAlert>
  ): Promise<{ modifiedCount: number }> {
    try {
      const result = await Alert.updateMany(filter, {
        ...updateData,
        updatedAt: new Date(),
      });

      logger.info(
        `Bulk alert update completed: ${result.modifiedCount} alerts modified`
      );
      return { modifiedCount: result.modifiedCount || 0 };
    } catch (error) {
      logger.error("Alert repository updateMany error:", error);
      throw error;
    }
  }

  async deleteMany(
    filter: FilterQuery<IAlert>
  ): Promise<{ deletedCount: number }> {
    try {
      const result = await Alert.deleteMany(filter);

      logger.info(
        `Bulk alert delete completed: ${result.deletedCount} alerts deleted`
      );
      return { deletedCount: result.deletedCount || 0 };
    } catch (error) {
      logger.error("Alert repository deleteMany error:", error);
      throw error;
    }
  }

  async countUnreadAlerts(userId: string): Promise<number> {
    try {
      return await Alert.countDocuments({ userId, isRead: false });
    } catch (error) {
      logger.error("Alert repository countUnreadAlerts error:", error);
      throw error;
    }
  }

  async findRecentAlerts(userId: string, days: number = 7): Promise<IAlert[]> {
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

      return await Alert.find({
        userId,
        createdAt: { $gte: dateThreshold },
      })
        .sort({ createdAt: -1 })
        .populate("relatedSearchId", "companyNames searchDate status")
        .populate("relatedProjectId", "name description");
    } catch (error) {
      logger.error("Alert repository findRecentAlerts error:", error);
      throw error;
    }
  }

  async findByType(userId: string, type: IAlert["type"]): Promise<IAlert[]> {
    try {
      return await Alert.find({ userId, type })
        .sort({ createdAt: -1 })
        .populate("relatedSearchId", "companyNames searchDate status")
        .populate("relatedProjectId", "name description");
    } catch (error) {
      logger.error("Alert repository findByType error:", error);
      throw error;
    }
  }

  async getAlertStatistics(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
    recent: number;
  }> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [total, unread, typeStats, recent] = await Promise.all([
        Alert.countDocuments({ userId }),
        Alert.countDocuments({ userId, isRead: false }),
        Alert.aggregate([
          { $match: { userId } },
          { $group: { _id: "$type", count: { $sum: 1 } } },
          { $project: { type: "$_id", count: 1, _id: 0 } },
        ]),
        Alert.countDocuments({
          userId,
          createdAt: { $gte: sevenDaysAgo },
        }),
      ]);

      const byType: Record<string, number> = {};
      typeStats.forEach((stat: any) => {
        byType[stat.type] = stat.count;
      });

      return {
        total,
        unread,
        byType,
        recent,
      };
    } catch (error) {
      logger.error("Alert repository getAlertStatistics error:", error);
      throw error;
    }
  }

  async deleteOldAlerts(days: number = 90): Promise<{ deletedCount: number }> {
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

      const result = await Alert.deleteMany({
        createdAt: { $lt: dateThreshold },
        isRead: true,
      });

      logger.info(`Old alerts cleanup: ${result.deletedCount} alerts deleted`);
      return { deletedCount: result.deletedCount || 0 };
    } catch (error) {
      logger.error("Alert repository deleteOldAlerts error:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const alertRepository = new AlertRepository();
export default alertRepository;
