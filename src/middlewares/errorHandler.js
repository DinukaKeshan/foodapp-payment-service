import logger from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import config from '../config/index.js';

/**
 * Global error handling middleware.
 * Differentiates operational errors from programming bugs.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let status = err.status || 'error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    status = 'fail';
    const messages = Object.values(err.errors).map((e) => e.message);
    message = messages.join('. ');
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    status = 'fail';
    const field = Object.keys(err.keyValue).join(', ');
    message = `Duplicate value for field: ${field}`;
  }

  // Mongoose cast error (invalid ObjectId etc.)
  if (err.name === 'CastError') {
    statusCode = 400;
    status = 'fail';
    message = `Invalid value for ${err.path}: ${err.value}`;
  }

  // Stripe errors
  if (err.type && err.type.startsWith('Stripe')) {
    statusCode = err.statusCode || 402;
    status = 'fail';
    message = err.message;
  }

  // Log error
  if (statusCode >= 500) {
    logger.error(`${statusCode} - ${message}`, {
      error: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.warn(`${statusCode} - ${message}`, {
      url: req.originalUrl,
      method: req.method,
    });
  }

  const response = {
    success: false,
    status,
    message,
    ...(config.env === 'development' && {
      stack: err.stack,
      error: err,
    }),
  };

  res.status(statusCode).json(response);
};

export default errorHandler;
