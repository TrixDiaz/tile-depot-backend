import express from "express";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotificationPublic,
} from "../controllers/notification-controller.js";
import { authenticateToken } from "../middlewares/auth-middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get notifications
router.get("/", getNotifications);

// Get unread count
router.get("/unread-count", getUnreadCount);

// Mark notification as read
router.patch("/:id/read", markAsRead);

// Mark all notifications as read
router.patch("/mark-all-read", markAllAsRead);

// Delete notification
router.delete("/:id", deleteNotification);

// Create notification (for testing)
router.post("/", createNotificationPublic);

export default router;
