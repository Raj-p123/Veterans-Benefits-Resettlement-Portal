import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import notificationService from '../services/notificationService';
import { SOCKET_EVENTS } from '../constants/socketEvents';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { on, off, isConnected } = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Fetch initial notifications & unread count
  const fetchInitialData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const [resList, resCount] = await Promise.all([
        notificationService.getNotifications({ limit: 15 }).catch(() => null),
        notificationService.getUnreadCount().catch(() => null),
      ]);

      if (resList?.success && resList.data?.notifications) {
        setNotifications(resList.data.notifications);
      }
      if (resCount?.success && typeof resCount.data?.unreadCount === 'number') {
        setUnreadCount(resCount.data.unreadCount);
      }
    } catch (err) {
      console.warn('[NotificationContext] Failed to fetch initial notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchInitialData();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setToasts([]);
    }
  }, [isAuthenticated, fetchInitialData]);

  // Handle Toast Dismissal
  const dismissToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  const addToast = useCallback((toast) => {
    const id = toast.id || `toast-${Date.now()}-${Math.random()}`;
    const newToast = { ...toast, id };

    setToasts((prev) => [newToast, ...prev.slice(0, 4)]); // Keep max 5 toasts

    // Auto dismiss after 5.5s
    setTimeout(() => {
      dismissToast(id);
    }, 5500);
  }, [dismissToast]);

  // Real-Time Socket Event Subscriptions
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNewNotification = (notification) => {
      console.log('[NotificationContext] Real-Time Notification Received:', notification);

      // Prevent duplicate UI additions
      setNotifications((prev) => {
        const exists = prev.some((n) => (n._id || n.id) === (notification._id || notification.id));
        if (exists) return prev;
        return [notification, ...prev];
      });

      if (typeof notification.unreadCount === 'number') {
        setUnreadCount(notification.unreadCount);
      } else {
        setUnreadCount((prev) => prev + 1);
      }

      // Show real-time notification toast
      addToast({
        id: notification._id || notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
      });
    };

    const handleCountUpdated = (data) => {
      if (typeof data.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    };

    const handleNotificationRead = (data) => {
      setNotifications((prev) =>
        prev.map((n) => ((n._id || n.id) === data.id ? { ...n, isRead: true } : n))
      );
    };

    const handleNotificationReadAll = () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    };

    on(SOCKET_EVENTS.NOTIFICATION_NEW, handleNewNotification);
    on(SOCKET_EVENTS.NOTIFICATION_COUNT_UPDATED, handleCountUpdated);
    on(SOCKET_EVENTS.NOTIFICATION_READ, handleNotificationRead);
    on(SOCKET_EVENTS.NOTIFICATION_READ_ALL, handleNotificationReadAll);

    return () => {
      off(SOCKET_EVENTS.NOTIFICATION_NEW, handleNewNotification);
      off(SOCKET_EVENTS.NOTIFICATION_COUNT_UPDATED, handleCountUpdated);
      off(SOCKET_EVENTS.NOTIFICATION_READ, handleNotificationRead);
      off(SOCKET_EVENTS.NOTIFICATION_READ_ALL, handleNotificationReadAll);
    };
  }, [isAuthenticated, on, off, addToast]);

  // Mark single as read
  const markAsRead = async (id) => {
    try {
      const res = await notificationService.markAsRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => ((n._id || n.id) === id ? { ...n, isRead: true } : n))
        );
        if (typeof res.data?.unreadCount === 'number') {
          setUnreadCount(res.data.unreadCount);
        } else {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error('[NotificationContext] Failed to mark notification as read:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('[NotificationContext] Failed to mark all as read:', err);
    }
  };

  // Delete notification
  const deleteNotification = async (id) => {
    try {
      const res = await notificationService.deleteNotification(id);
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => (n._id || n.id) !== id));
        if (typeof res.data?.unreadCount === 'number') {
          setUnreadCount(res.data.unreadCount);
        }
      }
    } catch (err) {
      console.error('[NotificationContext] Failed to delete notification:', err);
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    toasts,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: fetchInitialData,
    dismissToast,
    addToast,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
