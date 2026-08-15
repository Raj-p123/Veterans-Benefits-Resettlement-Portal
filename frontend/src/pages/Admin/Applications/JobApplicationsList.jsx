import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Briefcase,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Building2,
  Users,
} from 'lucide-react';
import { adminService } from '../../../services/adminService.js';
import Badge from '../../../components/Badge/Badge.jsx';
import Button from '../../../components/Button/Button.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../../components/ErrorMessage/ErrorMessage.jsx';
import '../AdminCommon.css';

export const JobApplicationsList = () => {
  const [searchParams] = useSearchParams();
  const jobIdParam = searchParams.get('jobId') || '';

  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [counts, setCounts] = useState({ total: 0, applied: 0, reviewing: 0, shortlisted: 0, selected: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');

  const fetchApplications = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getJobApplications({
        page,
        limit: 10,
        search,
        status,
        jobId: jobIdParam,
      });
      setApplications(res.data.applications);
      setPagination(res.data.pagination);
      setCounts(res.data.counts);
    } catch (err) {
      console.error('Error fetching job applications:', err);
      setError(err.message || 'Failed to load job applications');
    } finally {
      setLoading(false);
    }
  }, [search, status, jobIdParam]);

  useEffect(() => {
    fetchApplications(1);
  }, [fetchApplications]);

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-title-group">
          <h1>Corporate Job Applications Monitor</h1>
          <p>
            Oversee corporate recruitment pipelines, audit match scores, and track defense veteran selection rates.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="admin-filter-card">
        <div className="admin-filter-group">
          <div className="admin-input-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by Application ID, Candidate Name, Job, Company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">All Application States ({counts.total})</option>
            <option value="APPLIED">Applied ({counts.applied})</option>
            <option value="REVIEWING">Reviewing ({counts.reviewing})</option>
            <option value="SHORTLISTED">Shortlisted ({counts.shortlisted})</option>
            <option value="SELECTED">Selected / Hired ({counts.selected})</option>
            <option value="REJECTED">Rejected ({counts.rejected})</option>
          </select>
        </div>

        <div>
          <Badge variant="neutral">Total Applications: {counts.total}</Badge>
        </div>
      </div>

      {/* Table Card */}
      <div className="admin-table-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <LoadingSpinner size="md" text="Loading recruitment pipelines..." />
          </div>
        ) : error ? (
          <div style={{ padding: '2rem' }}>
            <ErrorMessage message={error} onRetry={() => fetchApplications(pagination.page)} />
          </div>
        ) : applications.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-slate-500)' }}>
            No job applications found matching criteria.
          </div>
        ) : (
          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Job Opening & Employer</th>
                  <th>Veteran Candidate</th>
                  <th>Match Score</th>
                  <th>Status</th>
                  <th>Applied Date</th>
                  <th>Last Activity</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const jobTitle = app.job?.title || 'Job Listing';
                  const companyName = app.employer?.companyName || 'Corporate Employer';
                  const empId = app.employer?.employerId;
                  const candName =
                    app.veteran?.personalInformation?.fullName || app.user?.name || 'Veteran';
                  const candId = app.veteran?.veteranId;
                  const appDate = app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A';
                  const upDate = app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : 'N/A';

                  return (
                    <tr key={app._id}>
                      <td>
                        <strong style={{ color: '#2563eb' }}>{app.applicationId}</strong>
                      </td>
                      <td>
                        <span className="admin-cell-title">{jobTitle}</span>
                        <span className="admin-cell-sub">
                          Company:{' '}
                          {empId ? (
                            <Link to={`/admin/employers/${empId}`} style={{ color: '#2563eb' }}>
                              {companyName}
                            </Link>
                          ) : (
                            companyName
                          )}
                        </span>
                      </td>
                      <td>
                        <span className="admin-cell-title">
                          {candId ? (
                            <Link to={`/admin/veterans/${candId}`} style={{ color: '#2563eb' }}>
                              {candName}
                            </Link>
                          ) : (
                            candName
                          )}
                        </span>
                        <span className="admin-cell-sub">ID: {candId || 'N/A'}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <strong style={{ color: (app.matchScore || 0) >= 70 ? '#16a34a' : '#d97706' }}>
                            {app.matchScore || 0}%
                          </strong>
                          <span className="admin-cell-sub">Match</span>
                        </div>
                      </td>
                      <td>
                        <Badge
                          variant={
                            app.status === 'SELECTED'
                              ? 'success'
                              : app.status === 'REJECTED'
                              ? 'danger'
                              : app.status === 'SHORTLISTED'
                              ? 'info'
                              : 'neutral'
                          }
                        >
                          {app.status}
                        </Badge>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem' }}>{appDate}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                          {upDate}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="admin-row-actions" style={{ justifyContent: 'flex-end' }}>
                          <Link
                            to={`/admin/applications/jobs/${app.applicationId}`}
                            className="admin-btn-action"
                            title="Inspect job candidate dossier"
                          >
                            <Eye size={13} /> Inspect
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="admin-pagination-bar">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} Total Applications)
            </span>
            <div className="admin-pagination-controls">
              <button
                type="button"
                className="admin-page-btn"
                disabled={pagination.page <= 1}
                onClick={() => fetchApplications(pagination.page - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="admin-page-btn"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchApplications(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobApplicationsList;
