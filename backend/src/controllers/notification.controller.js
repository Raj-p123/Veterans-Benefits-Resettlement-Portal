import { Notification } from '../models/Notification.js';
import { socketService } from '../services/socketService.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Get paginated list of notifications for authenticated user
 * GET /api/notifications?page=1&limit=20&unread=true
 */
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || '20', 10)));
    const unreadOnly = req.query.unread === 'true';

    const filter = { user: userId };
    if (unreadOnly) {
      filter.isRead = false;
    }

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

    return sendSuccess(res, 'Notifications retrieved successfully', {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get live unread notification count
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

    return sendSuccess(res, 'Unread notification count retrieved', { unreadCount });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a specific notification as read
 * PUT /api/notifications/:id/read
 */
export const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      user: userId,
    });

    if (!notification) {
      throw ApiError.notFound('Notification not found or access denied');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      await notification.save();

      const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

      // Emit real-time count update to user's room
      socketService.emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_COUNT_UPDATED, { unreadCount });
      socketService.emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_READ, { id: notification._id });
    }

    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

    return sendSuccess(res, 'Notification marked as read', {
      notification,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read for current user
 * PUT /api/notifications/read-all
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    await Notification.updateMany({ user: userId, isRead: false }, { $set: { isRead: true } });

    // Emit real-time count reset (0) to user's room
    socketService.emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_COUNT_UPDATED, { unreadCount: 0 });
    socketService.emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_READ_ALL, {});

    return sendSuccess(res, 'All notifications marked as read', { unreadCount: 0 });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!notification) {
      throw ApiError.notFound('Notification not found or access denied');
    }

    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });
    socketService.emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_COUNT_UPDATED, { unreadCount });

    return sendSuccess(res, 'Notification deleted successfully', { unreadCount });
  } catch (error) {
    next(error);
  }
};
