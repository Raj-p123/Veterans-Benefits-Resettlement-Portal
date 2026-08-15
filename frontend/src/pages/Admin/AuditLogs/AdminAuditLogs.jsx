import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Search,
  Clock,
  Eye,
  Terminal,
  User,
  Filter,
  CheckCircle,
} from 'lucide-react';
import { adminService } from '../../../services/adminService.js';
import Badge from '../../../components/Badge/Badge.jsx';
import Button from '../../../components/Button/Button.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../../components/ErrorMessage/ErrorMessage.jsx';
import '../AdminCommon.css';

export const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('ALL');
  const [entityType, setEntityType] = useState('ALL');

  // Metadata inspector modal
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getAuditLogs({
        page,
        limit: 15,
        search,
        action,
        entityType,
      });
      setLogs(res.data.logs);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [search, action, entityType]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-title-group">
          <h1>Administrative Security Audit Trail</h1>
          <p>
            Immutable event log tracking all verification reviews, account moderations, scheme updates, and administrative logins.
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
              placeholder="Search description, entity ID, action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select className="admin-select" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="ALL">All Actions</option>
            <option value="VERIFY_VETERAN">VERIFY_VETERAN</option>
            <option value="VERIFY_EMPLOYER">VERIFY_EMPLOYER</option>
            <option value="VERIFY_DOCUMENT">VERIFY_DOCUMENT</option>
            <option value="UPDATE_USER_STATUS">UPDATE_USER_STATUS</option>
            <option value="CREATE_SCHEME">CREATE_SCHEME</option>
            <option value="UPDATE_SCHEME">UPDATE_SCHEME</option>
            <option value="DELETE_SCHEME">DELETE_SCHEME</option>
            <option value="UPDATE_JOB_STATUS">UPDATE_JOB_STATUS</option>
            <option value="DELETE_JOB">DELETE_JOB</option>
            <option value="UPDATE_SCHEME_APPLICATION">UPDATE_SCHEME_APPLICATION</option>
            <option value="CHANGE_PASSWORD">CHANGE_PASSWORD</option>
          </select>

          <select className="admin-select" value={entityType} onChange={(e) => setEntityType(e.target.value)}>
            <option value="ALL">All Entity Types</option>
            <option value="Veteran">Veteran</option>
            <option value="Employer">Employer</option>
            <option value="Document">Document</option>
            <option value="User">User</option>
            <option value="Scheme">Scheme</option>
            <option value="Job">Job</option>
            <option value="Application">Application</option>
          </select>
        </div>

        <div>
          <Badge variant="neutral">Total Logs: {pagination.total}</Badge>
        </div>
      </div>

      {/* Table Card */}
      <div className="admin-table-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <LoadingSpinner size="md" text="Loading security audit log entries..." />
          </div>
        ) : error ? (
          <div style={{ padding: '2rem' }}>
            <ErrorMessage message={error} onRetry={() => fetchLogs(pagination.page)} />
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-slate-500)' }}>
            No audit log entries matching criteria.
          </div>
        ) : (
          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Description</th>
                  <th>Administrator</th>
                  <th>IP Address</th>
                  <th style={{ textAlign: 'right' }}>Inspector</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const dateStr = log.createdAt
                    ? new Date(log.createdAt).toLocaleString()
                    : 'N/A';
                  const adminName = log.user?.name || 'Admin';
                  const adminEmail = log.user?.email || '';

                  return (
                    <tr key={log._id}>
                      <td>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', whiteSpace: 'nowrap' }}>
                          {dateStr}
                        </span>
                      </td>
                      <td>
                        <Badge
                          variant={
                            log.action?.includes('VERIFY')
                              ? 'success'
                              : log.action?.includes('DELETE')
                              ? 'danger'
                              : log.action?.includes('STATUS')
                              ? 'warning'
                              : 'info'
                          }
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td>
                        <span className="admin-cell-title">{log.entityType}</span>
                        <span className="admin-cell-sub">{log.entityId ? `ID: ${log.entityId}` : ''}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--color-slate-800)' }}>
                          {log.description}
                        </span>
                      </td>
                      <td>
                        <span className="admin-cell-title">{adminName}</span>
                        <span className="admin-cell-sub">{adminEmail}</span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                          {log.ipAddress || '127.0.0.1'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="admin-btn-action"
                          onClick={() => setSelectedLog(log)}
                          title="Inspect JSON Metadata"
                        >
                          <Terminal size={13} /> JSON
                        </button>
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
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} Total Logs)
            </span>
            <div className="admin-pagination-controls">
              <button
                type="button"
                className="admin-page-btn"
                disabled={pagination.page <= 1}
                onClick={() => fetchLogs(pagination.page - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="admin-page-btn"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchLogs(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* JSON Metadata Inspector Modal */}
      {selectedLog && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedLog(null)}>
          <div className="admin-modal-dialog" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Audit Event Inspector: {selectedLog.action}</h3>
              <button type="button" className="admin-modal-close-btn" onClick={() => setSelectedLog(null)}>
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.8125rem' }}>
                  <strong>Description:</strong> {selectedLog.description}
                </div>
                <div style={{ fontSize: '0.8125rem' }}>
                  <strong>Administrator:</strong> {selectedLog.user?.name} ({selectedLog.user?.email})
                </div>
                <div style={{ fontSize: '0.8125rem' }}>
                  <strong>Client IP Address:</strong> {selectedLog.ipAddress}
                </div>
                <div style={{ fontSize: '0.8125rem' }}>
                  <strong>Recorded Timestamp:</strong> {new Date(selectedLog.createdAt).toISOString()}
                </div>
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <span className="admin-form-label" style={{ display: 'block', marginBottom: '0.375rem' }}>
                  Sanitized Audit Payload (JSON):
                </span>
                <pre
                  style={{
                    background: '#0f172a',
                    color: '#38bdf8',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.75rem',
                    overflowX: 'auto',
                    maxHeight: '260px',
                  }}
                >
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="admin-modal-footer">
              <Button variant="secondary" size="sm" onClick={() => setSelectedLog(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogs;
