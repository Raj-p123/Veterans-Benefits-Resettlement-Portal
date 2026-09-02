import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Briefcase,
  FileCheck2,
  Bookmark,
  ArrowRight,
  Building2,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { SOCKET_EVENTS } from '../../constants/socketEvents.js';
import { veteranService } from '../../services/veteranService.js';
import { schemeService } from '../../services/schemeService.js';
import { applicationService } from '../../services/applicationService.js';
import { documentService } from '../../services/documentService.js';
import { notificationService } from '../../services/notificationService.js';
import jobService from '../../services/jobService.js';
import jobApplicationService from '../../services/jobApplicationService.js';
import Button from '../../components/Button/Button.jsx';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner.jsx';

// Modular Dashboard Sub-components
import WelcomeBanner from './components/WelcomeBanner.jsx';
import StatCard from './components/StatCard.jsx';
import RecommendationCard from './components/RecommendationCard.jsx';
import ApplicationTracker from './components/ApplicationTracker.jsx';
import QuickActions from './components/QuickActions.jsx';
import ProfileCompletion from './components/ProfileCompletion.jsx';
import ImportantUpdates from './components/ImportantUpdates.jsx';

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
  const [notifications, setNotifications] = useState([]);

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
        notifRes,
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
        notificationService.getNotifications({ limit: 5 }).catch(() => null),
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

      if (notifRes?.data?.notifications) {
        setNotifications(notifRes.data.notifications);
      } else if (Array.isArray(notifRes?.notifications)) {
        setNotifications(notifRes.notifications);
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

  // Logged-in user information
  const veteranName =
    profile?.personalInformation?.fullName ||
    user?.name ||
    'Veteran';
  const verificationStatus = profile?.verificationStatus || 'PENDING';

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
      <WelcomeBanner userName={veteranName} verificationStatus={verificationStatus} />

      {/* ==================================================================
          2. QUICK STATISTICS (4 CARDS)
          ================================================================== */}
      <section className="stats-cards-grid" aria-label="Dashboard statistics">
        <StatCard
          icon={Award}
          label="Benefits & Schemes"
          value={totalSchemesCount}
          description="Available schemes"
          linkTo="/schemes"
          linkText="Explore Benefits →"
          colorScheme="blue"
        />

        <StatCard
          icon={FileCheck2}
          label="My Applications"
          value={schemeAppsCount}
          description="Active applications"
          linkTo="/veteran/applications"
          linkText="View Applications →"
          colorScheme="green"
        />

        <StatCard
          icon={Briefcase}
          label="Job Applications"
          value={jobAppsCount}
          description="Job applications"
          linkTo="/veteran/job-applications"
          linkText="View Jobs →"
          colorScheme="purple"
        />

        <StatCard
          icon={Bookmark}
          label="Saved Jobs"
          value={savedJobsCount}
          description="Saved opportunities"
          linkTo="/veteran/saved-jobs"
          linkText="View Saved Jobs →"
          colorScheme="amber"
        />
      </section>

      {/* ==================================================================
          3. FULL PAGE MULTI-COLUMN CONTENT LAYOUT (DESKTOP OPTIMIZED)
          ================================================================== */}
      <div className="dashboard-content-split">
        {/* Left Primary Column */}
        <div className="dashboard-primary-col">
          {/* Recommended for You */}
          <section className="dashboard-block" aria-labelledby="recommendations-heading">
            <div className="block-header">
              <div>
                <h2 id="recommendations-heading" className="block-title">Recommended for You</h2>
                <p className="block-subtitle">
                  Personalized opportunities based on your service history, skills and preferences.
                </p>
              </div>
            </div>

            <div className="recommendations-duo-grid">
              {/* Benefit Card */}
              <RecommendationCard
                type="scheme"
                tag="WELFARE SCHEME"
                title={recommendedScheme?.name || recommendedScheme?.scheme?.name}
                description={
                  recommendedScheme?.shortDescription ||
                  recommendedScheme?.scheme?.shortDescription
                }
                matchPercentage={recommendedScheme?.matchPercentage || 92}
                linkTo={
                  recommendedScheme?.schemeId
                    ? `/schemes/${recommendedScheme.schemeId}`
                    : recommendedScheme?.scheme?.schemeId
                    ? `/schemes/${recommendedScheme.scheme.schemeId}`
                    : '/schemes'
                }
                buttonText="View Details →"
                isEmpty={!recommendedScheme}
              />

              {/* Job Card */}
              <RecommendationCard
                type="job"
                tag="CORPORATE JOB"
                title={recommendedJob?.title || recommendedJob?.job?.title}
                company={
                  recommendedJob?.employer?.companyName ||
                  recommendedJob?.job?.employer?.companyName ||
                  recommendedJob?.companyName ||
                  recommendedJob?.job?.companyName
                }
                location={
                  (recommendedJob?.city && recommendedJob?.state)
                    ? `${recommendedJob.city}, ${recommendedJob.state}`
                    : (recommendedJob?.job?.city && recommendedJob?.job?.state)
                    ? `${recommendedJob.job.city}, ${recommendedJob.job.state}`
                    : (recommendedJob?.location || recommendedJob?.job?.location)
                }
                employmentType={
                  recommendedJob?.employmentType ||
                  recommendedJob?.job?.employmentType
                }
                matchPercentage={recommendedJob?.matchPercentage || 87}
                linkTo={
                  recommendedJob?.jobId
                    ? `/jobs/${recommendedJob.jobId}`
                    : recommendedJob?.job?.jobId
                    ? `/jobs/${recommendedJob.job.jobId}`
                    : recommendedJob?._id
                    ? `/jobs/${recommendedJob._id}`
                    : '/jobs'
                }
                buttonText="View Job →"
                isEmpty={!recommendedJob}
              />
            </div>
          </section>

          {/* Application Status */}
          <ApplicationTracker latestApplication={latestApplication} />

          {/* Latest Opportunities Feed */}
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
                            {job.employer?.companyName || job.companyName || 'Corporate Partner'}
                          </span>
                          <span className="meta-divider">•</span>
                          <span className="meta-loc">
                            <MapPin size={12} aria-hidden="true" /> {job.city || job.location || 'Pan-India'}
                            {job.state ? `, ${job.state}` : ''}
                          </span>
                          <span className="meta-divider">•</span>
                          <span className="meta-employment">
                            {(job.employmentType || 'Full-time').replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="job-row-action-side">
                      <div className="job-salary-stack">
                        <span className="salary-label">
                          {job.salaryMin && job.salaryMax
                            ? `₹${(job.salaryMin / 100000).toFixed(1)} – ₹${(job.salaryMax / 100000).toFixed(1)} LPA`
                            : job.salaryMin
                            ? `₹${(job.salaryMin / 100000).toFixed(1)} LPA+`
                            : 'Best in Industry'}
                        </span>
                        {job.matchPercentage && (
                          <span className="match-tag">{job.matchPercentage}% Match</span>
                        )}
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
                <div className="empty-tracker-card">
                  <div className="empty-icon-circle" aria-hidden="true">
                    <Briefcase size={22} />
                  </div>
                  <h3 className="empty-title">No job postings available</h3>
                  <p className="empty-desc">Check back soon for newly verified defense corporate postings.</p>
                  <Link to="/jobs">
                    <Button variant="primary" size="sm">
                      Explore Jobs Board →
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Widget Column */}
        <aside className="dashboard-sidebar-col" aria-label="Dashboard utilities and widgets">
          {/* Profile Completion */}
          <ProfileCompletion profile={profile} documentsCount={documentsCount} />

          {/* Quick Actions */}
          <QuickActions />

          {/* Important Updates */}
          <ImportantUpdates notifications={notifications} />
        </aside>
      </div>
    </div>
  );
};

export default VeteranDashboard;
