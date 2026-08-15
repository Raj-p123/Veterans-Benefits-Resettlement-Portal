import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/index.js';

export const notFoundHandler = (req, res, next) => {
  return res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: ERROR_MESSAGES.ROUTE_NOT_FOUND,
  });
};
