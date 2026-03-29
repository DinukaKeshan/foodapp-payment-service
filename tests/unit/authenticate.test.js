import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../../src/utils/errors.js';

// Since we can't easily mock ESM config, we'll test the middleware logic directly
describe('Authentication Middleware', () => {
  let authenticate;
  let req, res, next;

  beforeAll(async () => {
    // Dynamic import to work with ESM
    const mod = await import('../../src/middlewares/authenticate.js');
    authenticate = mod.default;
  });

  beforeEach(() => {
    req = { headers: {} };
    res = {};
    next = jest.fn();
  });

  it('should call next with error when no authorization header', () => {
    authenticate(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(401);
  });

  it('should call next with error when header does not start with Bearer', () => {
    req.headers.authorization = 'Basic sometoken';
    authenticate(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('should call next with error for invalid JWT token', () => {
    req.headers.authorization = 'Bearer invalid.token.value';
    authenticate(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('should attach decoded user to req and call next() for valid token', () => {
    // Use the actual JWT_SECRET from the config default
    const secret = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';
    const payload = { userId: 'U456', email: 'test@test.com' };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });

    req.headers.authorization = `Bearer ${token}`;
    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(); // called with no arguments = success
    expect(req.user).toBeDefined();
    expect(req.user.userId).toBe('U456');
    expect(req.user.email).toBe('test@test.com');
  });

  it('should call next with error for expired token', () => {
    const secret = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';
    const token = jwt.sign({ userId: 'U456' }, secret, { expiresIn: '-1s' });

    req.headers.authorization = `Bearer ${token}`;
    authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});
