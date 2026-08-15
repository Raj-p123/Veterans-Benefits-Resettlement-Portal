import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.js';
import authRoutes from './auth.routes.js';
import veteranRoutes from './veteran.routes.js';
import employerRoutes from './employer.routes.js';
import adminRoutes from './admin.routes.js';
import schemeRoutes from './scheme.routes.js';
import jobRoutes from './job.routes.js';
import applicationRoutes from './application.routes.js';
import notificationRoutes from './notification.routes.js';
import documentRoutes from './document.routes.js';
import testRoutes from './test.routes.js';

const router = Router();

// Health check endpoint: GET /api/health
router.get('/health', getHealth);

// Feature routes
router.use('/auth', authRoutes);
router.use('/veteran', veteranRoutes);
router.use('/veterans', veteranRoutes); // Support both singular and plural alias
router.use('/employer', employerRoutes);
router.use('/employers', employerRoutes);
router.use('/admin', adminRoutes);
router.use('/documents', documentRoutes);
router.use('/schemes', schemeRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/notifications', notificationRoutes);
router.use('/test', testRoutes);

export default router;
