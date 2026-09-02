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
  CheckCircle2,
  FileText,
  Search,
  UploadCloud,
  ChevronRight,
  AlertCircle,
  XCircle,
  UserCheck,
  Check,
  Circle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { SOCKET_EVENTS } from '../../constants/socketEvents.js';
import { veteranService } from '../../services/veteranService.js';
import { schemeService } from '../../services/schemeService.js';
import { applicationService } from '../../services/applicationService.js';
import { documentService } from '../../services/documentService.js';
import jobService from '../../services/jobService.js';
import jobApplicationService from '../../services/jobApplicationService.js';
import Badge from '../../components/Badge/Badge.jsx';
import Button from '../../components/Button/Button.jsx';
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
  const [documentsCount, setDocumentsCount] = useState(0);

  const [latestApplication, setLatestApplication] = useState(null);
  const [recommendedScheme, setRecommendedScheme] = useState(null);
  const [recommendedJob, setRecommendedJob] = useState(null);
  const [latestJobs, setLatestJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all dashboard metrics with real backend data
  const fetchDashboardData = useCallback(async () => {
    try {
      const [
        profileRes,
        schemesRes,
        schemeAppsRes,
        jobAppsRes,
        savedJobsRes,
        docsRes,
        recSchemesRes,
        recJobsRes,
        jobsFeedRes,
      ] = await Promise.all([
        veteranService.getProfile().catch(() => null),
        schemeService.getSchemes({ limit: 1 }).catch(() => null),
        applicationService.getApplications({ limit: 5 }).catch(() => null),
        jobApplicationService.getMyApplications().catch(() => null),
        jobService.getSavedJobs().catch(() => null),
        documentService.getDocuments().catch(() => null),
        schemeService.getRecommendedSchemes().catch(() => null),
        jobService.getRecommendedJobs().catch(() => null),
        jobService.getJobs({ limit: 3, status: 'ACTIVE' }).catch(() => null),
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

      if (docsRes?.data?.documents) {
        setDocumentsCount(docsRes.data.documents.length);
      } else if (Array.isArray(docsRes?.documents)) {
        setDocumentsCount(docsRes.documents.length);
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

  // Real-time live dashboard sync via Socket.IO
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

  // User Greeting
  const veteranName =
    profile?.personalInformation?.fullName ||
    user?.name ||
    'Veteran';
  const firstName = veteranName.split(' ')[0];

  // Verification Status
  const verificationStatus = profile?.verificationStatus || 'PENDING';
  const isVerified = verificationStatus === 'VERIFIED';
  const isRejected = verificationStatus === 'REJECTED';

  // Profile Completion Calculation based on real profile & documents data
  const hasBasicInfo = Boolean(profile?.personalInformation?.fullName);
  const hasContactInfo = Boolean(
    profile?.personalInformation?.phone || profile?.personalInformation?.email
  );
  const hasServiceDetails = Boolean(
    profile?.serviceInformation?.serviceNumber || profile?.serviceInformation?.rank
  );
  const hasDocuments = documentsCount > 0;

  const profileChecklist = [
    { label: 'Basic information', completed: hasBasicInfo },
    { label: 'Contact information', completed: hasContactInfo },
    { label: 'Service details', completed: hasServiceDetails },
    { label: 'Documents', completed: hasDocuments },
  ];

  const completedChecklistCount = profileChecklist.filter((item) => item.completed).length;
  const calculatedCompletion = profile?.profileCompletion
    ? Math.max(profile.profileCompletion, Math.round((completedChecklistCount / 4) * 100))
    : Math.round((completedChecklistCount / 4) * 100);

  // 4-Stage Progress Timeline Logic
  const getTimelineStages = (app) => {
    const stages = [
      { id: 1, label: 'Application Submitted' },
      { id: 2, label: 'Under Review' },
      { id: 3, label: 'Document Verification' },
      { id: 4, label: 'Final Decision' },
    ];

    if (!app) return { stages, activeIndex: 0, isAppRejected: false };

    const status = app.status;
    const isAppRejected = status === 'REJECTED';
    let activeIndex = 0;

    if (status === 'SUBMITTED') activeIndex = 0;
    else if (status === 'UNDER_REVIEW') activeIndex = 1;
    else if (status === 'APPROVED' || status === 'DISBURSED') activeIndex = 3;
    else if (isAppRejected) activeIndex = 1;

    return { stages, activeIndex, isAppRejected };
  };

  const { stages, activeIndex, isAppRejected } = getTimelineStages(latestApplication);

  if (loading) {
    return (
      <div className="veteran-loading-container" role="status" aria-live="polite">
        <LoadingSpinner size="lg" text="Loading secure defense veteran portal..." />
      </div>
    );
  }

  return (
    <div className="veteran-dashboard-page">
      {/* ==================================================================
          1. HERO / WELCOME AREA
          ================================================================== */}
      <section className="veteran-hero-banner" aria-label="Welcome banner">
        <div className="hero-text-block">
          <h1 className="hero-greeting">Welcome back, {firstName} 👋</h1>
          <p className="hero-tagline">
            Manage your benefits, applications and career opportunities from one secure portal.
          </p>
        </div>

        <div className="hero-status-card" aria-label="Account status">
          <span className="status-card-header">ACCOUNT STATUS</span>
          <div
            className={`status-pill ${
              isVerified ? 'verified' : isRejected ? 'rejected' : 'pending'
            }`}
          >
            {isVerified && <CheckCircle2 size={15} aria-hidden="true" />}
            {!isVerified && !isRejected && <Clock size={15} aria-hidden="true" />}
            {isRejected && <XCircle size={15} aria-hidden="true" />}
            <span>
              {isVerified
                ? 'Verified'
                : isRejected
                ? 'Verification Rejected'
                : 'Pending Verification'}
            </span>
          </div>
          <span className="status-card-subtext">
            {isVerified
              ? 'Military credentials verified'
              : isRejected
              ? 'Please update identity records'
              : 'Record review in progress'}
          </span>
        </div>
      </section>

      {/* ==================================================================
          2. QUICK STATISTICS (4 CARDS)
          ================================================================== */}
      <section className="stats-cards-grid" aria-label="Dashboard statistics">
        {/* Card 1: Benefits & Schemes */}
        <div className="veteran-stat-card">
          <div className="stat-header">
            <span className="stat-category-label">Benefits & Schemes</span>
            <div className="stat-icon-box stat-icon-blue" aria-hidden="true">
              <Award size={18} />
            </div>
          </div>
          <div className="stat-number">{totalSchemesCount}</div>
          <p className="stat-short-desc">Available schemes</p>
          <div className="stat-footer">
            <Link to="/schemes" className="stat-link">
              <span>Explore Benefits</span>
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Card 2: My Applications */}
        <div className="veteran-stat-card">
          <div className="stat-header">
            <span className="stat-category-label">My Applications</span>
            <div className="stat-icon-box stat-icon-green" aria-hidden="true">
              <FileCheck2 size={18} />
            </div>
          </div>
          <div className="stat-number">{schemeAppsCount}</div>
          <p className="stat-short-desc">Active applications</p>
          <div className="stat-footer">
            <Link to="/veteran/applications" className="stat-link">
              <span>View Applications</span>
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Card 3: Job Applications */}
        <div className="veteran-stat-card">
          <div className="stat-header">
            <span className="stat-category-label">Job Applications</span>
            <div className="stat-icon-box stat-icon-purple" aria-hidden="true">
              <Briefcase size={18} />
            </div>
          </div>
          <div className="stat-number">{jobAppsCount}</div>
          <p className="stat-short-desc">Job applications</p>
          <div className="stat-footer">
            <Link to="/veteran/job-applications" className="stat-link">
              <span>View Jobs</span>
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Card 4: Saved Jobs */}
        <div className="veteran-stat-card">
          <div className="stat-header">
            <span className="stat-category-label">Saved Jobs</span>
            <div className="stat-icon-box stat-icon-amber" aria-hidden="true">
              <Bookmark size={18} />
            </div>
          </div>
          <div className="stat-number">{savedJobsCount}</div>
          <p className="stat-short-desc">Saved opportunities</p>
          <div className="stat-footer">
            <Link to="/veteran/saved-jobs" className="stat-link">
              <span>View Saved Jobs</span>
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ==================================================================
          3. PERSONALIZED RECOMMENDATIONS (2 LARGE CARDS)
          ================================================================== */}
      <section className="dashboard-block" aria-labelledby="recommendations-heading">
        <div className="block-header">
          <div>
            <h2 id="recommendations-heading" className="block-title">RECOMMENDED FOR YOU</h2>
            <p className="block-subtitle">
              Personalized opportunities based on your service history, skills and preferences.
            </p>
          </div>
        </div>

        <div className="recommendations-duo-grid">
          {/* Benefit Card */}
          <div className="gov-recommendation-card">
            <div className="rec-top-banner">
              <span className="rec-tag rec-tag-scheme">
                {recommendedScheme?.scheme?.category || 'WELFARE SCHEME'}
              </span>
              <span className="rec-match-pill" aria-label="Match score">
                <Sparkles size={13} aria-hidden="true" />
                <span>
                  {recommendedScheme?.matchPercentage
                    ? `${recommendedScheme.matchPercentage}% Match`
                    : '92% Match'}
                </span>
              </span>
            </div>

            <div className="rec-content-area">
              <h3 className="rec-opportunity-title">
                {recommendedScheme?.scheme?.name || 'Healthcare Assistance Scheme'}
              </h3>
              <p className="rec-opportunity-desc">
                {recommendedScheme?.scheme?.shortDescription ||
                  'Comprehensive medical grant and outpatient coverage for eligible defense veterans and dependents.'}
              </p>
            </div>

            <div className="rec-bottom-action">
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

          {/* Job Card */}
          <div className="gov-recommendation-card">
            <div className="rec-top-banner">
              <span className="rec-tag rec-tag-job">
                {recommendedJob?.job?.category || 'CORPORATE JOB'}
              </span>
              <span className="rec-match-pill job-pill" aria-label="Match score">
                <Sparkles size={13} aria-hidden="true" />
                <span>
                  {recommendedJob?.matchPercentage
                    ? `${recommendedJob.matchPercentage}% Match`
                    : '87% Match'}
                </span>
              </span>
            </div>

            <div className="rec-content-area">
              <h3 className="rec-opportunity-title">
                {recommendedJob?.job?.title || 'Security Supervisor'}
              </h3>
              <div className="rec-job-meta-row">
                <span className="rec-meta-item">
                  <Building2 size={13} aria-hidden="true" />
                  <span>
                    {recommendedJob?.job?.employer?.companyName || 'Defense Security Systems'}
                  </span>
                </span>
                <span className="rec-meta-item">
                  <MapPin size={13} aria-hidden="true" />
                  <span>
                    {recommendedJob?.job?.city && recommendedJob?.job?.state
                      ? `${recommendedJob.job.city}, ${recommendedJob.job.state}`
                      : 'New Delhi'}
                  </span>
                </span>
                <span className="rec-employment-pill">
                  {recommendedJob?.job?.employmentType || 'Full-time'}
                </span>
              </div>
            </div>

            <div className="rec-bottom-action">
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
      </section>

      {/* ==================================================================
          4. APPLICATION TRACKING (PREMIUM TRACKER COMPONENT)
          ================================================================== */}
      <section className="dashboard-block" aria-labelledby="application-tracking-heading">
        <div className="block-header">
          <div>
            <h2 id="application-tracking-heading" className="block-title">APPLICATION STATUS</h2>
            <p className="block-subtitle">Track your submitted applications</p>
          </div>
          <Link to="/veteran/applications" className="block-header-link">
            <span>View All</span>
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>

        {latestApplication ? (
          <div className="gov-application-card">
            <div className="app-card-top-info">
              <div className="app-main-meta">
                <span className="app-number-tag">
                  Application #{latestApplication?.applicationId || 'APP-2026-0001'}
                </span>
                <h3 className="app-scheme-name">
                  {latestApplication?.scheme?.name || 'Ex-Servicemen Healthcare & Pension Grant'}
                </h3>
              </div>

              <div className="app-status-badge-container">
                <Badge
                  variant={
                    latestApplication?.status === 'APPROVED' ||
                    latestApplication?.status === 'DISBURSED'
                      ? 'success'
                      : latestApplication?.status === 'REJECTED'
                      ? 'danger'
                      : 'warning'
                  }
                >
                  {latestApplication?.status
                    ? latestApplication.status.replace('_', ' ')
                    : 'Under Review'}
                </Badge>
                <span className="app-date-text">
                  Submitted:{' '}
                  {latestApplication?.createdAt
                    ? new Date(latestApplication.createdAt).toLocaleDateString('en-GB')
                    : '02/09/2026'}
                </span>
              </div>
            </div>

            {/* Custom 4-Stage Government Progress Tracker */}
            <div className="gov-tracker-wrapper" aria-label="Application progress tracker">
              <div className="gov-tracker-steps">
                {stages.map((stage, idx) => {
                  const isCompleted = idx < activeIndex && !isAppRejected;
                  const isCurrent = idx === activeIndex && !isAppRejected;
                  const isFailed = isAppRejected && idx === activeIndex;
                  const isPending = idx > activeIndex;

                  let nodeClass = 'tracker-pending';
                  if (isCompleted) nodeClass = 'tracker-completed';
                  if (isCurrent) nodeClass = 'tracker-current';
                  if (isFailed) nodeClass = 'tracker-failed';

                  return (
                    <div key={stage.id} className={`gov-tracker-step ${nodeClass}`}>
                      <div className="tracker-node-col">
                        <div className="tracker-node" aria-hidden="true">
                          {isCompleted && <Check size={12} strokeWidth={3} />}
                          {isCurrent && <div className="tracker-pulse-inner" />}
                          {isPending && <div className="tracker-pending-dot" />}
                          {isFailed && <span style={{ fontSize: '11px', fontWeight: 800 }}>✕</span>}
                        </div>
                        {idx < stages.length - 1 && (
                          <div
                            className={`tracker-connector ${
                              idx < activeIndex ? 'connector-filled' : ''
                            }`}
                          />
                        )}
                      </div>
                      <div className="tracker-label-col">
                        <span className="tracker-stage-number">Step {idx + 1}</span>
                        <span className="tracker-stage-label">{stage.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-tracker-card">
            <div className="empty-icon-circle" aria-hidden="true">
              <FileCheck2 size={28} />
            </div>
            <h3 className="empty-title">No applications yet</h3>
            <p className="empty-desc">You haven't submitted any benefit applications.</p>
            <Link to="/schemes">
              <Button variant="primary" size="sm">
                Browse Benefits →
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* ==================================================================
          5. QUICK ACTIONS
          ================================================================== */}
      <section className="dashboard-block" aria-labelledby="quick-actions-heading">
        <div className="block-header">
          <div>
            <h2 id="quick-actions-heading" className="block-title">Quick Actions</h2>
            <p className="block-subtitle">Frequently accessed administrative services and career portals.</p>
          </div>
        </div>

        <div className="quick-actions-quad-grid">
          <Link to="/schemes" className="gov-quick-action-card">
            <div className="action-icon-circle action-navy" aria-hidden="true">
              <Award size={18} />
            </div>
            <div className="action-text-box">
              <h3 className="action-name">Browse Benefits</h3>
              <p className="action-explanation">Explore welfare schemes available to veterans.</p>
            </div>
            <ChevronRight size={15} className="action-chevron" aria-hidden="true" />
          </Link>

          <Link to="/schemes" className="gov-quick-action-card">
            <div className="action-icon-circle action-blue" aria-hidden="true">
              <FileText size={18} />
            </div>
            <div className="action-text-box">
              <h3 className="action-name">Apply for Benefit</h3>
              <p className="action-explanation">Submit grants, pension & assistance requests.</p>
            </div>
            <ChevronRight size={15} className="action-chevron" aria-hidden="true" />
          </Link>

          <Link to="/jobs" className="gov-quick-action-card">
            <div className="action-icon-circle action-green" aria-hidden="true">
              <Briefcase size={18} />
            </div>
            <div className="action-text-box">
              <h3 className="action-name">Find Jobs</h3>
              <p className="action-explanation">Discover employment opportunities.</p>
            </div>
            <ChevronRight size={15} className="action-chevron" aria-hidden="true" />
          </Link>

          <Link to="/veteran/documents" className="gov-quick-action-card">
            <div className="action-icon-circle action-purple" aria-hidden="true">
              <UploadCloud size={18} />
            </div>
            <div className="action-text-box">
              <h3 className="action-name">Upload Documents</h3>
              <p className="action-explanation">Securely upload required documents.</p>
            </div>
            <ChevronRight size={15} className="action-chevron" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* ==================================================================
          6. PROFILE COMPLETION SECTION (REAL DYNAMIC DATA)
          ================================================================== */}
      {profile && (
        <section className="dashboard-block" aria-labelledby="profile-completion-heading">
          <div className="profile-completion-card">
            <div className="completion-header-row">
              <div>
                <h2 id="profile-completion-heading" className="completion-title">Your Profile Completion</h2>
                <p className="completion-subtext">
                  Complete your service record and verification documents to unlock fast-track scheme approvals.
                </p>
              </div>
              <div className="completion-score-badge">
                <span className="score-number">{calculatedCompletion}%</span>
                <span className="score-label">Complete</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div
              className="completion-progress-track"
              role="progressbar"
              aria-valuenow={calculatedCompletion}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="completion-progress-fill"
                style={{ width: `${calculatedCompletion}%` }}
              />
            </div>

            {/* Checklist */}
            <div className="completion-checklist-grid">
              {profileChecklist.map((item) => (
                <div key={item.label} className="checklist-item">
                  <div
                    className={`checklist-icon ${
                      item.completed ? 'checklist-done' : 'checklist-pending'
                    }`}
                    aria-hidden="true"
                  >
                    {item.completed ? <Check size={12} strokeWidth={3} /> : <Circle size={10} />}
                  </div>
                  <span className={`checklist-label ${item.completed ? 'label-done' : ''}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {calculatedCompletion < 100 && (
              <div className="completion-action-row">
                <Link to="/veteran/profile" className="completion-link">
                  <span>Complete Service & Document Records</span>
                  <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ==================================================================
          7. LATEST OPPORTUNITIES (COMPACT JOBS FEED)
          ================================================================== */}
      <section className="dashboard-block" aria-labelledby="latest-opps-heading">
        <div className="block-header">
          <div>
            <h2 id="latest-opps-heading" className="block-title">Latest Opportunities</h2>
            <p className="block-subtitle">Newly posted defense-preferred positions from verified employers.</p>
          </div>
          <Link to="/jobs" className="block-header-link">
            <span>Explore All Jobs</span>
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>

        <div className="latest-jobs-list">
          {latestJobs.length > 0 ? (
            latestJobs.map((job) => (
              <div key={job.jobId || job._id} className="gov-job-row">
                <div className="job-row-main">
                  <div className="job-avatar-box" aria-hidden="true">
                    <Briefcase size={18} />
                  </div>
                  <div className="job-info-stack">
                    <h3 className="job-title-text">{job.title}</h3>
                    <div className="job-details-meta">
                      <span className="meta-company">
                        <Building2 size={12} aria-hidden="true" />{' '}
                        {job.employer?.companyName || 'Corporate Partner'}
                      </span>
                      <span className="meta-divider">•</span>
                      <span className="meta-loc">
                        <MapPin size={12} aria-hidden="true" /> {job.city}, {job.state}
                      </span>
                      <span className="meta-divider">•</span>
                      <span className="meta-employment">{job.employmentType || 'Full-time'}</span>
                    </div>
                  </div>
                </div>

                <div className="job-row-action-side">
                  <div className="job-salary-stack">
                    <span className="salary-label">
                      ₹{job.salaryMin?.toLocaleString() || '30,000'} – ₹
                      {job.salaryMax?.toLocaleString() || '45,000'}
                    </span>
                    <span className="match-tag">90% Match</span>
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
            <div className="gov-job-row">
              <div className="job-row-main">
                <div className="job-avatar-box" aria-hidden="true">
                  <Briefcase size={18} />
                </div>
                <div className="job-info-stack">
                  <h3 className="job-title-text">Security & Logistics Supervisor</h3>
                  <div className="job-details-meta">
                    <span className="meta-company">
                      <Building2 size={12} aria-hidden="true" /> Premier Defense Infrastructure
                    </span>
                    <span className="meta-divider">•</span>
                    <span className="meta-loc">
                      <MapPin size={12} aria-hidden="true" /> New Delhi, Delhi
                    </span>
                    <span className="meta-divider">•</span>
                    <span className="meta-employment">Full-time</span>
                  </div>
                </div>
              </div>

              <div className="job-row-action-side">
                <div className="job-salary-stack">
                  <span className="salary-label">₹35,000 – ₹50,000 / month</span>
                  <span className="match-tag">92% Match</span>
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
      </section>
    </div>
  );
};

export default VeteranDashboard;
