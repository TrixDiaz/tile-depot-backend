import {Router} from "express";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category-controller.js";
import {authenticateAdmin} from "../middlewares/auth-middleware.js";

const categoryRouter = Router();

// Get all categories
categoryRouter.get("/", getCategories);

// Get category by ID
categoryRouter.get("/:id", getCategoryById);

// Create category (Admin only)
categoryRouter.post("/", authenticateAdmin, createCategory);

// Update category (Admin only)
categoryRouter.put("/:id", authenticateAdmin, updateCategory);

// Delete category (Admin only)
categoryRouter.delete("/:id", authenticateAdmin, deleteCategory);

export {categoryRouter};
