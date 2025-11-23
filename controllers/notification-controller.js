import {db} from "../drizzle/index.js";
import {notifications, users} from "../drizzle/schema/schema.js";
import {eq, desc, count} from "drizzle-orm";

// Get all notifications for a user
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get total count
    const [{total}] = await db
      .select({total: count()})
      .from(notifications)
      .where(eq(notifications.userId, userId));

    // Get paginated notifications
    const notificationList = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    res.status(200).json({
      success: true,
      message: "Notifications fetched successfully",
      page,
      limit,
      total,
      notifications: notificationList,
    });
  } catch (error) {
    next(error);
  }
};

// Get unread notifications count
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [{total}] = await db
      .select({total: count()})
      .from(notifications)
      .where(
        eq(notifications.userId, userId) && eq(notifications.isRead, false)
      );

    res.status(200).json({
      success: true,
      unreadCount: total,
    });
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
const markAsRead = async (req, res, next) => {
  try {
    const {id} = req.params;
    const userId = req.user.id;

    const [updatedNotification] = await db
      .update(notifications)
      .set({isRead: true})
      .where(eq(notifications.id, id) && eq(notifications.userId, userId))
      .returning();

    if (!updatedNotification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification: updatedNotification,
    });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await db
      .update(notifications)
      .set({isRead: true})
      .where(eq(notifications.userId, userId));

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    next(error);
  }
};

// Delete notification
const deleteNotification = async (req, res, next) => {
  try {
    const {id} = req.params;
    const userId = req.user.id;

    const [deletedNotification] = await db
      .delete(notifications)
      .where(eq(notifications.id, id) && eq(notifications.userId, userId))
      .returning();

    if (!deletedNotification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Create notification (internal function)
const createNotification = async (userId, title, message) => {
  try {
    // Check if userId is provided
    if (!userId) {
      console.warn("Cannot create notification: userId is required");
      return null;
    }

    const [newNotification] = await db
      .insert(notifications)
      .values({
        userId,
        title,
        message,
        isRead: false,
      })
      .returning();

    return newNotification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

// Create notification (public endpoint for testing)
const createNotificationPublic = async (req, res, next) => {
  try {
    const {title, message} = req.body;
    const userId = req.user.id;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }

    const newNotification = await createNotification(userId, title, message);

    if (!newNotification) {
      return res.status(500).json({
        success: false,
        message: "Failed to create notification",
      });
    }

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      notification: newNotification,
    });
  } catch (error) {
    next(error);
  }
};

export {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  createNotificationPublic,
};
