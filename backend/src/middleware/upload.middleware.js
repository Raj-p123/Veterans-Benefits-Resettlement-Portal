import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { ApiError } from '../utils/apiError.js';

// Ensure uploads directory exists
const uploadDir = path.resolve('uploads', 'documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage Configuration with Cryptographically Safe Filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeRandom = crypto.randomBytes(12).toString('hex');
    cb(null, `doc_${Date.now()}_${safeRandom}${ext}`);
  },
});

// Explicitly Permitted MIME Types and Extensions
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];

// Explicit Dangerous Executable & Script Blacklist
const FORBIDDEN_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.js',
  '.mjs',
  '.html',
  '.htm',
  '.php',
  '.vbs',
  '.ps1',
  '.dll',
  '.com',
  '.scr',
  '.jar',
  '.msi',
  '.py',
  '.rb',
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (FORBIDDEN_EXTENSIONS.includes(ext)) {
    return cb(
      ApiError.badRequest(
        `Security Violation: Executable and script files (${ext}) are strictly forbidden.`
      ),
      false
    );
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype) || !ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      ApiError.badRequest(
        'Invalid document format. Only verified PDF, JPG, JPEG, PNG, and WEBP documents are permitted.'
      ),
      false
    );
  }

  cb(null, true);
};

export const uploadDocumentMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum
  },
  fileFilter,
}).single('file');

export const handleUpload = (req, res, next) => {
  uploadDocumentMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(ApiError.badRequest('File size exceeds the maximum allowed limit of 10 MB'));
      }
      return next(ApiError.badRequest(`File upload error: ${err.message}`));
    } else if (err) {
      return next(err);
    }

    if (!req.file && !req.body?.fileUrl) {
      return next(ApiError.badRequest('Please attach a document file to upload'));
    }

    next();
  });
};
