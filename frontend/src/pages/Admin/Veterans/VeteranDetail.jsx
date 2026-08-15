import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileCheck2,
  Award,
  Briefcase,
  ExternalLink,
  Clock,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Building,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { adminService } from '../../../services/adminService.js';
import { ROUTES } from '../../../constants/index.js';
import Badge from '../../../components/Badge/Badge.jsx';
import Button from '../../../components/Button/Button.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../../components/ErrorMessage/ErrorMessage.jsx';
import '../AdminCommon.css';
import './VeteranDetail.css';

export const VeteranDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verification modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('VERIFIED');
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchVeteran = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getVeteranById(id);
      setDossier(res.data);
    } catch (err) {
      console.error('Error fetching veteran details:', err);
      setError(err.message || 'Failed to load veteran dossier');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVeteran();
  }, [fetchVeteran]);

  const handleOpenVerification = (status) => {
    setVerificationStatus(status);
    setRemarks(
      status === 'VERIFIED'
        ? 'Service documents and military credentials officially verified.'
        : 'Discharge or identity certificate required for verification.'
    );
    setModalOpen(true);
  };

  const handleSaveVerification = async () => {
    if (!dossier?.veteran) return;
    setActionLoading(true);
    try {
      await adminService.updateVeteranVerification(dossier.veteran._id, {
        status: verificationStatus,
        remarks,
      });
      setModalOpen(false);
      fetchVeteran();
    } catch (err) {
      alert(err.message || 'Failed to update verification status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <LoadingSpinner size="lg" text="Loading military service dossier..." />
      </div>
    );
  }

  if (error || !dossier?.veteran) {
    return (
      <div style={{ padding: '2rem' }}>
        <ErrorMessage message={error || 'Veteran profile not found'} onRetry={fetchVeteran} />
      </div>
    );
  }

  const { veteran, documents = [], schemeApplications = [], jobApplications = [], auditHistory = [] } = dossier;
  const personal = veteran.personalInformation || {};
  const service = veteran.serviceInformation || {};
  const education = veteran.education || [];
  const skills = veteran.skills || [];
  const certifications = veteran.certifications || [];
  const preferences = veteran.jobPreferences || {};

  return (
    <div className="admin-page-container">
      {/* Top Breadcrumb & Actions */}
      <div className="admin-page-header">
        <div>
          <Link to={ROUTES.ADMIN_VETERANS} className="veteran-back-link">
            <ArrowLeft size={16} /> Back to Veterans Directory
          </Link>
          <h1 className="admin-page-title" style={{ marginTop: '0.5rem' }}>
            {personal.fullName || veteran.veteranId}
          </h1>
          <p className="admin-page-subtitle">
            Veteran ID: <strong>{veteran.veteranId}</strong> • Branch: {service.serviceBranch} • Rank: {service.rank || 'N/A'}
          </p>
        </div>

        <div className="veteran-action-bar">
          <Badge
            variant={
              veteran.verificationStatus === 'VERIFIED'
                ? 'success'
                : veteran.verificationStatus === 'REJECTED'
                ? 'danger'
                : 'warning'
            }
          >
            STATUS: {veteran.verificationStatus}
          </Badge>

          {veteran.verificationStatus !== 'VERIFIED' && (
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle}
              onClick={() => handleOpenVerification('VERIFIED')}
            >
              Verify Profile
            </Button>
          )}

          {veteran.verificationStatus !== 'REJECTED' && (
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

      {/* Grid: 2 Column Layout */}
      <div className="veteran-dossier-grid">
        {/* Left Column: Personal & Military Record */}
        <div className="dossier-col">
          {/* Card: Personal Information */}
          <div className="dossier-card">
            <h3 className="dossier-card-title">Personal & Contact Profile</h3>
            <div className="dossier-info-list">
              <div className="dossier-info-row">
                <span className="dossier-label">Full Name</span>
                <span className="dossier-value">{personal.fullName || 'N/A'}</span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Email Address</span>
                <span className="dossier-value">{personal.email || veteran.user?.email || 'N/A'}</span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Phone Number</span>
                <span className="dossier-value">{personal.phone || veteran.user?.phone || 'N/A'}</span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Gender / DOB</span>
                <span className="dossier-value">
                  {personal.gender || 'N/A'} • {personal.dob ? new Date(personal.dob).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Residential Address</span>
                <span className="dossier-value">
                  {personal.address ? `${personal.address}, ` : ''}{personal.city || ''} {personal.state || ''} {personal.pincode || ''}
                </span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Profile Completion</span>
                <span className="dossier-value">
                  <strong>{veteran.profileCompletion || 0}%</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Card: Military Service Information */}
          <div className="dossier-card">
            <h3 className="dossier-card-title">Military Service Record</h3>
            <div className="dossier-info-list">
              <div className="dossier-info-row">
                <span className="dossier-label">Service Branch</span>
                <span className="dossier-value">
                  <Badge variant="neutral">{service.serviceBranch || 'N/A'}</Badge>
                </span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Military Rank</span>
                <span className="dossier-value">{service.rank || 'N/A'}</span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Service Number</span>
                <span className="dossier-value"><strong>{service.serviceNumber || 'N/A'}</strong></span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Years of Service</span>
                <span className="dossier-value">{service.yearsOfService || 0} Years</span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Joining & Discharge</span>
                <span className="dossier-value">
                  {service.dateOfJoining ? new Date(service.dateOfJoining).toLocaleDateString() : 'N/A'} →{' '}
                  {service.dateOfDischarge ? new Date(service.dateOfDischarge).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Service Status</span>
                <span className="dossier-value">{service.serviceStatus || 'Retired'}</span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Primary Defense Role</span>
                <span className="dossier-value">{service.primaryMilitaryRole || 'N/A'}</span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Last Military Posting</span>
                <span className="dossier-value">{service.lastPosting || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Card: Education & Certifications */}
          <div className="dossier-card">
            <h3 className="dossier-card-title">Education & Certifications</h3>
            {education.length === 0 && certifications.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-400)' }}>
                No education or certification records submitted.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {education.map((edu, idx) => (
                  <div key={idx} className="dossier-sub-item">
                    <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                      {edu.qualification} - {edu.fieldOfStudy}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                      {edu.institution} ({edu.year || 'N/A'})
                    </div>
                  </div>
                ))}
                {certifications.map((cert, idx) => (
                  <div key={idx} className="dossier-sub-item">
                    <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                      🎖 {cert.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                      {cert.issuingOrganization} {cert.credentialId ? `(ID: ${cert.credentialId})` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Skills & Preferences */}
          <div className="dossier-card">
            <h3 className="dossier-card-title">Skills & Job Preferences</h3>
            <div style={{ marginBottom: '1rem' }}>
              <span className="dossier-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Core & Military Translated Skills
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {skills.length === 0 ? (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-slate-400)' }}>No skills listed.</span>
                ) : (
                  skills.map((s, idx) => (
                    <Badge key={idx} variant="info">{s}</Badge>
                  ))
                )}
              </div>
            </div>

            <div className="dossier-info-list">
              <div className="dossier-info-row">
                <span className="dossier-label">Preferred Industries</span>
                <span className="dossier-value">{preferences.preferredIndustries?.join(', ') || 'Any'}</span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Preferred Locations</span>
                <span className="dossier-value">{preferences.preferredJobLocation?.join(', ') || 'Any'}</span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Relocation / Remote</span>
                <span className="dossier-value">
                  {preferences.willingToRelocate ? 'Willing to relocate' : 'No relocation'} •{' '}
                  {preferences.remoteWorkPreference ? 'Prefers remote' : 'Onsite preferred'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Documents Vault & History */}
        <div className="dossier-col">
          {/* Card: Uploaded Documents */}
          <div className="dossier-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h3 className="dossier-card-title" style={{ margin: 0 }}>
                Supporting Documents Vault ({documents.length})
              </h3>
              <Link to={`${ROUTES.ADMIN_DOCUMENTS}?veteranId=${veteran.veteranId}`} style={{ fontSize: '0.75rem', color: '#2563eb' }}>
                Manage All
              </Link>
            </div>

            {documents.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-400)' }}>
                No verification documents uploaded by this veteran yet.
              </p>
            ) : (
              <div className="dossier-docs-list">
                {documents.map((doc) => (
                  <div key={doc._id} className="dossier-doc-item">
                    <div>
                      <strong>{doc.documentName}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                        Type: {doc.documentType} • Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                      </div>
                      {doc.adminRemarks && (
                        <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '2px' }}>
                          Remarks: {doc.adminRemarks}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Badge
                        variant={
                          doc.verificationStatus === 'VERIFIED'
                            ? 'success'
                            : doc.verificationStatus === 'REJECTED'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {doc.verificationStatus}
                      </Badge>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-btn-action"
                        title="View Document"
                      >
                        <ExternalLink size={13} /> View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Welfare Scheme Applications */}
          <div className="dossier-card">
            <h3 className="dossier-card-title">Welfare Scheme Applications ({schemeApplications.length})</h3>
            {schemeApplications.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-400)' }}>
                No welfare scheme claims submitted yet.
              </p>
            ) : (
              <div className="dossier-docs-list">
                {schemeApplications.map((app) => (
                  <div key={app._id} className="dossier-doc-item">
                    <div>
                      <strong>{app.scheme?.name || 'Welfare Scheme'}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                        App ID: {app.applicationId} • {app.scheme?.category || 'Category'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Badge
                        variant={
                          app.status === 'APPROVED'
                            ? 'success'
                            : app.status === 'REJECTED'
                            ? 'danger'
                            : 'info'
                        }
                      >
                        {app.status}
                      </Badge>
                      <Link to={`/admin/applications/schemes/${app.applicationId}`} className="admin-btn-action">
                        Inspect
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Job Applications */}
          <div className="dossier-card">
            <h3 className="dossier-card-title">Job Recruitment Applications ({jobApplications.length})</h3>
            {jobApplications.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-400)' }}>
                No corporate job applications submitted yet.
              </p>
            ) : (
              <div className="dossier-docs-list">
                {jobApplications.map((app) => (
                  <div key={app._id} className="dossier-doc-item">
                    <div>
                      <strong>{app.job?.title || 'Job Posting'}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                        Employer: {app.employer?.companyName || 'Employer'} • ID: {app.applicationId}
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

          {/* Card: Administrative Audit Trail */}
          <div className="dossier-card">
            <h3 className="dossier-card-title">Administrative Audit Trail</h3>
            {auditHistory.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-400)' }}>
                No administrative moderation actions recorded yet.
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
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-slate-500)', marginTop: '2px' }}>
                      By Admin: {log.user?.name || 'Admin'} ({log.user?.email || ''})
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
                {verificationStatus === 'VERIFIED' ? 'Approve Military Service Verification' : 'Reject Service Verification'}
              </h3>
              <button type="button" className="admin-modal-close-btn" onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-600)' }}>
                Confirm verification action for <strong>{personal.fullName || veteran.veteranId}</strong> (ID: {veteran.veteranId}).
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

export default VeteranDetail;
