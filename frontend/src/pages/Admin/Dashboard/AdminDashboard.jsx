import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  Briefcase,
  Award,
  FileText,
  FileCheck2,
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  ExternalLink,
  RefreshCw,
  PlusCircle,
  Sparkles,
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
      <div className="admin-page-loading">
        <LoadingSpinner size="lg" text="Loading administrative dashboard metrics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page-error">
        <ErrorMessage message={error} onRetry={() => fetchStats()} />
      </div>
    );
  }

  const pending = stats?.pendingBreakdown || { veterans: 0, employers: 0, documents: 0 };
  const totalPending = (stats?.pendingVerifications || 0);

  return (
    <div className="admin-dashboard-page">
      {/* Page Header */}
      <div className="admin-header-row">
        <div>
          <h1 className="admin-page-title">Administrator Command Center</h1>
          <p className="admin-page-subtitle">
            Live portal governance, verification pipelines, welfare administration, and operational metrics.
          </p>
        </div>
        <div className="admin-header-actions">
          <div className={`admin-live-badge ${livePulse ? 'pulsing' : ''}`}>
            <span className="live-dot" />
            <span>Live Sync Active</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={() => fetchStats()}
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Actionable Pending Verification Alert */}
      {totalPending > 0 && (
        <div className="admin-alert-banner">
          <div className="admin-alert-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="admin-alert-content">
            <h3>{totalPending} Action Items Pending Departmental Review</h3>
            <p>
              There are <strong>{pending.veterans}</strong> veteran profiles,{' '}
              <strong>{pending.employers}</strong> employer registrations, and{' '}
              <strong>{pending.documents}</strong> supporting documents awaiting official scrutiny.
            </p>
          </div>
          <div className="admin-alert-links">
            {pending.veterans > 0 && (
              <Link to={`${ROUTES.ADMIN_VETERANS}?verificationStatus=PENDING`} className="admin-alert-btn">
                Verify Veterans ({pending.veterans})
              </Link>
            )}
            {pending.employers > 0 && (
              <Link to={`${ROUTES.ADMIN_EMPLOYERS}?verificationStatus=PENDING`} className="admin-alert-btn">
                Verify Employers ({pending.employers})
              </Link>
            )}
            {pending.documents > 0 && (
              <Link to={`${ROUTES.ADMIN_DOCUMENTS}?verificationStatus=UPLOADED`} className="admin-alert-btn">
                Review Documents ({pending.documents})
              </Link>
            )}
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="admin-stats-grid">
        {/* Total Veterans */}
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Total Veterans</span>
            <div className="admin-stat-icon-wrap icon-blue">
              <Users size={20} />
            </div>
          </div>
          <div className="admin-stat-number">{stats?.veterans || 0}</div>
          <div className="admin-stat-bottom">
            <span className="admin-stat-pill pill-warning">
              {pending.veterans} Pending Verification
            </span>
            <Link to={ROUTES.ADMIN_VETERANS} className="admin-stat-link">
              Manage <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Total Employers */}
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Corporate Employers</span>
            <div className="admin-stat-icon-wrap icon-gold">
              <Building2 size={20} />
            </div>
          </div>
          <div className="admin-stat-number">{stats?.employers || 0}</div>
          <div className="admin-stat-bottom">
            <span className="admin-stat-pill pill-warning">
              {pending.employers} Pending
            </span>
            <Link to={ROUTES.ADMIN_EMPLOYERS} className="admin-stat-link">
              Manage <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Active Jobs */}
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Active Job Openings</span>
            <div className="admin-stat-icon-wrap icon-purple">
              <Briefcase size={20} />
            </div>
          </div>
          <div className="admin-stat-number">{stats?.activeJobs || 0}</div>
          <div className="admin-stat-bottom">
            <span className="admin-stat-meta">{stats?.totalJobs || 0} Total Listings</span>
            <Link to={ROUTES.ADMIN_JOBS} className="admin-stat-link">
              Moderate <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Total Schemes */}
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Welfare Schemes</span>
            <div className="admin-stat-icon-wrap icon-green">
              <Award size={20} />
            </div>
          </div>
          <div className="admin-stat-number">{stats?.schemes || 0}</div>
          <div className="admin-stat-bottom">
            <span className="admin-stat-meta">{stats?.activeSchemes || 0} Active Schemes</span>
            <Link to={ROUTES.ADMIN_SCHEMES} className="admin-stat-link">
              Configure <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Scheme Applications */}
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Scheme Applications</span>
            <div className="admin-stat-icon-wrap icon-teal">
              <FileText size={20} />
            </div>
          </div>
          <div className="admin-stat-number">{stats?.schemeApplications || 0}</div>
          <div className="admin-stat-bottom">
            <span className="admin-stat-meta">Welfare Claims</span>
            <Link to={ROUTES.ADMIN_SCHEME_APPLICATIONS} className="admin-stat-link">
              Review <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Job Applications */}
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Job Applications</span>
            <div className="admin-stat-icon-wrap icon-indigo">
              <Briefcase size={20} />
            </div>
          </div>
          <div className="admin-stat-number">{stats?.jobApplications || 0}</div>
          <div className="admin-stat-bottom">
            <span className="admin-stat-meta">Recruitment Pipelines</span>
            <Link to={ROUTES.ADMIN_JOB_APPLICATIONS} className="admin-stat-link">
              Monitor <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Approved Applications */}
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Approved Applications</span>
            <div className="admin-stat-icon-wrap icon-emerald">
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="admin-stat-number">{stats?.approvedApplications || 0}</div>
          <div className="admin-stat-bottom">
            <span className="admin-stat-pill pill-success">Disbursed / Selected</span>
            <Link to={ROUTES.ADMIN_ANALYTICS} className="admin-stat-link">
              Analytics <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Rejected Applications */}
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">Rejected / Non-Eligible</span>
            <div className="admin-stat-icon-wrap icon-rose">
              <XCircle size={20} />
            </div>
          </div>
          <div className="admin-stat-number">{stats?.rejectedApplications || 0}</div>
          <div className="admin-stat-bottom">
            <span className="admin-stat-meta">Claims & Job Matches</span>
            <Link to={ROUTES.ADMIN_ANALYTICS} className="admin-stat-link">
              Reports <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="admin-quick-actions-bar">
        <h3 className="admin-section-title">Quick Operational Actions</h3>
        <div className="admin-quick-buttons">
          <Link to={ROUTES.ADMIN_SCHEME_CREATE}>
            <Button variant="primary" size="sm" icon={PlusCircle}>
              Add New Scheme
            </Button>
          </Link>
          <Link to={ROUTES.ADMIN_VETERANS}>
            <Button variant="secondary" size="sm" icon={Users}>
              Verify Veteran Records
            </Button>
          </Link>
          <Link to={ROUTES.ADMIN_DOCUMENTS}>
            <Button variant="secondary" size="sm" icon={FileCheck2}>
              Scrutinize Documents
            </Button>
          </Link>
          <Link to={ROUTES.ADMIN_REPORTS}>
            <Button variant="secondary" size="sm" icon={FileText}>
              Generate CSV Reports
            </Button>
          </Link>
          <Link to={ROUTES.ADMIN_ANALYTICS}>
            <Button variant="secondary" size="sm" icon={TrendingUp}>
              View Analytics & Trends
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Activity Feeds Grid */}
      <div className="admin-feeds-grid">
        {/* Recent Veteran Registrations */}
        <div className="admin-feed-card">
          <div className="admin-feed-header">
            <h3>Recent Veteran Registrations</h3>
            <Link to={ROUTES.ADMIN_VETERANS} className="admin-feed-link">
              View All ({stats?.veterans || 0})
            </Link>
          </div>
          <div className="admin-feed-list">
            {!stats?.recentActivity?.veterans || stats.recentActivity.veterans.length === 0 ? (
              <div className="admin-feed-empty">No recent registrations found.</div>
            ) : (
              stats.recentActivity.veterans.map((v) => (
                <div key={v.id} className="admin-feed-item">
                  <div className="admin-feed-item-info">
                    <strong>{v.personalInformation?.fullName || v.veteranId}</strong>
                    <span>
                      {v.serviceInformation?.serviceBranch || 'Defense'} • Rank: {v.serviceInformation?.rank || 'N/A'} • {v.personalInformation?.email || v.user?.email}
                    </span>
                  </div>
                  <div className="admin-feed-item-badge">
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
              ))
            )}
          </div>
        </div>

        {/* Recent Scheme Applications */}
        <div className="admin-feed-card">
          <div className="admin-feed-header">
            <h3>Recent Scheme Applications</h3>
            <Link to={ROUTES.ADMIN_SCHEME_APPLICATIONS} className="admin-feed-link">
              View All ({stats?.schemeApplications || 0})
            </Link>
          </div>
          <div className="admin-feed-list">
            {!stats?.recentActivity?.schemeApplications || stats.recentActivity.schemeApplications.length === 0 ? (
              <div className="admin-feed-empty">No recent scheme claims submitted.</div>
            ) : (
              stats.recentActivity.schemeApplications.map((a) => (
                <div key={a.id} className="admin-feed-item">
                  <div className="admin-feed-item-info">
                    <strong>{a.scheme?.name || 'Welfare Scheme'}</strong>
                    <span>
                      Applicant: {a.veteran?.personalInformation?.fullName || 'Veteran'} • ID: {a.applicationId}
                    </span>
                  </div>
                  <div className="admin-feed-item-badge">
                    <Badge
                      variant={
                        a.status === 'APPROVED'
                          ? 'success'
                          : a.status === 'REJECTED'
                          ? 'danger'
                          : a.status === 'UNDER_REVIEW'
                          ? 'warning'
                          : 'info'
                      }
                    >
                      {a.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
