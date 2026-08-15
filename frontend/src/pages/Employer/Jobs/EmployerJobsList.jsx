import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import employerService from '../../../services/employerService';
import {
  Briefcase,
  PlusCircle,
  Users,
  MapPin,
  Calendar,
  Eye,
  Edit,
  PauseCircle,
  PlayCircle,
  XCircle,
  Search,
  Filter,
} from 'lucide-react';
import './EmployerJobsList.css';

export const EmployerJobsList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [counts, setCounts] = useState({ total: 0, active: 0, draft: 0, paused: 0, closed: 0 });

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: search.trim() || undefined,
      };
      const res = await employerService.getEmployerJobs(params);
      if (res.success) {
        setJobs(res.data.jobs || []);
        if (res.data.counts) setCounts(res.data.counts);
      }
    } catch (err) {
      console.error('Failed to load employer jobs:', err);
      setError('Unable to load job postings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      const res = await employerService.updateJobStatus(jobId, newStatus);
      if (res.success) {
        setJobs((prev) =>
          prev.map((j) => (j._id === jobId || j.jobId === jobId ? { ...j, status: newStatus } : j))
        );
      }
    } catch (err) {
      console.error('Failed to update job status:', err);
      alert('Failed to update job status.');
    }
  };

  return (
    <div className="employer-jobs-page">
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
              Job Postings Management
            </h1>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>
              Create, edit, pause, and review candidate applicants across your defense career opportunities.
            </p>
          </div>
          <Link to="/employer/jobs/create" className="btn btn-primary">
            <PlusCircle size={18} /> Post New Opportunity
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: `All (${counts.total})` },
            { key: 'ACTIVE', label: `Active (${counts.active})` },
            { key: 'DRAFT', label: `Draft (${counts.draft})` },
            { key: 'PAUSED', label: `Paused (${counts.paused})` },
            { key: 'CLOSED', label: `Closed (${counts.closed})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`btn ${statusFilter === tab.key ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.45rem 1rem', fontSize: '0.875rem' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
          <input
            type="text"
            placeholder="Search by job title or Job ID..."
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

        {/* Listing */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: '#64748b' }}>Loading job postings...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger" style={{ textAlign: 'center', padding: '2rem' }}>
            {error}
          </div>
        ) : jobs.length === 0 ? (
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
              No Job Postings Found
            </h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              You haven't posted any jobs under this status yet. Post a new opening to start receiving veteran applications.
            </p>
            <Link to="/employer/jobs/create" className="btn btn-primary">
              <PlusCircle size={16} /> Create New Job
            </Link>
          </div>
        ) : (
          <div>
            {jobs.map((job) => (
              <div key={job._id || job.jobId} className="employer-job-item">
                <div className="employer-job-main">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                      {job.jobId}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        background:
                          job.status === 'ACTIVE'
                            ? '#f0fdf4'
                            : job.status === 'DRAFT'
                            ? '#f1f5f9'
                            : '#fef2f2',
                        color:
                          job.status === 'ACTIVE'
                            ? '#166534'
                            : job.status === 'DRAFT'
                            ? '#475569'
                            : '#991b1b',
                        border: '1px solid currentColor',
                      }}
                    >
                      {job.status}
                    </span>
                  </div>

                  <h3>{job.title}</h3>

                  <div className="employer-job-meta">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <MapPin size={15} />
                      <span>{job.city}, {job.state} ({job.workMode})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Briefcase size={15} />
                      <span>{job.employmentType.replace('_', ' ')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Calendar size={15} />
                      <span>
                        Deadline:{' '}
                        {job.applicationDeadline
                          ? new Date(job.applicationDeadline).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Open'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="employer-job-actions">
                  <Link
                    to={`/employer/jobs/${job.jobId || job._id}/applications`}
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    <Users size={16} /> Applicants ({job.applicantCount || 0})
                  </Link>

                  <Link
                    to={`/employer/jobs/${job.jobId || job._id}/edit`}
                    className="btn btn-outline"
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                    title="Edit Job"
                  >
                    <Edit size={16} />
                  </Link>

                  {job.status === 'ACTIVE' ? (
                    <button
                      onClick={() => handleStatusChange(job._id || job.jobId, 'PAUSED')}
                      className="btn btn-outline"
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: '#ea580c' }}
                      title="Pause Job"
                    >
                      <PauseCircle size={16} />
                    </button>
                  ) : job.status === 'PAUSED' ? (
                    <button
                      onClick={() => handleStatusChange(job._id || job.jobId, 'ACTIVE')}
                      className="btn btn-outline"
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: '#16a34a' }}
                      title="Activate Job"
                    >
                      <PlayCircle size={16} />
                    </button>
                  ) : null}

                  {job.status !== 'CLOSED' && (
                    <button
                      onClick={() => handleStatusChange(job._id || job.jobId, 'CLOSED')}
                      className="btn btn-outline"
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: '#dc2626' }}
                      title="Close Job"
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployerJobsList;
