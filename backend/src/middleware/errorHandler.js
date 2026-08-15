import { HTTP_STATUS } from '../constants/index.js';
import { config } from '../config/environment.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    const extractedErrors = Object.values(err.errors).map((e) => e.message);
    message = extractedErrors[0] || 'Validation error';
    errors = extractedErrors;
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    const field = Object.keys(err.keyValue || {})[0] || 'Field';
    message = `An account with that ${field} already exists`;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = `Invalid resource identifier: ${err.value}`;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Authentication token has expired. Please login again.';
  }

  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  // Include stack trace only in development
  if (config.nodeEnv === 'development' && statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};
