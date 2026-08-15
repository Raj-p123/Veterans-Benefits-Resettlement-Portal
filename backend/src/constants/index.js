export const ROLES = {
  VETERAN: 'VETERAN',
  EMPLOYER: 'EMPLOYER',
  ADMIN: 'ADMIN',
};

export const PUBLIC_REGISTRATION_ROLES = [
  ROLES.VETERAN,
  ROLES.EMPLOYER,
];

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

export const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Authentication token is required',
  INVALID_TOKEN: 'Invalid or expired authentication token',
  ACCESS_DENIED: 'You do not have permission to access this resource',
  USER_NOT_FOUND: 'User account not found',
  ACCOUNT_INACTIVE: 'Account is deactivated. Please contact support.',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_EXISTS: 'An account with this email already exists',
  ADMIN_REGISTRATION_BLOCKED: 'Admin accounts cannot be created via public registration',
  ROUTE_NOT_FOUND: 'API route not found',
};
