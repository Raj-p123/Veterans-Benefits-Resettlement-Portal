import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Briefcase,
  FileCheck2,
  Bookmark,
  ArrowRight,
  ShieldCheck,
  Building2,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle,
  FileText,
  Search,
  UploadCloud,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { SOCKET_EVENTS } from '../../constants/socketEvents.js';
import { veteranService } from '../../services/veteranService.js';
import { schemeService } from '../../services/schemeService.js';
import { applicationService } from '../../services/applicationService.js';
import jobService from '../../services/jobService.js';
import jobApplicationService from '../../services/jobApplicationService.js';
import Badge from '../../components/Badge/Badge.jsx';
import Button from '../../components/Button/Button.jsx';
import Timeline from '../../components/Timeline/Timeline.jsx';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner.jsx';
import './Dashboard.css';

export const VeteranDashboard = () => {
  const { user } = useAuth();
  const { on, off } = useSocket();

  const [profile, setProfile] = useState(null);
  const [totalSchemesCount, setTotalSchemesCount] = useState(12);
  const [schemeAppsCount, setSchemeAppsCount] = useState(0);
  const [jobAppsCount, setJobAppsCount] = useState(0);
  const [savedJobsCount, setSavedJobsCount] = useState(0);

  const [latestApplication, setLatestApplication] = useState(null);
  const [recommendedScheme, setRecommendedScheme] = useState(null);
  const [recommendedJob, setRecommendedJob] = useState(null);
  const [latestJobs, setLatestJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const [
        profileRes,
        schemesRes,
        schemeAppsRes,
        jobAppsRes,
        savedJobsRes,
        recSchemesRes,
        recJobsRes,
        jobsFeedRes,
      ] = await Promise.all([
        veteranService.getProfile().catch(() => null),
        schemeService.getSchemes({ limit: 1 }).catch(() => null),
        applicationService.getApplications({ limit: 5 }).catch(() => null),
        jobApplicationService.getMyApplications().catch(() => null),
        jobService.getSavedJobs().catch(() => null),
        schemeService.getRecommendedSchemes().catch(() => null),
        jobService.getRecommendedJobs().catch(() => null),
        jobService.getJobs({ limit: 4, status: 'ACTIVE' }).catch(() => null),
      ]);

      if (profileRes?.profile) {
        setProfile(profileRes.profile);
      }

      if (schemesRes?.pagination?.total) {
        setTotalSchemesCount(schemesRes.pagination.total);
      }

      if (schemeAppsRes?.data?.applications) {
        const apps = schemeAppsRes.data.applications;
        setSchemeAppsCount(schemeAppsRes.data.pagination?.total || apps.length);
        if (apps.length > 0) {
          setLatestApplication(apps[0]);
        }
      }

      if (jobAppsRes?.data) {
        const total = jobAppsRes.data.counts?.total ?? (jobAppsRes.data.applications?.length || 0);
        setJobAppsCount(total);
      }

      if (savedJobsRes?.data?.savedJobs) {
        setSavedJobsCount(savedJobsRes.data.savedJobs.length);
      }

      if (recSchemesRes?.schemes && recSchemesRes.schemes.length > 0) {
        setRecommendedScheme(recSchemesRes.schemes[0]);
      }

      if (recJobsRes?.data?.jobs && recJobsRes.data.jobs.length > 0) {
        setRecommendedJob(recJobsRes.data.jobs[0]);
      }

      if (jobsFeedRes?.data?.jobs) {
        setLatestJobs(jobsFeedRes.data.jobs.slice(0, 3));
      }
    } catch (err) {
      console.warn('Dashboard data fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-time live dashboard sync
  useEffect(() => {
    const handleLiveSync = () => {
      fetchDashboardData();
    };

    on(SOCKET_EVENTS.DASHBOARD_UPDATED, handleLiveSync);
    on(SOCKET_EVENTS.APPLICATION_STATUS_CHANGED, handleLiveSync);
    on(SOCKET_EVENTS.JOB_APPLICATION_STATUS_CHANGED, handleLiveSync);
    on(SOCKET_EVENTS.NOTIFICATION_NEW, handleLiveSync);

    return () => {
      off(SOCKET_EVENTS.DASHBOARD_UPDATED, handleLiveSync);
      off(SOCKET_EVENTS.APPLICATION_STATUS_CHANGED, handleLiveSync);
      off(SOCKET_EVENTS.JOB_APPLICATION_STATUS_CHANGED, handleLiveSync);
      off(SOCKET_EVENTS.NOTIFICATION_NEW, handleLiveSync);
    };
  }, [on, off, fetchDashboardData]);

  // Compute greeting name
  const veteranName =
    profile?.personalInformation?.fullName ||
    user?.name?.split(' ')[0] ||
    'Veteran';

  // Compute Timeline steps for the latest application
  const getTimelineConfig = (app) => {
    if (!app) {
      return {
        steps: [
          { label: 'Application submitted', status: 'completed' },
          { label: 'Under review', status: 'current' },
          { label: 'Document verification', status: 'upcoming' },
          { label: 'Final decision', status: 'upcoming' },
        ],
        currentIndex: 1,
        isRejected: false,
      };
    }

    const st = app.status;
    const isRejected = st === 'REJECTED';
    let currentIndex = 0;

    if (st === 'SUBMITTED') currentIndex = 0;
    else if (st === 'UNDER_REVIEW') currentIndex = 1;
    else if (st === 'APPROVED' || st === 'DISBURSED') currentIndex = 3;
    else if (isRejected) currentIndex = 1;

    return {
      steps: [
        { label: 'Application submitted' },
        { label: 'Under review' },
        { label: 'Document verification' },
        { label: 'Final decision' },
      ],
      currentIndex,
      isRejected,
    };
  };

  const timelineConfig = getTimelineConfig(latestApplication);

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <LoadingSpinner size="lg" text="Loading your veteran command dashboard..." />
      </div>
    );
  }

  return (
    <div className="veteran-dashboard-page">
      {/* 1. Header Greeting */}
      <div className="dashboard-welcome-header">
        <div className="welcome-title-group">
          <h1>Good morning, {veteranName} 👋</h1>
          <p>Manage your benefits, applications and opportunities in one place.</p>
        </div>

        <div className="welcome-quick-badge">
          <Badge variant={profile?.verificationStatus === 'VERIFIED' ? 'success' : 'warning'}>
            {profile?.verificationStatus === 'VERIFIED' ? 'Verified Veteran' : 'Pending Verification'}
          </Badge>
        </div>
      </div>

      {/* 2. Four Statistics Cards */}
      <div className="dashboard-stats-grid">
        {/* Card 1: Benefits & Schemes */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Benefits & Schemes</span>
            <div className="stat-icon-wrapper icon-blue">
              <Award size={18} />
            </div>
          </div>
          <div className="stat-value">{totalSchemesCount}</div>
          <Link to="/schemes" className="stat-action-link">
            Explore Now →
          </Link>
        </div>

        {/* Card 2: My Applications */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">My Applications</span>
            <div className="stat-icon-wrapper icon-green">
              <FileCheck2 size={18} />
            </div>
          </div>
          <div className="stat-value">{schemeAppsCount}</div>
          <Link to="/veteran/applications" className="stat-action-link">
            Explore Now →
          </Link>
        </div>

        {/* Card 3: Job Applications */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Job Applications</span>
            <div className="stat-icon-wrapper icon-purple">
              <Briefcase size={18} />
            </div>
          </div>
          <div className="stat-value">{jobAppsCount}</div>
          <Link to="/veteran/job-applications" className="stat-action-link">
            Explore Now →
          </Link>
        </div>

        {/* Card 4: Saved Jobs */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Saved Jobs</span>
            <div className="stat-icon-wrapper icon-amber">
              <Bookmark size={18} />
            </div>
          </div>
          <div className="stat-value">{savedJobsCount}</div>
          <Link to="/veteran/saved-jobs" className="stat-action-link">
            Explore Now →
          </Link>
        </div>
      </div>

      {/* 3. Recommended For You Section */}
      <div className="dashboard-section">
        <div className="section-header-row">
          <h2>Recommended for You</h2>
          <span className="section-subtext">Tailored to your military service, skills & preferences</span>
        </div>

        <div className="recommendations-grid">
          {/* Scheme Recommendation */}
          <div className="recommendation-card">
            <div className="rec-top-row">
              <span className="rec-type-label">Welfare Scheme</span>
              <span className="match-pill">
                {recommendedScheme?.matchPercentage ? `${recommendedScheme.matchPercentage}% Match` : '92% Match'}
              </span>
            </div>

            <h3 className="rec-title">
              {recommendedScheme?.scheme?.name || 'Healthcare Assistance Scheme'}
            </h3>

            <p className="rec-desc">
              {recommendedScheme?.scheme?.shortDescription ||
                'Comprehensive medical grant and outpatient coverage for defense veterans and dependents.'}
            </p>

            <div className="rec-card-bottom">
              <Link
                to={
                  recommendedScheme?.scheme?.schemeId
                    ? `/schemes/${recommendedScheme.scheme.schemeId}`
                    : '/schemes'
                }
              >
                <Button variant="primary" size="sm">
                  View Details →
                </Button>
              </Link>
            </div>
          </div>

          {/* Job Recommendation */}
          <div className="recommendation-card">
            <div className="rec-top-row">
              <span className="rec-type-label">Corporate Job</span>
              <span className="match-pill">
                {recommendedJob?.matchPercentage ? `${recommendedJob.matchPercentage}% Match` : '87% Match'}
              </span>
            </div>

            <h3 className="rec-title">
              {recommendedJob?.job?.title || 'Security Supervisor'}
            </h3>

            <p className="rec-desc">
              {recommendedJob?.job?.employer?.companyName
                ? `${recommendedJob.job.employer.companyName} • ${recommendedJob.job.city || 'Delhi'}, ${recommendedJob.job.state || 'NCR'}`
                : 'Defense Security Systems • New Delhi • Full-time'}
            </p>

            <div className="rec-card-bottom">
              <Link
                to={
                  recommendedJob?.job?.jobId
                    ? `/jobs/${recommendedJob.job.jobId}`
                    : '/jobs'
                }
              >
                <Button variant="primary" size="sm">
                  View Job →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Application Status Card */}
      <div className="dashboard-section">
        <div className="section-header-row">
          <h2>Application Status</h2>
          <Link to="/veteran/applications" className="section-view-all">
            View All →
          </Link>
        </div>

        <div className="app-status-card">
          <div className="app-status-info-row">
            <div className="app-meta-group">
              <span className="app-id-tag">
                Application #{latestApplication?.applicationId || 'APP-2026-0001'}
              </span>
              <h3 className="app-scheme-name">
                {latestApplication?.scheme?.name || 'Ex-Servicemen Healthcare & Pension Grant'}
              </h3>
            </div>

            <div className="app-status-badge-group">
              <Badge
                variant={
                  latestApplication?.status === 'APPROVED'
                    ? 'success'
                    : latestApplication?.status === 'REJECTED'
                    ? 'danger'
                    : 'warning'
                }
              >
                {latestApplication?.status || 'Under Review'}
              </Badge>
              <span className="app-submission-date">
                Submitted:{' '}
                {latestApplication?.createdAt
                  ? new Date(latestApplication.createdAt).toLocaleDateString()
                  : new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Compact 4-step Timeline */}
          <div className="app-timeline-wrapper">
            <Timeline
              steps={timelineConfig.steps}
              currentStepIndex={timelineConfig.currentIndex}
              isRejected={timelineConfig.isRejected}
            />
          </div>
        </div>
      </div>

      {/* 5. Latest Opportunities */}
      <div className="dashboard-section">
        <div className="section-header-row">
          <h2>Latest Opportunities</h2>
          <Link to="/jobs" className="section-view-all">
            Explore All Jobs →
          </Link>
        </div>

        <div className="latest-jobs-list">
          {latestJobs.length > 0 ? (
            latestJobs.map((job) => (
              <div key={job.jobId || job._id} className="job-row-card">
                <div className="job-row-left">
                  <div className="job-row-icon">
                    <Briefcase size={20} />
                  </div>
                  <div className="job-row-details">
                    <h3 className="job-row-title">{job.title}</h3>
                    <div className="job-row-meta">
                      <span className="job-company">{job.employer?.companyName || 'Corporate Partner'}</span>
                      <span className="meta-dot">•</span>
                      <span className="job-location">
                        <MapPin size={12} /> {job.city}, {job.state}
                      </span>
                      <span className="meta-dot">•</span>
                      <span className="job-type">{job.employmentType || 'Full-time'}</span>
                    </div>
                  </div>
                </div>

                <div className="job-row-right">
                  <div className="job-row-compensation">
                    <span className="job-salary">
                      ₹{job.salaryMin?.toLocaleString() || '30,000'} – ₹{job.salaryMax?.toLocaleString() || '45,000'}
                    </span>
                    <span className="job-match-badge">90% Match</span>
                  </div>

                  <Link to={`/jobs/${job.jobId || job._id}`}>
                    <Button variant="primary" size="sm">
                      View Job
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            // Default placeholder card if empty
            <div className="job-row-card">
              <div className="job-row-left">
                <div className="job-row-icon">
                  <Briefcase size={20} />
                </div>
                <div className="job-row-details">
                  <h3 className="job-row-title">IT Support Specialist</h3>
                  <div className="job-row-meta">
                    <span className="job-company">Tech Solutions Pvt. Ltd.</span>
                    <span className="meta-dot">•</span>
                    <span className="job-location">Bhubaneswar</span>
                    <span className="meta-dot">•</span>
                    <span className="job-type">Full-time</span>
                  </div>
                </div>
              </div>

              <div className="job-row-right">
                <div className="job-row-compensation">
                  <span className="job-salary">₹30,000 – ₹45,000/month</span>
                  <span className="job-match-badge">90% Match</span>
                </div>

                <Link to="/jobs">
                  <Button variant="primary" size="sm">
                    View Job
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. Quick Actions Section */}
      <div className="dashboard-section">
        <div className="section-header-row">
          <h2>Quick Actions</h2>
        </div>

        <div className="quick-actions-bar">
          <Link to="/schemes" className="quick-action-item">
            <div className="quick-action-icon">
              <ShieldCheck size={18} />
            </div>
            <span>Check Eligibility</span>
          </Link>

          <Link to="/schemes" className="quick-action-item">
            <div className="quick-action-icon">
              <Search size={18} />
            </div>
            <span>Explore Schemes</span>
          </Link>

          <Link to="/jobs" className="quick-action-item">
            <div className="quick-action-icon">
              <Briefcase size={18} />
            </div>
            <span>Find Jobs</span>
          </Link>

          <Link to="/veteran/documents" className="quick-action-item">
            <div className="quick-action-icon">
              <UploadCloud size={18} />
            </div>
            <span>Upload Document</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VeteranDashboard;
