import { jest } from '@jest/globals';
import { generateId, apiResponse, asyncHandler } from '../../src/utils/helpers.js';

describe('Helpers Utility', () => {
  describe('generateId', () => {
    it('should generate a unique ID with prefix', () => {
      const id = generateId('PAY');
      expect(id).toMatch(/^PAY[A-Z0-9]{12}$/);
    });

    it('should generate a unique ID without prefix', () => {
      const id = generateId();
      expect(id).toMatch(/^[A-Z0-9]{12}$/);
    });

    it('should generate unique IDs on subsequent calls', () => {
      const id1 = generateId('TXN');
      const id2 = generateId('TXN');
      expect(id1).not.toBe(id2);
    });
  });

  describe('apiResponse', () => {
    it('should return success response for 2xx status codes', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      apiResponse(res, 200, 'Success', { foo: 'bar' });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: { foo: 'bar' },
      });
    });

    it('should return failure response for 4xx status codes', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      apiResponse(res, 400, 'Bad Request');

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Bad Request',
      });
    });

    it('should omit data field when data is null', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      apiResponse(res, 200, 'OK', null);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'OK',
      });
    });
  });

  describe('asyncHandler', () => {
    it('should call the handler function', async () => {
      const handler = jest.fn().mockResolvedValue('result');
      const req = {};
      const res = {};
      const next = jest.fn();

      await asyncHandler(handler)(req, res, next);

      expect(handler).toHaveBeenCalledWith(req, res, next);
    });

    it('should call next with error when handler throws', async () => {
      const error = new Error('Test error');
      const handler = jest.fn().mockRejectedValue(error);
      const req = {};
      const res = {};
      const next = jest.fn();

      await asyncHandler(handler)(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
