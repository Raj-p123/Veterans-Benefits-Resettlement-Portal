import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  Briefcase,
  Award,
  FileText,
  FileCheck2,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  FileSpreadsheet,
  BarChart3,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { adminService } from '../../../services/adminService.js';
import { useSocket } from '../../../context/SocketContext.jsx';
import { SOCKET_EVENTS } from '../../../constants/socketEvents.js';
import { ROUTES } from '../../../constants/index.js';
import Badge from '../../../components/Badge/Badge.jsx';
import Button from '../../../components/Button/Button.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../../components/ErrorMessage/ErrorMessage.jsx';
import './AdminDashboard.css';

export const AdminDashboard = () => {
  const { on, off } = useSocket();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [livePulse, setLivePulse] = useState(false);

  const fetchStats = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const res = await adminService.getDashboardStats();
      setStats(res.data);
      setLastRefreshed(new Date());
      if (isSilent) {
        setLivePulse(true);
        setTimeout(() => setLivePulse(false), 2000);
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
      if (!isSilent) {
        setError(err.message || 'Failed to load dashboard statistics');
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Real-time Socket.IO listeners for automatic live updates
  useEffect(() => {
    const handleRealTimeUpdate = (data) => {
      console.log('[Admin Dashboard] Received Real-Time Event:', data);
      fetchStats(true); // silent refresh
    };

    on(SOCKET_EVENTS.ADMIN_VETERAN_REGISTERED, handleRealTimeUpdate);
    on(SOCKET_EVENTS.ADMIN_EMPLOYER_REGISTERED, handleRealTimeUpdate);
    on(SOCKET_EVENTS.ADMIN_JOB_CREATED, handleRealTimeUpdate);
    on(SOCKET_EVENTS.ADMIN_APPLICATION_CREATED, handleRealTimeUpdate);
    on(SOCKET_EVENTS.ADMIN_DOCUMENT_UPLOADED, handleRealTimeUpdate);
    on(SOCKET_EVENTS.ADMIN_VERIFICATION_UPDATED, handleRealTimeUpdate);
    on(SOCKET_EVENTS.ADMIN_DASHBOARD_UPDATED, handleRealTimeUpdate);
    on(SOCKET_EVENTS.DASHBOARD_UPDATED, handleRealTimeUpdate);

    return () => {
      off(SOCKET_EVENTS.ADMIN_VETERAN_REGISTERED, handleRealTimeUpdate);
      off(SOCKET_EVENTS.ADMIN_EMPLOYER_REGISTERED, handleRealTimeUpdate);
      off(SOCKET_EVENTS.ADMIN_JOB_CREATED, handleRealTimeUpdate);
      off(SOCKET_EVENTS.ADMIN_APPLICATION_CREATED, handleRealTimeUpdate);
      off(SOCKET_EVENTS.ADMIN_DOCUMENT_UPLOADED, handleRealTimeUpdate);
      off(SOCKET_EVENTS.ADMIN_VERIFICATION_UPDATED, handleRealTimeUpdate);
      off(SOCKET_EVENTS.ADMIN_DASHBOARD_UPDATED, handleRealTimeUpdate);
      off(SOCKET_EVENTS.DASHBOARD_UPDATED, handleRealTimeUpdate);
    };
  }, [on, off, fetchStats]);

  if (loading) {
    return (
      <div className="admin-page-loading" role="status" aria-live="polite">
        <LoadingSpinner size="lg" text="Retrieving central administration records..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page-error" role="alert">
        <ErrorMessage message={error} onRetry={() => fetchStats()} />
      </div>
    );
  }

  const pending = stats?.pendingBreakdown || { veterans: 0, employers: 0, documents: 0 };
  const totalPending = stats?.pendingVerifications || 0;

  return (
    <div className="admin-dashboard-page">
      {/* ==================================================================
          1. FORMAL ADMINISTRATIVE HEADING BLOCK
          ================================================================== */}
      <section className="admin-gov-header-card" aria-label="Administrative Header">
        <div className="admin-gov-header-main">
          <div className="gov-dept-eyebrow">
            <ShieldCheck size={14} className="dept-eyebrow-icon" aria-hidden="true" />
            <span>ADMINISTRATOR COMMAND CENTER</span>
          </div>
          <h1 className="admin-gov-title">Veterans Benefits & Resettlement Portal</h1>
          <p className="admin-gov-subtitle">
            Central administrative dashboard for veteran verification, welfare schemes, employment services and portal operations.
          </p>
        </div>

        <div className="admin-gov-header-aside">
          <div className={`gov-live-sync-indicator ${livePulse ? 'pulsing' : ''}`}>
            <span className="gov-pulse-dot" aria-hidden="true" />
            <span className="gov-pulse-label">Live Sync Active</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={() => fetchStats()}
            title={`Last synchronized: ${lastRefreshed.toLocaleTimeString('en-GB')}`}
          >
            Refresh Data
          </Button>
        </div>
      </section>

      {/* ==================================================================
          2. IMPORTANT PENDING ACTION NOTICE (OFFICIAL ALERT PANEL)
          ================================================================== */}
      {totalPending > 0 && (
        <section className="gov-pending-action-panel" role="alert" aria-label="Action items pending review">
          <div className="gov-alert-header-row">
            <div className="gov-alert-title-wrap">
              <AlertTriangle size={18} className="gov-alert-lead-icon" aria-hidden="true" />
              <h2 className="gov-alert-heading">
                Action Items Pending Departmental Review ({totalPending})
              </h2>
            </div>
          </div>

          <p className="gov-alert-desc">
            Official scrutiny is required for <strong>{pending.veterans}</strong> veteran profile{pending.veterans === 1 ? '' : 's'},{' '}
            <strong>{pending.employers}</strong> corporate employer registration{pending.employers === 1 ? '' : 's'}, and{' '}
            <strong>{pending.documents}</strong> pending document verification{pending.documents === 1 ? '' : 's'}.
          </p>

          <div className="gov-alert-actions-row">
            {pending.veterans > 0 && (
              <Link
                to={`${ROUTES.ADMIN_VETERANS}?verificationStatus=PENDING`}
                className="gov-alert-action-btn"
              >
                <span>Verify Veterans</span>
                <span className="gov-badge-count">{pending.veterans}</span>
              </Link>
            )}
            {pending.employers > 0 && (
              <Link
                to={`${ROUTES.ADMIN_EMPLOYERS}?verificationStatus=PENDING`}
                className="gov-alert-action-btn"
              >
                <span>Verify Employers</span>
                <span className="gov-badge-count">{pending.employers}</span>
              </Link>
            )}
            {pending.documents > 0 && (
              <Link
                to={`${ROUTES.ADMIN_DOCUMENTS}?verificationStatus=UPLOADED`}
                className="gov-alert-action-btn"
              >
                <span>Review Documents</span>
                <span className="gov-badge-count">{pending.documents}</span>
              </Link>
            )}
          </div>
        </section>
      )}

      {/* ==================================================================
          3. STATISTICS SECTION (FORMAL INFORMATION BLOCKS)
          ================================================================== */}
      <section className="gov-stats-section" aria-label="Portal Metrics and Statistics">
        <div className="gov-section-header">
          <h2 className="gov-section-title">PORTAL METRICS & OPERATIONAL STATISTICS</h2>
          <span className="gov-section-meta">Official Consolidated Overview</span>
        </div>

        <div className="gov-stats-grid">
          {/* 1. Total Veterans */}
          <div className="gov-kpi-block theme-blue">
            <div className="gov-kpi-header">
              <span className="gov-kpi-title">TOTAL VETERANS</span>
              <div className="gov-kpi-icon-container" aria-hidden="true">
                <Users size={16} />
              </div>
            </div>
            <div className="gov-kpi-val">{stats?.veterans ?? 0}</div>
            <div className="gov-kpi-footer">
              <span className="gov-kpi-subtext">
                {pending.veterans} Pending Verification
              </span>
              <Link to={ROUTES.ADMIN_VETERANS} className="gov-kpi-link">
                Manage →
              </Link>
            </div>
          </div>

          {/* 2. Corporate Employers */}
          <div className="gov-kpi-block theme-amber">
            <div className="gov-kpi-header">
              <span className="gov-kpi-title">CORPORATE EMPLOYERS</span>
              <div className="gov-kpi-icon-container" aria-hidden="true">
                <Building2 size={16} />
              </div>
            </div>
            <div className="gov-kpi-val">{stats?.employers ?? 0}</div>
            <div className="gov-kpi-footer">
              <span className="gov-kpi-subtext">
                {pending.employers} Pending Review
              </span>
              <Link to={ROUTES.ADMIN_EMPLOYERS} className="gov-kpi-link">
                Manage →
              </Link>
            </div>
          </div>

          {/* 3. Active Job Openings */}
          <div className="gov-kpi-block theme-purple">
            <div className="gov-kpi-header">
              <span className="gov-kpi-title">ACTIVE JOB OPENINGS</span>
              <div className="gov-kpi-icon-container" aria-hidden="true">
                <Briefcase size={16} />
              </div>
            </div>
            <div className="gov-kpi-val">{stats?.activeJobs ?? 0}</div>
            <div className="gov-kpi-footer">
              <span className="gov-kpi-subtext">
                {stats?.totalJobs ?? 0} Total Listings
              </span>
              <Link to={ROUTES.ADMIN_JOBS} className="gov-kpi-link">
                Moderate →
              </Link>
            </div>
          </div>

          {/* 4. Welfare Schemes */}
          <div className="gov-kpi-block theme-green">
            <div className="gov-kpi-header">
              <span className="gov-kpi-title">WELFARE SCHEMES</span>
              <div className="gov-kpi-icon-container" aria-hidden="true">
                <Award size={16} />
              </div>
            </div>
            <div className="gov-kpi-val">{stats?.schemes ?? 0}</div>
            <div className="gov-kpi-footer">
              <span className="gov-kpi-subtext">
                {stats?.activeSchemes ?? 0} Active Schemes
              </span>
              <Link to={ROUTES.ADMIN_SCHEMES} className="gov-kpi-link">
                Configure →
              </Link>
            </div>
          </div>

          {/* 5. Scheme Applications */}
          <div className="gov-kpi-block theme-blue">
            <div className="gov-kpi-header">
              <span className="gov-kpi-title">SCHEME APPLICATIONS</span>
              <div className="gov-kpi-icon-container" aria-hidden="true">
                <FileText size={16} />
              </div>
            </div>
            <div className="gov-kpi-val">{stats?.schemeApplications ?? 0}</div>
            <div className="gov-kpi-footer">
              <span className="gov-kpi-subtext">Welfare Claims</span>
              <Link to={ROUTES.ADMIN_SCHEME_APPLICATIONS} className="gov-kpi-link">
                Review →
              </Link>
            </div>
          </div>

          {/* 6. Job Applications */}
          <div className="gov-kpi-block theme-blue">
            <div className="gov-kpi-header">
              <span className="gov-kpi-title">JOB APPLICATIONS</span>
              <div className="gov-kpi-icon-container" aria-hidden="true">
                <Briefcase size={16} />
              </div>
            </div>
            <div className="gov-kpi-val">{stats?.jobApplications ?? 0}</div>
            <div className="gov-kpi-footer">
              <span className="gov-kpi-subtext">Recruitment Pipelines</span>
              <Link to={ROUTES.ADMIN_JOB_APPLICATIONS} className="gov-kpi-link">
                Monitor →
              </Link>
            </div>
          </div>

          {/* 7. Approved Applications */}
          <div className="gov-kpi-block theme-green">
            <div className="gov-kpi-header">
              <span className="gov-kpi-title">APPROVED APPLICATIONS</span>
              <div className="gov-kpi-icon-container" aria-hidden="true">
                <CheckCircle size={16} />
              </div>
            </div>
            <div className="gov-kpi-val">{stats?.approvedApplications ?? 0}</div>
            <div className="gov-kpi-footer">
              <span className="gov-kpi-subtext status-green">
                Disbursed / Selected
              </span>
              <Link to={ROUTES.ADMIN_ANALYTICS} className="gov-kpi-link">
                Analytics →
              </Link>
            </div>
          </div>

          {/* 8. Rejected / Non-Eligible */}
          <div className="gov-kpi-block theme-red">
            <div className="gov-kpi-header">
              <span className="gov-kpi-title">REJECTED / NON-ELIGIBLE</span>
              <div className="gov-kpi-icon-container" aria-hidden="true">
                <XCircle size={16} />
              </div>
            </div>
            <div className="gov-kpi-val">{stats?.rejectedApplications ?? 0}</div>
            <div className="gov-kpi-footer">
              <span className="gov-kpi-subtext status-red">
                Claims & Job Matches
              </span>
              <Link to={ROUTES.ADMIN_REPORTS} className="gov-kpi-link">
                Reports →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================
          4. OPERATIONAL SECTION (QUICK ACTIONS)
          ================================================================== */}
      <section className="gov-operations-section" aria-label="Administrative Actions">
        <div className="gov-section-header">
          <h2 className="gov-section-title">QUICK OPERATIONAL ACTIONS</h2>
          <span className="gov-section-meta">Administrative Shortcuts & Workflows</span>
        </div>

        <div className="gov-actions-toolbar">
          <Link to={ROUTES.ADMIN_VETERANS} className="gov-action-tile">
            <Users size={16} className="tile-icon" aria-hidden="true" />
            <div className="tile-content">
              <span className="tile-title">Verify Veterans</span>
              <span className="tile-sub">Service record verification</span>
            </div>
          </Link>

          <Link to={ROUTES.ADMIN_EMPLOYERS} className="gov-action-tile">
            <Building2 size={16} className="tile-icon" aria-hidden="true" />
            <div className="tile-content">
              <span className="tile-title">Verify Employers</span>
              <span className="tile-sub">Corporate partner validation</span>
            </div>
          </Link>

          <Link to={ROUTES.ADMIN_DOCUMENTS} className="gov-action-tile">
            <FileCheck2 size={16} className="tile-icon" aria-hidden="true" />
            <div className="tile-content">
              <span className="tile-title">Review Documents</span>
              <span className="tile-sub">ID & pension certification</span>
            </div>
          </Link>

          <Link to={ROUTES.ADMIN_SCHEME_APPLICATIONS} className="gov-action-tile">
            <FileText size={16} className="tile-icon" aria-hidden="true" />
            <div className="tile-content">
              <span className="tile-title">Review Scheme Applications</span>
              <span className="tile-sub">Welfare claim adjudication</span>
            </div>
          </Link>

          <Link to={ROUTES.ADMIN_JOBS} className="gov-action-tile">
            <Briefcase size={16} className="tile-icon" aria-hidden="true" />
            <div className="tile-content">
              <span className="tile-title">Moderate Job Listings</span>
              <span className="tile-sub">Job opening approvals</span>
            </div>
          </Link>

          <Link to={ROUTES.ADMIN_REPORTS} className="gov-action-tile">
            <FileSpreadsheet size={16} className="tile-icon" aria-hidden="true" />
            <div className="tile-content">
              <span className="tile-title">View Reports</span>
              <span className="tile-sub">Audit & statistical exports</span>
            </div>
          </Link>

          <Link to={ROUTES.ADMIN_SCHEME_CREATE} className="gov-action-tile highlight">
            <PlusCircle size={16} className="tile-icon" aria-hidden="true" />
            <div className="tile-content">
              <span className="tile-title">Add New Scheme</span>
              <span className="tile-sub">Publish welfare assistance</span>
            </div>
          </Link>
        </div>
      </section>

      {/* ==================================================================
          5. RECENT ACTIVITY (INSTITUTIONAL AUDIT & LOGS)
          ================================================================== */}
      <section className="gov-activity-section" aria-label="Recent Portal Activity">
        <div className="gov-section-header">
          <h2 className="gov-section-title">RECENT PORTAL ACTIVITY</h2>
          <span className="gov-section-meta">Official Real-Time Operational Log</span>
        </div>

        <div className="gov-activity-grid">
          {/* Recent Veteran Registrations Table */}
          <div className="gov-activity-card">
            <div className="gov-activity-card-header">
              <div className="card-header-left">
                <Users size={16} className="card-header-icon" aria-hidden="true" />
                <h3 className="card-header-title">Recent Veteran Registrations</h3>
              </div>
              <Link to={ROUTES.ADMIN_VETERANS} className="gov-view-all-link">
                <span>View All ({stats?.veterans ?? 0})</span>
                <ArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>

            <div className="gov-activity-body">
              {!stats?.recentActivity?.veterans || stats.recentActivity.veterans.length === 0 ? (
                <div className="gov-empty-feed">
                  No recent registrations logged in the current audit period.
                </div>
              ) : (
                <div className="gov-records-list">
                  {stats.recentActivity.veterans.map((v) => (
                    <div key={v.id || v._id} className="gov-record-item">
                      <div className="gov-record-main">
                        <div className="record-primary-row">
                          <strong className="record-name">
                            {v.personalInformation?.fullName || v.veteranId || 'Veteran Applicant'}
                          </strong>
                          {v.veteranId && (
                            <span className="gov-id-tag">ID: {v.veteranId}</span>
                          )}
                        </div>
                        <div className="record-secondary-row">
                          <span>{v.serviceInformation?.serviceBranch || 'Armed Forces'}</span>
                          <span className="record-dot" aria-hidden="true">•</span>
                          <span>Rank: {v.serviceInformation?.rank || 'N/A'}</span>
                          <span className="record-dot" aria-hidden="true">•</span>
                          <span className="record-email">{v.personalInformation?.email || v.user?.email || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="gov-record-status">
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Scheme Applications Table */}
          <div className="gov-activity-card">
            <div className="gov-activity-card-header">
              <div className="card-header-left">
                <FileText size={16} className="card-header-icon" aria-hidden="true" />
                <h3 className="card-header-title">Recent Scheme Applications</h3>
              </div>
              <Link to={ROUTES.ADMIN_SCHEME_APPLICATIONS} className="gov-view-all-link">
                <span>View All ({stats?.schemeApplications ?? 0})</span>
                <ArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>

            <div className="gov-activity-body">
              {!stats?.recentActivity?.schemeApplications || stats.recentActivity.schemeApplications.length === 0 ? (
                <div className="gov-empty-feed">
                  No recent scheme applications logged in the current audit period.
                </div>
              ) : (
                <div className="gov-records-list">
                  {stats.recentActivity.schemeApplications.map((a) => (
                    <div key={a.id || a._id} className="gov-record-item">
                      <div className="gov-record-main">
                        <div className="record-primary-row">
                          <strong className="record-name">
                            {a.scheme?.name || 'Welfare Assistance Grant'}
                          </strong>
                          {a.applicationId && (
                            <span className="gov-id-tag">ID: {a.applicationId}</span>
                          )}
                        </div>
                        <div className="record-secondary-row">
                          <span>
                            Applicant: {a.veteran?.personalInformation?.fullName || 'Defense Veteran'}
                          </span>
                          {a.createdAt && (
                            <>
                              <span className="record-dot" aria-hidden="true">•</span>
                              <span className="record-date">
                                <Calendar size={11} aria-hidden="true" />{' '}
                                {new Date(a.createdAt).toLocaleDateString('en-GB')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="gov-record-status">
                        <Badge
                          variant={
                            a.status === 'APPROVED' || a.status === 'DISBURSED'
                              ? 'success'
                              : a.status === 'REJECTED'
                              ? 'danger'
                              : a.status === 'UNDER_REVIEW'
                              ? 'warning'
                              : 'info'
                          }
                        >
                          {a.status?.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
