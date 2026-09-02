import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, FileCheck2 } from 'lucide-react';
import Badge from '../../../components/Badge/Badge.jsx';
import Button from '../../../components/Button/Button.jsx';

export const ApplicationTracker = ({ latestApplication }) => {
  const stages = [
    { id: 1, label: 'Application Submitted' },
    { id: 2, label: 'Under Review' },
    { id: 3, label: 'Document Verification' },
    { id: 4, label: 'Final Decision' },
  ];

  const getTrackerState = (app) => {
    if (!app) return { activeIndex: 0, isRejected: false };
    const status = app.status;
    const isRejected = status === 'REJECTED';
    let activeIndex = 0;

    if (status === 'SUBMITTED') activeIndex = 0;
    else if (status === 'UNDER_REVIEW') activeIndex = 1;
    else if (status === 'APPROVED' || status === 'DISBURSED') activeIndex = 3;
    else if (isRejected) activeIndex = 1;

    return { activeIndex, isRejected };
  };

  const { activeIndex, isRejected } = getTrackerState(latestApplication);

  return (
    <section className="dashboard-block" aria-labelledby="application-tracking-heading">
      <div className="block-header">
        <div>
          <h2 id="application-tracking-heading" className="block-title">Application Status</h2>
          <p className="block-subtitle">Track the progress of your submitted applications.</p>
        </div>
        <Link to="/veteran/applications" className="block-header-link">
          <span>View All</span>
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>

      {latestApplication ? (
        <div className="gov-application-card">
          <div className="app-card-top-info">
            <div className="app-main-meta">
              <span className="app-number-tag">
                Application #{latestApplication?.applicationId || 'APP-2026-0001'}
              </span>
              <h3 className="app-scheme-name">
                {latestApplication?.scheme?.name || 'Ex-Servicemen Healthcare & Pension Grant'}
              </h3>
            </div>

            <div className="app-status-badge-container">
              <Badge
                variant={
                  latestApplication?.status === 'APPROVED' ||
                  latestApplication?.status === 'DISBURSED'
                    ? 'success'
                    : latestApplication?.status === 'REJECTED'
                    ? 'danger'
                    : 'warning'
                }
              >
                {latestApplication?.status
                  ? latestApplication.status.replace('_', ' ')
                  : 'Under Review'}
              </Badge>
              <span className="app-date-text">
                Submitted:{' '}
                {latestApplication?.createdAt
                  ? new Date(latestApplication.createdAt).toLocaleDateString('en-GB')
                  : '02/09/2026'}
              </span>
            </div>
          </div>

          {/* 4-Stage Progress Tracker */}
          <div className="gov-tracker-wrapper" aria-label="Application progress stages">
            <div className="gov-tracker-steps">
              {stages.map((stage, idx) => {
                const isCompleted = idx < activeIndex && !isRejected;
                const isCurrent = idx === activeIndex && !isRejected;
                const isFailed = isRejected && idx === activeIndex;
                const isPending = idx > activeIndex;

                let nodeClass = 'tracker-pending';
                if (isCompleted) nodeClass = 'tracker-completed';
                if (isCurrent) nodeClass = 'tracker-current';
                if (isFailed) nodeClass = 'tracker-failed';

                return (
                  <div key={stage.id} className={`gov-tracker-step ${nodeClass}`}>
                    <div className="tracker-node-col">
                      <div className="tracker-node" aria-hidden="true">
                        {isCompleted && <Check size={12} strokeWidth={3} />}
                        {isCurrent && <div className="tracker-pulse-inner" />}
                        {isPending && <div className="tracker-pending-dot" />}
                        {isFailed && <span style={{ fontSize: '11px', fontWeight: 800 }}>✕</span>}
                      </div>
                      {idx < stages.length - 1 && (
                        <div
                          className={`tracker-connector ${
                            idx < activeIndex ? 'connector-filled' : ''
                          }`}
                        />
                      )}
                    </div>
                    <div className="tracker-label-col">
                      <span className="tracker-stage-number">Stage {idx + 1}</span>
                      <span className="tracker-stage-label">{stage.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-tracker-card">
          <div className="empty-icon-circle" aria-hidden="true">
            <FileCheck2 size={26} />
          </div>
          <h3 className="empty-title">No applications yet</h3>
          <p className="empty-desc">You haven't submitted any benefit applications.</p>
          <Link to="/schemes">
            <Button variant="primary" size="sm">
              Browse Benefits →
            </Button>
          </Link>
        </div>
      )}
    </section>
  );
};

export default ApplicationTracker;
