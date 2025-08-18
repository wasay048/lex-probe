import { ProjectRepository } from "@repositories/projectRepository";
import { SearchRepository } from "@repositories/searchRepository";
import { UserRepository } from "@repositories/userRepository";
import { IProject } from "@models/Project";
import { logger } from "@utils/logger";
import { ServiceResponse } from "./authService";
import { log } from "console";

export interface CreateProjectRequest {
  userId: string;
  name: string;
  description?: string;
  tags?: string[];
  searchIds?: string[];
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  tags?: string[];
}

export interface ProjectListOptions {
  page: number;
  limit: number;
  search?: string;
  tags?: string;
}

export class ProjectService {
  private projectRepository: ProjectRepository;
  private searchRepository: SearchRepository;
  private userRepository: UserRepository;

  constructor() {
    this.projectRepository = new ProjectRepository();
    this.searchRepository = new SearchRepository();
    this.userRepository = new UserRepository();
  }

  async createProject(request: CreateProjectRequest): Promise<ServiceResponse> {
    try {
      const { userId, name, description, tags, searchIds } = request;

      // Verify user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      // Validate search IDs if provided
      if (searchIds && searchIds.length > 0) {
        const searches = await this.searchRepository.findByIds(searchIds);
        const foundIds = searches.map((s) => s._id);
        const invalidIds = searchIds.filter((id) => !foundIds.includes(id));

        if (invalidIds.length > 0) {
          return {
            success: false,
            message: `Invalid search IDs: ${invalidIds.join(", ")}`,
          };
        }

        // Check if user owns all the searches
        const unauthorizedSearches = searches.filter(
          (s) => s.userId !== userId
        );
        if (unauthorizedSearches.length > 0) {
          return {
            success: false,
            message: "Unauthorized access to some searches",
          };
        }
      }

      const projectData = {
        userId,
        name,
        description,
        tags: tags || [],
        searchIds: searchIds || [],
        isActive: true,
      };

      const project = await this.projectRepository.create(projectData);

      return {
        success: true,
        message: "Project created successfully",
        data: { project },
      };
    } catch (error) {
      logger.error("Create project service error:", error);
      throw error;
    }
  }

  async getUserProjects(
    userId: string,
    options: ProjectListOptions
  ): Promise<ServiceResponse> {
    try {
      const { page, limit, search, tags } = options;

      const filter: any = { userId, isActive: true };

      // Add search filter
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      // Add tags filter
      if (tags) {
        const tagArray = tags.split(",").map((tag) => tag.trim());
        filter.tags = { $in: tagArray };
      }

      const projects = await this.projectRepository.findWithPagination(
        filter,
        { page, limit },
        { updatedAt: -1 }
      );

      return {
        success: true,
        message: "Projects fetched successfully",
        data: projects,
      };
    } catch (error) {
      logger.error("Get user projects service error:", error);
      throw error;
    }
  }

  async getProjectById(
    projectId: string,
    userId: string
  ): Promise<ServiceResponse> {
    try {
      logger.debug(`Getting project by ID: ${projectId} for user: ${userId}`);
      const project = await this.projectRepository.findById(projectId);

      if (!project) {
        logger.debug(`Project not found: ${projectId}`);
        return {
          success: false,
          message: "Project not found",
        };
      }

      logger.debug(
        `Found project: ${project.name}, userId: ${project.userId}, requesting user: ${userId}`
      );

      // Convert both IDs to strings for comparison
      const projectOwnerIdStr = project.userId.toString();
      const requestingUserIdStr = userId.toString();

      logger.debug(`Owner ID (string): "${projectOwnerIdStr}"`);
      logger.debug(`Requesting ID (string): "${requestingUserIdStr}"`);
      logger.debug(`IDs match: ${projectOwnerIdStr === requestingUserIdStr}`);

      // Check if user owns this project or has access
      if (
        projectOwnerIdStr !== requestingUserIdStr &&
        !this.hasProjectAccess(project, userId)
      ) {
        logger.debug(
          `Access denied for project ${projectId}: owner "${projectOwnerIdStr}" !== requester "${requestingUserIdStr}"`
        );
        return {
          success: false,
          message: "Unauthorized access to project",
        };
      }

      // Populate search details
      const searches = await this.searchRepository.findByIds(project.searchIds);

      return {
        success: true,
        message: "Project fetched successfully",
        data: {
          project: {
            ...project.toObject(),
            searches,
          },
        },
      };
    } catch (error) {
      logger.error("Get project by ID service error:", error);
      throw error;
    }
  }

  async updateProject(
    projectId: string,
    userId: string,
    updates: UpdateProjectRequest
  ): Promise<ServiceResponse> {
    try {
      const project = await this.projectRepository.findById(projectId);

      if (!project) {
        return {
          success: false,
          message: "Project not found",
        };
      }
      logger.debug(`Updating project: ${projectId} by user: ${userId}`);
      logger.debug(`Project details: ${JSON.stringify(project)}`);
      // Check if user owns this project
      if (project.userId !== userId) {
        return {
          success: false,
          message: "Unauthorized access to project",
        };
      }

      const updatedProject = await this.projectRepository.update(
        projectId,
        updates
      );

      return {
        success: true,
        message: "Project updated successfully",
        data: { project: updatedProject },
      };
    } catch (error) {
      logger.error("Update project service error:", error);
      throw error;
    }
  }

  async deleteProject(
    projectId: string,
    userId: string
  ): Promise<ServiceResponse> {
    try {
      const project = await this.projectRepository.findById(projectId);

      if (!project) {
        return {
          success: false,
          message: "Project not found",
        };
      }

      // Check if user owns this project
      if (project.userId !== userId) {
        return {
          success: false,
          message: "Unauthorized access to project",
        };
      }

      // Soft delete by setting isActive to false
      await this.projectRepository.update(projectId, { isActive: false });

      return {
        success: true,
        message: "Project deleted successfully",
      };
    } catch (error) {
      logger.error("Delete project service error:", error);
      throw error;
    }
  }

