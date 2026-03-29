import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a prefixed unique ID.
 * @param {string} prefix - e.g. 'PAY', 'WAL', 'TXN', 'INV'
 * @returns {string}
 */
export const generateId = (prefix = '') => {
  const shortUuid = uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();
  return prefix ? `${prefix}${shortUuid}` : shortUuid;
};

/**
 * Build a standardized API response.
 */
export const apiResponse = (res, statusCode, message, data = null) => {
  const response = {
    success: statusCode >= 200 && statusCode < 300,
    message,
    ...(data !== null && { data }),
  };
  return res.status(statusCode).json(response);
};

/**
 * Async handler wrapper to avoid repetitive try/catch.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
