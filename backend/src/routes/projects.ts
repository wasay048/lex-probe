import { Router } from "express";
import { ProjectController } from "@controllers/projectController";
import { authenticate } from "@middleware/auth";
import {
  validateProjectCreation,
  handleValidationErrors,
} from "@middleware/validation";

const router = Router();
const projectController = new ProjectController();

// All project routes require authentication
router.use(authenticate);

// Create new project
router.post(
  "/",
  validateProjectCreation,
  handleValidationErrors,
  projectController.createProject
);

// Get user's projects with pagination and filtering
router.get("/", projectController.getUserProjects);

// Get specific project by ID
router.get("/:projectId", projectController.getProjectById);

// Update project
router.put(
  "/:projectId",
  validateProjectCreation,
  handleValidationErrors,
  projectController.updateProject
);

// Delete project
router.delete("/:projectId", projectController.deleteProject);

// Add search to project
router.post("/:projectId/searches", projectController.addSearchToProject);

// Remove search from project
router.delete(
  "/:projectId/searches/:searchId",
  projectController.removeSearchFromProject
);

export default router;
