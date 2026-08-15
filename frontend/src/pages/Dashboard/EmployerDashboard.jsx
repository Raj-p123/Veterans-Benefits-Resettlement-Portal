import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Users,
  PlusCircle,
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserCheck,
  ChevronRight,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { SOCKET_EVENTS } from '../../constants/socketEvents.js';
import employerService from '../../services/employerService';
import Badge from '../../components/Badge/Badge.jsx';
import Button from '../../components/Button/Button.jsx';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner.jsx';
import './Dashboard.css';

export const EmployerDashboard = () => {
  const { user } = useAuth();
  const { on, off } = useSocket();
  const [stats, setStats] = useState({
    activeJobs: 0,
    draftJobs: 0,
    totalJobs: 0,
    totalApplicants: 0,
    underReview: 0,
    shortlisted: 0,
    interview: 0,
    selected: 0,
    recentApplications: [],
    recentJobs: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await employerService.getDashboardStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load employer dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Real-time dashboard update listener
  useEffect(() => {
    const handleDashboardUpdate = () => {
      fetchStats();
    };

    on(SOCKET_EVENTS.DASHBOARD_UPDATED, handleDashboardUpdate);
    on(SOCKET_EVENTS.JOB_APPLICATION_CREATED, handleDashboardUpdate);

    return () => {
      off(SOCKET_EVENTS.DASHBOARD_UPDATED, handleDashboardUpdate);
      off(SOCKET_EVENTS.JOB_APPLICATION_CREATED, handleDashboardUpdate);
    };
  }, [on, off, fetchStats]);

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <LoadingSpinner size="lg" text="Loading corporate recruitment dashboard..." />
      </div>
    );
  }

  return (
    <div className="veteran-dashboard-page">
      {/* 1. Header Greeting */}
      <div className="dashboard-welcome-header">
        <div className="welcome-title-group">
          <h1>Corporate Talent Acquisition 👋</h1>
          <p>Manage defense veteran job postings, candidate pipelines, and interviews.</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/employer/jobs/create">
            <Button variant="primary" size="sm" icon={PlusCircle}>
              Post New Job
            </Button>
          </Link>
          <Link to="/employer/profile">
            <Button variant="secondary" size="sm" icon={Building2}>
              Company Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Four Statistics Cards */}
      <div className="dashboard-stats-grid">
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Active Jobs</span>
            <div className="stat-icon-wrapper icon-blue">
              <Briefcase size={18} />
            </div>
          </div>
          <div className="stat-value">{stats.activeJobs}</div>
          <Link to="/employer/jobs" className="stat-action-link">
            Manage Postings →
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Total Applicants</span>
            <div className="stat-icon-wrapper icon-green">
              <Users size={18} />
            </div>
          </div>
          <div className="stat-value">{stats.totalApplicants}</div>
          <Link to="/employer/jobs" className="stat-action-link">
            Review Pipeline →
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Shortlisted</span>
            <div className="stat-icon-wrapper icon-purple">
              <Clock size={18} />
            </div>
          </div>
          <div className="stat-value">{stats.shortlisted}</div>
          <Link to="/employer/jobs" className="stat-action-link">
            Schedule Interviews →
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Selected</span>
            <div className="stat-icon-wrapper icon-amber">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="stat-value">{stats.selected}</div>
          <Link to="/employer/jobs" className="stat-action-link">
            View Hired Veterans →
          </Link>
        </div>
      </div>

      {/* 3. Recent Applications Table */}
      <div className="dashboard-section">
        <div className="section-header-row">
          <h2>Recent Candidate Applications</h2>
          <Link to="/employer/jobs" className="section-view-all">
            View All Applications →
          </Link>
        </div>

        <div className="app-status-card" style={{ padding: 0, overflow: 'hidden' }}>
          {stats.recentApplications && stats.recentApplications.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-bg-canvas)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Candidate Name</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Role Applied</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Match Score</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Status</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentApplications.map((app) => (
                    <tr key={app._id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-main)' }}>
                        {app.veteran?.personalInformation?.fullName || 'Defense Candidate'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)' }}>
                        {app.job?.title || 'Job Opening'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: '#047857', backgroundColor: '#ECFDF5', padding: '2px 8px', borderRadius: '9999px' }}>
                          {app.matchScore}% Match
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge variant={app.status === 'SELECTED' ? 'success' : app.status === 'SHORTLISTED' ? 'warning' : 'neutral'}>
                          {app.status}
                        </Badge>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <Link to={`/employer/applications/${app._id}`}>
                          <Button variant="secondary" size="xs">
                            Review
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              No candidates have applied yet. Post new vacancies to attract qualified veterans.
            </div>
          )}
        </div>
      </div>

      {/* 4. Active Job Postings List */}
      <div className="dashboard-section">
        <div className="section-header-row">
          <h2>Active Job Openings</h2>
          <Link to="/employer/jobs" className="section-view-all">
            Manage All Jobs →
          </Link>
        </div>

        <div className="latest-jobs-list">
          {stats.recentJobs && stats.recentJobs.length > 0 ? (
            stats.recentJobs.map((job) => (
              <div key={job._id} className="job-row-card">
                <div className="job-row-left">
                  <div className="job-row-icon">
                    <Briefcase size={20} />
                  </div>
                  <div className="job-row-details">
                    <h3 className="job-row-title">{job.title}</h3>
                    <div className="job-row-meta">
                      <span>{job.city}, {job.state}</span>
                      <span className="meta-dot">•</span>
                      <span>{job.employmentType}</span>
                      <span className="meta-dot">•</span>
                      <Badge variant={job.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="job-row-right">
                  <div className="job-row-compensation">
                    <span className="job-salary">{job.applicantCount || 0} Candidates</span>
                  </div>
                  <Link to={`/employer/jobs/${job._id}/applicants`}>
                    <Button variant="primary" size="sm">
                      View Applicants
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '2rem', backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                You have no active job postings.
              </p>
              <Link to="/employer/jobs/create">
                <Button variant="primary" size="sm" icon={PlusCircle}>
                  Create Job Posting
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;
