import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  Briefcase,
  Award,
  FileText,
  FileCheck2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  FileSpreadsheet,
  BarChart3,
  Calendar,
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
  const totalPending = stats?.pendingVerifications ?? (pending.veterans + pending.employers + pending.documents);

  // Consolidate real activity data into a unified chronological array
  const activityRows = [];
  if (Array.isArray(stats?.recentActivity?.veterans)) {
    stats.recentActivity.veterans.forEach((v) => {
      activityRows.push({
        id: `vet-${v.id || v._id || v.veteranId}`,
        activity: `Veteran profile verification submitted (${v.personalInformation?.fullName || 'Veteran Profile'})`,
        referenceId: v.veteranId || ('VET-' + (v._id || v.id || '').slice(-6).toUpperCase()),
        time: v.createdAt ? new Date(v.createdAt).toLocaleDateString('en-GB') : 'Recent',
        status: v.verificationStatus || 'PENDING',
        timestamp: v.createdAt ? new Date(v.createdAt).getTime() : 0,
      });
    });
  }

  if (Array.isArray(stats?.recentActivity?.schemeApplications)) {
    stats.recentActivity.schemeApplications.forEach((a) => {
      activityRows.push({
        id: `app-${a.id || a._id || a.applicationId}`,
        activity: `Welfare scheme application submitted (${a.scheme?.name || 'Welfare Assistance'})`,
        referenceId: a.applicationId || ('SCH-' + (a._id || a.id || '').slice(-6).toUpperCase()),
        time: a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-GB') : 'Recent',
        status: a.status || 'UNDER_REVIEW',
        timestamp: a.createdAt ? new Date(a.createdAt).getTime() : 0,
      });
    });
  }

  // Sort descending by timestamp
  activityRows.sort((x, y) => y.timestamp - x.timestamp);

  return (
    <div className="admin-gov-dashboard-container">
      {/* ==================================================================
          3. MAIN HEADER AREA
          ================================================================== */}
      <section className="gov-main-header-panel" aria-label="Administrator Command Center Heading">
        <div className="gov-header-content">
          <h1 className="gov-title-main">Administrator Command Center</h1>
          <p className="gov-subtitle-main">
            Central administrative dashboard for veteran verification, welfare schemes, employment services and portal operations.
          </p>
        </div>

        <div className="gov-header-controls">
          <div className={`gov-status-pill ${livePulse ? 'pulsing' : ''}`}>
            <span className="gov-status-dot" aria-hidden="true" />
            <div className="gov-status-text-stack">
              <span className="gov-status-live">Live Sync Active</span>
              <span className="gov-status-sub">All systems operational</span>
            </div>
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
          4. PENDING REVIEW PANEL (THREE STRUCTURED COLUMNS)
          ================================================================== */}
      <section className="gov-pending-review-banner" aria-label="Action Items Pending Departmental Review">
        <div className="gov-banner-heading-wrap">
          <AlertTriangle size={18} className="gov-banner-lead-icon" aria-hidden="true" />
          <h2 className="gov-banner-title">Action Items Pending Departmental Review</h2>
        </div>

        <div className="gov-pending-three-columns">
          {/* Column 1: Pending Veteran Verification */}
          <div className="gov-pending-col">
            <div className="gov-pending-metric-row">
              <span className="gov-pending-number">{pending.veterans}</span>
              <span className="gov-pending-desc">Pending Veteran Verification</span>
            </div>
            <Link
              to={`${ROUTES.ADMIN_VETERANS}?verificationStatus=PENDING`}
              className="gov-pending-action-link"
            >
              Verify Veterans →
            </Link>
          </div>

          {/* Column 2: Pending Employer Verification */}
          <div className="gov-pending-col">
            <div className="gov-pending-metric-row">
              <span className="gov-pending-number">{pending.employers}</span>
              <span className="gov-pending-desc">Pending Employer Verification</span>
            </div>
            <Link
              to={`${ROUTES.ADMIN_EMPLOYERS}?verificationStatus=PENDING`}
              className="gov-pending-action-link"
            >
              Verify Employers →
            </Link>
          </div>

          {/* Column 3: Pending Document Review */}
          <div className="gov-pending-col">
            <div className="gov-pending-metric-row">
              <span className="gov-pending-number">{pending.documents}</span>
              <span className="gov-pending-desc">Pending Document Review</span>
            </div>
            <Link
              to={`${ROUTES.ADMIN_DOCUMENTS}?verificationStatus=UPLOADED`}
              className="gov-pending-action-link"
            >
              Review Documents →
            </Link>
          </div>
        </div>
      </section>

      {/* ==================================================================
          5. PORTAL OVERVIEW (8 STRUCTURED METRIC CARDS)
          ================================================================== */}
      <section className="gov-overview-section" aria-label="Portal Overview">
        <div className="gov-section-bar">
          <h2 className="gov-section-heading">PORTAL OVERVIEW</h2>
        </div>

        <div className="gov-overview-grid">
          {/* Card 1: Total Veterans */}
          <div className="gov-overview-card">
            <div className="gov-card-top">
              <span className="gov-card-label">Total Veterans</span>
              <div className="gov-card-icon-box icon-navy" aria-hidden="true">
                <Users size={16} />
              </div>
            </div>
            <div className="gov-card-metric">{stats?.veterans ?? 0}</div>
            <div className="gov-card-bottom">
              <span className="gov-card-subtext">{pending.veterans} Pending Verification</span>
              <Link to={ROUTES.ADMIN_VETERANS} className="gov-card-link">
                Manage →
              </Link>
            </div>
          </div>

          {/* Card 2: Corporate Employers */}
          <div className="gov-overview-card">
            <div className="gov-card-top">
              <span className="gov-card-label">Corporate Employers</span>
              <div className="gov-card-icon-box icon-navy" aria-hidden="true">
                <Building2 size={16} />
              </div>
            </div>
            <div className="gov-card-metric">{stats?.employers ?? 0}</div>
            <div className="gov-card-bottom">
              <span className="gov-card-subtext">{pending.employers} Pending</span>
              <Link to={ROUTES.ADMIN_EMPLOYERS} className="gov-card-link">
                Manage →
              </Link>
            </div>
          </div>

          {/* Card 3: Active Job Openings */}
          <div className="gov-overview-card">
            <div className="gov-card-top">
              <span className="gov-card-label">Active Job Openings</span>
              <div className="gov-card-icon-box icon-navy" aria-hidden="true">
                <Briefcase size={16} />
              </div>
            </div>
            <div className="gov-card-metric">{stats?.activeJobs ?? 0}</div>
            <div className="gov-card-bottom">
              <span className="gov-card-subtext">{stats?.totalJobs ?? 0} Total Listings</span>
              <Link to={ROUTES.ADMIN_JOBS} className="gov-card-link">
                Moderate →
              </Link>
            </div>
          </div>

          {/* Card 4: Welfare Schemes */}
          <div className="gov-overview-card">
            <div className="gov-card-top">
              <span className="gov-card-label">Welfare Schemes</span>
              <div className="gov-card-icon-box icon-navy" aria-hidden="true">
                <Award size={16} />
              </div>
            </div>
            <div className="gov-card-metric">{stats?.schemes ?? 0}</div>
            <div className="gov-card-bottom">
              <span className="gov-card-subtext">{stats?.activeSchemes ?? 0} Active Schemes</span>
              <Link to={ROUTES.ADMIN_SCHEMES} className="gov-card-link">
                Configure →
              </Link>
            </div>
          </div>

          {/* Card 5: Scheme Applications */}
          <div className="gov-overview-card">
            <div className="gov-card-top">
              <span className="gov-card-label">Scheme Applications</span>
              <div className="gov-card-icon-box icon-navy" aria-hidden="true">
                <FileText size={16} />
              </div>
            </div>
            <div className="gov-card-metric">{stats?.schemeApplications ?? 0}</div>
            <div className="gov-card-bottom">
              <span className="gov-card-subtext">Welfare Claims</span>
              <Link to={ROUTES.ADMIN_SCHEME_APPLICATIONS} className="gov-card-link">
                Review →
              </Link>
            </div>
          </div>

          {/* Card 6: Job Applications */}
          <div className="gov-overview-card">
            <div className="gov-card-top">
              <span className="gov-card-label">Job Applications</span>
              <div className="gov-card-icon-box icon-navy" aria-hidden="true">
                <Briefcase size={16} />
              </div>
            </div>
            <div className="gov-card-metric">{stats?.jobApplications ?? 0}</div>
            <div className="gov-card-bottom">
              <span className="gov-card-subtext">Recruitment Pipelines</span>
              <Link to={ROUTES.ADMIN_JOB_APPLICATIONS} className="gov-card-link">
                Monitor →
              </Link>
            </div>
          </div>

          {/* Card 7: Approved Applications */}
          <div className="gov-overview-card">
            <div className="gov-card-top">
              <span className="gov-card-label">Approved Applications</span>
              <div className="gov-card-icon-box icon-green" aria-hidden="true">
                <CheckCircle size={16} />
              </div>
            </div>
            <div className="gov-card-metric">{stats?.approvedApplications ?? 0}</div>
            <div className="gov-card-bottom">
              <span className="gov-card-subtext status-green">Disbursed / Selected</span>
              <Link to={ROUTES.ADMIN_ANALYTICS} className="gov-card-link">
                Analytics →
              </Link>
            </div>
          </div>

          {/* Card 8: Rejected / Non-Eligible */}
          <div className="gov-overview-card">
            <div className="gov-card-top">
              <span className="gov-card-label">Rejected / Non-Eligible</span>
              <div className="gov-card-icon-box icon-red" aria-hidden="true">
                <XCircle size={16} />
              </div>
            </div>
            <div className="gov-card-metric">{stats?.rejectedApplications ?? 0}</div>
            <div className="gov-card-bottom">
              <span className="gov-card-subtext status-red">Claims & Job Matches</span>
              <Link to={ROUTES.ADMIN_REPORTS} className="gov-card-link">
                Reports →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================
          6. QUICK OPERATIONAL ACTIONS (STRUCTURED 2-COLUMN LAYOUT)
          ================================================================== */}
      <section className="gov-actions-section" aria-label="Quick Operational Actions">
        <div className="gov-section-bar">
          <h2 className="gov-section-heading">QUICK OPERATIONAL ACTIONS</h2>
        </div>

        <div className="gov-two-col-action-grid">
          {/* Action 1: Verify Veterans */}
          <Link to={ROUTES.ADMIN_VETERANS} className="gov-action-card">
            <div className="gov-action-icon-cell">
              <Users size={18} aria-hidden="true" />
            </div>
            <div className="gov-action-text-cell">
              <span className="gov-action-title">Verify Veterans</span>
              <span className="gov-action-desc">Review and verify veteran profiles</span>
            </div>
          </Link>

          {/* Action 2: Verify Employers */}
          <Link to={ROUTES.ADMIN_EMPLOYERS} className="gov-action-card">
            <div className="gov-action-icon-cell">
              <Building2 size={18} aria-hidden="true" />
            </div>
            <div className="gov-action-text-cell">
              <span className="gov-action-title">Verify Employers</span>
              <span className="gov-action-desc">Review and verify employer registrations</span>
            </div>
          </Link>

          {/* Action 3: Review Documents */}
          <Link to={ROUTES.ADMIN_DOCUMENTS} className="gov-action-card">
            <div className="gov-action-icon-cell">
              <FileCheck2 size={18} aria-hidden="true" />
            </div>
            <div className="gov-action-text-cell">
              <span className="gov-action-title">Review Documents</span>
              <span className="gov-action-desc">Check and verify supporting documents</span>
            </div>
          </Link>

          {/* Action 4: Review Job Listings */}
          <Link to={ROUTES.ADMIN_JOBS} className="gov-action-card">
            <div className="gov-action-icon-cell">
              <Briefcase size={18} aria-hidden="true" />
            </div>
            <div className="gov-action-text-cell">
              <span className="gov-action-title">Review Job Listings</span>
              <span className="gov-action-desc">Review and moderate job postings</span>
            </div>
          </Link>

          {/* Action 5: Review Scheme Applications */}
          <Link to={ROUTES.ADMIN_SCHEME_APPLICATIONS} className="gov-action-card">
            <div className="gov-action-icon-cell">
              <FileText size={18} aria-hidden="true" />
            </div>
            <div className="gov-action-text-cell">
              <span className="gov-action-title">Review Scheme Applications</span>
              <span className="gov-action-desc">Scrutinize welfare scheme applications</span>
            </div>
          </Link>

          {/* Action 6: View Reports */}
          <Link to={ROUTES.ADMIN_REPORTS} className="gov-action-card">
            <div className="gov-action-icon-cell">
              <FileSpreadsheet size={18} aria-hidden="true" />
            </div>
            <div className="gov-action-text-cell">
              <span className="gov-action-title">View Reports</span>
              <span className="gov-action-desc">Access system reports and export data</span>
            </div>
          </Link>
        </div>
      </section>

      {/* ==================================================================
          7. RECENT PORTAL ACTIVITY (INSTITUTIONAL TABLE)
          ================================================================== */}
      <section className="gov-activity-table-section" aria-label="Recent Portal Activity">
        <div className="gov-section-bar">
          <h2 className="gov-section-heading">RECENT PORTAL ACTIVITY</h2>
        </div>

        <div className="gov-table-wrapper">
          {activityRows.length === 0 ? (
            <div className="gov-table-empty">
              No recent activity records logged in the current audit period.
            </div>
          ) : (
            <table className="gov-data-table">
              <thead>
                <tr>
                  <th scope="col" className="col-activity">Activity</th>
                  <th scope="col" className="col-ref">Reference ID</th>
                  <th scope="col" className="col-time">Time</th>
                  <th scope="col" className="col-status">Status</th>
                </tr>
              </thead>
              <tbody>
                {activityRows.map((row) => (
                  <tr key={row.id}>
                    <td className="col-activity">
                      <span className="activity-title">{row.activity}</span>
                    </td>
                    <td className="col-ref">
                      <span className="ref-tag">{row.referenceId}</span>
                    </td>
                    <td className="col-time">
                      <span className="time-val">
                        <Calendar size={12} className="time-icon" aria-hidden="true" />
                        {row.time}
                      </span>
                    </td>
                    <td className="col-status">
                      <Badge
                        variant={
                          row.status === 'VERIFIED' || row.status === 'APPROVED' || row.status === 'ACTIVE'
                            ? 'success'
                            : row.status === 'REJECTED'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {row.status?.replace('_', ' ')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
