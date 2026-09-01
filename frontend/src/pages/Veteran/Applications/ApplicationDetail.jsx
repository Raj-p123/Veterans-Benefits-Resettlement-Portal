import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Building,
  User,
  ShieldCheck,
  ExternalLink,
  Trash2,
  Info,
  Check,
  FileCheck2,
} from 'lucide-react';
import { applicationService } from '../../../services/applicationService.js';
import { useSocket } from '../../../context/SocketContext.jsx';
import { SOCKET_EVENTS } from '../../../constants/socketEvents.js';
import PageContainer from '../../../components/PageContainer/PageContainer.jsx';
import Button from '../../../components/Button/Button.jsx';
import Badge from '../../../components/Badge/Badge.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../../components/ErrorMessage/ErrorMessage.jsx';
import './ApplicationDetail.css';

export const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { on, off } = useSocket();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const loadApplication = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await applicationService.getApplicationById(id);
      if (data && data.application) {
        setApplication(data.application);
      }
    } catch (err) {
      setError(err.message || 'Unable to retrieve application details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadApplication();
  }, [id]);

  // Real-time status synchronization
  useEffect(() => {
    const handleStatusChanged = (data) => {
      if (
        application &&
        (data.applicationId === application.applicationId || data.applicationId === application._id)
      ) {
        console.log('[Real-Time] Scheme application status updated live:', data);
        setApplication((prev) => ({
          ...prev,
          status: data.status,
          adminRemarks: data.adminRemarks !== undefined ? data.adminRemarks : prev.adminRemarks,
          timeline: data.timeline || prev.timeline,
        }));
      }
    };

    on(SOCKET_EVENTS.APPLICATION_STATUS_CHANGED, handleStatusChanged);

    return () => {
      off(SOCKET_EVENTS.APPLICATION_STATUS_CHANGED, handleStatusChanged);
    };
  }, [application, on, off]);

  const handleWithdraw = async () => {
    if (!window.confirm('Are you sure you want to withdraw this application? This action will cancel current processing.')) {
      return;
    }

    setWithdrawing(true);
    setError('');
    try {
      const res = await applicationService.withdrawApplication(application.id || application._id);
      if (res && res.application) {
        setApplication(res.application);
        setActionSuccess('Application has been successfully withdrawn.');
      }
    } catch (err) {
      setError(err.message || 'Failed to withdraw application');
    } finally {
      setWithdrawing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT': return <Badge variant="neutral">Draft</Badge>;
      case 'SUBMITTED': return <Badge variant="info">Submitted</Badge>;
      case 'UNDER_REVIEW': return <Badge variant="warning">Under Review</Badge>;
      case 'DOCUMENT_VERIFICATION': return <Badge variant="warning">Document Verification</Badge>;
      case 'APPROVED': return <Badge variant="success">Approved</Badge>;
      case 'REJECTED': return <Badge variant="danger">Rejected</Badge>;
      case 'WITHDRAWN': return <Badge variant="neutral">Withdrawn</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const resolveFileUrl = (url) => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const backendBase = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
      : (import.meta.env.PROD ? '' : 'http://localhost:5000');
    return `${backendBase}${url}`;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size="lg" message="Loading application dossier & timeline..." />
      </div>
    );
  }

  if (error || !application) {
    return (
      <PageContainer width="regular">
        <div style={{ padding: '3rem 0' }}>
          <ErrorMessage message={error || 'Application record not found.'} />
          <Link to="/veteran/applications">
            <Button variant="secondary" size="md" icon={ArrowLeft}>
              Back to My Applications
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const scheme = application.scheme || {};
  const veteran = application.veteran || {};
  const canWithdraw = ['DRAFT', 'SUBMITTED'].includes(application.status);

  return (
    <PageContainer width="wide">
      <div className="app-detail-page-wrapper">
        {/* Top Back Link */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/veteran/applications">
            <Button variant="ghost" size="sm" icon={ArrowLeft}>
              Back to All Applications
            </Button>
          </Link>
        </div>

        {/* Application Header Card */}
        <div className="app-detail-header-card">
          <div className="app-detail-header-top">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Badge variant="gold">{scheme.category || 'Welfare Scheme'}</Badge>
              {getStatusBadge(application.status)}
            </div>
            <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-primary-900)' }}>
              {application.applicationId}
            </span>
          </div>

          <h1 className="app-detail-title">{scheme.name || 'Welfare Scheme Application'}</h1>

          <div className="app-detail-meta">
            <span>Authority: {scheme.officialSource || 'DESW'}</span>
            <span>•</span>
            <span>
              Submitted:{' '}
              {application.submittedAt
                ? new Date(application.submittedAt).toLocaleString()
                : 'Not yet submitted (Draft)'}
            </span>
          </div>
        </div>

        {/* Success Alert */}
        {actionSuccess && (
          <div style={{ backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)', color: 'var(--color-success)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <CheckCircle2 size={18} />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Admin Remarks Notice (if available) */}
        {application.adminRemarks && (
          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-xl)', padding: '1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <Info size={22} color="#1d4ed8" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 800, color: '#1e40af', fontSize: '0.9375rem', marginBottom: '2px' }}>
                Departmental Remark / Communication
              </div>
              <p style={{ fontSize: '0.875rem', color: '#1e3a8a', lineHeight: 1.5 }}>
                {application.adminRemarks}
              </p>
            </div>
          </div>
        )}

        {/* Status Timeline Visualizer */}
        <div className="timeline-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-950)' }}>
              Application Status Timeline
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Live Tracking System
            </span>
          </div>

          <div className="timeline-milestones-track">
            {application.timeline?.map((evt, idx) => {
              const isCompleted = ['SUBMITTED', 'UNDER_REVIEW', 'DOCUMENT_VERIFICATION', 'APPROVED'].includes(evt.status);
              const isReject = evt.status === 'REJECTED';

              return (
                <div key={idx} className="timeline-event-row">
                  <div
                    className={`timeline-node-dot ${
                      isReject ? 'rejected' : isCompleted ? 'completed' : 'current'
                    }`}
                  >
                    {isCompleted ? <Check size={12} color="#fff" /> : null}
                  </div>

                  <div className="timeline-event-content">
                    <div className="timeline-event-header">
                      <span className="timeline-event-title">
                        {evt.status.replace('_', ' ')}
                      </span>
                      <span className="timeline-event-date">
                        {new Date(evt.changedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="timeline-event-msg">{evt.message}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Applicant Dossier */}
        <div className="detail-section-card">
          <h3 className="detail-section-title">
            <User size={18} /> Applicant & Defense Dossier
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: 'var(--color-slate-500)', fontSize: '0.75rem', fontWeight: 700 }}>FULL NAME:</span>
              <div style={{ fontWeight: 700, color: 'var(--color-primary-950)' }}>{veteran.personalInformation?.fullName}</div>
            </div>
            <div>
              <span style={{ color: 'var(--color-slate-500)', fontSize: '0.75rem', fontWeight: 700 }}>VETERAN ID:</span>
              <div style={{ fontWeight: 700, color: 'var(--color-accent-600)', fontFamily: 'monospace' }}>{veteran.veteranId}</div>
            </div>
            <div>
              <span style={{ color: 'var(--color-slate-500)', fontSize: '0.75rem', fontWeight: 700 }}>BRANCH & RANK:</span>
              <div style={{ fontWeight: 700, color: 'var(--color-primary-950)' }}>
                {veteran.serviceInformation?.serviceBranch} • {veteran.serviceInformation?.rank}
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--color-slate-500)', fontSize: '0.75rem', fontWeight: 700 }}>TOTAL SERVICE:</span>
              <div style={{ fontWeight: 700, color: 'var(--color-primary-950)' }}>
                {veteran.serviceInformation?.yearsOfService || 0} Years ({veteran.serviceInformation?.serviceStatus || 'Retired'})
              </div>
            </div>
          </div>
        </div>

        {/* Submitted Form Answers */}
        <div className="detail-section-card">
          <h3 className="detail-section-title">
            <FileText size={18} /> Submitted Application Answers
          </h3>
          {application.formData && Object.keys(application.formData).length > 0 ? (
            <table className="answers-table">
              <tbody>
                {Object.entries(application.formData).map(([key, val]) => (
                  <tr key={key}>
                    <td className="answers-label-cell">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                    </td>
                    <td className="answers-value-cell">{String(val)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.875rem' }}>
              Standard defense entitlement claim details submitted.
            </p>
          )}
        </div>

        {/* Attached Supporting Documents */}
        <div className="detail-section-card">
          <h3 className="detail-section-title">
            <FileCheck2 size={18} /> Attached Supporting Documents ({application.documents?.length || 0})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {application.documents?.map((doc, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--color-slate-50)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border-main)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-primary-950)' }}>
                    {doc.documentType}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    {doc.documentName}
                  </div>
                </div>

                <a href={resolveFileUrl(doc.fileUrl)} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="sm" icon={ExternalLink}>
                    View
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Withdrawal Section */}
        {canWithdraw && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              loading={withdrawing}
              onClick={handleWithdraw}
            >
              Withdraw Application
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default ApplicationDetail;
