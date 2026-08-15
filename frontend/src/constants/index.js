export const ROLES = {
  VETERAN: 'VETERAN',
  EMPLOYER: 'EMPLOYER',
  ADMIN: 'ADMIN',
};

export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  SCHEMES: '/schemes',
  SCHEME_DETAIL: '/schemes/:id',
  JOBS: '/jobs',
  JOB_DETAIL: '/jobs/:id',
  LOGIN: '/login',
  REGISTER: '/register',
  
  // Veteran routes
  VETERAN_DASHBOARD: '/veteran/dashboard',
  VETERAN_PROFILE: '/veteran/profile',
  VETERAN_DOCUMENTS: '/veteran/documents',
  VETERAN_APPLICATIONS: '/veteran/applications',
  VETERAN_APPLY: '/veteran/apply/:schemeId',
  VETERAN_JOB_APPLICATIONS: '/veteran/job-applications',
  VETERAN_JOB_APPLICATION_DETAIL: '/veteran/job-applications/:id',
  VETERAN_SAVED_JOBS: '/veteran/saved-jobs',
  VETERAN_NOTIFICATIONS: '/veteran/notifications',

  // Employer routes
  EMPLOYER_DASHBOARD: '/employer/dashboard',
  EMPLOYER_PROFILE: '/employer/profile',
  EMPLOYER_JOBS: '/employer/jobs',
  EMPLOYER_JOB_CREATE: '/employer/jobs/create',
  EMPLOYER_JOB_EDIT: '/employer/jobs/:id/edit',
  EMPLOYER_JOB_APPLICANTS: '/employer/jobs/:jobId/applications',
  EMPLOYER_APPLICANT_DETAIL: '/employer/applications/:id',
  EMPLOYER_NOTIFICATIONS: '/employer/notifications',

  // Phase 8 Admin routes
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_VETERANS: '/admin/veterans',
  ADMIN_VETERAN_DETAIL: '/admin/veterans/:id',
  ADMIN_EMPLOYERS: '/admin/employers',
  ADMIN_EMPLOYER_DETAIL: '/admin/employers/:id',
  ADMIN_DOCUMENTS: '/admin/documents',
  ADMIN_USERS: '/admin/users',
  ADMIN_SCHEMES: '/admin/schemes',
  ADMIN_SCHEME_CREATE: '/admin/schemes/create',
  ADMIN_SCHEME_EDIT: '/admin/schemes/:id/edit',
  ADMIN_JOBS: '/admin/jobs',
  ADMIN_SCHEME_APPLICATIONS: '/admin/applications/schemes',
  ADMIN_SCHEME_APPLICATION_DETAIL: '/admin/applications/schemes/:id',
  ADMIN_JOB_APPLICATIONS: '/admin/applications/jobs',
  ADMIN_JOB_APPLICATION_DETAIL: '/admin/applications/jobs/:id',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_AUDIT_LOGS: '/admin/audit-logs',
  ADMIN_NOTIFICATIONS: '/admin/notifications',
  ADMIN_SETTINGS: '/admin/settings',

  EMPLOYER_APPLICATIONS: '/employer/applications',
  ACCESS_DENIED: '/access-denied',
};

export const ROLE_DASHBOARD_MAP = {
  [ROLES.VETERAN]: ROUTES.VETERAN_DASHBOARD,
  [ROLES.EMPLOYER]: ROUTES.EMPLOYER_DASHBOARD,
  [ROLES.ADMIN]: ROUTES.ADMIN_DASHBOARD,
};

export const getAuthenticatedHomeRoute = (role) => {
  if (!role) return ROUTES.HOME;
  const normalized = String(role).toUpperCase().trim();
  return ROLE_DASHBOARD_MAP[normalized] || ROUTES.HOME;
};

export const STORAGE_KEYS = {
  TOKEN: 'vbrp_auth_token',
  USER: 'vbrp_auth_user',
};
