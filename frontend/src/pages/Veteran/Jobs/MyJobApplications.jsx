import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import jobApplicationService from '../../../services/jobApplicationService';
import { useSocket } from '../../../context/SocketContext';
import { SOCKET_EVENTS } from '../../../constants/socketEvents';
import {
  Briefcase,
  Building2,
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Search,
} from 'lucide-react';
import './MyJobApplications.css';

const STATUS_TABS = [
  { key: 'ALL', label: 'All Applications' },
  { key: 'APPLIED', label: 'Applied' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'SHORTLISTED', label: 'Shortlisted' },
  { key: 'INTERVIEW', label: 'Interview' },
  { key: 'SELECTED', label: 'Selected' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'WITHDRAWN', label: 'Withdrawn' },
];

export const MyJobApplications = () => {
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
    withdrawn: 0,
  });

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        search: search.trim() || undefined,
      };

      const res = await jobApplicationService.getMyApplications(params);
      if (res.success) {
        setApplications(res.data.applications || []);
        if (res.data.counts) setCounts(res.data.counts);
      }
    } catch (err) {
      console.error('Failed to load job applications:', err);
      setError('Unable to load your job applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const { on, off } = useSocket();

  useEffect(() => {
    fetchApplications();
  }, [selectedStatus]);

  // Real-time synchronization on status change or submission
  useEffect(() => {
    const handleJobApplicationUpdate = () => {
      console.log('[Real-Time] Job application list update received');
      fetchApplications();
    };

    on(SOCKET_EVENTS.JOB_APPLICATION_STATUS_CHANGED, handleJobApplicationUpdate);
    on(SOCKET_EVENTS.APPLICATION_STATUS_CHANGED, handleJobApplicationUpdate);
    on(SOCKET_EVENTS.JOB_APPLICATION_CREATED, handleJobApplicationUpdate);
    on(SOCKET_EVENTS.DASHBOARD_UPDATED, handleJobApplicationUpdate);

    return () => {
      off(SOCKET_EVENTS.JOB_APPLICATION_STATUS_CHANGED, handleJobApplicationUpdate);
      off(SOCKET_EVENTS.APPLICATION_STATUS_CHANGED, handleJobApplicationUpdate);
      off(SOCKET_EVENTS.JOB_APPLICATION_CREATED, handleJobApplicationUpdate);
      off(SOCKET_EVENTS.DASHBOARD_UPDATED, handleJobApplicationUpdate);
    };
  }, [on, off, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchApplications();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'APPLIED':
        return 'status-badge applied';
      case 'UNDER_REVIEW':
        return 'status-badge under_review';
      case 'SHORTLISTED':
        return 'status-badge shortlisted';
      case 'INTERVIEW':
        return 'status-badge interview';
      case 'SELECTED':
        return 'status-badge selected';
      case 'REJECTED':
        return 'status-badge rejected';
      case 'WITHDRAWN':
        return 'status-badge withdrawn';
      default:
        return 'status-badge';
    }
  };

  return (
    <div className="my-job-apps-page">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            My Job Applications & Resettlement Claims
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem' }}>
            Track real-time candidate screening status, employer reviews, and interview schedules for your defense applications.
          </p>
        </div>

        {/* Metrics Strip */}
        <div className="job-apps-metrics-strip">
          <div className="job-metric-card">
            <div className="job-metric-count">{counts.total}</div>
            <div className="job-metric-label">Total Applied</div>
          </div>
          <div className="job-metric-card">
            <div className="job-metric-count" style={{ color: '#854d0e' }}>{counts.underReview}</div>
            <div className="job-metric-label">Under Review</div>
          </div>
          <div className="job-metric-card">
            <div className="job-metric-count" style={{ color: '#6d28d9' }}>{counts.shortlisted}</div>
            <div className="job-metric-label">Shortlisted</div>
          </div>
          <div className="job-metric-card">
            <div className="job-metric-count" style={{ color: '#0e7490' }}>{counts.interview}</div>
            <div className="job-metric-label">Interview</div>
          </div>
          <div className="job-metric-card">
            <div className="job-metric-count" style={{ color: '#16a34a' }}>{counts.selected}</div>
            <div className="job-metric-label">Selected</div>
          </div>
          <div className="job-metric-card">
            <div className="job-metric-count" style={{ color: '#b91c1c' }}>{counts.rejected}</div>
            <div className="job-metric-label">Rejected</div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="job-apps-filter-tabs">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key)}
              className={`job-app-tab-btn ${selectedStatus === tab.key ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
          <input
            type="text"
            placeholder="Search by Application ID (e.g. JOBAPP-2026-000001)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: '0.625rem 1rem',
              borderRadius: '0.375rem',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
            }}
          />
          <button type="submit" className="btn btn-secondary">
            <Search size={16} /> Search
          </button>
        </form>

        {/* Applications List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: '#64748b' }}>Loading your job applications...</p>
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
            <Briefcase size={48} style={{ color: '#94a3b8', margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              No Job Applications Found
            </h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              You haven’t applied for any positions under this status yet. Browse verified opportunities in the job catalog.
            </p>
            <Link to="/jobs" className="btn btn-primary">
              Explore Job Catalog
            </Link>
          </div>
        ) : (
          <div>
            {applications.map((app) => (
              <div key={app._id || app.applicationId} className="job-app-card">
                <div className="job-app-info">
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>
                    ID: {app.applicationId}
                  </span>
                  <h3>{app.job?.title || 'Defense Career Position'}</h3>
                  <div className="job-app-company">
                    <Building2 size={15} />
                    <span>{app.job?.employer?.companyName || 'Defense Employer'}</span>
                    <span style={{ color: '#94a3b8' }}>•</span>
                    <span>{app.job?.city}, {app.job?.state}</span>
                  </div>
                  <div className="job-app-meta">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Calendar size={14} />
                      <span>
                        Applied on{' '}
                        {new Date(app.appliedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <span className={getStatusBadgeClass(app.status)}>
                    {app.status.replace('_', ' ')}
                  </span>
                  <Link
                    to={`/veteran/job-applications/${app.applicationId || app._id}`}
                    className="btn btn-outline"
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    Track Status <ChevronRight size={16} />
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

export default MyJobApplications;
