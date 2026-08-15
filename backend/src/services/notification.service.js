import { Notification } from '../models/Notification.js';
import { socketService } from './socketService.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';
import { emailService } from './emailService.js';

class NotificationService {
  /**
   * Create a notification in MongoDB, compute unread count, and emit real-time Socket.IO event
   */
  async createNotification({
    userId,
    type,
    title,
    message,
    entityType = 'SYSTEM',
    entityId = null,
    actionUrl = '',
    emailDetails = null, // Optional { toEmail, templateType, data }
  }) {
    try {
      if (!userId) {
        console.warn('[NotificationService] Skipped: userId is required.');
        return null;
      }

      // 1. Save Notification in MongoDB
      const notification = await Notification.create({
        user: userId,
        type,
        title,
        message,
        entityType,
        entityId: entityId ? entityId.toString() : undefined,
        actionUrl,
        isRead: false,
      });

      // 2. Count current unread notifications for this user
      const unreadCount = await Notification.countDocuments({
        user: userId,
        isRead: false,
      });

      // 3. Emit Real-Time Socket.IO Events to User's Room
      const payload = {
        id: notification._id.toString(),
        _id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        entityType: notification.entityType,
        entityId: notification.entityId,
        actionUrl: notification.actionUrl,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        unreadCount,
      };

      socketService.emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_NEW, payload);
      socketService.emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_COUNT_UPDATED, { unreadCount });

      // 4. Send Email Asynchronously through EmailService if emailDetails provided
      if (emailDetails && emailDetails.toEmail) {
        this.dispatchEmail(emailDetails).catch((err) => {
          console.warn('[NotificationService] Background email dispatch error:', err.message);
        });
      }

      return notification;
    } catch (error) {
      console.error('[NotificationService Error]: Failed to create notification:', error.message);
      return null;
    }
  }

  /**
   * Helper to dispatch transactional email based on template type
   */
  async dispatchEmail({ toEmail, templateType, data = {} }) {
    switch (templateType) {
      case 'SCHEME_SUBMITTED':
        return emailService.sendApplicationSubmittedEmail({
          to: toEmail,
          veteranName: data.veteranName,
          applicationId: data.applicationId,
          schemeName: data.schemeName,
          submissionDate: data.submissionDate,
          status: data.status,
          actionUrl: data.actionUrl,
        });

      case 'SCHEME_STATUS_CHANGED':
        return emailService.sendApplicationStatusChangedEmail({
          to: toEmail,
          veteranName: data.veteranName,
          applicationId: data.applicationId,
          schemeName: data.schemeName,
          newStatus: data.newStatus || data.status,
          adminRemarks: data.adminRemarks,
          actionUrl: data.actionUrl,
        });

      case 'JOB_SUBMITTED':
        return emailService.sendJobApplicationSubmittedEmail({
          to: toEmail,
          veteranName: data.veteranName,
          jobTitle: data.jobTitle,
          companyName: data.companyName,
          applicationId: data.applicationId,
          applicationDate: data.applicationDate,
          status: data.status,
          actionUrl: data.actionUrl,
        });

      case 'JOB_RECEIVED':
        return emailService.sendJobApplicationReceivedEmail({
          to: toEmail,
          applicantName: data.applicantName || data.veteranName,
          veteranId: data.veteranId,
          jobTitle: data.jobTitle,
          applicationId: data.applicationId,
          applicationDate: data.applicationDate,
          actionUrl: data.actionUrl,
        });

      case 'JOB_STATUS_CHANGED':
        return emailService.sendJobApplicationStatusChangedEmail({
          to: toEmail,
          veteranName: data.veteranName,
          jobTitle: data.jobTitle,
          companyName: data.companyName,
          applicationId: data.applicationId,
          newStatus: data.newStatus || data.status,
          employerRemarks: data.employerRemarks,
          actionUrl: data.actionUrl,
        });

      default:
        return null;
    }
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId) {
    return Notification.countDocuments({
      user: userId,
      isRead: false,
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
