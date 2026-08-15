import { Router } from 'express';
import {
  getProfile,
  createProfile,
  updateProfile,
  getProfileCompletion,
} from '../controllers/veteran.controller.js';
import {
  uploadDocument,
  replaceDocument,
  getDocuments,
  getDocumentById,
  streamDocumentFile,
  downloadDocumentFile,
  deleteDocument,
} from '../controllers/document.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { handleUpload } from '../middleware/upload.middleware.js';
import { ROLES } from '../constants/index.js';

const router = Router();

// Enforce authentication & VETERAN role across all veteran routes
router.use(authenticate, authorizeRoles(ROLES.VETERAN));

// --- Profile Endpoints ---
router.get('/profile', getProfile);
router.post('/profile', createProfile);
router.put('/profile', updateProfile);
router.get('/profile/completion', getProfileCompletion);

// --- Document Management Endpoints ---
router.post('/documents', handleUpload, uploadDocument);
router.get('/documents', getDocuments);
router.get('/documents/:id', getDocumentById);
router.get('/documents/:id/file', streamDocumentFile);
router.get('/documents/:id/view', streamDocumentFile);
router.get('/documents/:id/download', downloadDocumentFile);
router.put('/documents/:id/replace', handleUpload, replaceDocument);
router.delete('/documents/:id', deleteDocument);

export default router;
