import { User, IUser } from "@models/User";
import { logger } from "@utils/logger";
import { FilterQuery } from "mongoose";

export interface IUserRepository {
  create(userData: Partial<IUser>): Promise<IUser>;
  findById(userId: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  findByVerificationToken(token: string): Promise<IUser | null>;
  findByResetToken(token: string): Promise<IUser | null>;
  update(userId: string, userData: Partial<IUser>): Promise<IUser | null>;
  delete(userId: string): Promise<boolean>;
  findWithPagination(
    filter: FilterQuery<IUser>,
    options: { page: number; limit: number },
    sort?: any
  ): Promise<{
    users: IUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>;
  updateLastLogin(userId: string): Promise<IUser | null>;
  markEmailAsVerified(userId: string): Promise<IUser | null>;
  updatePassword(userId: string, hashedPassword: string): Promise<IUser | null>;
  findByRole(role: string): Promise<IUser[]>;
  countUsers(filter?: FilterQuery<IUser>): Promise<number>;
  findActiveUsers(): Promise<IUser[]>;
  findInactiveUsers(days: number): Promise<IUser[]>;
}

export class UserRepository implements IUserRepository {
  async create(userData: Partial<IUser>): Promise<IUser> {
    try {
      const user = new User(userData);
      const savedUser = await user.save();
      logger.info(`User created successfully: ${savedUser.email}`);
      return savedUser;
    } catch (error) {
      logger.error("User repository create error:", error);
      throw error;
    }
  }

  async findById(userId: string): Promise<IUser | null> {
    try {
      return await User.findById(userId).select("-password").lean();
    } catch (error) {
      logger.error("User repository findById error:", error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<IUser | null> {
    try {
      return await User.findOne({ email: email.toLowerCase() });
    } catch (error) {
      logger.error("User repository findByEmail error:", error);
      throw error;
    }
  }

  async findByVerificationToken(token: string): Promise<IUser | null> {
    try {
      return await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() },
      });
    } catch (error) {
      logger.error("User repository findByVerificationToken error:", error);
      throw error;
    }
  }

  async findByResetToken(token: string): Promise<IUser | null> {
    try {
      return await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
      });
    } catch (error) {
      logger.error("User repository findByResetToken error:", error);
      throw error;
    }
  }

