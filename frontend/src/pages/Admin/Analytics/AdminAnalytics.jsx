import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  Users,
  Building2,
  Award,
  Briefcase,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Sparkles,
  MapPin,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { adminService } from '../../../services/adminService.js';
import { useSocket } from '../../../context/SocketContext.jsx';
import Badge from '../../../components/Badge/Badge.jsx';
import Button from '../../../components/Button/Button.jsx';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner.jsx';
import ErrorMessage from '../../../components/ErrorMessage/ErrorMessage.jsx';
import '../AdminCommon.css';
import './AdminAnalytics.css';

export const AdminAnalytics = () => {
  const { on, off } = useSocket();
  const [period, setPeriod] = useState('30days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustomRange, setShowCustomRange] = useState(false);

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchAnalytics = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const params = { period };
      if (period === 'custom') {
        if (customStart) params.startDate = customStart;
        if (customEnd) params.endDate = customEnd;
      }

      const res = await adminService.getAnalytics(params);
      setAnalytics(res.data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error fetching analytics:', err);
      if (!isSilent) {
        setError(err.message || 'Failed to load analytics');
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [period, customStart, customEnd]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Real-time synchronization when portal operations occur
  useEffect(() => {
    const handleUpdate = () => {
      console.log('[Analytics] Live sync triggered via WebSockets');
      fetchAnalytics(true);
    };

    on('admin:dashboardUpdated', handleUpdate);
    on('admin:verificationUpdated', handleUpdate);
    on('admin:documentUploaded', handleUpdate);
    on('application:statusChanged', handleUpdate);
    on('job:applicationStatusChanged', handleUpdate);

    return () => {
      off('admin:dashboardUpdated', handleUpdate);
      off('admin:verificationUpdated', handleUpdate);
      off('admin:documentUploaded', handleUpdate);
      off('application:statusChanged', handleUpdate);
      off('job:applicationStatusChanged', handleUpdate);
    };
  }, [on, off, fetchAnalytics]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setShowCustomRange(newPeriod === 'custom');
  };

  const handleCustomApply = (e) => {
    e.preventDefault();
    if (customStart && customEnd) {
      fetchAnalytics();
    }
  };

  if (loading && !analytics) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <LoadingSpinner size="lg" message="Aggregating multi-dimensional portal metrics..." />
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div style={{ padding: '2rem' }}>
        <ErrorMessage message={error} onRetry={() => fetchAnalytics()} />
      </div>
    );
  }

  const kpis = analytics?.kpis || {};
  const trends = analytics?.trends || {};
  const distributions = analytics?.distributions || {};

  const veteranTrends = trends.veteranRegistrations || [];
  const employerTrends = trends.employerRegistrations || [];
  const schemeAppTrends = trends.schemeApplications || [];
  const schemeCategories = distributions.schemeCategories || [];
  const jobIndustries = distributions.jobIndustries || [];
  const jobEmploymentTypes = distributions.jobEmploymentTypes || [];
  const applicationsByStatus = distributions.applicationsByStatus || [];
  const topJobLocations = distributions.topJobLocations || [];
  const topVeteranLocations = distributions.topVeteranLocations || [];
  const topEmployerLocations = distributions.topEmployerLocations || [];
  const recentActivity = analytics?.recentActivity || [];

  // Scaling helpers
  const maxTrend = Math.max(
    ...veteranTrends.map((r) => r.count || 0),
    ...employerTrends.map((r) => r.count || 0),
    5
  );
  const maxCategory = Math.max(...schemeCategories.map((c) => c.count || 0), 5);
  const maxIndustry = Math.max(...jobIndustries.map((i) => i.count || 0), 5);
  const maxStatus = Math.max(...applicationsByStatus.map((s) => s.count || 0), 5);

  return (
    <div className="admin-page-container">
      {/* Header & Controls */}
      <div className="admin-page-header">
        <div className="admin-title-group">
          <h1>Portal Analytics & Intelligence</h1>
          <p>
            Real-time database aggregations, registration trends, welfare throughput, and resettlement rates.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="analytics-range-selector">
            <Calendar size={16} color="var(--color-slate-400)" />
            <button
              type="button"
              className={`analytics-range-btn ${period === 'today' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('today')}
            >
              Today
            </button>
            <button
              type="button"
              className={`analytics-range-btn ${period === '7days' || period === '7d' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('7days')}
            >
              7 Days
            </button>
            <button
              type="button"
              className={`analytics-range-btn ${period === '30days' || period === '30d' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('30days')}
            >
              30 Days
            </button>
            <button
              type="button"
              className={`analytics-range-btn ${period === '90days' || period === '3m' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('90days')}
            >
              3 Months
            </button>
            <button
              type="button"
              className={`analytics-range-btn ${period === '180days' || period === '6m' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('180days')}
            >
              6 Months
            </button>
            <button
              type="button"
              className={`analytics-range-btn ${period === '365days' || period === '12m' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('365days')}
            >
              12 Months
            </button>
            <button
              type="button"
              className={`analytics-range-btn ${period === 'all_time' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('all_time')}
            >
              All Time
            </button>
            <button
              type="button"
              className={`analytics-range-btn ${period === 'custom' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('custom')}
            >
              Custom
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={() => fetchAnalytics()}
            title="Refresh Live Data"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Custom Range Picker */}
      {showCustomRange && (
        <form onSubmit={handleCustomApply} className="admin-filter-card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-slate-700)' }}>From:</label>
            <input
              type="date"
              className="admin-select"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-slate-700)' }}>To:</label>
            <input
              type="date"
              className="admin-select"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="primary" size="sm">
            Apply Date Range
          </Button>
        </form>
      )}

      {/* KPI Cards Grid */}
      <div className="analytics-kpi-grid">
        <div className="analytics-kpi-card">
          <div className="analytics-kpi-top">
            <span>Claim Approval Rate</span>
            <CheckCircle size={18} color="#16a34a" />
          </div>
          <div className="analytics-kpi-num">{kpis.schemeApprovalRate ?? 0}%</div>
          <div className="analytics-kpi-sub">
            {kpis.totalCompletedSchemeApps ?? 0} Decided Scheme Claims
          </div>
        </div>

        <div className="analytics-kpi-card">
          <div className="analytics-kpi-top">
            <span>Job Placement Rate</span>
            <Briefcase size={18} color="#9333ea" />
          </div>
          <div className="analytics-kpi-num">
            {kpis.totalCompletedJobApps > 0 ? `${kpis.portalJobPlacementRate}%` : 'N/A'}
          </div>
          <div className="analytics-kpi-sub">
            {kpis.totalCompletedJobApps > 0
              ? `${kpis.totalCompletedJobApps} Completed Recruitments`
              : 'Placement tracking data not yet recorded'}
          </div>
        </div>

        <div className="analytics-kpi-card">
          <div className="analytics-kpi-top">
            <span>Avg Processing Time</span>
            <Clock size={18} color="#0d9488" />
          </div>
          <div className="analytics-kpi-num">
            {kpis.hasProcessingTimeData ? (
              <>
                {kpis.avgProcessingTimeDays} <span style={{ fontSize: '1rem' }}>Days</span>
              </>
            ) : (
              <span style={{ fontSize: '1.25rem', color: 'var(--color-slate-500)' }}>0 Days</span>
            )}
          </div>
          <div className="analytics-kpi-sub">
            {kpis.hasProcessingTimeData
              ? `Fastest: ${kpis.minProcessingTimeDays}d • Slowest: ${kpis.maxProcessingTimeDays}d`
              : 'Submission to adjudication timing'}
          </div>
        </div>

        <div className="analytics-kpi-card">
          <div className="analytics-kpi-top">
            <span>Veterans Registered</span>
            <Users size={18} color="#2563eb" />
          </div>
          <div className="analytics-kpi-num">
            {kpis.totalVeteransInPeriod ?? veteranTrends.reduce((sum, item) => sum + (item.count || 0), 0)}
          </div>
          <div className="analytics-kpi-sub">In selected time frame</div>
        </div>

        <div className="analytics-kpi-card">
          <div className="analytics-kpi-top">
            <span>Employers Registered</span>
            <Building2 size={18} color="#d97706" />
          </div>
          <div className="analytics-kpi-num">
            {kpis.totalEmployersInPeriod ?? employerTrends.reduce((sum, item) => sum + (item.count || 0), 0)}
          </div>
          <div className="analytics-kpi-sub">In selected time frame</div>
        </div>
      </div>

      {/* Interactive Charts Grid */}
      <div className="analytics-charts-grid" style={{ marginTop: '1.5rem' }}>
        {/* 1. Applications by Status */}
        <div className="analytics-chart-card">
          <div className="chart-card-header">
            <h3>Applications by Status</h3>
            <Badge variant="primary">Workflow Throughput</Badge>
          </div>

          <div className="chart-body">
            {applicationsByStatus.length === 0 ? (
              <div className="chart-empty">No application activity recorded in this period.</div>
            ) : (
              <div className="horizontal-bar-list">
                {applicationsByStatus.map((item, idx) => {
                  const pct = Math.round((item.count / maxStatus) * 100);
                  return (
                    <div key={idx} className="horizontal-bar-item">
                      <div className="horizontal-bar-label-row">
                        <strong style={{ textTransform: 'capitalize' }}>{item.status}</strong>
                        <span>{item.count} Applications</span>
                      </div>
                      <div className="horizontal-bar-track">
                        <div
                          className="horizontal-bar-fill"
                          style={{
                            width: `${pct}%`,
                            background:
                              item.status.includes('approved') || item.status.includes('disbursed') || item.status.includes('selected')
                                ? '#16a34a'
                                : item.status.includes('rejected')
                                ? '#dc2626'
                                : item.status.includes('review') || item.status.includes('verification')
                                ? '#d97706'
                                : '#2563eb',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 2. Registrations Over Time (Veterans & Employers) */}
        <div className="analytics-chart-card">
          <div className="chart-card-header">
            <h3>Registrations Over Time</h3>
            <div className="chart-legend">
              <span className="legend-item"><span className="legend-dot dot-blue" /> Veterans</span>
              <span className="legend-item"><span className="legend-dot dot-gold" /> Employers</span>
            </div>
          </div>

          <div className="chart-body">
            {veteranTrends.length === 0 && employerTrends.length === 0 ? (
              <div className="chart-empty">No registration records found for this period.</div>
            ) : (
              <div className="bar-chart-container">
                {veteranTrends.map((item, idx) => {
                  const empMatch = employerTrends.find((e) => e._id === item._id);
                  const empCount = empMatch ? empMatch.count : 0;
                  return (
                    <div key={idx} className="bar-column">
                      <div className="bar-bars-wrapper">
                        <div
                          className="bar-fill bar-blue"
                          style={{ height: `${Math.max((item.count / maxTrend) * 150, 8)}px` }}
                          title={`Veterans: ${item.count} on ${item._id}`}
                        />
                        <div
                          className="bar-fill bar-gold"
                          style={{ height: `${Math.max((empCount / maxTrend) * 150, 4)}px` }}
                          title={`Employers: ${empCount} on ${item._id}`}
                        />
                      </div>
                      <span className="bar-label">{item._id?.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 3. Scheme Claims by Welfare Category */}
        <div className="analytics-chart-card">
          <div className="chart-card-header">
            <h3>Scheme Claims by Welfare Category</h3>
            <Badge variant="neutral">Categories</Badge>
          </div>

          <div className="chart-body">
            {schemeCategories.length === 0 ? (
              <div className="chart-empty">No welfare category distribution available.</div>
            ) : (
              <div className="horizontal-bar-list">
                {schemeCategories.map((cat, idx) => {
                  const percentage = Math.round((cat.count / maxCategory) * 100);
                  return (
                    <div key={idx} className="horizontal-bar-item">
                      <div className="horizontal-bar-label-row">
                        <strong>{cat.category}</strong>
                        <span>{cat.count} Schemes</span>
                      </div>
                      <div className="horizontal-bar-track">
                        <div className="horizontal-bar-fill" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 4. Corporate Job Vacancies by Industry */}
        <div className="analytics-chart-card">
          <div className="chart-card-header">
            <h3>Job Vacancies by Industry & Work Type</h3>
            <Badge variant="neutral">Recruitment</Badge>
          </div>

          <div className="chart-body">
            {jobIndustries.length === 0 ? (
              <div className="chart-empty">No corporate vacancy breakdown available.</div>
            ) : (
              <div className="horizontal-bar-list">
                {jobIndustries.map((ind, idx) => {
                  const percentage = Math.round((ind.count / maxIndustry) * 100);
                  return (
                    <div key={idx} className="horizontal-bar-item">
                      <div className="horizontal-bar-label-row">
                        <strong>{ind.industry}</strong>
                        <span>{ind.count} Openings</span>
                      </div>
                      <div className="horizontal-bar-track">
                        <div
                          className="horizontal-bar-fill"
                          style={{
                            width: `${percentage}%`,
                            background: 'linear-gradient(90deg, #9333ea 0%, #a855f7 100%)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 5. Top Resettlement & Job Locations */}
        <div className="analytics-chart-card">
          <div className="chart-card-header">
            <h3>Top Job & Veteran Hub Locations</h3>
            <MapPin size={16} color="var(--color-primary-800)" />
          </div>

          <div className="chart-body">
            {topJobLocations.length === 0 && topVeteranLocations.length === 0 ? (
              <div className="chart-empty">No geographical location data available.</div>
            ) : (
              <div className="branch-grid">
                {topJobLocations.slice(0, 4).map((loc, idx) => (
                  <div key={idx} className="branch-stat-item">
                    <div className="branch-stat-name">{loc.location}</div>
                    <div className="branch-stat-count">{loc.count}</div>
                    <div className="branch-stat-sub">Active Job Postings</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 6. Recent Administrative Audit Stream */}
        <div className="analytics-chart-card">
          <div className="chart-card-header">
            <h3>Recent Administrative Operations</h3>
            <Badge variant="neutral">Audit Trail</Badge>
          </div>

          <div className="chart-body">
            {recentActivity.length === 0 ? (
              <div className="chart-empty">No audit events recorded in this period.</div>
            ) : (
              <div className="status-dist-list">
                {recentActivity.slice(0, 6).map((log, idx) => (
                  <div key={log._id || idx} className="status-dist-item">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-slate-900)' }}>
                        {log.action?.replace(/_/g, ' ')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                        {log.description || 'System operation executed.'}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-slate-400)', textAlign: 'right' }}>
                      {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : 'Recent'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
