import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { config } from './config/environment.js';
import routes from './routes/index.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import { User } from './models/User.js';
import { Document } from './models/Document.js';
import { checkDocumentAccess } from './controllers/document.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolved Candidate Paths for Static Assets and Production Frontend
export const getFrontendDistInfo = () => {
  const candidates = [
    path.resolve(__dirname, '../../frontend/dist'),
    path.resolve(__dirname, '../frontend/dist'),
    path.resolve(process.cwd(), 'frontend/dist'),
    path.resolve(process.cwd(), '../frontend/dist'),
    path.resolve('frontend/dist'),
    path.resolve('../frontend/dist'),
  ];

  for (const candidate of candidates) {
    const candidateIndex = path.join(candidate, 'index.html');
    if (fs.existsSync(candidateIndex)) {
      return { distPath: candidate, indexPath: candidateIndex, exists: true };
    }
  }

  const defaultDist = path.resolve(__dirname, '../../frontend/dist');
  return { distPath: defaultDist, indexPath: path.join(defaultDist, 'index.html'), exists: false };
};

const uploadsDocumentsPath = path.resolve(__dirname, '../../uploads/documents');
const uploadsPublicPath = path.resolve(__dirname, '../../uploads/public');

const app = express();

// Trust reverse proxy (Render, Railway, Heroku, Nginx, AWS ALB) for client IP & rate limiting
app.set('trust proxy', 1);

// Security Headers with Explicit Content Security Policy (CSP)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://*.tile.openstreetmap.org',
          'https://res.cloudinary.com',
          'https:',
        ],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        connectSrc: [
          "'self'",
          'ws:',
          'wss:',
          'https://veterans-benefits-resettlement-portal.onrender.com',
          'wss://veterans-benefits-resettlement-portal.onrender.com',
          ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
          ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
          ...(config.nodeEnv === 'development' || process.env.NODE_ENV === 'development'
            ? [
                'http://localhost:5000',
                'ws://localhost:5000',
                'http://127.0.0.1:5000',
                'ws://127.0.0.1:5000',
                'http://localhost:5173',
                'ws://localhost:5173',
              ]
            : []),
        ],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
  })
);

// CORS Configuration (Dynamic resolution for single, comma-separated, or same-domain origins)
const getAllowedOrigins = () => {
  const envOrigins = (process.env.FRONTEND_URL || process.env.CLIENT_URL || config.clientUrl || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return Array.from(new Set([
    ...envOrigins,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
  ])).filter(Boolean);
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server, same-origin navigations)
      if (!origin) return callback(null, true);

      const allowedOrigins = getAllowedOrigins();
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Check if request origin host matches Render deployment or local development
      try {
        const originUrl = new URL(origin);
        if (
          originUrl.hostname.endsWith('onrender.com') ||
          originUrl.hostname === 'localhost' ||
          originUrl.hostname === '127.0.0.1'
        ) {
          return callback(null, true);
        }
      } catch (e) {
        // Invalid origin format
      }

      // In development mode, allow localhost/127.0.0.1 origins
      if (process.env.NODE_ENV === 'development' || config.nodeEnv === 'development') {
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          return callback(null, true);
        }
      }

      // Reject unauthorized foreign origins cleanly without setting CORS headers
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve Frontend Production Assets (JS, CSS, images, icons, etc.) across candidate paths
const staticCandidates = [
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(__dirname, '../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(process.cwd(), '../frontend/dist'),
  path.resolve('frontend/dist'),
  path.resolve('../frontend/dist'),
];

const mountedStaticPaths = new Set();
for (const candidate of staticCandidates) {
  if (fs.existsSync(candidate) && !mountedStaticPaths.has(candidate)) {
    mountedStaticPaths.add(candidate);
    app.use(express.static(candidate));
  }
}

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

    let safeFilePath = path.resolve(uploadsDocumentsPath, filename);
    if (!fs.existsSync(safeFilePath)) {
      safeFilePath = path.resolve(__dirname, '../uploads/documents', filename);
    }
    if (!fs.existsSync(safeFilePath)) {
      safeFilePath = path.resolve('uploads', 'documents', filename);
    }

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

// Static File Serving for Public uploads
if (fs.existsSync(uploadsPublicPath)) {
  app.use('/uploads/public', express.static(uploadsPublicPath));
} else {
  app.use('/uploads/public', express.static(path.resolve(__dirname, '../uploads/public')));
}

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

// Master API Routes (Must be registered BEFORE SPA catch-all)
app.use('/api', routes);

// 404 Handler for undefined /api/* routes (so unmatched API calls return JSON 404, never index.html)
app.use('/api', notFoundHandler);

// Serve React SPA index.html for all client-side navigation routes
app.get('*', (req, res, next) => {
  // Never intercept API routes
  if (req.originalUrl.startsWith('/api') || req.path.startsWith('/api')) {
    return next();
  }

  const currentDist = getFrontendDistInfo();
  if (currentDist.exists) {
    return res.sendFile(currentDist.indexPath);
  }

  // Fallback if frontend is not built
  if (req.path === '/' || req.path === '') {
    return res.json({
      success: true,
      message: 'Welcome to the Veterans Benefits & Resettlement Portal REST API',
      version: '1.0.0',
      note: 'Frontend production build not detected at frontend/dist. Run "npm run build" to compile React frontend.',
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
  }

  return next();
});

// 404 Handler for any other unhandled non-GET requests
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

export default app;
