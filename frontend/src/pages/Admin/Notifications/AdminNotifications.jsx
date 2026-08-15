import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  CheckCircle,
  Clock,
  Trash2,
  CheckCheck,
  AlertTriangle,
  Info,
  ExternalLink,
} from 'lucide-react';
import notificationService from '../../../services/notificationService.js';
import { socketService } from '../../../services/socketService.js';
import { SOCKET_EVENTS } from '../../../constants/socketEvents.js';
import Badge from '../../../components/Badge/Badge.jsx';
import Button from '../../../components/Button/Button.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../../components/ErrorMessage/ErrorMessage.jsx';
import '../AdminCommon.css';

export const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationService.getNotifications({
        limit: 50,
        unreadOnly: unreadOnly ? 'true' : undefined,
      });
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error('Error fetching admin notifications:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time socket listeners
  useEffect(() => {
    const handleNewNotif = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    };

    socketService.on(SOCKET_EVENTS.NOTIFICATION_RECEIVED, handleNewNotif);
    socketService.on(SOCKET_EVENTS.ADMIN_VETERAN_REGISTERED, () => fetchNotifications());
    socketService.on(SOCKET_EVENTS.ADMIN_EMPLOYER_REGISTERED, () => fetchNotifications());
    socketService.on(SOCKET_EVENTS.ADMIN_DOCUMENT_UPLOADED, () => fetchNotifications());
    socketService.on(SOCKET_EVENTS.ADMIN_APPLICATION_CREATED, () => fetchNotifications());

    return () => {
      socketService.off(SOCKET_EVENTS.NOTIFICATION_RECEIVED, handleNewNotif);
      socketService.off(SOCKET_EVENTS.ADMIN_VETERAN_REGISTERED);
      socketService.off(SOCKET_EVENTS.ADMIN_EMPLOYER_REGISTERED);
      socketService.off(SOCKET_EVENTS.ADMIN_DOCUMENT_UPLOADED);
      socketService.off(SOCKET_EVENTS.ADMIN_APPLICATION_CREATED);
    };
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-title-group">
          <h1>Administrative Dispatch Center</h1>
          <p>
            Real-time incoming alerts, registration dispatches, document upload notifications, and claim events.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {unreadCount > 0 && (
            <Button variant="secondary" size="sm" icon={CheckCheck} onClick={handleMarkAllRead}>
              Mark All as Read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="admin-filter-card">
        <div className="admin-filter-group">
          <button
            type="button"
            className={`admin-page-btn ${!unreadOnly ? 'active' : ''}`}
            onClick={() => setUnreadOnly(false)}
          >
            All Alerts ({notifications.length})
          </button>
          <button
            type="button"
            className={`admin-page-btn ${unreadOnly ? 'active' : ''}`}
            onClick={() => setUnreadOnly(true)}
          >
            Unread Alerts ({unreadCount})
          </button>
        </div>

        <div>
          <Badge variant={unreadCount > 0 ? 'warning' : 'success'}>
            {unreadCount} Unread Notifications
          </Badge>
        </div>
      </div>

      {/* Notifications List */}
      <div className="admin-table-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <LoadingSpinner size="md" text="Loading notification alerts..." />
          </div>
        ) : error ? (
          <div style={{ padding: '2rem' }}>
            <ErrorMessage message={error} onRetry={fetchNotifications} />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-slate-500)' }}>
            No administrative notifications found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map((n) => {
              const timeStr = n.createdAt
                ? new Date(n.createdAt).toLocaleString()
                : 'Just now';

              return (
                <div
                  key={n._id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid var(--color-border-subtle)',
                    background: n.isRead ? '#ffffff' : '#f8fafc',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-md)',
                        background: n.isRead ? '#f1f5f9' : '#eff6ff',
                        color: n.isRead ? '#64748b' : '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Bell size={18} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '0.9375rem', color: 'var(--color-slate-900)' }}>
                          {n.title}
                        </strong>
                        {!n.isRead && (
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: '#2563eb',
                            }}
                          />
                        )}
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-600)', margin: '0.25rem 0' }}>
                        {n.message}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)' }}>
                        {timeStr}
                      </span>
                    </div>
                  </div>

                  {!n.isRead && (
                    <button
                      type="button"
                      className="admin-btn-action"
                      onClick={() => handleMarkAsRead(n._id)}
                      title="Mark as Read"
                    >
                      <CheckCircle size={13} /> Mark Read
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
