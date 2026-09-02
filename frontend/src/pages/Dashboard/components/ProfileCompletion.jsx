import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Circle, ArrowRight } from 'lucide-react';

export const ProfileCompletion = ({ profile, documentsCount = 0 }) => {
  if (!profile) return null;

  const hasBasicInfo = Boolean(profile?.personalInformation?.fullName);
  const hasContactInfo = Boolean(
    profile?.personalInformation?.phone || profile?.personalInformation?.email
  );
  const hasServiceDetails = Boolean(
    profile?.serviceInformation?.serviceNumber || profile?.serviceInformation?.rank
  );
  const hasDocuments = documentsCount > 0;

  const checklist = [
    { label: 'Basic Information', completed: hasBasicInfo },
    { label: 'Contact Information', completed: hasContactInfo },
    { label: 'Service Details', completed: hasServiceDetails },
    { label: 'Documents', completed: hasDocuments },
  ];

  const completedCount = checklist.filter((item) => item.completed).length;
  const calculatedPercentage = profile?.profileCompletion
    ? Math.max(profile.profileCompletion, Math.round((completedCount / 4) * 100))
    : Math.round((completedCount / 4) * 100);

  return (
    <div className="gov-widget-card profile-completion-widget">
      <div className="widget-header">
        <h3 className="widget-title">Profile Completion</h3>
        <span className="widget-badge">{calculatedPercentage}%</span>
      </div>

      <div
        className="completion-progress-track"
        role="progressbar"
        aria-valuenow={calculatedPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="completion-progress-fill"
          style={{ width: `${calculatedPercentage}%` }}
        />
      </div>

      <ul className="profile-checklist-list">
        {checklist.map((item) => (
          <li key={item.label} className="profile-checklist-item">
            <span
              className={`checklist-bullet ${
                item.completed ? 'bullet-done' : 'bullet-pending'
              }`}
              aria-hidden="true"
            >
              {item.completed ? <Check size={11} strokeWidth={3} /> : <Circle size={9} />}
            </span>
            <span className={`checklist-text ${item.completed ? 'text-done' : ''}`}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>

      {calculatedPercentage < 100 && (
        <div className="widget-footer-action">
          <Link to="/veteran/profile" className="widget-action-link">
            <span>Complete Profile</span>
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProfileCompletion;
