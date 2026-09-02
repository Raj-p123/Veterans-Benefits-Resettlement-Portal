import React from 'react';

export const SchemeSkeleton = () => {
  return (
    <div className="gov-scheme-card skeleton-scheme-card" aria-hidden="true">
      <div className="card-top-badges-row">
        <div className="skeleton-box skeleton-badge" style={{ width: '85px', height: '22px' }} />
        <div className="skeleton-box skeleton-id" style={{ width: '90px', height: '18px' }} />
      </div>

      <div className="skeleton-box skeleton-title" style={{ width: '85%', height: '22px', margin: '0.75rem 0 0.5rem' }} />
      <div className="skeleton-box skeleton-text" style={{ width: '95%', height: '14px', marginBottom: '0.35rem' }} />
      <div className="skeleton-box skeleton-text" style={{ width: '70%', height: '14px', marginBottom: '1rem' }} />

      <div className="skeleton-benefits-cluster">
        <div className="skeleton-box skeleton-benefit-item" style={{ width: '90%', height: '16px', marginBottom: '0.4rem' }} />
        <div className="skeleton-box skeleton-benefit-item" style={{ width: '80%', height: '16px', marginBottom: '1rem' }} />
      </div>

      <div className="card-bottom-row">
        <div className="skeleton-box skeleton-authority" style={{ width: '130px', height: '28px' }} />
        <div className="skeleton-box skeleton-btn" style={{ width: '100px', height: '34px' }} />
      </div>
    </div>
  );
};

export default SchemeSkeleton;
