import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { config } from './config/environment.js';
import routes from './routes/index.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import { User } from './models/User.js';
import { Document } from './models/Document.js';
import { checkDocumentAccess } from './controllers/document.controller.js';

const app = express();

// Security Headers (Configured with crossOriginResourcePolicy for uploads)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS Configuration
const allowedOrigins = [
  config.clientUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in local dev
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Protected File Access for /uploads/documents: Enforce authentication and ownership
app.use('/uploads/documents/:filename', async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : queryToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required to access confidential veteran documents.',
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const userId = decoded.id || decoded.userId;
    const user = await User.findById(userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication session.',
      });
    }

    const filename = path.basename(req.params.filename);
    const doc = await Document.findOne({ fileUrl: new RegExp(filename, 'i') });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document record not found.',
      });
    }

    const hasAccess = await checkDocumentAccess(doc, user);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You do not have authorization to view this document.',
      });
    }

    const safeFilePath = path.resolve('uploads', 'documents', filename);
    if (!fs.existsSync(safeFilePath)) {
      return res.status(404).json({
        success: false,
        message: 'Physical document file not found on disk.',
      });
    }

    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.sendFile(safeFilePath);
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
});

// Static File Serving for Public assets only
app.use('/uploads/public', express.static(path.resolve('uploads', 'public')));

// Request Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// 1. Rate Limiting on Auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

// 2. Rate Limiting on File Uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60, // 60 uploads per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'File upload rate limit reached. Please wait before uploading more documents.',
  },
});

// 3. Rate Limiting on Administrative Verifications
const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150, // 150 verifications per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many verification actions. Please wait a few moments.',
  },
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/documents', uploadLimiter);
app.use('/api/veterans/documents', uploadLimiter);
app.use('/api/admin/documents/:id/status', verificationLimiter);
app.use('/api/admin/veterans/:id/verification', verificationLimiter);
app.use('/api/admin/employers/:id/verification', verificationLimiter);

// Root Welcome Endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Veterans Benefits & Resettlement Portal REST API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      veteranProfile: '/api/veterans/profile',
      veteranDocuments: '/api/veterans/documents',
      schemes: '/api/schemes',
      jobs: '/api/jobs',
      admin: '/api/admin',
    },
  });
});

// Master API Routes
app.use('/api', routes);

// 404 Handler for undefined routes
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

export default app;
