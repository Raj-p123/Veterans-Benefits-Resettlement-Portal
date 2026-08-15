import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { ROLES } from '../constants/index.js';
import * as adminController from '../controllers/admin.controller.js';

const router = Router();

// Master Admin Protection: ALL routes below require authenticate + authorizeRoles('ADMIN')
router.use(authenticate, authorizeRoles(ROLES.ADMIN));

/* 1. Dashboard & Statistics */
router.get('/dashboard/stats', adminController.getDashboardStats);

/* 2. Veteran Management & Verification */
router.get('/veterans', adminController.getVeterans);
router.get('/veterans/:id', adminController.getVeteranById);
router.put('/veterans/:id/verification', adminController.updateVeteranVerification);

/* 3. Document Verification */
router.get('/documents', adminController.getDocuments);
router.put('/documents/:id/status', adminController.updateDocumentStatus);

/* 4. Employer Management & Verification */
router.get('/employers', adminController.getEmployers);
router.get('/employers/:id', adminController.getEmployerById);
router.put('/employers/:id/verification', adminController.updateEmployerVerification);

/* 5. User Account Management */
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/status', adminController.updateUserStatus);

/* 6. Welfare Scheme Management */
router.get('/schemes', adminController.getSchemes);
router.post('/schemes', adminController.createScheme);
router.get('/schemes/:id', adminController.getSchemeById);
router.put('/schemes/:id', adminController.updateScheme);
router.delete('/schemes/:id', adminController.deleteScheme);

/* 7. Job Management & Moderation */
router.get('/jobs', adminController.getJobs);
router.get('/jobs/:id', adminController.getJobById);
router.put('/jobs/:id/status', adminController.updateJobStatus);
router.delete('/jobs/:id', adminController.deleteJob);

/* 8. Scheme Application Management */
router.get('/applications/schemes', adminController.getSchemeApplications);
router.get('/applications/schemes/:id', adminController.getSchemeApplicationById);
router.put('/applications/schemes/:id/status', adminController.updateSchemeApplicationStatus);

/* 9. Job Application Monitoring */
router.get('/applications/jobs', adminController.getJobApplications);
router.get('/applications/jobs/:id', adminController.getJobApplicationById);

/* 10. Analytics & Aggregate Metrics */
router.get('/analytics', adminController.getAnalytics);

/* 11. Reports & CSV Exports */
router.get('/reports/summary', adminController.getReportsSummary);
router.get('/reports/veterans/export', adminController.exportVeteransCsv);
router.get('/reports/employers/export', adminController.exportEmployersCsv);
router.get('/reports/schemes/export', adminController.exportSchemesCsv);
router.get('/reports/jobs/export', adminController.exportJobsCsv);
router.get('/reports/scheme-applications/export', adminController.exportSchemeApplicationsCsv);
router.get('/reports/job-applications/export', adminController.exportJobApplicationsCsv);
router.get('/reports/verifications/export', adminController.exportVerificationsCsv);

/* 12. Audit Logs */
router.get('/audit-logs', adminController.getAuditLogs);

/* 13. Global Search */
router.get('/search', adminController.globalSearch);

/* 14. Settings & Password Management */
router.get('/settings/profile', adminController.getAdminProfile);
router.put('/settings/profile', adminController.updateAdminProfile);
router.put('/settings/change-password', adminController.changePassword);

export default router;
