import { Router } from 'express';
import {
  getPublicJobs,
  getNearbyJobs,
  getFeaturedJobs,
  getRecommendedJobs,
  getJobById,
  saveJob,
  unsaveJob,
  getSavedJobs,
  applyForJob,
  getMyJobApplications,
  getJobApplicationDetail,
  withdrawJobApplication,
} from '../controllers/job.controller.js';
import { authenticate, optionalAuthenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { ROLES } from '../constants/index.js';

const router = Router();

// Public Job Listing & Map Discovery
router.get('/', optionalAuthenticate, getPublicJobs);
router.get('/nearby', optionalAuthenticate, getNearbyJobs);
router.get('/featured', getFeaturedJobs);

// Veteran Recommendation & Saved Bookmarks
router.get('/recommended', authenticate, authorizeRoles(ROLES.VETERAN, ROLES.ADMIN), getRecommendedJobs);
router.get('/saved', authenticate, authorizeRoles(ROLES.VETERAN, ROLES.ADMIN), getSavedJobs);
router.post('/:id/save', authenticate, authorizeRoles(ROLES.VETERAN), saveJob);
router.delete('/:id/save', authenticate, authorizeRoles(ROLES.VETERAN), unsaveJob);

// Job Applications (Veteran Tracking & Withdrawal)
router.get('/applications/my', authenticate, authorizeRoles(ROLES.VETERAN, ROLES.ADMIN), getMyJobApplications);
router.get('/applications/:id', authenticate, getJobApplicationDetail);
router.post('/applications/:id/withdraw', authenticate, authorizeRoles(ROLES.VETERAN), withdrawJobApplication);

// Apply for Job
router.post('/:jobId/apply', authenticate, authorizeRoles(ROLES.VETERAN), applyForJob);

// Single Job Details
router.get('/:id', optionalAuthenticate, getJobById);

export default router;
