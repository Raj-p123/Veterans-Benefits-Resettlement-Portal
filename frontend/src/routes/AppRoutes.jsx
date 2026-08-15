import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout.jsx';
import PublicLayout from '../layouts/PublicLayout.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';

import Home from '../pages/Home/Home.jsx';
import About from '../pages/About/About.jsx';
import Contact from '../pages/Contact/Contact.jsx';
import Login from '../pages/Auth/Login.jsx';
import Register from '../pages/Auth/Register.jsx';
import VeteranDashboard from '../pages/Dashboard/VeteranDashboard.jsx';
import Profile from '../pages/Veteran/Profile/Profile.jsx';
import Documents from '../pages/Veteran/Documents/Documents.jsx';
import ApplyScheme from '../pages/Veteran/Applications/ApplyScheme.jsx';
import ApplicationsList from '../pages/Veteran/Applications/ApplicationsList.jsx';
import ApplicationDetail from '../pages/Veteran/Applications/ApplicationDetail.jsx';
import SchemesList from '../pages/Schemes/SchemesList.jsx';
import SchemeDetail from '../pages/Schemes/SchemeDetail.jsx';

// Phase 6 Job & Resettlement Pages
import JobsList from '../pages/Jobs/JobsList.jsx';
import JobDetail from '../pages/Jobs/JobDetail.jsx';
import MyJobApplications from '../pages/Veteran/Jobs/MyJobApplications.jsx';
import JobApplicationDetail from '../pages/Veteran/Jobs/JobApplicationDetail.jsx';
import SavedJobs from '../pages/Veteran/Jobs/SavedJobs.jsx';

// Phase 6 Employer Management Pages
import EmployerDashboard from '../pages/Dashboard/EmployerDashboard.jsx';
import EmployerProfile from '../pages/Employer/EmployerProfile.jsx';
import EmployerJobsList from '../pages/Employer/Jobs/EmployerJobsList.jsx';
import CreateJob from '../pages/Employer/Jobs/CreateJob.jsx';
import EditJob from '../pages/Employer/Jobs/EditJob.jsx';
import EmployerJobApplicants from '../pages/Employer/Jobs/EmployerJobApplicants.jsx';
import EmployerApplicantDetail from '../pages/Employer/Jobs/EmployerApplicantDetail.jsx';

// Phase 7 Notification Center
import NotificationCenter from '../pages/Notifications/NotificationCenter.jsx';

// Phase 8 Admin Module Pages
import AdminDashboard from '../pages/Admin/Dashboard/AdminDashboard.jsx';
import AdminVeteransList from '../pages/Admin/Veterans/VeteransList.jsx';
import AdminVeteranDetail from '../pages/Admin/Veterans/VeteranDetail.jsx';
import AdminDocumentsList from '../pages/Admin/Documents/DocumentsList.jsx';
import AdminEmployersList from '../pages/Admin/Employers/EmployersList.jsx';
import AdminEmployerDetail from '../pages/Admin/Employers/EmployerDetail.jsx';
import AdminUsersList from '../pages/Admin/Users/UsersList.jsx';
import AdminSchemesList from '../pages/Admin/Schemes/SchemesList.jsx';
import AdminSchemeForm from '../pages/Admin/Schemes/SchemeForm.jsx';
import AdminJobsList from '../pages/Admin/Jobs/JobsList.jsx';
import AdminSchemeApplicationsList from '../pages/Admin/Applications/SchemeApplicationsList.jsx';
import AdminSchemeApplicationDetail from '../pages/Admin/Applications/SchemeApplicationDetail.jsx';
import AdminJobApplicationsList from '../pages/Admin/Applications/JobApplicationsList.jsx';
import AdminJobApplicationDetail from '../pages/Admin/Applications/JobApplicationDetail.jsx';
import AdminAnalytics from '../pages/Admin/Analytics/AdminAnalytics.jsx';
import AdminReports from '../pages/Admin/Reports/AdminReports.jsx';
import AdminAuditLogs from '../pages/Admin/AuditLogs/AdminAuditLogs.jsx';
import AdminNotifications from '../pages/Admin/Notifications/AdminNotifications.jsx';
import AdminSettings from '../pages/Admin/Settings/AdminSettings.jsx';

