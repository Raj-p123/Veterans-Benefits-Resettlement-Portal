import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller.js';
import { testAuth, testVeteran, testEmployer, testAdmin } from '../controllers/test.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { ROLES } from '../constants/index.js';

const router = Router();

// Public Authentication Endpoints
router.post('/register', register);
router.post('/login', login);

// Protected Current User Endpoint
router.get('/me', authenticate, getMe);

// Protected Authorization Test Endpoints (for verification)
router.get('/test', authenticate, testAuth);
router.get('/test/veteran', authenticate, authorizeRoles(ROLES.VETERAN), testVeteran);
router.get('/test/employer', authenticate, authorizeRoles(ROLES.EMPLOYER), testEmployer);
router.get('/test/admin', authenticate, authorizeRoles(ROLES.ADMIN), testAdmin);

export default router;
