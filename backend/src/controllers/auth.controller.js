import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { validateRegisterInput, validateLoginInput } from '../validators/auth.validator.js';
import { sendSuccess, sendCreated } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { config } from '../config/environment.js';
import { ERROR_MESSAGES } from '../constants/index.js';
import { socketService } from '../services/socketService.js';

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id || user.id,
      role: user.role,
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn,
    }
  );
};

export const register = async (req, res, next) => {
  try {
    const validatedData = validateRegisterInput(req.body);

    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      throw ApiError.badRequest(ERROR_MESSAGES.EMAIL_EXISTS);
    }

    const user = await User.create({
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone,
      password: validatedData.password,
      role: validatedData.role,
      isActive: true,
      isVerified: false,
    });

    const token = generateToken(user);
    const userJson = user.toJSON();

    // Emit Real-Time notification & event to ADMIN role
    const eventName =
      user.role === 'VETERAN'
        ? 'admin:veteranRegistered'
        : user.role === 'EMPLOYER'
        ? 'admin:employerRegistered'
        : 'admin:userRegistered';

    socketService.emitToRole('ADMIN', eventName, {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
    socketService.emitToRole('ADMIN', 'admin:dashboardUpdated', { module: 'users', role: user.role });

    return sendCreated(res, 'Registration successful', {
      user: userJson,
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = validateLoginInput(req.body);

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw ApiError.unauthorized(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw ApiError.forbidden(ERROR_MESSAGES.ACCOUNT_INACTIVE);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user);
    const userJson = user.toJSON();

    return sendSuccess(res, 'Login successful', {
      user: userJson,
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized(ERROR_MESSAGES.AUTH_REQUIRED);
    }

    return sendSuccess(res, 'Current user retrieved successfully', {
      user: req.user.toJSON ? req.user.toJSON() : req.user,
    });
  } catch (error) {
    next(error);
  }
};
