import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  CreditCard,
  Building,
  User,
} from 'lucide-react';
import { adminService } from '../../../services/adminService.js';
import { documentService } from '../../../services/documentService.js';
import { ROUTES } from '../../../constants/index.js';
import Badge from '../../../components/Badge/Badge.jsx';
import Button from '../../../components/Button/Button.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../../components/ErrorMessage/ErrorMessage.jsx';
import '../AdminCommon.css';
import '../Veterans/VeteranDetail.css';

export const SchemeApplicationDetail = () => {
  const { id } = useParams();

  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status Action Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('APPROVED');
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApplication = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getSchemeApplicationById(id);
      setDossier(res.data);
    } catch (err) {
      console.error('Error fetching scheme application:', err);
      setError(err.message || 'Failed to load application claim details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const handleOpenStatusModal = (status) => {
    setTargetStatus(status);
    setRemarks(
      status === 'APPROVED'
        ? 'Application claims and supporting documents scrutinized and approved for grant disbursal.'
        : status === 'DISBURSED'
        ? 'Direct Benefit Transfer (DBT) funds processed and credited to verified bank account.'
        : status === 'REJECTED'
        ? 'Application rejected due to ineligibility or document discrepancies.'
        : 'Application placed under comprehensive departmental review.'
    );
    setModalOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!dossier?.application) return;
    setActionLoading(true);
    try {
      await adminService.updateSchemeApplicationStatus(dossier.application._id, {
        status: targetStatus,
        remarks,
      });
      setModalOpen(false);
      fetchApplication();
    } catch (err) {
      alert(err.message || 'Failed to update application status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <LoadingSpinner size="lg" text="Loading scheme claim dossier..." />
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

  const { application, documents = [], auditHistory = [] } = dossier;
  const veteran = application.veteran || {};
  const scheme = application.scheme || {};
  const formData = application.formData || {};
  const timeline = application.timeline || [];

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <Link to={ROUTES.ADMIN_SCHEME_APPLICATIONS} className="veteran-back-link">
            <ArrowLeft size={16} /> Back to Scheme Claims
          </Link>
          <h1 className="admin-page-title" style={{ marginTop: '0.5rem' }}>
            Claim #{application.applicationId}
          </h1>
          <p className="admin-page-subtitle">
            Scheme: <strong>{scheme.name}</strong> • Category: {scheme.category}
          </p>
        </div>

        <div className="veteran-action-bar">
          <Badge
            variant={
              application.status === 'APPROVED' || application.status === 'DISBURSED'
                ? 'success'
                : application.status === 'REJECTED'
                ? 'danger'
                : application.status === 'UNDER_REVIEW'
                ? 'warning'
                : 'info'
            }
          >
            STATUS: {application.status}
          </Badge>

          {application.status !== 'UNDER_REVIEW' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleOpenStatusModal('UNDER_REVIEW')}
            >
              Set Under Review
            </Button>
          )}

          {application.status !== 'APPROVED' && (
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle}
              onClick={() => handleOpenStatusModal('APPROVED')}
            >
              Approve Claim
            </Button>
          )}

          {application.status === 'APPROVED' && (
            <Button
              variant="primary"
              size="sm"
              icon={CreditCard}
              onClick={() => handleOpenStatusModal('DISBURSED')}
            >
              Mark Disbursed
            </Button>
          )}

          {application.status !== 'REJECTED' && (
            <Button
              variant="danger"
              size="sm"
              icon={XCircle}
              onClick={() => handleOpenStatusModal('REJECTED')}
            >
              Reject Claim
            </Button>
          )}
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="veteran-dossier-grid">
        {/* Left Column */}
        <div className="dossier-col">
          {/* Card: Applicant Dossier */}
          <div className="dossier-card">
            <h3 className="dossier-card-title">Applicant Military Profile</h3>
            <div className="dossier-info-list">
              <div className="dossier-info-row">
                <span className="dossier-label">Applicant Name</span>
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
                <span className="dossier-label">Service Branch & Rank</span>
                <span className="dossier-value">
                  {veteran.serviceInformation?.serviceBranch || 'N/A'} • {veteran.serviceInformation?.rank || 'N/A'}
                </span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Service Number</span>
                <span className="dossier-value">{veteran.serviceInformation?.serviceNumber || 'N/A'}</span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Email & Phone</span>
                <span className="dossier-value">
                  {veteran.personalInformation?.email || application.user?.email} •{' '}
                  {veteran.personalInformation?.phone || application.user?.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Card: Submitted Application Responses */}
          <div className="dossier-card">
            <h3 className="dossier-card-title">Submitted Questionnaire & DBT Details</h3>
            {Object.keys(formData).length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-400)' }}>
                No custom form responses recorded.
              </p>
            ) : (
              <div className="dossier-info-list">
                {Object.entries(formData).map(([key, val]) => (
                  <div key={key} className="dossier-info-row">
                    <span className="dossier-label">{key}</span>
                    <span className="dossier-value" style={{ maxWidth: '60%' }}>
                      {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Welfare Scheme Details */}
          <div className="dossier-card">
            <h3 className="dossier-card-title">Scheme Provision Details</h3>
            <div className="dossier-info-list">
              <div className="dossier-info-row">
                <span className="dossier-label">Scheme Name</span>
                <span className="dossier-value">{scheme.name}</span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Authority</span>
                <span className="dossier-value">{scheme.officialSource}</span>
              </div>
              <div className="dossier-info-row">
                <span className="dossier-label">Official Website</span>
                <span className="dossier-value">
                  <a href={scheme.officialWebsite} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>
                    {scheme.officialWebsite}
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="dossier-col">
          {/* Card: Attached Documents */}
          <div className="dossier-card">
            <h3 className="dossier-card-title">Attached Verification Documents ({documents.length})</h3>
            {documents.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-400)' }}>
                No documents directly attached to this claim.
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
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Badge variant={doc.verificationStatus === 'VERIFIED' ? 'success' : 'warning'}>
                        {doc.verificationStatus}
                      </Badge>
                      <a
                        href={documentService.getDocumentViewUrl(doc._id, doc.fileUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-btn-action"
                      >
                        <ExternalLink size={13} /> View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Status Timeline */}
          <div className="dossier-card">
            <h3 className="dossier-card-title">Claim Processing Timeline</h3>
            {timeline.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-400)' }}>
                No status transitions recorded yet.
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
                    {item.remarks && (
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-slate-700)', marginTop: '4px' }}>
                        Remarks: {item.remarks}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Audit Trail */}
          <div className="dossier-card">
            <h3 className="dossier-card-title">Administrative Audit Trail</h3>
            {auditHistory.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate-400)' }}>
                No moderation logs recorded for this claim.
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

      {/* Status Modal */}
      {modalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Update Claim Status to {targetStatus}</h3>
              <button type="button" className="admin-modal-close-btn" onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-600)' }}>
                Updating status for Claim <strong>#{application.applicationId}</strong> ({scheme.name}).
              </p>

              <div className="admin-form-group">
                <label className="admin-form-label">Administrative Scrutiny & Disbursal Remarks:</label>
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
                variant={targetStatus === 'APPROVED' || targetStatus === 'DISBURSED' ? 'primary' : 'danger'}
                size="sm"
                onClick={handleSaveStatus}
                loading={actionLoading}
                icon={targetStatus === 'APPROVED' ? CheckCircle : targetStatus === 'DISBURSED' ? CreditCard : XCircle}
              >
                Confirm {targetStatus}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchemeApplicationDetail;
