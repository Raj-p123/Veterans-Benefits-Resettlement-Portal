import { Router } from 'express';
import {
  testAuth,
  testVeteran,
  testEmployer,
  testAdmin,
  testEmail,
} from '../controllers/test.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { ROLES } from '../constants/index.js';

const router = Router();

// Authorization verification endpoints
router.get('/auth', authenticate, testAuth);
router.get('/veteran', authenticate, authorizeRoles(ROLES.VETERAN), testVeteran);
router.get('/employer', authenticate, authorizeRoles(ROLES.EMPLOYER), testEmployer);
router.get('/admin', authenticate, authorizeRoles(ROLES.ADMIN), testAdmin);

// Development email testing endpoint: POST /api/test/email
router.post('/email', authenticate, testEmail);

export default router;
