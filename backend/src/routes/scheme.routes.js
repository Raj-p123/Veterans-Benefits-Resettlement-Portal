import { Router } from 'express';
import {
  getSchemes,
  searchSchemes,
  getFeaturedSchemes,
  getSchemeById,
  checkEligibility,
  getRecommendedSchemes,
} from '../controllers/scheme.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { ROLES } from '../constants/index.js';

const router = Router();

// Public Scheme Endpoints
router.get('/', getSchemes);
router.get('/search', searchSchemes);
router.get('/autocomplete', searchSchemes);
router.get('/featured', getFeaturedSchemes);
router.get('/recommended', authenticate, authorizeRoles(ROLES.VETERAN), getRecommendedSchemes);
router.post('/check-eligibility', authenticate, authorizeRoles(ROLES.VETERAN), checkEligibility);
router.get('/:id', getSchemeById);

export default router;
