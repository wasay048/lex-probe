import { Request, Response } from "express";
import { ProjectService } from "@services/projectService";
import { logger } from "@utils/logger";
import { AuthenticatedRequest } from "@middleware/auth";

export class ProjectController {
  private projectService: ProjectService;

  constructor() {
    this.projectService = new ProjectService();
  }

  createProject = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { name, description, tags, searchIds } = req.body;

      const result = await this.projectService.createProject({
        userId: req.user._id,
        name,
        description,
        tags,
        searchIds,
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      logger.info(`Project created: ${name} by user: ${req.user.email}`);
      res.status(201).json(result);
    } catch (error) {
      logger.error("Create project error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while creating project",
      });
    }
  };

  getUserProjects = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const tags = req.query.tags as string;

      const result = await this.projectService.getUserProjects(req.user._id, {
        page,
        limit,
        search,
        tags,
      });

      res.status(200).json(result);
    } catch (error) {
      logger.error("Get user projects error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while fetching projects",
      });
    }
  };

  getProjectById = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { projectId } = req.params;

      const result = await this.projectService.getProjectById(
        projectId,
        req.user._id
      );

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      logger.error("Get project by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while fetching project",
      });
    }
  };

  updateProject = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { projectId } = req.params;
      const { name, description, tags } = req.body;

      const result = await this.projectService.updateProject(
        projectId,
        req.user._id,
        { name, description, tags }
      );

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      logger.info(`Project updated: ${projectId} by user: ${req.user.email}`);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Update project error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while updating project",
      });
    }
  };

  deleteProject = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { projectId } = req.params;

      const result = await this.projectService.deleteProject(
        projectId,
        req.user._id
      );

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      logger.info(`Project deleted: ${projectId} by user: ${req.user.email}`);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Delete project error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while deleting project",
      });
    }
  };

  addSearchToProject = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { projectId } = req.params;
      const { searchId } = req.body;

      const result = await this.projectService.addSearchToProject(
        projectId,
        searchId,
        req.user._id
      );

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      logger.info(
        `Search ${searchId} added to project: ${projectId} by user: ${req.user.email}`
      );
      res.status(200).json(result);
    } catch (error) {
      logger.error("Add search to project error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while adding search to project",
      });
    }
  };

  removeSearchFromProject = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { projectId, searchId } = req.params;

      const result = await this.projectService.removeSearchFromProject(
        projectId,
        searchId,
        req.user._id
      );

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      logger.info(
        `Search ${searchId} removed from project: ${projectId} by user: ${req.user.email}`
      );
      res.status(200).json(result);
    } catch (error) {
      logger.error("Remove search from project error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error while removing search from project",
      });
    }
  };
}
