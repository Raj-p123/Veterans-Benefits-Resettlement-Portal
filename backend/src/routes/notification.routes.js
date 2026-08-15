import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notification.controller.js';

const router = Router();

// All notification endpoints require authentication
router.use(authenticate);

// Listing & Counter
router.get('/', getNotifications);
router.get('/unread', getUnreadCount);
router.get('/unread-count', getUnreadCount);

// Status Mutations (Support both PUT and PATCH)
router.put('/read-all', markAllAsRead);
router.patch('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
