import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import employerService from '../../../services/employerService';
import {
  User,
  Shield,
  Briefcase,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  AlertCircle,
  ExternalLink,
  Send,
  MessageSquare,
  Award,
  BookOpen,
} from 'lucide-react';
import './EmployerJobApplicants.css';

export const EmployerApplicantDetail = () => {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status Action Modal State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await employerService.getApplicantDetail(id);
      if (res.success) {
        setApplication(res.data.application);
      }
    } catch (err) {
      console.error('Failed to load applicant detail:', err);
      setError('Unable to load applicant dossier or access denied.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const handleOpenStatusModal = (status) => {
    setTargetStatus(status);
    if (status === 'SHORTLISTED') {
      setRemarks('Candidate background and military credentials shortlisted for next evaluation stage.');
    } else if (status === 'INTERVIEW') {
      setRemarks('Please attend the formal technical interview. Interview details will be communicated via official email.');
    } else if (status === 'SELECTED') {
      setRemarks('Congratulations! Candidate has been selected for the position.');
    } else if (status === 'REJECTED') {
      setRemarks('We appreciate your defense service, but we are proceeding with other candidates for this specific role.');
    } else if (status === 'UNDER_REVIEW') {
      setRemarks('Dossier is undergoing active review by hiring panel.');
    } else {
      setRemarks('');
    }
    setShowStatusModal(true);
  };

  const handleConfirmStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      const res = await employerService.updateApplicantStatus(
        application.applicationId || application._id,
        {
          status: targetStatus,
          employerRemarks: remarks,
        }
      );
      if (res.success) {
        setApplication(res.data.application);
        setShowStatusModal(false);
        alert(`Candidate status updated to ${targetStatus.replace('_', ' ')}!`);
      }
    } catch (err) {
      console.error('Failed to update applicant status:', err);
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="employer-applicants-page">
        <div className="container" style={{ textAlign: 'center', padding: '6rem 0' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#64748b' }}>Loading candidate military dossier...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="employer-applicants-page">
        <div className="container" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
          <div className="alert alert-danger" style={{ padding: '2rem' }}>
            <AlertCircle size={40} style={{ color: '#dc2626', margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{error}</h2>
            <Link to="/employer/jobs" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              <ChevronLeft size={16} /> Back to Job Postings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { veteran, job, timeline = [], status } = application;
  const personal = veteran?.personalInformation || {};
  const service = veteran?.serviceInformation || {};

  return (
    <div className="employer-applicants-page">
      <div className="container" style={{ maxWidth: '960px' }}>
        {/* Navigation */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            to={`/employer/jobs/${job?._id || job?.jobId}/applications`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              color: '#64748b',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            <ChevronLeft size={18} /> Back to Applicants Board
          </Link>
        </div>

        {/* Top Header & Status Progression Actions */}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#2563eb' }}>
                APPLICATION: {application.applicationId} • VETERAN ID: {veteran?.veteranId}
              </span>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
                {personal.fullName || 'Veteran Candidate'}
              </h1>
              <div style={{ fontSize: '1rem', color: '#475569', fontWeight: 600 }}>
                Applying for: <strong style={{ color: '#0f172a' }}>{job?.title}</strong>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.35rem' }}>
                CURRENT STAGE
              </span>
              <span
                style={{
                  display: 'inline-block',
                  padding: '0.45rem 1rem',
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
            </div>
          </div>

          {/* Recruiter Action Bar */}
          <div
            style={{
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155' }}>Recruiter Actions:</span>

            {status === 'APPLIED' && (
              <button onClick={() => handleOpenStatusModal('UNDER_REVIEW')} className="btn btn-outline">
                <Clock size={16} /> Move to Under Review
              </button>
            )}

            {['APPLIED', 'UNDER_REVIEW'].includes(status) && (
              <button
                onClick={() => handleOpenStatusModal('SHORTLISTED')}
                className="btn btn-primary"
                style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
              >
                <Award size={16} /> Shortlist Candidate
              </button>
            )}

            {status === 'SHORTLISTED' && (
              <button
                onClick={() => handleOpenStatusModal('INTERVIEW')}
                className="btn btn-primary"
                style={{ background: '#0284c7', borderColor: '#0284c7' }}
              >
                <MessageSquare size={16} /> Schedule Interview
              </button>
            )}

            {status === 'INTERVIEW' && (
              <button
                onClick={() => handleOpenStatusModal('SELECTED')}
                className="btn btn-primary"
                style={{ background: '#16a34a', borderColor: '#16a34a' }}
              >
                <CheckCircle2 size={16} /> Select Candidate
              </button>
            )}

            {!['SELECTED', 'REJECTED', 'WITHDRAWN'].includes(status) && (
              <button
                onClick={() => handleOpenStatusModal('REJECTED')}
                className="btn btn-outline"
                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
              >
                <XCircle size={16} /> Reject
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Dossier */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          {/* Military Service Record */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '0.75rem',
              border: '1px solid #e2e8f0',
              padding: '1.75rem',
            }}
          >
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} /> Verified Military Background
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Service Branch:</span>
                <strong>{service.serviceBranch || 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Rank / Cadre:</span>
                <strong>{service.rank || 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Years of Service:</span>
                <strong>{service.yearsOfService || 0} Years</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Discharge Status:</span>
                <strong>{service.serviceStatus || 'Retired'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Location / State:</span>
                <strong>{personal.state || 'India'}</strong>
              </div>
            </div>
          </div>

          {/* Education & Skills */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '0.75rem',
              border: '1px solid #e2e8f0',
              padding: '1.75rem',
            }}
          >
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={18} /> Verified Skills & Qualifications
            </h2>

            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Core Skills
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                {(veteran?.skills || []).map((sk, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: '#f1f5f9',
                      color: '#334155',
                      fontSize: '0.8rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '9999px',
                      fontWeight: 600,
                    }}
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Education
              </span>
              <div style={{ marginTop: '0.35rem', fontSize: '0.875rem', color: '#334155' }}>
                {(veteran?.education || []).map((ed, idx) => (
                  <div key={idx} style={{ marginBottom: '0.25rem' }}>
                    <strong>{ed.qualification}</strong> — {ed.institution} ({ed.year})
                  </div>
                ))}
                {(veteran?.education || []).length === 0 && <span>Defense Graduate / Equivalent</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Resume & Cover Letter */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '0.75rem',
            border: '1px solid #e2e8f0',
            padding: '2rem',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem' }}>
            Candidate Submission Dossier
          </h2>

          {application.resumeDocument && (
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Attached Resume / Defense Record
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
                Candidate Cover Note / Statement
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

        {/* Timeline */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '0.75rem',
            border: '1px solid #e2e8f0',
            padding: '2rem',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem' }}>
            Application Audit Timeline
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
              <div key={idx} style={{ position: 'relative', marginBottom: '1.5rem' }}>
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
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                  {evt.status.replace('_', ' ')}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569', margin: '0.2rem 0' }}>
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
      </div>

      {/* Recruiter Action Modal */}
      {showStatusModal && (
        <div className="modal-overlay">
          <div className="apply-modal-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                Update Status to {targetStatus.replace('_', ' ')}
              </h2>
              <button
                onClick={() => setShowStatusModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmStatusUpdate}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: '#334155' }}>
                  Recruiter Remarks / Communication Note
                </label>
                <textarea
                  rows={4}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks visible on candidate tracking board..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="btn btn-secondary"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={updating}>
                  {updating ? 'Updating...' : `Confirm ${targetStatus.replace('_', ' ')}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerApplicantDetail;
