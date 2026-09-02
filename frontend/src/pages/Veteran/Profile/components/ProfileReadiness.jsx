import React from 'react';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export const ProfileReadiness = ({ completion }) => {
  const percentage = completion?.percentage ?? 0;
  const completedSections = completion?.completedSections || [];
  const remainingSections = completion?.remainingSections || [];

  return (
    <section className="gov-readiness-card" aria-label="Profile Readiness and Completion">
      {/* Top Header & Progress Bar */}
      <div className="readiness-header-row">
        <div>
          <h2 className="readiness-heading">Profile Readiness Score</h2>
          <p className="readiness-subtext">
            Complete your profile to unlock higher priority for welfare grants and job matching.
          </p>
        </div>
        <div className="readiness-percentage-box">
          <span className="readiness-percentage-number">{percentage}%</span>
          <span className="readiness-percentage-label">Complete</span>
        </div>
      </div>

      <div
        className="readiness-progress-track"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="readiness-progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Two Distinct Columns: Completed vs Remaining */}
      <div className="readiness-summary-columns">
        {/* Completed Sections Column */}
        <div className="readiness-column completed-column">
          <div className="column-header-row header-green">
            <CheckCircle2 size={15} aria-hidden="true" />
            <span className="column-title">
              COMPLETED SECTIONS ({completedSections.length})
            </span>
          </div>
          <ul className="sections-list">
            {completedSections.length > 0 ? (
              completedSections.map((sec, idx) => (
                <li key={idx} className="section-item item-done">
                  <span className="bullet-check" aria-hidden="true">✓</span>
                  <span>{sec}</span>
                </li>
              ))
            ) : (
              <li className="section-item-empty">No sections completed yet</li>
            )}
          </ul>
        </div>

        {/* Remaining Sections Column */}
        <div className="readiness-column remaining-column">
          <div className="column-header-row header-amber">
            <AlertCircle size={15} aria-hidden="true" />
            <span className="column-title">
              REMAINING FOR 100% ({remainingSections.length})
            </span>
          </div>
          <ul className="sections-list">
            {remainingSections.length > 0 ? (
              remainingSections.map((sec, idx) => (
                <li key={idx} className="section-item item-pending">
                  <span className="bullet-pending" aria-hidden="true">○</span>
                  <span>{sec}</span>
                </li>
              ))
            ) : (
              <li className="section-item-all-done">
                <Sparkles size={14} aria-hidden="true" />
                <span>All profile sections fully completed!</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default ProfileReadiness;
