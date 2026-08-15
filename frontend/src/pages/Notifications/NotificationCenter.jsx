import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import notificationService from '../../services/notificationService';
import {
  Bell,
  CheckCircle2,
  Clock,
  Trash2,
  CheckCheck,
  ChevronRight,
  Briefcase,
  FileCheck2,
  FileText,
  Filter,
} from 'lucide-react';
import './NotificationCenter.css';

export const NotificationCenter = () => {
  const { markAsRead, markAllAsRead, deleteNotification, unreadCount } = useNotifications();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL'); // 'ALL' or 'UNREAD'
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await notificationService.getNotifications({
        page,
        limit: 15,
        unread: filter === 'UNREAD' ? true : undefined,
      });

      if (res.success) {
        setNotifications(res.data.notifications || []);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Unable to load notification history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, filter]);

  const handleMarkRead = async (id) => {
    await markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => ((n._id || n.id) === id ? { ...n, isRead: true } : n))
    );
  };

  const handleDelete = async (id) => {
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => (n._id || n.id) !== id));
  };

  const handleMarkAll = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'JOB_APPLICATION_RECEIVED':
      case 'JOB_POSTED':
      case 'JOB_APPLICATION_STATUS_CHANGED':
        return <Briefcase size={20} color="#2563eb" />;
      case 'APPLICATION_SUBMITTED':
      case 'APPLICATION_STATUS_CHANGED':
        return <FileCheck2 size={20} color="#16a34a" />;
      case 'DOCUMENT_STATUS_CHANGED':
        return <FileText size={20} color="#7c3aed" />;
      default:
        return <Bell size={20} color="#475569" />;
    }
  };

  return (
    <div className="notification-center-page">
      <div className="container" style={{ maxWidth: '960px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
              Notification Center
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Real-time administrative notices, welfare claim progressions, and job recruitment alerts.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleMarkAll}
              disabled={unreadCount === 0}
            >
              <CheckCheck size={16} /> Mark All as Read
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            className={`btn ${filter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => {
              setFilter('ALL');
              setPage(1);
            }}
            style={{ padding: '0.45rem 1.25rem', fontSize: '0.875rem' }}
          >
            All Notifications
          </button>
          <button
            type="button"
            className={`btn ${filter === 'UNREAD' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => {
              setFilter('UNREAD');
              setPage(1);
            }}
            style={{ padding: '0.45rem 1.25rem', fontSize: '0.875rem' }}
          >
            Unread Only ({unreadCount})
          </button>
        </div>

        {/* Main List Card */}
        <div className="notification-center-card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
              <p style={{ color: '#64748b' }}>Loading notification history...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger" style={{ margin: '2rem' }}>
              {error}
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <Bell size={48} style={{ color: '#cbd5e1', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                No notifications found
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                {filter === 'UNREAD'
                  ? "You're all caught up! You don't have any unread notifications."
                  : 'You have not received any portal notifications yet.'}
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((n) => {
                const id = n._id || n.id;
                return (
                  <div
                    key={id}
                    className={`notification-card-item ${!n.isRead ? 'unread' : ''}`}
                  >
                    {!n.isRead && <div className="notif-unread-indicator" />}

                    <div className="notif-icon-box">{getNotificationIcon(n.type)}</div>

                    <div className="notif-main-info">
                      <div className="notif-header-line">
                        <span className="notif-tag">{n.entityType?.replace('_', ' ')}</span>
                        <span className="notif-time">
                          <Clock size={12} />
                          {new Date(n.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <h3 className="notif-title">{n.title}</h3>
                      <p className="notif-message">{n.message}</p>
                    </div>

                    <div className="notif-actions">
                      {n.actionUrl && (
                        <Link
                          to={n.actionUrl}
                          className="btn btn-primary"
                          style={{ padding: '0.4rem 0.85rem', fontSize: '0.8125rem' }}
                          onClick={() => {
                            if (!n.isRead) handleMarkRead(id);
                          }}
                        >
                          View <ChevronRight size={14} />
                        </Link>
                      )}

                      {!n.isRead && (
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }}
                          onClick={() => handleMarkRead(id)}
                          title="Mark as read"
                        >
                          <CheckCircle2 size={15} />
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8125rem', color: '#dc2626' }}
                        onClick={() => handleDelete(id)}
                        title="Delete notification"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button
              className="btn btn-outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', fontSize: '0.875rem', fontWeight: 600 }}>
              Page {page} of {pagination.totalPages}
            </span>
            <button
              className="btn btn-outline"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