import AccessDenied from '../pages/Errors/AccessDenied.jsx';
import NotFound from '../pages/Errors/NotFound.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import RoleRoute from './RoleRoute.jsx';
import { ROUTES, ROLES, getAuthenticatedHomeRoute } from '../constants/index.js';
import { useAuth } from '../context/AuthContext.jsx';

// Helper Redirect Components for Generic Navigation Aliases
const AuthenticatedDashboardRedirect = () => {
  const { user } = useAuth();
  const role = (user?.role || '').toUpperCase().trim();
  return <Navigate to={getAuthenticatedHomeRoute(role)} replace />;
};

const AuthenticatedApplicationsRedirect = () => {
  const { user } = useAuth();
  const role = (user?.role || '').toUpperCase().trim();
  if (role === ROLES.EMPLOYER) return <Navigate to={ROUTES.EMPLOYER_JOBS} replace />;
  if (role === ROLES.ADMIN) return <Navigate to={ROUTES.ADMIN_SCHEME_APPLICATIONS} replace />;
  return <Navigate to={ROUTES.VETERAN_APPLICATIONS} replace />;
};

const AuthenticatedProfileRedirect = () => {
  const { user } = useAuth();
  const role = (user?.role || '').toUpperCase().trim();
  if (role === ROLES.EMPLOYER) return <Navigate to={ROUTES.EMPLOYER_PROFILE} replace />;
  if (role === ROLES.ADMIN) return <Navigate to={ROUTES.ADMIN_SETTINGS} replace />;
  return <Navigate to={ROUTES.VETERAN_PROFILE} replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. Public Landing Pages (Clean Top Navbar, NO Sidebar) */}
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.ABOUT} element={<About />} />
        <Route path={ROUTES.CONTACT} element={<Contact />} />
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
      </Route>

      {/* 2. Admin Panel Routes with Dedicated AdminLayout */}
      <Route
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />
        <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboard />} />
        <Route path={ROUTES.ADMIN_VETERANS} element={<AdminVeteransList />} />
        <Route path="/admin/veterans/:id" element={<AdminVeteranDetail />} />
        <Route path={ROUTES.ADMIN_EMPLOYERS} element={<AdminEmployersList />} />
        <Route path="/admin/employers/:id" element={<AdminEmployerDetail />} />
        <Route path={ROUTES.ADMIN_DOCUMENTS} element={<AdminDocumentsList />} />
        <Route path={ROUTES.ADMIN_USERS} element={<AdminUsersList />} />
        <Route path={ROUTES.ADMIN_SCHEMES} element={<AdminSchemesList />} />
        <Route path={ROUTES.ADMIN_SCHEME_CREATE} element={<AdminSchemeForm />} />
        <Route path="/admin/schemes/:id/edit" element={<AdminSchemeForm />} />
        <Route path={ROUTES.ADMIN_JOBS} element={<AdminJobsList />} />
        <Route path={ROUTES.ADMIN_SCHEME_APPLICATIONS} element={<AdminSchemeApplicationsList />} />
        <Route path="/admin/applications/schemes/:id" element={<AdminSchemeApplicationDetail />} />
        <Route path={ROUTES.ADMIN_JOB_APPLICATIONS} element={<AdminJobApplicationsList />} />
        <Route path="/admin/applications/jobs/:id" element={<AdminJobApplicationDetail />} />
        <Route path={ROUTES.ADMIN_ANALYTICS} element={<AdminAnalytics />} />
        <Route path={ROUTES.ADMIN_REPORTS} element={<AdminReports />} />
        <Route path={ROUTES.ADMIN_AUDIT_LOGS} element={<AdminAuditLogs />} />
        <Route path={ROUTES.ADMIN_NOTIFICATIONS} element={<AdminNotifications />} />
        <Route path={ROUTES.ADMIN_SETTINGS} element={<AdminSettings />} />
      </Route>

      {/* 3. Main Portal & Authenticated Routes with Hamburger & Slide-in Drawer */}
      <Route element={<MainLayout />}>
        {/* Generic Route Aliases */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AuthenticatedDashboardRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications"
          element={
            <ProtectedRoute>
              <AuthenticatedApplicationsRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AuthenticatedProfileRedirect />
            </ProtectedRoute>
          }
        />

        {/* Protected Schemes Module (Requires Login) */}
        <Route
          path={ROUTES.SCHEMES}
          element={
            <ProtectedRoute>
              <SchemesList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schemes/:id"
          element={
            <ProtectedRoute>
              <SchemeDetail />
            </ProtectedRoute>
          }
        />

        {/* Protected Jobs Module (Requires Login) */}
        <Route
          path={ROUTES.JOBS}
          element={
            <ProtectedRoute>
              <JobsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:id"
          element={
            <ProtectedRoute>
              <JobDetail />
            </ProtectedRoute>
          }
        />

        {/* Protected Veteran Modules */}
        <Route
          path="/veteran"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.VETERAN]}>
                <Navigate to={ROUTES.VETERAN_DASHBOARD} replace />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.VETERAN_DASHBOARD}
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.VETERAN]}>
                <VeteranDashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.VETERAN_PROFILE}
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.VETERAN]}>
                <Profile />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.VETERAN_DOCUMENTS}
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.VETERAN]}>
                <Documents />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* Welfare Scheme Applications */}
        <Route
          path="/veteran/apply/:schemeId"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.VETERAN]}>
                <ApplyScheme />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.VETERAN_APPLICATIONS}
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.VETERAN]}>
                <ApplicationsList />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/veteran/applications/:id"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.VETERAN]}>
                <ApplicationDetail />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* Veteran Job Applications & Bookmarks */}
        <Route
          path={ROUTES.VETERAN_JOB_APPLICATIONS}
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.VETERAN]}>
                <MyJobApplications />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/veteran/job-applications/:id"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.VETERAN]}>
                <JobApplicationDetail />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.VETERAN_SAVED_JOBS}
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.VETERAN]}>
                <SavedJobs />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* Veteran Notification Center */}
        <Route
          path={ROUTES.VETERAN_NOTIFICATIONS}
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.VETERAN]}>
                <NotificationCenter />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* Protected Employer Management Modules */}
        <Route
          path="/employer"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.EMPLOYER]}>
                <Navigate to={ROUTES.EMPLOYER_DASHBOARD} replace />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.EMPLOYER_DASHBOARD}
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.EMPLOYER]}>
                <EmployerDashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.EMPLOYER_PROFILE}
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.EMPLOYER]}>
                <EmployerProfile />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.EMPLOYER_JOBS}
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.EMPLOYER]}>
                <EmployerJobsList />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/employer/applications"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.EMPLOYER]}>
                <Navigate to={ROUTES.EMPLOYER_JOBS} replace />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.EMPLOYER_JOB_CREATE}
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.EMPLOYER]}>
                <CreateJob />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/employer/jobs/:id/edit"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.EMPLOYER]}>
                <EditJob />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/employer/jobs/:jobId/applications"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.EMPLOYER]}>
                <EmployerJobApplicants />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/employer/applications/:id"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.EMPLOYER]}>
                <EmployerApplicantDetail />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* Employer Notification Center */}
        <Route
          path={ROUTES.EMPLOYER_NOTIFICATIONS}
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[ROLES.EMPLOYER]}>
                <NotificationCenter />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* Error Fallbacks */}
        <Route path={ROUTES.ACCESS_DENIED} element={<AccessDenied />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
