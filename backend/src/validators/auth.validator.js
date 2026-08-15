import { PUBLIC_REGISTRATION_ROLES, ERROR_MESSAGES } from '../constants/index.js';
import { ApiError } from '../utils/apiError.js';

export const validateRegisterInput = (data) => {
  const { name, email, phone, password, role } = data;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Full name is required and must be at least 2 characters long');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(String(email).trim())) {
    errors.push('A valid email address is required');
  }

  if (!phone || typeof phone !== 'string' || phone.trim().length < 7) {
    errors.push('A valid phone number is required (at least 7 digits)');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (role) {
    const normalizedRole = String(role).toUpperCase().trim();
    if (normalizedRole === 'ADMIN') {
      throw ApiError.badRequest(ERROR_MESSAGES.ADMIN_REGISTRATION_BLOCKED);
    }
    if (!PUBLIC_REGISTRATION_ROLES.includes(normalizedRole)) {
      errors.push(`Role must be one of: ${PUBLIC_REGISTRATION_ROLES.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    throw ApiError.badRequest(errors[0], errors);
  }

  return {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    password,
    role: role ? String(role).toUpperCase().trim() : 'VETERAN',
  };
};

export const validateLoginInput = (data) => {
  const { email, password } = data;
  const errors = [];

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Email is required');
  }

  if (!password || typeof password !== 'string' || !password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    throw ApiError.badRequest('Email and password are required', errors);
  }

  return {
    email: email.toLowerCase().trim(),
    password,
  };
};
