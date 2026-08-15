import React from 'react';
import { HelpCircle } from 'lucide-react';
import './EmptyState.css';

export const EmptyState = ({
  icon: Icon = HelpCircle,
  title = 'No records found',
  description = 'There is currently no information or activity available for this section.',
  action,
  className = '',
}) => {
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-state-icon">
        <Icon size={28} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {action && <div className="empty-state-actions">{action}</div>}
    </div>
  );
};

export default EmptyState;
