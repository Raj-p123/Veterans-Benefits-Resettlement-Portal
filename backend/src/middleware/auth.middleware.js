import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { config } from '../config/environment.js';
import { ERROR_MESSAGES } from '../constants/index.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized(ERROR_MESSAGES.AUTH_REQUIRED);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw ApiError.unauthorized(ERROR_MESSAGES.AUTH_REQUIRED);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      throw ApiError.unauthorized(ERROR_MESSAGES.INVALID_TOKEN);
    }

    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId);

    if (!user) {
      throw ApiError.unauthorized(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (!user.isActive) {
      throw ApiError.forbidden(ERROR_MESSAGES.ACCOUNT_INACTIVE);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      const userId = decoded.userId || decoded.id;
      const user = await User.findById(userId);
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (err) {
      // Ignore token error for optional auth
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized(ERROR_MESSAGES.AUTH_REQUIRED));
    }

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(ERROR_MESSAGES.ACCESS_DENIED));
    }

    next();
  };
};
