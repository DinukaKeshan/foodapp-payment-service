import { jest } from '@jest/globals';
import {
  AppError,
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  PaymentError,
  InsufficientFundsError,
} from '../../src/utils/errors.js';

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    it('should create error with status code and message', () => {
      const error = new AppError('Something went wrong', 500);
      expect(error.message).toBe('Something went wrong');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.status).toBe('error');
      expect(error instanceof Error).toBe(true);
    });

    it('should set status to fail for 4xx codes', () => {
      const error = new AppError('Not found', 404);
      expect(error.status).toBe('fail');
    });
  });

  describe('NotFoundError', () => {
    it('should default to 404 status', () => {
      const error = new NotFoundError();
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Resource not found');
    });

    it('should accept custom message', () => {
      const error = new NotFoundError('Payment not found');
      expect(error.message).toBe('Payment not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('BadRequestError', () => {
    it('should default to 400 status', () => {
      const error = new BadRequestError();
      expect(error.statusCode).toBe(400);
    });
  });

  describe('UnauthorizedError', () => {
    it('should default to 401 status', () => {
      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Unauthorized');
    });
  });

  describe('ConflictError', () => {
    it('should default to 409 status', () => {
      const error = new ConflictError();
      expect(error.statusCode).toBe(409);
    });
  });

  describe('PaymentError', () => {
    it('should default to 402 status', () => {
      const error = new PaymentError();
      expect(error.statusCode).toBe(402);
      expect(error.message).toBe('Payment processing failed');
    });
  });

  describe('InsufficientFundsError', () => {
    it('should default to 402 status', () => {
      const error = new InsufficientFundsError();
      expect(error.statusCode).toBe(402);
      expect(error.message).toBe('Insufficient wallet balance');
    });
  });
});
