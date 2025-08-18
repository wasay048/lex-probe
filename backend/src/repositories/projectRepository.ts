import { Project, IProject } from "@models/Project";
import { logger } from "@utils/logger";

export class ProjectRepository {
  async create(projectData: Partial<IProject>): Promise<IProject> {
    try {
      const project = new Project(projectData);
      return await project.save();
    } catch (error) {
      logger.error("Project repository create error:", error);
      throw error;
    }
  }

  async findById(id: string): Promise<IProject | null> {
    try {
      logger.debug(
        `ProjectRepository.findById: Searching for project with ID: ${id}`
      );
      const result = await Project.findById(id);
      logger.debug(
        `ProjectRepository.findById: Found project: ${
          result ? result.name : "null"
        }`
      );
      return result;
    } catch (error) {
      logger.error("Project repository findById error:", error);
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<IProject[]> {
    try {
      return await Project.find({ userId, isActive: true }).sort({
        updatedAt: -1,
      });
    } catch (error) {
      logger.error("Project repository findByUserId error:", error);
      throw error;
    }
  }

  async update(
    id: string,
    updates: Partial<IProject>
  ): Promise<IProject | null> {
    try {
      return await Project.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      );
    } catch (error) {
      logger.error("Project repository update error:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await Project.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      logger.error("Project repository delete error:", error);
      throw error;
    }
  }

  async addSearchId(
    projectId: string,
    searchId: string
  ): Promise<IProject | null> {
    try {
      return await Project.findByIdAndUpdate(
        projectId,
        {
          $addToSet: { searchIds: searchId },
          updatedAt: new Date(),
        },
        { new: true }
      );
    } catch (error) {
      logger.error("Project repository addSearchId error:", error);
      throw error;
    }
  }

  async removeSearchId(
    projectId: string,
    searchId: string
  ): Promise<IProject | null> {
    try {
      return await Project.findByIdAndUpdate(
        projectId,
        {
          $pull: { searchIds: searchId },
          updatedAt: new Date(),
        },
        { new: true }
      );
    } catch (error) {
      logger.error("Project repository removeSearchId error:", error);
      throw error;
    }
  }

  async findWithPagination(
    filter: any = {},
    options: { page: number; limit: number } = { page: 1, limit: 10 },
    sort: any = { updatedAt: -1 }
  ) {
    try {
      const skip = (options.page - 1) * options.limit;

      const [projects, total] = await Promise.all([
        Project.find(filter).sort(sort).skip(skip).limit(options.limit),
        Project.countDocuments(filter),
      ]);

      return {
        projects,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          pages: Math.ceil(total / options.limit),
        },
      };
    } catch (error) {
      logger.error("Project repository findWithPagination error:", error);
      throw error;
    }
  }

  async findByTag(tag: string, userId?: string): Promise<IProject[]> {
    try {
      const filter: any = { tags: tag, isActive: true };
      if (userId) {
        filter.userId = userId;
      }

      return await Project.find(filter).sort({ updatedAt: -1 });
    } catch (error) {
      logger.error("Project repository findByTag error:", error);
      throw error;
    }
  }

  async searchByName(searchTerm: string, userId?: string): Promise<IProject[]> {
    try {
      const filter: any = {
        name: { $regex: searchTerm, $options: "i" },
        isActive: true,
      };
      if (userId) {
        filter.userId = userId;
      }

      return await Project.find(filter).sort({ updatedAt: -1 });
    } catch (error) {
      logger.error("Project repository searchByName error:", error);
      throw error;
    }
  }

  async getProjectStats(userId?: string) {
    try {
      const matchStage = userId
        ? { $match: { userId, isActive: true } }
        : { $match: { isActive: true } };

      const stats = await Project.aggregate([
        matchStage,
        {
          $group: {
            _id: null,
            totalProjects: { $sum: 1 },
            totalSearches: { $sum: { $size: "$searchIds" } },
            averageSearchesPerProject: { $avg: { $size: "$searchIds" } },
          },
        },
      ]);

      return (
        stats[0] || {
          totalProjects: 0,
          totalSearches: 0,
          averageSearchesPerProject: 0,
        }
      );
    } catch (error) {
      logger.error("Project repository getProjectStats error:", error);
      throw error;
    }
  }

  async getUserSharedProjects(userId: string): Promise<IProject[]> {
    try {
      return await Project.find({
        "sharedWith.userId": userId,
        isActive: true,
      }).sort({ updatedAt: -1 });
    } catch (error) {
      logger.error("Project repository getUserSharedProjects error:", error);
      throw error;
    }
  }
}
