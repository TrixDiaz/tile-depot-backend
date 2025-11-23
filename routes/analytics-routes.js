import express from "express";
import {authenticateToken} from "../middlewares/auth-middleware.js";
import {
  testAnalytics,
  getDashboardStats,
  getSalesAnalytics,
  getProductAnalytics,
  getSalesByCashier,
  getTodayTotalSales,
  getCategoryDistribution,
  getRecentActivity,
} from "../controllers/analytics-controller.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Test endpoint (for debugging)
router.get("/test", testAnalytics);

// Dashboard statistics
router.get("/dashboard/stats", getDashboardStats);

// Sales analytics by period
router.get("/sales", getSalesAnalytics);

// Product analytics (top products)
router.get("/products", getProductAnalytics);

// Sales by cashier/user
router.get("/sales-by-cashier", getSalesByCashier);

// Today's total sales (all users) - for admin
router.get("/today", getTodayTotalSales);

// Category distribution
router.get("/category-distribution", getCategoryDistribution);

// Recent activity
router.get("/recent-activity", getRecentActivity);

export default router;
