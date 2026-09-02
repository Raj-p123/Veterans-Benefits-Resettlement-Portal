import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Clock,
  Briefcase,
  Bookmark,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Navigation,
} from 'lucide-react';
import Button from '../../../components/Button/Button.jsx';

export const JobCard = ({ job, onToggleBookmark }) => {
  const employerName =
    job.employer?.companyName || job.companyName || 'Defense Corporate Partner';

  const isVerifiedEmployer =
    job.employer?.isVerified ||
    job.isVerified ||
    job.employer?.verificationStatus === 'VERIFIED';

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Best in Industry';
    const toLakhs = (val) => `${(val / 100000).toFixed(1)} LPA`;
    if (min && max) return `₹${toLakhs(min)} – ₹${toLakhs(max)}`;
    if (min) return `₹${toLakhs(min)}+`;
    return `Up to ₹${toLakhs(max)}`;
  };

  const jobId = job.id || job._id || job.jobId;

  return (
    <div className="gov-job-card">
      <div className="job-card-top-row">
        <div className="employer-brand-cluster">
          <div className="employer-avatar-container" aria-hidden="true">
            <Building2 size={18} />
          </div>
          <div className="employer-meta-col">
            <div className="employer-name-row">
              <span className="employer-company-name">{employerName}</span>
              {isVerifiedEmployer && (
                <span className="verified-employer-badge" title="Verified Defense Employer">
                  <CheckCircle2 size={12} aria-hidden="true" />
                  <span>Verified Employer</span>
                </span>
              )}
            </div>
            <h3 className="job-main-title">
              <Link to={`/jobs/${jobId}`} className="job-title-link">
                {job.title}
              </Link>
            </h3>
          </div>
        </div>

        <div className="job-card-actions-cluster">
          {job.matchPercentage && (
            <span className="job-match-pill" title="Profile Match Score">
              <Sparkles size={11} aria-hidden="true" />
              <span>{job.matchPercentage}% Match</span>
            </span>
          )}

          <button
            type="button"
            className={`btn-save-bookmark ${job.isSaved ? 'saved' : ''}`}
            onClick={() => onToggleBookmark(jobId, job.isSaved)}
            title={job.isSaved ? 'Remove from Saved Jobs' : 'Save Job Opportunity'}
            aria-label={job.isSaved ? 'Remove from Saved Jobs' : 'Save Job Opportunity'}
          >
            <Bookmark size={16} fill={job.isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Metadata Chips */}
      <div className="job-chips-row">
        <span className="gov-meta-chip">
          <MapPin size={12} aria-hidden="true" />
          <span>{job.city || job.location || 'Pan-India'}{job.state ? `, ${job.state}` : ''}</span>
        </span>

        <span className="gov-meta-chip">
          <Clock size={12} aria-hidden="true" />
          <span>{(job.employmentType || 'Full-time').replace(/_/g, ' ')}</span>
        </span>

        {job.workMode && (
          <span className="gov-meta-chip workmode-chip">
            <span className="status-dot" aria-hidden="true" />
            <span>{job.workMode}</span>
          </span>
        )}

        {job.distanceText && (
          <span className="gov-meta-chip distance-chip">
            <Navigation size={11} aria-hidden="true" />
            <span>{job.distanceText}</span>
          </span>
        )}
      </div>

      {/* Short Job Description */}
      <p className="job-card-description">
        {job.description?.slice(0, 140) ||
          'Proven military leadership, discipline, security operations or technical management experience required.'}
        ...
      </p>

      {/* Bottom Bar: Salary & View Details Button */}
      <div className="job-card-bottom-bar">
        <div className="job-salary-stack">
          <span className="salary-prefix">Remuneration</span>
          <span className="job-salary-figure">
            {formatSalary(job.salaryMin, job.salaryMax)}
          </span>
        </div>

        <Link to={`/jobs/${jobId}`}>
          <Button variant="primary" size="sm" icon={ChevronRight} iconPosition="right">
            View Job
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default JobCard;
