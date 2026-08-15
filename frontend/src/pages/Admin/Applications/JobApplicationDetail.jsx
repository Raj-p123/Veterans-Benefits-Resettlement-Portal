import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Briefcase,
  ArrowLeft,
  CheckCircle,
  Building2,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  Award,
  Sparkles,
} from 'lucide-react';
import { adminService } from '../../../services/adminService.js';
import { ROUTES } from '../../../constants/index.js';
import Badge from '../../../components/Badge/Badge.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../../components/ErrorMessage/ErrorMessage.jsx';
import '../AdminCommon.css';
import '../Veterans/VeteranDetail.css';

export const JobApplicationDetail = () => {
  const { id } = useParams();

  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApplication = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getJobApplicationById(id);
      setDossier(res.data);
    } catch (err) {
      console.error('Error fetching job application:', err);
      setError(err.message || 'Failed to load job application details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <LoadingSpinner size="lg" text="Loading job application dossier..." />
      </div>
    );
  }

  if (error || !dossier?.application) {
    return (
      <div style={{ padding: '2rem' }}>
        <ErrorMessage message={error || 'Application not found'} onRetry={fetchApplication} />
      </div>
    );
  }

  const { application } = dossier;
  const veteran = application.veteran || {};
  const job = application.job || {};
  const employer = application.employer || {};
  const timeline = application.timeline || [];

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <Link to={ROUTES.ADMIN_JOB_APPLICATIONS} className="veteran-back-link">
            <ArrowLeft size={16} /> Back to Job Applications
          </Link>
          <h1 className="admin-page-title" style={{ marginTop: '0.5rem' }}>
            Job Application #{application.applicationId}
          </h1>
          <p className="admin-page-subtitle">
            Role: <strong>{job.title}</strong> at {employer.companyName}
          </p>
        </div>

        <div className="veteran-action-bar">
          <Badge
            variant={
              application.status === 'SELECTED'
                ? 'success'
                : application.status === 'REJECTED'
                ? 'danger'
                : application.status === 'SHORTLISTED'
                ? 'info'
                : 'neutral'
            }
          >
            STATUS: {application.status}
          </Badge>
          <Badge variant="gold">
            Match Score: {application.matchScore || 0}%
          </Badge>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="veteran-dossier-grid">
        {/* Left Column */}
        <div className="dossier-col">
          {/* Card: Candidate Military Profile */}
          <div className="dossier-card">
            <h3 className="dossier-card-title">Candidate Veteran Profile</h3>
            <div className="dossier-info-list">
              <div className="dossier-info-row">
                <span className="dossier-label">Candidate Name</span>
                <span className="dossier-value">
                  {veteran.personalInformation?.fullName || application.user?.name || 'Veteran'}
                </span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Veteran Portal ID</span>
                <span className="dossier-value">
                  <Link to={`/admin/veterans/${veteran.veteranId}`} style={{ color: '#2563eb' }}>
                    {veteran.veteranId || 'N/A'}
                  </Link>
                </span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Branch & Rank</span>
                <span className="dossier-value">
                  {veteran.serviceInformation?.serviceBranch || 'N/A'} • {veteran.serviceInformation?.rank || 'N/A'}
                </span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Service Years</span>
                <span className="dossier-value">{veteran.serviceInformation?.yearsOfService || 0} Years</span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Contact</span>
                <span className="dossier-value">
                  {veteran.personalInformation?.email || application.user?.email} •{' '}
                  {veteran.personalInformation?.phone || application.user?.phone}
                </span>
              </div>
            </div>

            {/* Skills */}
            <div style={{ marginTop: '1rem' }}>
              <span className="dossier-label" style={{ display: 'block', marginBottom: '0.375rem' }}>
                Candidate Skills
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {(veteran.skills || []).map((s, idx) => (
                  <Badge key={idx} variant="info">{s}</Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Card: Cover Note */}
          <div className="dossier-card">
            <h3 className="dossier-card-title">Candidate Cover Note</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-700)', lineHeight: '1.6' }}>
              {application.coverLetter || 'No cover note submitted with this application.'}
            </p>
          </div>
        </div>

        {/* Right Column */}
        <div className="dossier-col">
          {/* Card: Job Position */}
          <div className="dossier-card">
            <h3 className="dossier-card-title">Job Position Details</h3>
            <div className="dossier-info-list">
              <div className="dossier-info-row">
                <span className="dossier-label">Job Title</span>
                <span className="dossier-value">{job.title}</span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Corporate Employer</span>
                <span className="dossier-value">
                  <Link to={`/admin/employers/${employer.employerId}`} style={{ color: '#2563eb' }}>
                    {employer.companyName}
                  </Link>
                </span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Job ID</span>
                <span className="dossier-value">{job.jobId}</span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Location</span>
                <span className="dossier-value">{job.city}, {job.state} ({job.locationType})</span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Employment Type</span>
                <span className="dossier-value">{job.jobType}</span>
              </div>
            </div>
          </div>

          {/* Card: Status Timeline */}
          <div className="dossier-card">
            <h3 className="dossier-card-title">Application Progression Timeline</h3>
            {timeline.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-400)' }}>
                No events recorded.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {timeline.map((item, idx) => (
                  <div key={idx} className="dossier-sub-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <strong style={{ color: '#2563eb' }}>{item.status}</strong>
                      <span style={{ color: 'var(--color-slate-400)' }}>
                        {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    {item.notes && (
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-slate-700)', marginTop: '4px' }}>
                        Notes: {item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApplicationDetail;
