import express from "express";
import {
  getProductReviews,
  getUserReviews,
  createReview,
  updateReview,
  deleteReview,
  getReviewableOrders,
} from "../controllers/review-controller.js";
import { authenticateToken } from "../middlewares/auth-middleware.js";

const router = express.Router();

// Get reviews for a product (public)
router.get("/product/:productId", getProductReviews);

// Get reviewable orders for user (authenticated)
router.get("/reviewable", authenticateToken, getReviewableOrders);

// Get user's reviews (authenticated)
router.get("/user", authenticateToken, getUserReviews);

// Create a review (authenticated)
router.post("/", authenticateToken, createReview);

// Update a review (authenticated)
router.patch("/:id", authenticateToken, updateReview);

// Delete a review (authenticated)
router.delete("/:id", authenticateToken, deleteReview);

export default router;
