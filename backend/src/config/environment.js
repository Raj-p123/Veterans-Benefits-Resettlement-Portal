import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/veterans_portal',
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_veterans_portal_2026_fallback',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  clientUrl: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173',
  admin: {
    name: process.env.ADMIN_NAME || 'Portal Administrator',
    email: (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase().trim(),
    password: process.env.ADMIN_PASSWORD || 'AdminPassword123!',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    isConfigured: !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ),
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : '',
    from: process.env.EMAIL_FROM ? process.env.EMAIL_FROM.trim() : 'onboarding@resend.dev',
    isConfigured: !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim().length > 0),
  },
  search: {
    apiKey: process.env.SEARCH_API_KEY ? process.env.SEARCH_API_KEY.trim() : '',
    apiUrl: process.env.SEARCH_API_URL ? process.env.SEARCH_API_URL.trim() : 'https://api.tavily.com/search',
    provider: process.env.SEARCH_PROVIDER ? process.env.SEARCH_PROVIDER.trim().toLowerCase() : 'tavily',
    isConfigured: !!(process.env.SEARCH_API_KEY && process.env.SEARCH_API_KEY.trim().length > 0),
  },
};

export default config;
