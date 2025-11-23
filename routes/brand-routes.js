import {Router} from "express";
import {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
} from "../controllers/brand-controller.js";
import {authenticateAdmin} from "../middlewares/auth-middleware.js";

const brandRouter = Router();

// Get all brands
brandRouter.get("/", getBrands);

// Get brand by ID
brandRouter.get("/:id", getBrandById);

// Create brand (Admin only)
brandRouter.post("/", authenticateAdmin, createBrand);

// Update brand (Admin only)
brandRouter.put("/:id", authenticateAdmin, updateBrand);

// Delete brand (Admin only)
brandRouter.delete("/:id", authenticateAdmin, deleteBrand);

export {brandRouter};
