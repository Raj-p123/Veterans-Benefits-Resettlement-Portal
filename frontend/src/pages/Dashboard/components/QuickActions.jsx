import React from 'react';
import { Link } from 'react-router-dom';
import { Award, FileText, Briefcase, UploadCloud, ChevronRight } from 'lucide-react';

export const QuickActions = () => {
  const actions = [
    {
      title: 'Browse Benefits',
      description: 'Explore available welfare schemes.',
      linkTo: '/schemes',
      icon: Award,
      color: 'navy',
    },
    {
      title: 'Apply for Benefit',
      description: 'Submit grants, pension & assistance requests.',
      linkTo: '/schemes',
      icon: FileText,
      color: 'blue',
    },
    {
      title: 'Find Jobs',
      description: 'Discover employment opportunities.',
      linkTo: '/jobs',
      icon: Briefcase,
      color: 'green',
    },
    {
      title: 'Upload Documents',
      description: 'Manage required documents.',
      linkTo: '/veteran/documents',
      icon: UploadCloud,
      color: 'purple',
    },
  ];

  return (
    <div className="gov-widget-card quick-actions-widget">
      <div className="widget-header">
        <h3 className="widget-title">Quick Actions</h3>
      </div>

      <div className="quick-actions-stacked-list">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.title} to={action.linkTo} className="quick-action-row-item">
              <div className={`action-icon-circle action-${action.color}`} aria-hidden="true">
                <Icon size={16} />
              </div>
              <div className="action-row-text">
                <h4 className="action-row-title">{action.title}</h4>
                <p className="action-row-desc">{action.description}</p>
              </div>
              <ChevronRight size={14} className="action-row-chevron" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
