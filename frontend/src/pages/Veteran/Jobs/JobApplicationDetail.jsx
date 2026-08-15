import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import jobApplicationService from '../../../services/jobApplicationService';
import { useSocket } from '../../../context/SocketContext';
import { SOCKET_EVENTS } from '../../../constants/socketEvents';
import {
  Briefcase,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronLeft,
  FileText,
  AlertCircle,
  Shield,
  ExternalLink,
  Ban,
} from 'lucide-react';
import './MyJobApplications.css';

export const JobApplicationDetail = () => {
  const { id } = useParams();
  const { on, off } = useSocket();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await jobApplicationService.getApplicationDetail(id);
      if (res.success) {
        setApplication(res.data.application);
      }
    } catch (err) {
      console.error('Error fetching job application detail:', err);
      setError('Job application record not found or access denied.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // Real-time status synchronization
  useEffect(() => {
    const handleStatusChanged = (data) => {
      if (
        application &&
        (data.applicationId === application.applicationId || data.applicationId === application._id)
      ) {
        console.log('[Real-Time] Job application status updated live:', data);
        setApplication((prev) => ({
          ...prev,
          status: data.status,
          employerRemarks: data.employerRemarks !== undefined ? data.employerRemarks : prev.employerRemarks,
          timeline: data.timeline || prev.timeline,
        }));
      }
    };

    on(SOCKET_EVENTS.JOB_APPLICATION_STATUS_CHANGED, handleStatusChanged);
    on(SOCKET_EVENTS.APPLICATION_STATUS_CHANGED, handleStatusChanged);

    return () => {
      off(SOCKET_EVENTS.JOB_APPLICATION_STATUS_CHANGED, handleStatusChanged);
      off(SOCKET_EVENTS.APPLICATION_STATUS_CHANGED, handleStatusChanged);
    };
  }, [application, on, off]);

  const handleWithdraw = async () => {
    if (!window.confirm('Are you sure you want to withdraw this job application? This action cannot be undone.')) {
      return;
    }

    try {
      setWithdrawing(true);
      const res = await jobApplicationService.withdrawApplication(application.applicationId || application._id);
      if (res.success) {
        setApplication(res.data.application);
        alert('Your application has been withdrawn.');
      }
    } catch (err) {
      console.error('Withdrawal failed:', err);
      alert(err.response?.data?.message || 'Failed to withdraw application.');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="my-job-apps-page">
        <div className="container" style={{ textAlign: 'center', padding: '6rem 0' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#64748b' }}>Loading application status & timeline...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="my-job-apps-page">
        <div className="container" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
          <div className="alert alert-danger" style={{ padding: '2rem' }}>
            <AlertCircle size={40} style={{ color: '#dc2626', margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{error}</h2>
            <Link to="/veteran/job-applications" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              <ChevronLeft size={16} /> Back to My Applications
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { job, employer, timeline = [], status } = application;
  const canWithdraw = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED'].includes(status);

  return (
    <div className="my-job-apps-page">
      <div className="container" style={{ maxWidth: '960px' }}>
        {/* Navigation */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            to="/veteran/job-applications"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              color: '#64748b',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            <ChevronLeft size={18} /> Back to All Job Applications
          </Link>
        </div>

        {/* Application Header Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '0.75rem',
            border: '1px solid #e2e8f0',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#2563eb', letterSpacing: '0.05em' }}>
                APPLICATION ID: {application.applicationId}
              </span>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
                {job?.title}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '1rem', fontWeight: 600 }}>
                <Building2 size={16} />
                <span>{employer?.companyName}</span>
                <span style={{ color: '#94a3b8' }}>•</span>
                <span>{job?.city}, {job?.state}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '0.5rem 1rem',
                  borderRadius: '9999px',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  background: status === 'SELECTED' ? '#f0fdf4' : status === 'REJECTED' ? '#fef2f2' : '#eff6ff',
                  color: status === 'SELECTED' ? '#166534' : status === 'REJECTED' ? '#b91c1c' : '#1d4ed8',
                  border: '1px solid currentColor',
                }}
              >
                {status.replace('_', ' ')}
              </span>

              {canWithdraw && (
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  className="btn btn-outline"
                  style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                >
                  <Ban size={16} /> {withdrawing ? 'Withdrawing...' : 'Withdraw Application'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Employer Remarks Alert (If Any) */}
        {application.employerRemarks && (
          <div
            style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0369a1', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} /> Official Communication from Recruiter
            </h2>
            <p style={{ color: '#0c4a6e', fontSize: '0.95rem', lineHeight: '1.6' }}>
              "{application.employerRemarks}"
            </p>
          </div>
        )}

        {/* Status Timeline */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '0.75rem',
            border: '1px solid #e2e8f0',
            padding: '2rem',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem' }}>
            Application Milestone Timeline
          </h2>

          <div style={{ position: 'relative', paddingLeft: '2rem' }}>
            <div
              style={{
                position: 'absolute',
                left: '9px',
                top: '8px',
                bottom: '8px',
                width: '2px',
                background: '#e2e8f0',
              }}
            />

            {timeline.map((evt, idx) => (
              <div key={idx} style={{ position: 'relative', marginBottom: '1.75rem' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '-2rem',
                    top: '2px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: idx === timeline.length - 1 ? '#2563eb' : '#94a3b8',
                    border: '3px solid #ffffff',
                    boxShadow: '0 0 0 1px #cbd5e1',
                  }}
                />
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                  {evt.status.replace('_', ' ')}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#475569', margin: '0.25rem 0' }}>
                  {evt.message}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {new Date(evt.changedAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dossier Summary */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '0.75rem',
            border: '1px solid #e2e8f0',
            padding: '2rem',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem' }}>
            Submitted Candidate Details
          </h2>

          {application.resumeDocument && (
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Attached Resume / Defense Certificate
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginTop: '0.5rem',
                  padding: '0.75rem 1rem',
                  background: '#f8fafc',
                  borderRadius: '0.375rem',
                  border: '1px solid #e2e8f0',
                }}
              >
                <FileText size={20} className="text-primary" />
                <span style={{ fontWeight: 600, color: '#0f172a', flex: 1 }}>
                  {application.resumeDocument.documentName}
                </span>
                {application.resumeDocument.fileUrl && (
                  <a
                    href={application.resumeDocument.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem' }}
                  >
                    View Document <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>
          )}

          {application.coverLetter && (
            <div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Cover Letter / Statement of Suitability
              </span>
              <p
                style={{
                  marginTop: '0.5rem',
                  padding: '1rem',
                  background: '#f8fafc',
                  borderRadius: '0.375rem',
                  border: '1px solid #e2e8f0',
                  color: '#334155',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {application.coverLetter}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobApplicationDetail;
