import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Briefcase,
  ExternalLink,
  MapPin,
  Mail,
  Phone,
  Globe,
  Users,
} from 'lucide-react';
import { adminService } from '../../../services/adminService.js';
import { ROUTES } from '../../../constants/index.js';
import Badge from '../../../components/Badge/Badge.jsx';
import Button from '../../../components/Button/Button.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../../components/ErrorMessage/ErrorMessage.jsx';
import '../AdminCommon.css';
import '../Veterans/VeteranDetail.css';

export const EmployerDetail = () => {
  const { id } = useParams();

  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verification modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('VERIFIED');
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEmployer = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getEmployerById(id);
      setDossier(res.data);
    } catch (err) {
      console.error('Error fetching employer:', err);
      setError(err.message || 'Failed to load employer dossier');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEmployer();
  }, [fetchEmployer]);

  const handleOpenVerification = (status) => {
    setVerificationStatus(status);
    setRemarks(
      status === 'VERIFIED'
        ? 'Corporate identity and recruitment authority verified.'
        : 'Corporate documents required for verification.'
    );
    setModalOpen(true);
  };

  const handleSaveVerification = async () => {
    if (!dossier?.employer) return;
    setActionLoading(true);
    try {
      await adminService.updateEmployerVerification(dossier.employer._id, {
        status: verificationStatus,
        remarks,
      });
      setModalOpen(false);
      fetchEmployer();
    } catch (err) {
      alert(err.message || 'Failed to update verification status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <LoadingSpinner size="lg" text="Loading corporate employer dossier..." />
      </div>
    );
  }

  if (error || !dossier?.employer) {
    return (
      <div style={{ padding: '2rem' }}>
        <ErrorMessage message={error || 'Employer not found'} onRetry={fetchEmployer} />
      </div>
    );
  }

  const { employer, jobs = [], applications = [], auditHistory = [] } = dossier;

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <Link to={ROUTES.ADMIN_EMPLOYERS} className="veteran-back-link">
            <ArrowLeft size={16} /> Back to Employers Directory
          </Link>
          <h1 className="admin-page-title" style={{ marginTop: '0.5rem' }}>
            {employer.companyName}
          </h1>
          <p className="admin-page-subtitle">
            Employer ID: <strong>{employer.employerId}</strong> • Industry: {employer.industry} • Size: {employer.companySize}
          </p>
        </div>

        <div className="veteran-action-bar">
          <Badge
            variant={
              employer.verificationStatus === 'VERIFIED'
                ? 'success'
                : employer.verificationStatus === 'REJECTED'
                ? 'danger'
                : 'warning'
            }
          >
            VERIFICATION: {employer.verificationStatus}
          </Badge>

          {employer.verificationStatus !== 'VERIFIED' && (
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle}
              onClick={() => handleOpenVerification('VERIFIED')}
            >
              Verify Company
            </Button>
          )}

          {employer.verificationStatus !== 'REJECTED' && (
            <Button
              variant="danger"
              size="sm"
              icon={XCircle}
              onClick={() => handleOpenVerification('REJECTED')}
            >
              Reject Verification
            </Button>
          )}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="veteran-dossier-grid">
        {/* Left Column */}
        <div className="dossier-col">
          {/* Card: Company Details */}
          <div className="dossier-card">
            <h3 className="dossier-card-title">Corporate Organization Profile</h3>
            <div className="dossier-info-list">
              <div className="dossier-info-row">
                <span className="dossier-label">Company Name</span>
                <span className="dossier-value">{employer.companyName}</span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Industry Sector</span>
                <span className="dossier-value">{employer.industry}</span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Company Size</span>
                <span className="dossier-value">{employer.companySize}</span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Corporate Email</span>
                <span className="dossier-value">{employer.email}</span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Phone</span>
                <span className="dossier-value">{employer.phone}</span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Official Website</span>
                <span className="dossier-value">
                  {employer.website ? (
                    <a href={employer.website} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
                      {employer.website}
                    </a>
                  ) : (
                    'Not provided'
                  )}
                </span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Headquarters Location</span>
                <span className="dossier-value">
                  {employer.address ? `${employer.address}, ` : ''}{employer.city}, {employer.state} {employer.postalCode}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <span className="dossier-label" style={{ display: 'block', marginBottom: '0.25rem' }}>
                Company Description
              </span>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-700)', lineHeight: '1.5' }}>
                {employer.companyDescription}
              </p>
            </div>
          </div>

          {/* Card: Contact Person */}
          <div className="dossier-card">
            <h3 className="dossier-card-title">Corporate Contact Person</h3>
            <div className="dossier-info-list">
              <div className="dossier-info-row">
                <span className="dossier-label">Contact Name</span>
                <span className="dossier-value">{employer.contactPerson?.name || 'N/A'}</span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Designation</span>
                <span className="dossier-value">{employer.contactPerson?.designation || 'N/A'}</span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Direct Email</span>
                <span className="dossier-value">{employer.contactPerson?.email || 'N/A'}</span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Direct Phone</span>
                <span className="dossier-value">{employer.contactPerson?.phone || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="dossier-col">
          {/* Card: Posted Jobs */}
          <div className="dossier-card">
            <h3 className="dossier-card-title">Published Job Postings ({jobs.length})</h3>
            {jobs.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-400)' }}>
                No job openings posted by this employer yet.
              </p>
            ) : (
              <div className="dossier-docs-list">
                {jobs.map((job) => (
                  <div key={job._id} className="dossier-doc-item">
                    <div>
                      <strong>{job.title}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                        ID: {job.jobId} • {job.location} • {job.applicantCount || 0} Applicants
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Badge variant={job.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {job.status}
                      </Badge>
                      <Link to={`/admin/jobs/${job.jobId}`} className="admin-btn-action">
                        Inspect
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Recent Applications Received */}
          <div className="dossier-card">
            <h3 className="dossier-card-title">Recent Candidate Applications ({applications.length})</h3>
            {applications.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-400)' }}>
                No candidate applications received yet.
              </p>
            ) : (
              <div className="dossier-docs-list">
                {applications.slice(0, 5).map((app) => (
                  <div key={app._id} className="dossier-doc-item">
                    <div>
                      <strong>{app.job?.title || 'Job Opening'}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                        Candidate: {app.veteran?.personalInformation?.fullName || 'Veteran'} (ID: {app.veteran?.veteranId})
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Badge variant={app.status === 'SELECTED' ? 'success' : 'neutral'}>
                        {app.status}
                      </Badge>
                      <Link to={`/admin/applications/jobs/${app.applicationId}`} className="admin-btn-action">
                        Inspect
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Audit Trail */}
          <div className="dossier-card">
            <h3 className="dossier-card-title">Employer Audit Trail</h3>
            {auditHistory.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-400)' }}>
                No moderation actions recorded for this employer.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {auditHistory.map((log) => (
                  <div key={log._id} className="dossier-sub-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <strong>{log.action}</strong>
                      <span style={{ color: 'var(--color-slate-400)' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-slate-700)', marginTop: '2px' }}>
                      {log.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      {modalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                {verificationStatus === 'VERIFIED' ? 'Verify Corporate Employer' : 'Reject Employer Verification'}
              </h3>
              <button type="button" className="admin-modal-close-btn" onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-600)' }}>
                Confirm verification action for <strong>{employer.companyName}</strong> (ID: {employer.employerId}).
              </p>
              <div className="admin-form-group">
                <label className="admin-form-label">Official Scrutiny Remarks:</label>
                <textarea
                  className="admin-form-textarea"
                  rows={4}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>

            <div className="admin-modal-footer">
              <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button
                variant={verificationStatus === 'VERIFIED' ? 'primary' : 'danger'}
                size="sm"
                onClick={handleSaveVerification}
                loading={actionLoading}
                icon={verificationStatus === 'VERIFIED' ? CheckCircle : XCircle}
              >
                Confirm {verificationStatus}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerDetail;