  async addSearchToProject(
    projectId: string,
    searchId: string,
    userId: string
  ): Promise<ServiceResponse> {
    try {
      logger.info(
        `🔍 AddSearchToProject - ProjectId: ${projectId}, SearchId: ${searchId}, UserId: ${userId}`
      );

      const project = await this.projectRepository.findById(projectId);

      if (!project) {
        logger.warn(`❌ Project not found: ${projectId}`);
        return {
          success: false,
          message: "Project not found",
        };
      }

      logger.info(
        `📁 Project found: ${project.name}, Owner: ${
          project.userId
        }, Type: ${typeof project.userId}`
      );
      logger.info(`👤 Request user: ${userId}, Type: ${typeof userId}`);
      logger.info(
        `🔒 Ownership check: ${project.userId} === ${userId} = ${
          project.userId === userId
        }`
      );
      logger.info(
        `🔒 String comparison: ${String(project.userId)} === ${String(
          userId
        )} = ${String(project.userId) === String(userId)}`
      );

      // Check if user owns this project - use string comparison to handle ObjectId/string mismatch
      // Handle the specific case where JWT user ID might be truncated
      const projectOwnerStr = String(project.userId);
      const requestUserStr = String(userId);

      logger.info(
        `🔧 Project owner string: "${projectOwnerStr}" (length: ${projectOwnerStr.length})`
      );
      logger.info(
        `🔧 Request user string: "${requestUserStr}" (length: ${requestUserStr.length})`
      );

      // Check for exact match or if the shorter ID is contained in the longer one
      const exactMatch = projectOwnerStr === requestUserStr;
      const truncatedMatch =
        projectOwnerStr.includes(requestUserStr) ||
        requestUserStr.includes(projectOwnerStr);
      const isOwner = exactMatch || truncatedMatch;

      logger.info(`🔒 Exact match: ${exactMatch}`);
      logger.info(`🔒 Truncated match: ${truncatedMatch}`);
      logger.info(`🔒 Final ownership result: ${isOwner}`);

      if (!isOwner) {
        logger.warn(
          `❌ Unauthorized project access - Owner: "${project.userId}", User: "${userId}"`
        );
        return {
          success: false,
          message: "Unauthorized access to project",
        };
      }

      // Verify search exists and user owns it
      const search = await this.searchRepository.findById(searchId);
      if (!search) {
        logger.warn(`❌ Search not found: ${searchId}`);
        return {
          success: false,
          message: "Search not found",
        };
      }

      logger.info(
        `🔍 Search found, Owner: ${
          search.userId
        }, Type: ${typeof search.userId}`
      );

      const searchOwnerStr = String(search.userId);
      const searchExactMatch = searchOwnerStr === requestUserStr;
      const searchTruncatedMatch =
        searchOwnerStr.includes(requestUserStr) ||
        requestUserStr.includes(searchOwnerStr);
      const isSearchOwner = searchExactMatch || searchTruncatedMatch;

      logger.info(
        `🔒 Search ownership - Exact: ${searchExactMatch}, Truncated: ${searchTruncatedMatch}, Result: ${isSearchOwner}`
      );

      if (!isSearchOwner) {
        logger.warn(
          `❌ Unauthorized search access - Owner: "${search.userId}", User: "${userId}"`
        );
        return {
          success: false,
          message: "Unauthorized access to search",
        };
      }

      // Check if search is already in project
      logger.info(`🔗 Checking if search ${searchId} is already in project`);
      logger.info(`📋 Project searchIds:`, project.searchIds);
      logger.info(`🔍 Includes check: ${project.searchIds.includes(searchId)}`);

      if (project.searchIds.includes(searchId)) {
        logger.warn(`❌ Search ${searchId} is already in project ${projectId}`);
        return {
          success: false,
          message: "Search is already in this project",
        };
      }

      // Add search to project
      logger.info(`✅ Adding search ${searchId} to project ${projectId}`);
      const updatedProject = await this.projectRepository.addSearchId(
        projectId,
        searchId
      );

      logger.info(`🎉 Successfully added search to project`);
      return {
        success: true,
        message: "Search added to project successfully",
        data: { project: updatedProject },
      };
    } catch (error) {
      logger.error("Add search to project service error:", error);
      throw error;
    }
  }

  async removeSearchFromProject(
    projectId: string,
    searchId: string,
    userId: string
  ): Promise<ServiceResponse> {
    try {
      const project = await this.projectRepository.findById(projectId);

      if (!project) {
        return {
          success: false,
          message: "Project not found",
        };
      }

      // Check if user owns this project
      if (project.userId !== userId) {
        return {
          success: false,
          message: "Unauthorized access to project",
        };
      }

      // Check if search is in project
      if (!project.searchIds.includes(searchId)) {
        return {
          success: false,
          message: "Search is not in this project",
        };
      }

      // Remove search from project
      const updatedProject = await this.projectRepository.removeSearchId(
        projectId,
        searchId
      );

      return {
        success: true,
        message: "Search removed from project successfully",
        data: { project: updatedProject },
      };
    } catch (error) {
      logger.error("Remove search from project service error:", error);
      throw error;
    }
  }

  private hasProjectAccess(project: IProject, userId: string): boolean {
    // Check if project has sharedWith array and user has access
    if (project.sharedWith && Array.isArray(project.sharedWith)) {
      return project.sharedWith.some(
        (share: any) =>
          share.userId === userId &&
          ["read", "write", "admin"].includes(share.permission)
      );
    }
    return false;
  }
}
