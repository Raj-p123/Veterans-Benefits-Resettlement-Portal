import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FileCheck2,
  Search,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Filter,
  Users,
} from 'lucide-react';
import { adminService } from '../../../services/adminService.js';
import { documentService } from '../../../services/documentService.js';
import { useSocket } from '../../../context/SocketContext.jsx';
import Badge from '../../../components/Badge/Badge.jsx';
import Button from '../../../components/Button/Button.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../../components/ErrorMessage/ErrorMessage.jsx';
import '../AdminCommon.css';

export const DocumentsList = () => {
  const { on, off } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const veteranIdParam = searchParams.get('veteranId') || '';
  const statusParam = searchParams.get('verificationStatus') || 'ALL';

  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [counts, setCounts] = useState({ total: 0, uploaded: 0, underReview: 0, verified: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [documentType, setDocumentType] = useState('ALL');
  const [verificationStatus, setVerificationStatus] = useState(statusParam);

  // Action modal
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [targetStatus, setTargetStatus] = useState('VERIFIED');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDocuments = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getDocuments({
        page,
        limit: 12,
        search,
        documentType,
        verificationStatus,
        veteranId: veteranIdParam,
      });
      setDocuments(res.data.documents);
      setPagination(res.data.pagination);
      setCounts(res.data.counts);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [search, documentType, verificationStatus, veteranIdParam]);

  useEffect(() => {
    fetchDocuments(1);
  }, [fetchDocuments]);

  // Real-time synchronization when Veterans upload new files or replace rejected records
  useEffect(() => {
    const handleDocUpdate = (data) => {
      console.log('[Admin Socket] Document updated event received:', data);
      fetchDocuments(pagination.page);
    };

    on('admin:documentUploaded', handleDocUpdate);
    on('admin:dashboardUpdated', handleDocUpdate);

    return () => {
      off('admin:documentUploaded', handleDocUpdate);
      off('admin:dashboardUpdated', handleDocUpdate);
    };
  }, [on, off, pagination.page, fetchDocuments]);

  const handleOpenReviewModal = (doc, status) => {
    setSelectedDoc(doc);
    setTargetStatus(status);
    setAdminRemarks(
      status === 'VERIFIED'
        ? 'Official stamp and service details verified.'
        : status === 'REJECTED'
        ? 'Illegible scan or document mismatch. Please re-upload clear copy.'
        : 'Under active review.'
    );
  };

  const handleSaveDocStatus = async () => {
    if (!selectedDoc) return;
    if (targetStatus === 'REJECTED' && !adminRemarks.trim()) {
      alert('Please provide a mandatory reason for rejecting this document.');
      return;
    }

    setActionLoading(true);
    try {
      await adminService.updateDocumentStatus(selectedDoc._id, {
        status: targetStatus,
        adminRemarks: adminRemarks.trim(),
        rejectionReason: targetStatus === 'REJECTED' ? adminRemarks.trim() : undefined,
      });
      setSelectedDoc(null);
      fetchDocuments(pagination.page);
    } catch (err) {
      alert(err.message || 'Failed to update document status');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-title-group">
          <h1>Supporting Documents Vault</h1>
          <p>
            Scrutinize military discharge books, identity proofs, education certificates, and claim records.
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
              placeholder="Search document name or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="admin-select"
            value={verificationStatus}
            onChange={(e) => setVerificationStatus(e.target.value)}
          >
            <option value="ALL">All Statuses ({counts.total})</option>
            <option value="UPLOADED">Pending Scrutiny ({counts.uploaded})</option>
            <option value="UNDER_REVIEW">Under Review ({counts.underReview})</option>
            <option value="VERIFIED">Verified ({counts.verified})</option>
            <option value="REJECTED">Rejected ({counts.rejected})</option>
          </select>

          <select
            className="admin-select"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
          >
            <option value="ALL">All Document Types</option>
            <option value="Service Certificate">Service Certificate</option>
            <option value="Discharge Certificate">Discharge Certificate</option>
            <option value="Identity Document">Identity Document</option>
            <option value="Pension Document">Pension Document</option>
            <option value="Education Certificate">Education Certificate</option>
            <option value="Skill Certificate">Skill Certificate</option>
            <option value="Experience Certificate">Experience Certificate</option>
            <option value="Address Proof">Address Proof</option>
            <option value="Other">Other</option>
          </select>

          {veteranIdParam && (
            <Button
              variant="secondary"
              size="sm"
              icon={Users}
              onClick={() => {
                searchParams.delete('veteranId');
                setSearchParams(searchParams);
              }}
            >
              Clear Veteran Filter
            </Button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="admin-table-container">
        {loading ? (
          <LoadingSpinner size="lg" message="Loading documents vault..." />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : documents.length === 0 ? (
          <div className="admin-empty-state">
            <FileCheck2 size={48} className="admin-empty-icon" />
            <h3>No Documents Found</h3>
            <p>Try refining your search terms or status filters.</p>
          </div>
        ) : (
          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Type</th>
                  <th>Veteran</th>
                  <th>Uploaded Date</th>
                  <th>Status</th>
                  <th>Remarks / Reason</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const vetId = doc.veteran?.veteranId || doc.veteran?._id || 'N/A';
                  const vetName = doc.veteran?.personalInformation?.fullName || 'Veteran User';
                  const dateStr = doc.uploadedAt
                    ? new Date(doc.uploadedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'N/A';

                  return (
                    <tr key={doc._id}>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                          {doc.documentName}
                        </span>
                      </td>
                      <td>
                        <Badge variant="neutral">{doc.documentType}</Badge>
                      </td>
                      <td>
                        <Link to={`/admin/veterans/${vetId}`} style={{ color: '#2563eb', fontWeight: 600 }}>
                          {vetName}
                        </Link>
                        <span className="admin-cell-sub">ID: {vetId}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                          {dateStr}
                        </span>
                      </td>
                      <td>
                        <Badge
                          variant={
                            doc.verificationStatus === 'VERIFIED'
                              ? 'success'
                              : doc.verificationStatus === 'REJECTED'
                              ? 'danger'
                              : doc.verificationStatus === 'UNDER_REVIEW'
                              ? 'warning'
                              : 'info'
                          }
                        >
                          {doc.verificationStatus}
                        </Badge>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', color: doc.verificationStatus === 'REJECTED' ? '#dc2626' : doc.adminRemarks ? '#b45309' : '#94a3b8' }}>
                          {doc.rejectionReason || doc.adminRemarks || 'None'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="admin-row-actions" style={{ justifyContent: 'flex-end' }}>
                          <a
                            href={documentService.getDocumentViewUrl(doc._id, doc.fileUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-btn-action"
                            title="Inspect file securely"
                          >
                            <ExternalLink size={14} /> Open File
                          </a>

                          {doc.verificationStatus !== 'VERIFIED' && (
                            <button
                              type="button"
                              className="admin-btn-action btn-verify"
                              onClick={() => handleOpenReviewModal(doc, 'VERIFIED')}
                              title="Approve Document"
                            >
                              <CheckCircle size={14} /> Approve
                            </button>
                          )}

                          {doc.verificationStatus !== 'REJECTED' && (
                            <button
                              type="button"
                              className="admin-btn-action btn-reject"
                              onClick={() => handleOpenReviewModal(doc, 'REJECTED')}
                              title="Reject Document"
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
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} Total Documents)
            </span>
            <div className="admin-pagination-controls">
              <button
                type="button"
                className="admin-page-btn"
                disabled={pagination.page <= 1}
                onClick={() => fetchDocuments(pagination.page - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="admin-page-btn"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchDocuments(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedDoc && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedDoc(null)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                {targetStatus === 'VERIFIED' ? 'Approve Supporting Document' : 'Reject Supporting Document'}
              </h3>
              <button type="button" className="admin-modal-close-btn" onClick={() => setSelectedDoc(null)}>
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-600)' }}>
                Updating status for document: <strong>{selectedDoc.documentName}</strong> ({selectedDoc.documentType}).
              </p>

              <div className="admin-form-group">
                <label className="admin-form-label">
                  {targetStatus === 'REJECTED' ? 'Mandatory Rejection Reason (Notified to Veteran):' : 'Administrative Scrutiny Remarks:'}
                </label>
                <textarea
                  className="admin-form-textarea"
                  rows={4}
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder={targetStatus === 'REJECTED' ? 'Please state why the document is rejected (e.g. illegible scan, expired document, name mismatch)...' : 'Remarks...'}
                  required={targetStatus === 'REJECTED'}
                />
              </div>
            </div>

            <div className="admin-modal-footer">
              <Button variant="secondary" size="sm" onClick={() => setSelectedDoc(null)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button
                variant={targetStatus === 'VERIFIED' ? 'primary' : 'danger'}
                size="sm"
                onClick={handleSaveDocStatus}
                loading={actionLoading}
                icon={targetStatus === 'VERIFIED' ? CheckCircle : XCircle}
              >
                Set to {targetStatus}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsList;
