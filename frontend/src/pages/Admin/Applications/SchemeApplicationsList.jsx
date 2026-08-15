import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Award,
  Users,
} from 'lucide-react';
import { adminService } from '../../../services/adminService.js';
import Badge from '../../../components/Badge/Badge.jsx';
import Button from '../../../components/Button/Button.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../../components/ErrorMessage/ErrorMessage.jsx';
import '../AdminCommon.css';

export const SchemeApplicationsList = () => {
  const [searchParams] = useSearchParams();
  const schemeIdParam = searchParams.get('schemeId') || '';

  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [counts, setCounts] = useState({ total: 0, submitted: 0, underReview: 0, approved: 0, rejected: 0, disbursed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');

  const fetchApplications = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getSchemeApplications({
        page,
        limit: 10,
        search,
        status,
        schemeId: schemeIdParam,
      });
      setApplications(res.data.applications);
      setPagination(res.data.pagination);
      setCounts(res.data.counts);
    } catch (err) {
      console.error('Error fetching scheme applications:', err);
      setError(err.message || 'Failed to load scheme applications');
    } finally {
      setLoading(false);
    }
  }, [search, status, schemeIdParam]);

  useEffect(() => {
    fetchApplications(1);
  }, [fetchApplications]);

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-title-group">
          <h1>Welfare Scheme Claims Review</h1>
          <p>
            Process veteran benefit claims, scrutinize direct benefit transfer submissions, and record approval decisions.
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
              placeholder="Search by Application ID, Veteran Name, Scheme..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">All Application States ({counts.total})</option>
            <option value="SUBMITTED">Submitted ({counts.submitted})</option>
            <option value="UNDER_REVIEW">Under Review ({counts.underReview})</option>
            <option value="APPROVED">Approved ({counts.approved})</option>
            <option value="DISBURSED">Disbursed ({counts.disbursed})</option>
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
            <LoadingSpinner size="md" text="Loading welfare claims..." />
          </div>
        ) : error ? (
          <div style={{ padding: '2rem' }}>
            <ErrorMessage message={error} onRetry={() => fetchApplications(pagination.page)} />
          </div>
        ) : applications.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-slate-500)' }}>
            No scheme applications found matching criteria.
          </div>
        ) : (
          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Welfare Scheme</th>
                  <th>Veteran Applicant</th>
                  <th>Branch & Rank</th>
                  <th>Submitted Date</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const vetName =
                    app.veteran?.personalInformation?.fullName || app.user?.name || 'Veteran';
                  const vetId = app.veteran?.veteranId || 'N/A';
                  const branch = app.veteran?.serviceInformation?.serviceBranch || 'Defense';
                  const rank = app.veteran?.serviceInformation?.rank || 'N/A';
                  const subDate = app.submittedAt
                    ? new Date(app.submittedAt).toLocaleDateString()
                    : 'N/A';
                  const upDate = app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : 'N/A';

                  return (
                    <tr key={app._id}>
                      <td>
                        <strong style={{ color: '#2563eb' }}>{app.applicationId}</strong>
                      </td>
                      <td>
                        <span className="admin-cell-title">{app.scheme?.name || 'Welfare Scheme'}</span>
                        <span className="admin-cell-sub">{app.scheme?.category}</span>
                      </td>
                      <td>
                        <Link to={`/admin/veterans/${vetId}`} style={{ color: '#2563eb', fontWeight: 600 }}>
                          {vetName}
                        </Link>
                        <span className="admin-cell-sub">ID: {vetId}</span>
                      </td>
                      <td>
                        <span className="admin-cell-title">{branch}</span>
                        <span className="admin-cell-sub">Rank: {rank}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem' }}>{subDate}</span>
                      </td>
                      <td>
                        <Badge
                          variant={
                            app.status === 'APPROVED' || app.status === 'DISBURSED'
                              ? 'success'
                              : app.status === 'REJECTED'
                              ? 'danger'
                              : app.status === 'UNDER_REVIEW'
                              ? 'warning'
                              : 'info'
                          }
                        >
                          {app.status}
                        </Badge>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                          {upDate}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="admin-row-actions" style={{ justifyContent: 'flex-end' }}>
                          <Link
                            to={`/admin/applications/schemes/${app.applicationId}`}
                            className="admin-btn-action"
                            title="Inspect application claim dossier"
                          >
                            <Eye size={13} /> Scrutinize
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
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} Total Claims)
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

export default SchemeApplicationsList;
