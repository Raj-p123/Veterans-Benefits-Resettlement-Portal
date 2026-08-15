import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import { adminService } from '../../../services/adminService.js';
import Badge from '../../../components/Badge/Badge.jsx';
import Button from '../../../components/Button/Button.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../../components/ErrorMessage/ErrorMessage.jsx';
import '../AdminCommon.css';

export const VeteransList = () => {
  const [veterans, setVeterans] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [counts, setCounts] = useState({ total: 0, pending: 0, verified: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('ALL');
  const [branch, setBranch] = useState('ALL');

  // Verification modal state
  const [selectedVeteran, setSelectedVeteran] = useState(null);
  const [modalAction, setModalAction] = useState('VERIFIED'); // 'VERIFIED' | 'REJECTED'
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchVeterans = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getVeterans({
        page,
        limit: 10,
        search,
        verificationStatus,
        branch,
      });
      setVeterans(res.data.veterans);
      setPagination(res.data.pagination);
      setCounts(res.data.counts);
    } catch (err) {
      console.error('Error fetching veterans:', err);
      setError(err.message || 'Failed to load veterans');
    } finally {
      setLoading(false);
    }
  }, [search, verificationStatus, branch]);

  useEffect(() => {
    fetchVeterans(1);
  }, [fetchVeterans]);

  const handleOpenVerificationModal = (veteran, action) => {
    setSelectedVeteran(veteran);
    setModalAction(action);
    setRemarks(
      action === 'VERIFIED'
        ? 'Service documents and military identity successfully verified.'
        : 'Incomplete or unclear service credentials. Please submit valid discharge certificate.'
    );
  };

  const handleSaveVerification = async () => {
    if (!selectedVeteran) return;
    setActionLoading(true);
    try {
      await adminService.updateVeteranVerification(selectedVeteran._id, {
        status: modalAction,
        remarks,
      });
      setSelectedVeteran(null);
      fetchVeterans(pagination.page);
    } catch (err) {
      alert(err.message || 'Failed to update verification status');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-title-group">
          <h1>Veteran Military Profiles</h1>
          <p>
            Review registered defense personnel, inspect service credentials, and perform identity verifications.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="admin-filter-card">
        <div className="admin-filter-group">
          <div className="admin-input-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by Veteran ID, Name, Email, Rank, Service Number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="admin-select"
            value={verificationStatus}
            onChange={(e) => setVerificationStatus(e.target.value)}
          >
            <option value="ALL">All Verification Statuses</option>
            <option value="PENDING">Pending Verification ({counts.pending})</option>
            <option value="VERIFIED">Verified ({counts.verified})</option>
            <option value="REJECTED">Rejected ({counts.rejected})</option>
          </select>

          <select
            className="admin-select"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          >
            <option value="ALL">All Service Branches</option>
            <option value="Army">Indian Army</option>
            <option value="Navy">Indian Navy</option>
            <option value="Air Force">Indian Air Force</option>
            <option value="Coast Guard">Coast Guard</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <Badge variant="neutral">Total Records: {counts.total}</Badge>
        </div>
      </div>

      {/* Table Card */}
      <div className="admin-table-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <LoadingSpinner size="md" text="Loading veterans records..." />
          </div>
        ) : error ? (
          <div style={{ padding: '2rem' }}>
            <ErrorMessage message={error} onRetry={() => fetchVeterans(pagination.page)} />
          </div>
        ) : veterans.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-slate-500)' }}>
            No veterans match the selected filter criteria.
          </div>
        ) : (
          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Veteran ID</th>
                  <th>Name & Contact</th>
                  <th>Branch & Rank</th>
                  <th>Service Years</th>
                  <th>Status</th>
                  <th>Verification</th>
                  <th>Account</th>
                  <th>Registered</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {veterans.map((v) => {
                  const name = v.personalInformation?.fullName || v.user?.name || 'Unnamed Veteran';
                  const email = v.personalInformation?.email || v.user?.email || 'No email';
                  const phone = v.personalInformation?.phone || v.user?.phone || 'No phone';
                  const branch = v.serviceInformation?.serviceBranch || 'N/A';
                  const rank = v.serviceInformation?.rank || 'N/A';
                  const years = v.serviceInformation?.yearsOfService || 0;
                  const serviceStatus = v.serviceInformation?.serviceStatus || 'Retired';
                  const regDate = v.createdAt ? new Date(v.createdAt).toLocaleDateString() : 'N/A';

                  return (
                    <tr key={v._id}>
                      <td>
                        <strong style={{ color: '#2563eb' }}>{v.veteranId}</strong>
                      </td>
                      <td>
                        <span className="admin-cell-title">{name}</span>
                        <span className="admin-cell-sub">{email} • {phone}</span>
                      </td>
                      <td>
                        <span className="admin-cell-title">{branch}</span>
                        <span className="admin-cell-sub">Rank: {rank}</span>
                      </td>
                      <td>
                        <span>{years} Years</span>
                      </td>
                      <td>
                        <Badge variant="neutral">{serviceStatus}</Badge>
                      </td>
                      <td>
                        <Badge
                          variant={
                            v.verificationStatus === 'VERIFIED'
                              ? 'success'
                              : v.verificationStatus === 'REJECTED'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {v.verificationStatus}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={v.user?.isActive ? 'success' : 'danger'}>
                          {v.user?.isActive ? 'ACTIVE' : 'INACTIVE'}
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
                            to={`/admin/veterans/${v.veteranId}`}
                            className="admin-btn-action"
                            title="View full military profile dossier"
                          >
                            <Eye size={14} /> Dossier
                          </Link>

                          {v.verificationStatus !== 'VERIFIED' && (
                            <button
                              type="button"
                              className="admin-btn-action btn-verify"
                              onClick={() => handleOpenVerificationModal(v, 'VERIFIED')}
                              title="Verify Veteran"
                            >
                              <CheckCircle size={14} /> Verify
                            </button>
                          )}

                          {v.verificationStatus !== 'REJECTED' && (
                            <button
                              type="button"
                              className="admin-btn-action btn-reject"
                              onClick={() => handleOpenVerificationModal(v, 'REJECTED')}
                              title="Reject Verification"
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

        {/* Pagination Bar */}
        {!loading && pagination.totalPages > 1 && (
          <div className="admin-pagination-bar">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} Total Records)
            </span>
            <div className="admin-pagination-controls">
              <button
                type="button"
                className="admin-page-btn"
                disabled={pagination.page <= 1}
                onClick={() => fetchVeterans(pagination.page - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="admin-page-btn"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchVeterans(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Verification Action Modal */}
      {selectedVeteran && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedVeteran(null)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                {modalAction === 'VERIFIED' ? 'Approve Veteran Verification' : 'Reject Veteran Verification'}
              </h3>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setSelectedVeteran(null)}
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-600)' }}>
                You are updating the verification status for{' '}
                <strong>{selectedVeteran.personalInformation?.fullName || selectedVeteran.veteranId}</strong>{' '}
                (ID: {selectedVeteran.veteranId}).
              </p>

              <div className="admin-form-group">
                <label className="admin-form-label">Administrative Remarks / Scrutiny Reason:</label>
                <textarea
                  className="admin-form-textarea"
                  rows={4}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter official remarks..."
                />
              </div>
            </div>

            <div className="admin-modal-footer">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedVeteran(null)}
                disabled={actionLoading}
              >
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

export default VeteransList;
