import { Router } from 'express';
import {
  getEmployerProfile,
  saveEmployerProfile,
  createJob,
  getEmployerJobs,
  getEmployerJobById,
  updateJob,
  updateJobStatus,
  getJobApplicants,
  getApplicantDetail,
  updateApplicantStatus,
  getEmployerDashboardStats,
} from '../controllers/employer.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { ROLES } from '../constants/index.js';

const router = Router();

// Enforce authentication & EMPLOYER/ADMIN role
router.use(authenticate);

// Profile
router.get('/profile', authorizeRoles(ROLES.EMPLOYER, ROLES.ADMIN), getEmployerProfile);
router.post('/profile', authorizeRoles(ROLES.EMPLOYER), saveEmployerProfile);
router.put('/profile', authorizeRoles(ROLES.EMPLOYER), saveEmployerProfile);

// Dashboard Stats
router.get('/dashboard/stats', authorizeRoles(ROLES.EMPLOYER, ROLES.ADMIN), getEmployerDashboardStats);

// Job Postings Management
router.post('/jobs', authorizeRoles(ROLES.EMPLOYER), createJob);
router.get('/jobs', authorizeRoles(ROLES.EMPLOYER, ROLES.ADMIN), getEmployerJobs);
router.get('/jobs/:id', authorizeRoles(ROLES.EMPLOYER, ROLES.ADMIN), getEmployerJobById);
router.put('/jobs/:id', authorizeRoles(ROLES.EMPLOYER), updateJob);
router.patch('/jobs/:id/status', authorizeRoles(ROLES.EMPLOYER, ROLES.ADMIN), updateJobStatus);
router.delete('/jobs/:id', authorizeRoles(ROLES.EMPLOYER), updateJobStatus);

// Applicant Review Management
router.get('/jobs/:jobId/applications', authorizeRoles(ROLES.EMPLOYER, ROLES.ADMIN), getJobApplicants);
router.get('/applications/:id', authorizeRoles(ROLES.EMPLOYER, ROLES.ADMIN), getApplicantDetail);
router.put('/applications/:id/status', authorizeRoles(ROLES.EMPLOYER, ROLES.ADMIN), updateApplicantStatus);

export default router;
