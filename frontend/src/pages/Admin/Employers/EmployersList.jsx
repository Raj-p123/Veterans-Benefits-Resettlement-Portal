import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Briefcase,
  ExternalLink,
} from 'lucide-react';
import { adminService } from '../../../services/adminService.js';
import Badge from '../../../components/Badge/Badge.jsx';
import Button from '../../../components/Button/Button.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../../components/ErrorMessage/ErrorMessage.jsx';
import '../AdminCommon.css';

export const EmployersList = () => {
  const [employers, setEmployers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [counts, setCounts] = useState({ total: 0, pending: 0, verified: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('ALL');
  const [isActive, setIsActive] = useState('ALL');

  // Modal
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [modalAction, setModalAction] = useState('VERIFIED');
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEmployers = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getEmployers({
        page,
        limit: 10,
        search,
        verificationStatus,
        isActive,
      });
      setEmployers(res.data.employers);
      setPagination(res.data.pagination);
      setCounts(res.data.counts);
    } catch (err) {
      console.error('Error fetching employers:', err);
      setError(err.message || 'Failed to load employers');
    } finally {
      setLoading(false);
    }
  }, [search, verificationStatus, isActive]);

  useEffect(() => {
    fetchEmployers(1);
  }, [fetchEmployers]);

  const handleOpenVerification = (emp, action) => {
    setSelectedEmployer(emp);
    setModalAction(action);
    setRemarks(
      action === 'VERIFIED'
        ? 'Corporate credentials and authorized defense recruitment rights verified.'
        : 'Company credentials or official domain could not be authenticated.'
    );
  };

  const handleSaveVerification = async () => {
    if (!selectedEmployer) return;
    setActionLoading(true);
    try {
      await adminService.updateEmployerVerification(selectedEmployer._id, {
        status: modalAction,
        remarks,
      });
      setSelectedEmployer(null);
      fetchEmployers(pagination.page);
    } catch (err) {
      alert(err.message || 'Failed to update employer verification');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-title-group">
          <h1>Corporate Employers Directory</h1>
          <p>
            Verify partner companies, manage corporate recruitment authorizations, and audit active defense vacancies.
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
              placeholder="Search by Company Name, Employer ID, Email, City..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="admin-select"
            value={verificationStatus}
            onChange={(e) => setVerificationStatus(e.target.value)}
          >
            <option value="ALL">All Verification Statuses ({counts.total})</option>
            <option value="PENDING">Pending Verification ({counts.pending})</option>
            <option value="VERIFIED">Verified ({counts.verified})</option>
            <option value="REJECTED">Rejected ({counts.rejected})</option>
          </select>

          <select
            className="admin-select"
            value={isActive}
            onChange={(e) => setIsActive(e.target.value)}
          >
            <option value="ALL">All Account Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>

        <div>
          <Badge variant="neutral">Total Employers: {counts.total}</Badge>
        </div>
      </div>

      {/* Table Card */}
      <div className="admin-table-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <LoadingSpinner size="md" text="Loading corporate employers..." />
          </div>
        ) : error ? (
          <div style={{ padding: '2rem' }}>
            <ErrorMessage message={error} onRetry={() => fetchEmployers(pagination.page)} />
          </div>
        ) : employers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-slate-500)' }}>
            No employers found matching criteria.
          </div>
        ) : (
          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Employer ID</th>
                  <th>Company & Industry</th>
                  <th>Location</th>
                  <th>Contact Person</th>
                  <th>Jobs Posted</th>
                  <th>Verification</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employers.map((emp) => {
                  const regDate = emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : 'N/A';

                  return (
                    <tr key={emp._id}>
                      <td>
                        <strong style={{ color: '#2563eb' }}>{emp.employerId}</strong>
                      </td>
                      <td>
                        <span className="admin-cell-title">{emp.companyName}</span>
                        <span className="admin-cell-sub">{emp.industry} • {emp.companySize}</span>
                      </td>
                      <td>
                        <span className="admin-cell-title">{emp.city}, {emp.state}</span>
                        <span className="admin-cell-sub">{emp.email}</span>
                      </td>
                      <td>
                        <span className="admin-cell-title">{emp.contactPerson?.name || 'N/A'}</span>
                        <span className="admin-cell-sub">{emp.contactPerson?.designation || 'Contact'}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{emp.activeJobs || 0} Active</span>
                        <span className="admin-cell-sub">({emp.totalJobs || 0} Total)</span>
                      </td>
                      <td>
                        <Badge
                          variant={
                            emp.verificationStatus === 'VERIFIED'
                              ? 'success'
                              : emp.verificationStatus === 'REJECTED'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {emp.verificationStatus}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={emp.isActive ? 'success' : 'danger'}>
                          {emp.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                          {regDate}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="admin-row-actions" style={{ justifyContent: 'flex-end' }}>
                          <Link
                            to={`/admin/employers/${emp.employerId}`}
                            className="admin-btn-action"
                            title="Inspect employer profile"
                          >
                            <Eye size={14} /> Profile
                          </Link>

                          {emp.verificationStatus !== 'VERIFIED' && (
                            <button
                              type="button"
                              className="admin-btn-action btn-verify"
                              onClick={() => handleOpenVerification(emp, 'VERIFIED')}
                              title="Verify Employer"
                            >
                              <CheckCircle size={14} /> Verify
                            </button>
                          )}

                          {emp.verificationStatus !== 'REJECTED' && (
                            <button
                              type="button"
                              className="admin-btn-action btn-reject"
                              onClick={() => handleOpenVerification(emp, 'REJECTED')}
                              title="Reject Employer"
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          )}
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
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} Total Employers)
            </span>
            <div className="admin-pagination-controls">
              <button
                type="button"
                className="admin-page-btn"
                disabled={pagination.page <= 1}
                onClick={() => fetchEmployers(pagination.page - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="admin-page-btn"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchEmployers(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {selectedEmployer && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedEmployer(null)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                {modalAction === 'VERIFIED' ? 'Verify Corporate Employer' : 'Reject Employer Verification'}
              </h3>
              <button type="button" className="admin-modal-close-btn" onClick={() => setSelectedEmployer(null)}>
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-600)' }}>
                Updating verification status for <strong>{selectedEmployer.companyName}</strong> (ID: {selectedEmployer.employerId}).
              </p>

              <div className="admin-form-group">
                <label className="admin-form-label">Administrative Scrutiny Remarks:</label>
                <textarea
                  className="admin-form-textarea"
                  rows={4}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>

            <div className="admin-modal-footer">
              <Button variant="secondary" size="sm" onClick={() => setSelectedEmployer(null)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button
                variant={modalAction === 'VERIFIED' ? 'primary' : 'danger'}
                size="sm"
                onClick={handleSaveVerification}
                loading={actionLoading}
                icon={modalAction === 'VERIFIED' ? CheckCircle : XCircle}
              >
                Confirm {modalAction}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployersList;
