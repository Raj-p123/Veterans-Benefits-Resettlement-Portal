import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FolderOpen,
  ArrowRight,
  Edit3,
  Sparkles,
} from 'lucide-react';
import { applicationService } from '../../../services/applicationService.js';
import PageContainer from '../../../components/PageContainer/PageContainer.jsx';
import Button from '../../../components/Button/Button.jsx';
import Badge from '../../../components/Badge/Badge.jsx';
import EmptyState from '../../../components/EmptyState/EmptyState.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../../components/ErrorMessage/ErrorMessage.jsx';
import { useSocket } from '../../../context/SocketContext.jsx';
import { SOCKET_EVENTS } from '../../../constants/socketEvents.js';
import './ApplicationsList.css';

const STATUS_TABS = [
  { id: 'ALL', label: 'All Applications' },
  { id: 'DRAFT', label: 'Drafts' },
  { id: 'SUBMITTED', label: 'Submitted' },
  { id: 'UNDER_REVIEW', label: 'Under Review' },
  { id: 'DOCUMENT_VERIFICATION', label: 'Doc Verification' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'WITHDRAWN', label: 'Withdrawn' },
];

export const ApplicationsList = () => {
  const [applications, setApplications] = useState([]);
  const [counts, setCounts] = useState({ total: 0, draft: 0, submitted: 0, underReview: 0, approved: 0, rejected: 0, withdrawn: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Pagination
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit };
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const data = await applicationService.getMyApplications(params);
      if (data) {
        setApplications(data.applications || []);
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        if (data.counts) setCounts(data.counts);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve submitted applications');
    } finally {
      setLoading(false);
    }
  }, [page, limit, selectedStatus, debouncedSearch]);

  const { on, off } = useSocket();

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Real-time synchronization on status change or submission
  useEffect(() => {
    const handleApplicationUpdate = () => {
      console.log('[Real-Time] Scheme application list update received');
      loadApplications();
    };

    on(SOCKET_EVENTS.APPLICATION_STATUS_CHANGED, handleApplicationUpdate);
    on(SOCKET_EVENTS.APPLICATION_SUBMITTED, handleApplicationUpdate);
    on(SOCKET_EVENTS.DASHBOARD_UPDATED, handleApplicationUpdate);

    return () => {
      off(SOCKET_EVENTS.APPLICATION_STATUS_CHANGED, handleApplicationUpdate);
      off(SOCKET_EVENTS.APPLICATION_SUBMITTED, handleApplicationUpdate);
      off(SOCKET_EVENTS.DASHBOARD_UPDATED, handleApplicationUpdate);
    };
  }, [on, off, loadApplications]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="neutral" icon={Edit3}>Draft</Badge>;
      case 'SUBMITTED':
        return <Badge variant="info" icon={FileText}>Submitted</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="warning" icon={Clock}>Under Review</Badge>;
      case 'DOCUMENT_VERIFICATION':
        return <Badge variant="warning" icon={Clock}>Doc Verification</Badge>;
      case 'APPROVED':
        return <Badge variant="success" icon={CheckCircle2}>Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="danger" icon={XCircle}>Rejected</Badge>;
      case 'WITHDRAWN':
        return <Badge variant="neutral" icon={AlertTriangle}>Withdrawn</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <PageContainer width="wide">
      <div className="my-apps-page-wrapper">
        <div className="my-apps-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary-950)', marginBottom: '4px' }}>
                My Scheme Applications & Claims
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
                Track the live review milestones, verification updates, and departmental decisions for all your submitted claims.
              </p>
            </div>
            <Link to="/schemes">
              <Button variant="accent" size="sm" icon={Sparkles}>
                Browse Welfare Schemes
              </Button>
            </Link>
          </div>
        </div>

        {/* Top Status Metrics Strip */}
        <div className="my-apps-metrics-strip">
          <div className="metric-strip-card">
            <span className="metric-strip-label">Total Claims</span>
            <span className="metric-strip-count">{counts.total}</span>
          </div>
          <div className="metric-strip-card">
            <span className="metric-strip-label">Drafts</span>
            <span className="metric-strip-count" style={{ color: 'var(--color-slate-600)' }}>
              {counts.draft}
            </span>
          </div>
          <div className="metric-strip-card">
            <span className="metric-strip-label">Submitted</span>
            <span className="metric-strip-count" style={{ color: 'var(--color-primary-700)' }}>
              {counts.submitted}
            </span>
          </div>
          <div className="metric-strip-card">
            <span className="metric-strip-label">In Review</span>
            <span className="metric-strip-count" style={{ color: '#ca8a04' }}>
              {counts.underReview}
            </span>
          </div>
          <div className="metric-strip-card">
            <span className="metric-strip-label">Approved</span>
            <span className="metric-strip-count" style={{ color: '#16a34a' }}>
              {counts.approved}
            </span>
          </div>
          <div className="metric-strip-card">
            <span className="metric-strip-label">Rejected</span>
            <span className="metric-strip-count" style={{ color: '#dc2626' }}>
              {counts.rejected}
            </span>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="my-apps-toolbar">
          <div className="apps-status-tabs">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`app-status-tab-btn ${selectedStatus === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedStatus(tab.id);
                  setPage(1);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate-400)' }} />
            <input
              type="text"
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.75rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border-main)',
                fontSize: '0.875rem',
                backgroundColor: 'var(--color-slate-50)',
              }}
              placeholder="Search by Application ID (e.g. APP-2026-000001) or scheme keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <ErrorMessage message={error} />

        {/* Applications List */}
        {loading ? (
          <div style={{ minHeight: '30vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LoadingSpinner size="md" message="Loading your applications..." />
          </div>
        ) : applications.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No applications found"
            description="You have not submitted or initiated any welfare scheme applications matching these filters."
          />
        ) : (
          <div className="apps-table-card">
            <table className="apps-table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Welfare Scheme</th>
                  <th>Submitted / Initiated</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const appId = app.applicationId || app.id || app._id;
                  const scheme = app.scheme || {};
                  const isDraft = app.status === 'DRAFT';

                  return (
                    <tr key={appId}>
                      <td className="app-id-cell">{app.applicationId}</td>
                      <td>
                        <div className="app-scheme-title-text">{scheme.name || 'Welfare Scheme Application'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                          Category: {scheme.category || 'General'} • {scheme.officialSource}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--color-slate-600)' }}>
                        {app.submittedAt
                          ? new Date(app.submittedAt).toLocaleDateString()
                          : `Draft (${new Date(app.updatedAt).toLocaleDateString()})`}
                      </td>
                      <td>{getStatusBadge(app.status)}</td>
                      <td style={{ textAlign: 'right' }}>
                        {isDraft ? (
                          <Link to={`/veteran/apply/${scheme.schemeId || scheme._id}`}>
                            <Button variant="accent" size="sm" icon={Edit3}>
                              Continue Draft
                            </Button>
                          </Link>
                        ) : (
                          <Link to={`/veteran/applications/${appId}`}>
                            <Button variant="secondary" size="sm" icon={ArrowRight}>
                              Track Status
                            </Button>
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
            <Button
              variant="secondary"
              size="sm"
              icon={ChevronLeft}
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              Previous
            </Button>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-slate-700)' }}>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              icon={ChevronRight}
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default ApplicationsList;
