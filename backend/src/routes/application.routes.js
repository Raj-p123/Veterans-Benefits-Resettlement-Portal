import { Router } from 'express';
import {
  createApplication,
  getMyApplications,
  getApplicationStats,
  getApplicationById,
  updateApplication,
  submitApplication,
  withdrawApplication,
  updateApplicationStatus,
} from '../controllers/application.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { ROLES } from '../constants/index.js';

const router = Router();

// Enforce authentication across all application endpoints
router.use(authenticate);

// Veteran Application Lifecycle
router.post('/', authorizeRoles(ROLES.VETERAN), createApplication);
router.get('/my', authorizeRoles(ROLES.VETERAN), getMyApplications);
router.get('/stats', authorizeRoles(ROLES.VETERAN), getApplicationStats);
router.get('/:id', getApplicationById);
router.put('/:id', authorizeRoles(ROLES.VETERAN), updateApplication);
router.post('/:id/submit', authorizeRoles(ROLES.VETERAN), submitApplication);
router.post('/:id/withdraw', authorizeRoles(ROLES.VETERAN), withdrawApplication);

// Admin Status Management
router.put('/:id/status', authorizeRoles(ROLES.ADMIN), updateApplicationStatus);

export default router;
