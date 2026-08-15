import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Search,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { adminService } from '../../../services/adminService.js';
import { ROUTES } from '../../../constants/index.js';
import Badge from '../../../components/Badge/Badge.jsx';
import Button from '../../../components/Button/Button.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../../components/ErrorMessage/ErrorMessage.jsx';
import '../AdminCommon.css';

export const JobsList = () => {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [counts, setCounts] = useState({ total: 0, active: 0, closed: 0, rejected: 0, draft: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [employmentType, setEmploymentType] = useState('ALL');

  // Status moderation modal
  const [selectedJob, setSelectedJob] = useState(null);
  const [targetStatus, setTargetStatus] = useState('ACTIVE');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchJobs = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getJobs({
        page,
        limit: 10,
        search,
        status,
        employmentType,
      });
      setJobs(res.data.jobs);
      setPagination(res.data.pagination);
      setCounts(res.data.counts);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [search, status, employmentType]);

  useEffect(() => {
    fetchJobs(1);
  }, [fetchJobs]);

  const handleOpenModeration = (job, st) => {
    setSelectedJob(job);
    setTargetStatus(st);
    setAdminRemarks(
      st === 'ACTIVE'
        ? 'Job opening approved for defense veterans.'
        : st === 'REJECTED'
        ? 'Inappropriate job listing or invalid compensation details.'
        : 'Listing closed by administrator.'
    );
  };

  const handleSaveModeration = async () => {
    if (!selectedJob) return;
    setActionLoading(true);
    try {
      await adminService.updateJobStatus(selectedJob._id, {
        status: targetStatus,
        adminRemarks,
      });
      setSelectedJob(null);
      fetchJobs(pagination.page);
    } catch (err) {
      alert(err.message || 'Failed to moderate job');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminService.deleteJob(deleteTarget._id);
      setDeleteTarget(null);
      fetchJobs(pagination.page);
    } catch (err) {
      alert(err.message || 'Failed to delete job');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-title-group">
          <h1>Corporate Job Moderation</h1>
          <p>
            Audit defense-focused employment vacancies, moderate corporate listings, and enforce fair salary standards.
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
              placeholder="Search by Job Title, ID, Company, City..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">All Listing Statuses ({counts.total})</option>
            <option value="ACTIVE">Active Listings ({counts.active})</option>
            <option value="CLOSED">Closed ({counts.closed})</option>
            <option value="REJECTED">Rejected ({counts.rejected})</option>
            <option value="DRAFT">Draft ({counts.draft})</option>
          </select>

          <select
            className="admin-select"
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
          >
            <option value="ALL">All Employment Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
        </div>

        <div>
          <Badge variant="neutral">Total Postings: {counts.total}</Badge>
        </div>
      </div>

      {/* Table Card */}
      <div className="admin-table-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <LoadingSpinner size="md" text="Loading corporate job listings..." />
          </div>
        ) : error ? (
          <div style={{ padding: '2rem' }}>
            <ErrorMessage message={error} onRetry={() => fetchJobs(pagination.page)} />
          </div>
        ) : jobs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-slate-500)' }}>
            No jobs found matching criteria.
          </div>
        ) : (
          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Title & Employer</th>
                  <th>Location</th>
                  <th>Type & Experience</th>
                  <th>Compensation</th>
                  <th>Applicants</th>
                  <th>Status</th>
                  <th>Posted Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const companyName = job.employer?.companyName || 'Corporate Employer';
                  const empId = job.employer?.employerId;
                  const dateStr = job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A';
                  const salaryStr = job.salaryMin && job.salaryMax
                    ? `₹${(job.salaryMin / 100000).toFixed(1)}L - ₹${(job.salaryMax / 100000).toFixed(1)}L`
                    : 'Not disclosed';

                  return (
                    <tr key={job._id}>
                      <td>
                        <strong style={{ color: '#2563eb' }}>{job.jobId}</strong>
                      </td>
                      <td>
                        <span className="admin-cell-title">{job.title}</span>
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
                        <span className="admin-cell-title">{job.city}, {job.state}</span>
                        <span className="admin-cell-sub">{job.locationType}</span>
                      </td>
                      <td>
                        <span className="admin-cell-title">{job.jobType}</span>
                        <span className="admin-cell-sub">{job.experienceMin}-{job.experienceMax} Yrs Exp</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{salaryStr}</span>
                      </td>
                      <td>
                        <Link
                          to={`${ROUTES.ADMIN_JOB_APPLICATIONS}?jobId=${job.jobId}`}
                          style={{ fontWeight: 600, color: '#2563eb' }}
                        >
                          {job.applicantCount || 0} Candidates
                        </Link>
                      </td>
                      <td>
                        <Badge
                          variant={
                            job.status === 'ACTIVE'
                              ? 'success'
                              : job.status === 'REJECTED'
                              ? 'danger'
                              : job.status === 'CLOSED'
                              ? 'neutral'
                              : 'warning'
                          }
                        >
                          {job.status}
                        </Badge>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                          {dateStr}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="admin-row-actions" style={{ justifyContent: 'flex-end' }}>
                          <Link
                            to={`/jobs/${job.jobId}`}
                            target="_blank"
                            className="admin-btn-action"
                            title="Preview public job posting"
                          >
                            <Eye size={13} /> View
                          </Link>

                          {job.status !== 'ACTIVE' && (
                            <button
                              type="button"
                              className="admin-btn-action btn-verify"
                              onClick={() => handleOpenModeration(job, 'ACTIVE')}
                              title="Approve / Activate Job"
                            >
                              <CheckCircle size={13} /> Approve
                            </button>
                          )}

                          {job.status !== 'REJECTED' && (
                            <button
                              type="button"
                              className="admin-btn-action btn-reject"
                              onClick={() => handleOpenModeration(job, 'REJECTED')}
                              title="Reject / Suspend Job"
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          )}

                          <button
                            type="button"
                            className="admin-btn-action btn-reject"
                            onClick={() => setDeleteTarget(job)}
                            title="Delete Job"
                          >
                            <Trash2 size={13} />
                          </button>
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
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} Total Jobs)
            </span>
            <div className="admin-pagination-controls">
              <button
                type="button"
                className="admin-page-btn"
                disabled={pagination.page <= 1}
                onClick={() => fetchJobs(pagination.page - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="admin-page-btn"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchJobs(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Moderation Modal */}
      {selectedJob && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedJob(null)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                {targetStatus === 'ACTIVE' ? 'Approve Job Opening' : 'Moderate Job Listing'}
              </h3>
              <button type="button" className="admin-modal-close-btn" onClick={() => setSelectedJob(null)}>
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-600)' }}>
                Updating status to <strong>{targetStatus}</strong> for job:{' '}
                <strong>{selectedJob.title}</strong> ({selectedJob.jobId}).
              </p>

              <div className="admin-form-group">
                <label className="admin-form-label">Moderator Remarks / Feedback:</label>
                <textarea
                  className="admin-form-textarea"
                  rows={4}
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                />
              </div>
            </div>

            <div className="admin-modal-footer">
              <Button variant="secondary" size="sm" onClick={() => setSelectedJob(null)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button
                variant={targetStatus === 'ACTIVE' ? 'primary' : 'danger'}
                size="sm"
                onClick={handleSaveModeration}
                loading={actionLoading}
                icon={targetStatus === 'ACTIVE' ? CheckCircle : XCircle}
              >
                Confirm {targetStatus}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="admin-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Delete Job Posting</h3>
              <button type="button" className="admin-modal-close-btn" onClick={() => setDeleteTarget(null)}>
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <AlertTriangle size={24} color="#dc2626" />
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-700)', marginBottom: '0.5rem' }}>
                    Are you sure you want to permanently delete job posting{' '}
                    <strong>{deleteTarget.title}</strong> ({deleteTarget.jobId})?
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                    If candidate veterans have already submitted applications, deletion will be blocked by database safety checks. You can set the listing status to <strong>CLOSED</strong> or <strong>REJECTED</strong> instead.
                  </p>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteJob}
                loading={deleteLoading}
                icon={Trash2}
              >
                Confirm Deletion
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsList;
