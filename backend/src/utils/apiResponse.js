import { HTTP_STATUS } from '../constants/index.js';

export const sendResponse = (res, statusCode = HTTP_STATUS.OK, message = 'Success', data = null) => {
  const response = {
    success: statusCode >= 200 && statusCode < 300,
    message,
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

export const sendSuccess = (res, message = 'Request successful', data = null, statusCode = HTTP_STATUS.OK) => {
  return sendResponse(res, statusCode, message, data);
};

export const sendCreated = (res, message = 'Resource created successfully', data = null) => {
  return sendResponse(res, HTTP_STATUS.CREATED, message, data);
};
