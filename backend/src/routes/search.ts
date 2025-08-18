import { Router } from "express";
import { SearchController } from "@controllers/searchController";
import { authenticate } from "@middleware/auth";
import { searchLimiter } from "@middleware/rateLimiter";
import {
  validateSearchRequest,
  handleValidationErrors,
} from "@middleware/validation";

const router = Router();
const searchController = new SearchController();

// All search routes require authentication
router.use(authenticate);

// Get risk indicators (no rate limiting for reference data)
router.get("/risk-indicators", searchController.getRiskIndicators);

// Create new search (rate limited)
router.post(
  "/execute",
  searchLimiter,
  validateSearchRequest,
  handleValidationErrors,
  searchController.createSearch
);
// Get user's searches with pagination and filtering
router.get("/", searchController.getUserSearches);

// Get specific search by ID
router.get("/:searchId", searchController.getSearchById);

// Get search status (for polling)
router.get("/:searchId/status", searchController.getSearchStatus);

// Generate AI summary for search results
router.post("/:searchId/ai-summary", searchController.generateAISummary);

// Delete search
router.delete("/:searchId", searchController.deleteSearch);

export default router;
