import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Search,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Star,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { adminService } from '../../../services/adminService.js';
import { ROUTES } from '../../../constants/index.js';
import Badge from '../../../components/Badge/Badge.jsx';
import Button from '../../../components/Button/Button.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../../components/ErrorMessage/ErrorMessage.jsx';
import '../AdminCommon.css';

export const SchemesList = () => {
  const [schemes, setSchemes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [counts, setCounts] = useState({ total: 0, active: 0, inactive: 0, featured: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [isFeatured, setIsFeatured] = useState('ALL');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchSchemes = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getSchemes({
        page,
        limit: 10,
        search,
        category,
        status,
        isFeatured,
      });
      setSchemes(res.data.schemes);
      setPagination(res.data.pagination);
      setCounts(res.data.counts);
    } catch (err) {
      console.error('Error fetching schemes:', err);
      setError(err.message || 'Failed to load welfare schemes');
    } finally {
      setLoading(false);
    }
  }, [search, category, status, isFeatured]);

  useEffect(() => {
    fetchSchemes(1);
  }, [fetchSchemes]);

  const handleToggleStatus = async (scheme) => {
    const newStatus = scheme.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await adminService.updateScheme(scheme._id, { status: newStatus });
      fetchSchemes(pagination.page);
    } catch (err) {
      alert(err.message || 'Failed to toggle scheme status');
    }
  };

  const handleToggleFeatured = async (scheme) => {
    try {
      await adminService.updateScheme(scheme._id, { isFeatured: !scheme.isFeatured });
      fetchSchemes(pagination.page);
    } catch (err) {
      alert(err.message || 'Failed to toggle featured status');
    }
  };

  const handleDeleteScheme = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminService.deleteScheme(deleteTarget._id);
      setDeleteTarget(null);
      fetchSchemes(pagination.page);
    } catch (err) {
      alert(err.message || 'Failed to delete scheme');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-title-group">
          <h1>Welfare Schemes & Grants Administration</h1>
          <p>
            Configure central and state financial assistance, pension policies, healthcare entitlements, and eligibility rules.
          </p>
        </div>
        <div>
          <Link to={ROUTES.ADMIN_SCHEME_CREATE}>
            <Button variant="primary" icon={PlusCircle}>
              Publish New Scheme
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="admin-filter-card">
        <div className="admin-filter-group">
          <div className="admin-input-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by Scheme Name, ID, Category, Authority..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select className="admin-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="ALL">All Categories</option>
            <option value="Pension">Pension</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Housing">Housing</option>
            <option value="Education">Education</option>
            <option value="Financial Assistance">Financial Assistance</option>
            <option value="Family Welfare">Family Welfare</option>
            <option value="Employment">Employment</option>
            <option value="Skill Development">Skill Development</option>
            <option value="Resettlement">Resettlement</option>
          </select>

          <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">All Statuses ({counts.total})</option>
            <option value="ACTIVE">Active ({counts.active})</option>
            <option value="INACTIVE">Inactive ({counts.inactive})</option>
          </select>

          <select className="admin-select" value={isFeatured} onChange={(e) => setIsFeatured(e.target.value)}>
            <option value="ALL">All Schemes</option>
            <option value="true">Featured Only ({counts.featured})</option>
          </select>
        </div>

        <div>
          <Badge variant="neutral">Total Schemes: {counts.total}</Badge>
        </div>
      </div>

      {/* Table Card */}
      <div className="admin-table-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <LoadingSpinner size="md" text="Loading welfare schemes..." />
          </div>
        ) : error ? (
          <div style={{ padding: '2rem' }}>
            <ErrorMessage message={error} onRetry={() => fetchSchemes(pagination.page)} />
          </div>
        ) : schemes.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-slate-500)' }}>
            No schemes found matching criteria.
          </div>
        ) : (
          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Scheme ID</th>
                  <th>Scheme Name & Authority</th>
                  <th>Category</th>
                  <th>Applicable State</th>
                  <th>Claims Submitted</th>
                  <th>Featured</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schemes.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <strong style={{ color: '#2563eb' }}>{s.schemeId}</strong>
                    </td>
                    <td>
                      <span className="admin-cell-title">{s.name}</span>
                      <span className="admin-cell-sub">Authority: {s.officialSource}</span>
                    </td>
                    <td>
                      <Badge variant="neutral">{s.category}</Badge>
                    </td>
                    <td>
                      <span>{s.state || 'All India'}</span>
                    </td>
                    <td>
                      <Link
                        to={`${ROUTES.ADMIN_SCHEME_APPLICATIONS}?schemeId=${s.schemeId}`}
                        style={{ fontWeight: 600, color: '#2563eb' }}
                      >
                        {s.applicationCount || 0} Claims
                      </Link>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(s)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: s.isFeatured ? '#d97706' : '#cbd5e1',
                        }}
                        title={s.isFeatured ? 'Featured scheme (Click to unfeature)' : 'Click to feature on home'}
                      >
                        <Star size={18} fill={s.isFeatured ? '#f59e0b' : 'none'} />
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(s)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        title="Click to toggle status"
                      >
                        <Badge variant={s.status === 'ACTIVE' ? 'success' : 'danger'}>
                          {s.status}
                        </Badge>
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="admin-row-actions" style={{ justifyContent: 'flex-end' }}>
                        <Link
                          to={`/schemes/${s.schemeId}`}
                          target="_blank"
                          className="admin-btn-action"
                          title="Preview public listing"
                        >
                          <Eye size={13} /> Preview
                        </Link>
                        <Link
                          to={`/admin/schemes/${s.schemeId}/edit`}
                          className="admin-btn-action"
                          title="Edit Scheme Configuration"
                        >
                          <Edit2 size={13} /> Edit
                        </Link>
                        <button
                          type="button"
                          className="admin-btn-action btn-reject"
                          onClick={() => setDeleteTarget(s)}
                          title="Delete Scheme"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="admin-pagination-bar">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} Total Schemes)
            </span>
            <div className="admin-pagination-controls">
              <button
                type="button"
                className="admin-page-btn"
                disabled={pagination.page <= 1}
                onClick={() => fetchSchemes(pagination.page - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="admin-page-btn"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchSchemes(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="admin-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Delete Welfare Scheme</h3>
              <button type="button" className="admin-modal-close-btn" onClick={() => setDeleteTarget(null)}>
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <AlertTriangle size={24} color="#dc2626" />
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-700)', marginBottom: '0.5rem' }}>
                    Are you sure you want to permanently delete scheme{' '}
                    <strong>{deleteTarget.name}</strong> ({deleteTarget.schemeId})?
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                    If veterans have already applied for this scheme, deletion will be blocked by safety checks. You can set the scheme to <strong>INACTIVE</strong> instead.
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
                onClick={handleDeleteScheme}
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

export default SchemesList;