  async update(
    userId: string,
    userData: Partial<IUser>
  ): Promise<IUser | null> {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { ...userData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).select("-password");

      if (updatedUser) {
        logger.info(`User updated successfully: ${updatedUser.email}`);
      }

      return updatedUser;
    } catch (error) {
      logger.error("User repository update error:", error);
      throw error;
    }
  }

  async delete(userId: string): Promise<boolean> {
    try {
      const deletedUser = await User.findByIdAndDelete(userId);

      if (deletedUser) {
        logger.info(`User deleted successfully: ${deletedUser.email}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error("User repository delete error:", error);
      throw error;
    }
  }

  async findWithPagination(
    filter: FilterQuery<IUser> = {},
    options: { page: number; limit: number } = { page: 1, limit: 10 },
    sort: any = { createdAt: -1 }
  ) {
    try {
      const skip = (options.page - 1) * options.limit;

      const [users, total] = await Promise.all([
        User.find(filter)
          .select("-password")
          .sort(sort)
          .skip(skip)
          .limit(options.limit)
          .lean(),
        User.countDocuments(filter),
      ]);

      return {
        users: users as IUser[],
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          pages: Math.ceil(total / options.limit),
        },
      };
    } catch (error) {
      logger.error("User repository findWithPagination error:", error);
      throw error;
    }
  }

  async updateLastLogin(userId: string): Promise<IUser | null> {
    try {
      return (await User.findByIdAndUpdate(
        userId,
        {
          lastLogin: new Date(),
          updatedAt: new Date(),
        },
        { new: true }
      )
        .select("-password")
        .lean()
        .exec()) as IUser | null;
    } catch (error) {
      logger.error("User repository updateLastLogin error:", error);
      throw error;
    }
  }

  async markEmailAsVerified(userId: string): Promise<IUser | null> {
    try {
      return await User.findByIdAndUpdate(
        userId,
        {
          isEmailVerified: true,
          emailVerificationToken: undefined,
          emailVerificationExpires: undefined,
          updatedAt: new Date(),
        },
        { new: true }
      )
        .select("-password")
        .lean<IUser>()
        .exec();
    } catch (error) {
      logger.error("User repository markEmailAsVerified error:", error);
      throw error;
    }
  }

  async updatePassword(
    userId: string,
    hashedPassword: string
  ): Promise<IUser | null> {
    try {
      return await User.findByIdAndUpdate(
        userId,
        {
          password: hashedPassword,
          passwordResetToken: undefined,
          passwordResetExpires: undefined,
          passwordChangedAt: new Date(),
          updatedAt: new Date(),
        },
        { new: true }
      )
        .select("password")
        .lean<IUser>()
        .exec();
    } catch (error) {
      logger.error("User repository updatePassword error:", error);
      throw error;
    }
  }

  async findByRole(role: string): Promise<IUser[]> {
    try {
      return await User.find({ role })
        .select("password")
        .sort({ createdAt: -1 });
    } catch (error) {
      logger.error("User repository findByRole error:", error);
      throw error;
    }
  }

  async countUsers(filter: FilterQuery<IUser> = {}): Promise<number> {
    try {
      return await User.countDocuments(filter);
    } catch (error) {
      logger.error("User repository countUsers error:", error);
      throw error;
    }
  }

  async findActiveUsers(): Promise<IUser[]> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      return await User.find({
        $or: [
          { lastLogin: { $gte: thirtyDaysAgo } },
          { createdAt: { $gte: thirtyDaysAgo } },
        ],
        isEmailVerified: true,
        isActive: true,
      })
        .select("password")
        .sort({ lastLogin: -1 });
    } catch (error) {
      logger.error("User repository findActiveUsers error:", error);
      throw error;
    }
  }

  async findInactiveUsers(days: number = 90): Promise<IUser[]> {
    try {
      const inactiveDate = new Date();
      inactiveDate.setDate(inactiveDate.getDate() - days);

      return await User.find({
        $or: [
          { lastLogin: { $lt: inactiveDate } },
          { lastLogin: { $exists: false }, createdAt: { $lt: inactiveDate } },
        ],
        isActive: true,
      })
        .select("password")
        .sort({ lastLogin: 1 });
    } catch (error) {
      logger.error("User repository findInactiveUsers error:", error);
      throw error;
    }
  }

  // Additional utility methods for user management
  async updateProfile(
    userId: string,
    profileData: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      organization?: string;
      bio?: string;
    }
  ): Promise<IUser | null> {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { ...profileData, updatedAt: new Date() },
        { new: true, runValidators: true }
      )
        .select("password")
        .lean<IUser>()
        .exec();
    } catch (error) {
      logger.error("User repository updateProfile error:", error);
      throw error;
    }
  }

  async updateUserSettings(
    userId: string,
    settings: {
      emailNotifications?: boolean;
      marketingEmails?: boolean;
      twoFactorEnabled?: boolean;
      language?: string;
      timezone?: string;
    }
  ): Promise<IUser | null> {
    try {
      return (await User.findByIdAndUpdate(
        userId,
        {
          preferences: settings,
          updatedAt: new Date(),
        },
        { new: true, runValidators: true }
      )
        .select("password")
        .lean<IUser>()
        .exec()) as IUser | null;
    } catch (error) {
      logger.error("User repository updateUserSettings error:", error);
      throw error;
    }
  }

  async setOtp(userId: string, otpCode: string, otpExpires: Date) {
    return User.findByIdAndUpdate(userId, { otpCode, otpExpires }, { new: true });
  }
  async verifyOtp(email: string, otpCode: string) {
    const user = await User.findOne({ email, otpCode, otpExpires: { $gt: new Date() } });
    return user;
  }
  async clearOtp(userId: string) {
    return User.findByIdAndUpdate(userId, { otpCode: undefined, otpExpires: undefined }, { new: true });
  }

  //   async setUserInactive(userId: string): Promise<IUser | null> {
  //     try {
  //       return await User.findByIdAndUpdate(
  //         userId,
  //         {
  //           isActive: false,
  //           updatedAt: new Date(),
  //         },
  //         { new: true }
  //       ).select("-password");
  //     } catch (error) {
  //       logger.error("User repository setUserInactive error:", error);
  //       throw error;
  //     }
  //   }

  //   async setUserActive(userId: string): Promise<IUser | null> {
  //     try {
  //       return await User.findByIdAndUpdate(
  //         userId,
  //         {
  //           isActive: true,
  //           updatedAt: new Date(),
  //         },
  //         { new: true }
  //       ).select("-password");
  //     } catch (error) {
  //       logger.error("User repository setUserActive error:", error);
  //       throw error;
  //     }
  //   }

  async findUsersByEmailDomain(domain: string): Promise<IUser[]> {
    try {
      return await User.find({
        email: { $regex: `@${domain}$`, $options: "i" },
      })
        .select("-password")
        .sort({ createdAt: -1 });
    } catch (error) {
      logger.error("User repository findUsersByEmailDomain error:", error);
      throw error;
    }
  }

  async getUserStatistics(): Promise<{
    total: number;
    verified: number;
    active: number;
    inactive: number;
    admins: number;
    users: number;
    recentRegistrations: number;
  }> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        total,
        verified,
        active,
        inactive,
        admins,
        users,
        recentRegistrations,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isEmailVerified: true }),
        User.countDocuments({
          isActive: true,
          $or: [
            { lastLogin: { $gte: thirtyDaysAgo } },
            { createdAt: { $gte: thirtyDaysAgo } },
          ],
        }),
        User.countDocuments({ isActive: false }),
        User.countDocuments({ role: "admin" }),
        User.countDocuments({ role: "user" }),
        User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      ]);

      return {
        total,
        verified,
        active,
        inactive,
        admins,
        users,
        recentRegistrations,
      };
    } catch (error) {
      logger.error("User repository getUserStatistics error:", error);
      throw error;
    }
  }

  // Bulk operations
  async bulkUpdate(
    filter: FilterQuery<IUser>,
    updateData: Partial<IUser>
  ): Promise<{ modifiedCount: number }> {
    try {
      const result = await User.updateMany(filter, {
        ...updateData,
        updatedAt: new Date(),
      });

      logger.info(
        `Bulk update completed: ${result.modifiedCount} users modified`
      );
      return { modifiedCount: result.modifiedCount || 0 };
    } catch (error) {
      logger.error("User repository bulkUpdate error:", error);
      throw error;
    }
  }

  async bulkDelete(
    filter: FilterQuery<IUser>
  ): Promise<{ deletedCount: number }> {
    try {
      const result = await User.deleteMany(filter);

      logger.info(
        `Bulk delete completed: ${result.deletedCount} users deleted`
      );
      return { deletedCount: result.deletedCount || 0 };
    } catch (error) {
      logger.error("User repository bulkDelete error:", error);
      throw error;
    }
  }

  // Search functionality
  async searchUsers(
    query: string,
    options: { page: number; limit: number } = { page: 1, limit: 10 }
  ) {
    try {
      const searchRegex = new RegExp(query, "i");
      const filter = {
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
          { organization: searchRegex },
        ],
      };

      return await this.findWithPagination(filter, options);
    } catch (error) {
      logger.error("User repository searchUsers error:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
export default userRepository;
