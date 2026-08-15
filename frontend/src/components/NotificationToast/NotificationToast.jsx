import React from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  FileText,
  X,
  ChevronRight,
  Shield,
} from 'lucide-react';
import './NotificationToast.css';

export const NotificationToastContainer = () => {
  const { toasts, dismissToast } = useNotifications();

  if (!toasts || toasts.length === 0) return null;

  const getToastIcon = (type) => {
    switch (type) {
      case 'APPLICATION_SUBMITTED':
      case 'JOB_APPLICATION_STATUS_CHANGED':
        return <CheckCircle2 size={18} className="text-success" style={{ color: '#16a34a' }} />;
      case 'JOB_APPLICATION_RECEIVED':
      case 'JOB_POSTED':
        return <Briefcase size={18} className="text-primary" style={{ color: '#2563eb' }} />;
      case 'DOCUMENT_STATUS_CHANGED':
        return <FileText size={18} style={{ color: '#7c3aed' }} />;
      default:
        return <Bell size={18} style={{ color: '#2563eb' }} />;
    }
  };

  const getToastClass = (type) => {
    if (type?.includes('SUBMITTED') || type?.includes('SELECTED')) return 'toast-success';
    if (type?.includes('REJECTED')) return 'toast-danger';
    if (type?.includes('SHORTLISTED') || type?.includes('INTERVIEW')) return 'toast-warning';
    return 'toast-info';
  };

  return (
    <div className="notification-toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`notification-toast ${getToastClass(toast.type)}`}>
          <div className="toast-icon">{getToastIcon(toast.type)}</div>
          <div className="toast-content">
            <div className="toast-title">{toast.title}</div>
            <div className="toast-message">{toast.message}</div>
            {toast.actionUrl && (
              <Link
                to={toast.actionUrl}
                className="toast-action"
                onClick={() => dismissToast(toast.id)}
              >
                View Details <ChevronRight size={12} />
              </Link>
            )}
          </div>
          <button
            type="button"
            className="toast-close"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationToastContainer;
