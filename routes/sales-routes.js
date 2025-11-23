import express from "express";
import {authenticateToken} from "../middlewares/auth-middleware.js";
import {
  createSale,
  getUserSales,
  getSaleById,
  updateSaleStatus,
  cancelSale,
  getTodaySales,
} from "../controllers/sales-controller.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create a new sale/order
router.post("/", createSale);

// Get today's sales for the authenticated user (cashier) - Must be before /:id route
router.get("/today/summary", getTodaySales);

// Get all sales for the authenticated user
router.get("/", getUserSales);

// Get a specific sale by ID
router.get("/:id", getSaleById);

// Update sale status (admin functionality)
router.patch("/:id/status", updateSaleStatus);

// Cancel a sale
router.patch("/:id/cancel", cancelSale);

export default router;
