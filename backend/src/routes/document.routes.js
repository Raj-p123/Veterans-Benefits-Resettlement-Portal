import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { handleUpload } from '../middleware/upload.middleware.js';
import {
  uploadDocument,
  replaceDocument,
  getDocuments,
  getDocumentById,
  streamDocumentFile,
  downloadDocumentFile,
  deleteDocument,
} from '../controllers/document.controller.js';

const router = Router();

// All document routes require authentication
router.use(authenticate);

// List current user's documents & Upload
router.get('/', getDocuments);
router.post('/', handleUpload, uploadDocument);

// Single Document Operations with Contextual Authorization
router.get('/:id', getDocumentById);
router.get('/:id/file', streamDocumentFile);
router.get('/:id/view', streamDocumentFile);
router.get('/:id/download', downloadDocumentFile);
router.put('/:id/replace', handleUpload, replaceDocument);
router.delete('/:id', deleteDocument);

export default router;
