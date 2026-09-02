import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, ArrowRight, Award, FileText, Briefcase, Info } from 'lucide-react';

export const ImportantUpdates = ({ notifications = [] }) => {
  const formatNotificationCategory = (type) => {
    switch (type) {
      case 'SCHEME_NEW':
      case 'SCHEME_APPLICATION':
        return { label: 'New Scheme', color: 'blue', icon: Award };
      case 'JOB_APPLICATION':
      case 'JOB_ALERT':
        return { label: 'Job Fair', color: 'purple', icon: Briefcase };
      case 'DOCUMENT_VERIFICATION':
      case 'DOCUMENT_UPLOAD':
        return { label: 'Document Update', color: 'amber', icon: FileText };
      default:
        return { label: 'Application Update', color: 'navy', icon: Info };
    }
  };

  const displayList = notifications.slice(0, 3);

  return (
    <div className="gov-widget-card important-updates-widget">
      <div className="widget-header">
        <h3 className="widget-title">Important Updates</h3>
        <Link to="/veteran/notifications" className="widget-view-all">
          <span>All</span>
          <ArrowRight size={11} aria-hidden="true" />
        </Link>
      </div>

      {displayList.length > 0 ? (
        <div className="updates-stack">
          {displayList.map((item, idx) => {
            const cat = formatNotificationCategory(item.type);
            const CatIcon = cat.icon;
            const timeFormatted = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                })
              : 'Recent';

            return (
              <div key={item._id || item.id || idx} className="update-item-card">
                <div className="update-item-top">
                  <span className={`update-badge badge-${cat.color}`}>
                    <CatIcon size={11} aria-hidden="true" />
                    <span>{cat.label}</span>
                  </span>
                  <span className="update-date">{timeFormatted}</span>
                </div>
                <h4 className="update-title">{item.title || 'Official Portal Notification'}</h4>
                <p className="update-message">
                  {item.message || 'Check your notifications center for detailed official correspondence.'}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="updates-empty-card">
          <div className="updates-empty-icon" aria-hidden="true">
            <Bell size={20} />
          </div>
          <p className="updates-empty-text">No pending administrative updates at this time.</p>
        </div>
      )}
    </div>
  );
};

export default ImportantUpdates;
