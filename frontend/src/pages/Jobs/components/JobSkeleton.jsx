import React from 'react';

export const JobSkeleton = () => {
  return (
    <div className="gov-job-card skeleton-card" aria-hidden="true">
      <div className="job-card-top-row">
        <div className="employer-brand-cluster">
          <div className="skeleton-box skeleton-avatar" />
          <div className="employer-meta-col">
            <div className="skeleton-box skeleton-text-sm" style={{ width: '110px' }} />
            <div className="skeleton-box skeleton-text-lg" style={{ width: '200px' }} />
          </div>
        </div>
        <div className="skeleton-box skeleton-badge" style={{ width: '32px', height: '32px' }} />
      </div>

      <div className="job-chips-row">
        <div className="skeleton-box skeleton-chip" style={{ width: '90px' }} />
        <div className="skeleton-box skeleton-chip" style={{ width: '80px' }} />
        <div className="skeleton-box skeleton-chip" style={{ width: '70px' }} />
      </div>

      <div className="skeleton-box skeleton-paragraph" style={{ width: '100%', height: '36px' }} />

      <div className="job-card-bottom-bar">
        <div className="skeleton-box skeleton-text-md" style={{ width: '120px' }} />
        <div className="skeleton-box skeleton-btn" style={{ width: '95px', height: '34px' }} />
      </div>
    </div>
  );
};

export default JobSkeleton;
