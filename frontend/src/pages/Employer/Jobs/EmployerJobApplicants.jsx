import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import employerService from '../../../services/employerService';
import { useSocket } from '../../../context/SocketContext';
import { SOCKET_EVENTS } from '../../../constants/socketEvents';
import {
  Users,
  Briefcase,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Shield,
  CheckCircle2,
  Clock,
  Search,
} from 'lucide-react';
import './EmployerJobApplicants.css';

const STATUS_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'APPLIED', label: 'Applied' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'SHORTLISTED', label: 'Shortlisted' },
  { key: 'INTERVIEW', label: 'Interview' },
  { key: 'SELECTED', label: 'Selected' },
  { key: 'REJECTED', label: 'Rejected' },
];

export const EmployerJobApplicants = () => {
  const { jobId } = useParams();
  const { on, off, joinRoom, leaveRoom } = useSocket();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [counts, setCounts] = useState({
    total: 0,
    applied: 0,
    underReview: 0,
    shortlisted: 0,
    interview: 0,
    selected: 0,
    rejected: 0,
  });

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        search: search.trim() || undefined,
      };

      const res = await employerService.getJobApplicants(jobId, params);
      if (res.success) {
        setJob(res.data.job);
        setApplications(res.data.applications || []);
        if (res.data.counts) setCounts(res.data.counts);
      }
    } catch (err) {
      console.error('Failed to load job applicants:', err);
      setError('Unable to load applicants for this job posting.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [jobId, selectedStatus]);

  // Real-time live applicant reception
  useEffect(() => {
    const jobRoom = `job:${jobId}`;
    joinRoom(jobRoom);

    const handleNewApplicant = (data) => {
      console.log('[Real-Time Employer] New applicant received:', data);
      if (data.jobId === jobId || data.jobId === job?.jobId) {
        if (data.application) {
          setApplications((prev) => [data.application, ...prev]);
        } else {
          fetchApplicants();
        }
        setCounts((prev) => ({
          ...prev,
          total: prev.total + 1,
          applied: prev.applied + 1,
        }));
      }
    };

    on(SOCKET_EVENTS.JOB_APPLICATION_CREATED, handleNewApplicant);

    return () => {
      leaveRoom(jobRoom);
      off(SOCKET_EVENTS.JOB_APPLICATION_CREATED, handleNewApplicant);
    };
  }, [jobId, job, on, off, joinRoom, leaveRoom]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchApplicants();
  };

  const getStatusBadge = (status) => {
    let bg = '#eff6ff',
      color = '#1d4ed8';
    if (status === 'SELECTED') {
      bg = '#f0fdf4';
      color = '#166534';
    } else if (status === 'REJECTED') {
      bg = '#fef2f2';
      color = '#b91c1c';
    } else if (status === 'SHORTLISTED') {
      bg = '#f5f3ff';
      color = '#6d28d9';
    } else if (status === 'INTERVIEW') {
      bg = '#ecfeff';
      color = '#0e7490';
    } else if (status === 'UNDER_REVIEW') {
      bg = '#fefce8';
      color = '#854d0e';
    }

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '0.35rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 800,
          background: bg,
          color: color,
          border: `1px solid ${color}33`,
          textTransform: 'uppercase',
        }}
      >
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="employer-applicants-page">
      <div className="container">
        {/* Navigation */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            to="/employer/jobs"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              color: '#64748b',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            <ChevronLeft size={18} /> Back to Job Management
          </Link>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#2563eb' }}>
            JOB ID: {job?.jobId || jobId}
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
            Applicant Review Board: {job?.title}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Review defense military backgrounds, service certifications, and progress candidates through hiring stages.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key)}
              className={`btn ${selectedStatus === tab.key ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.45rem 1rem', fontSize: '0.875rem' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Applicants List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: '#64748b' }}>Loading applicant dossiers...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger" style={{ textAlign: 'center', padding: '2rem' }}>
            {error}
          </div>
        ) : applications.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              padding: '4rem 2rem',
              borderRadius: '0.75rem',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
            }}
          >
            <Users size={48} style={{ color: '#94a3b8', margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              No Applicants Found
            </h2>
            <p style={{ color: '#64748b' }}>
              There are no candidate applications under this status filter for this opening.
            </p>
          </div>
        ) : (
          <div>
            {applications.map((app) => (
              <div key={app._id || app.applicationId} className="applicant-card">
                <div className="applicant-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                      {app.applicationId}
                    </span>
                    <span className="applicant-service-badge">
                      <Shield size={12} />
                      {app.veteran?.serviceInformation?.serviceBranch || 'Armed Forces'} •{' '}
                      {app.veteran?.serviceInformation?.rank || 'Veteran'}
                    </span>
                  </div>

                  <h3>
                    {app.veteran?.personalInformation?.fullName ||
                      `Veteran Candidate (${app.veteran?.veteranId || 'ID Verified'})`}
                  </h3>

                  <div className="applicant-meta">
                    <div>
                      <strong>Experience:</strong> {app.veteran?.serviceInformation?.yearsOfService || 0} Yrs Service
                    </div>
                    <div>
                      <strong>Location:</strong> {app.veteran?.personalInformation?.state || 'India'}
                    </div>
                    <div>
                      <strong>Applied:</strong>{' '}
                      {new Date(app.appliedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  {getStatusBadge(app.status)}
                  <Link
                    to={`/employer/applications/${app.applicationId || app._id}`}
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
                  >
                    Review Dossier <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployerJobApplicants;
