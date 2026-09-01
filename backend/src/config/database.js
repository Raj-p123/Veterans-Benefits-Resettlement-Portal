import mongoose from 'mongoose';
import { config } from './environment.js';

let isConnected = false;

// Helper to sanitize connection strings in logs
const sanitizeUri = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@)/gi, '$1***$3');
};

export const connectDB = async () => {
  if (isConnected) {
    console.log('[MongoDB] Already connected.');
    return;
  }

  if (!config.mongodbUri || !config.mongodbUri.trim()) {
    console.error('[MongoDB Error] MONGODB_URI is not set in environment variables.');
    console.warn('[MongoDB] Running without active database connection. Database-dependent operations will fail until MONGODB_URI is configured.');
    return;
  }

  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    const safeError = sanitizeUri(error.message);
    console.error(`[MongoDB Connection Error] ${safeError}`);
    console.warn('[MongoDB] Running without active database connection. Database-dependent operations will fail until MongoDB is available.');
  }
};

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[MongoDB] Connection lost.');
});

mongoose.connection.on('error', (err) => {
  const safeErr = sanitizeUri(err.message);
  console.error('[MongoDB Error]', safeErr);
});

export const getDBStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return {
    state: states[mongoose.connection.readyState] || 'unknown',
    isConnected: mongoose.connection.readyState === 1,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  };
};

export default connectDB;
