import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  CheckCheck,
  ChevronRight,
  Briefcase,
  FileCheck2,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import './NotificationBell.css';

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'JOB_APPLICATION_RECEIVED':
      case 'JOB_POSTED':
      case 'JOB_APPLICATION_STATUS_CHANGED':
        return <Briefcase size={16} color="#2563eb" />;
      case 'APPLICATION_SUBMITTED':
      case 'APPLICATION_STATUS_CHANGED':
        return <FileCheck2 size={16} color="#16a34a" />;
      case 'DOCUMENT_STATUS_CHANGED':
        return <FileText size={16} color="#7c3aed" />;
      default:
        return <Bell size={16} color="#475569" />;
    }
  };

  const notificationCenterUrl =
    user?.role === 'EMPLOYER' ? '/employer/notifications' : '/veteran/notifications';

  return (
    <div className="notification-bell-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="notification-badge-count">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h4>
              Notifications {unreadCount > 0 && <span style={{ color: '#2563eb', fontSize: '0.8rem' }}>({unreadCount} new)</span>}
            </h4>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notification-mark-all-btn"
                onClick={() => markAllAsRead()}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-dropdown-list">
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                <Bell size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                <p style={{ margin: 0 }}>No notifications yet.</p>
              </div>
            ) : (
              notifications.slice(0, 7).map((n) => {
                const id = n._id || n.id;
                const link = n.actionUrl || notificationCenterUrl;

                return (
                  <Link
                    key={id}
                    to={link}
                    className={`notification-dropdown-item ${!n.isRead ? 'unread' : ''}`}
                    onClick={() => {
                      if (!n.isRead) markAsRead(id);
                      setIsOpen(false);
                    }}
                  >
                    {!n.isRead && <div className="notification-unread-dot" />}
                    <div className="notification-item-icon">{getNotificationIcon(n.type)}</div>
                    <div style={{ flex: 1 }}>
                      <div className="notification-item-title">{n.title}</div>
                      <div className="notification-item-message">{n.message}</div>
                      <div className="notification-item-time">
                        {new Date(n.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {' • '}
                        {new Date(n.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          <div className="notification-dropdown-footer">
            <Link
              to={notificationCenterUrl}
              className="notification-view-all-link"
              onClick={() => setIsOpen(false)}
            >
              Open Notification Center <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
