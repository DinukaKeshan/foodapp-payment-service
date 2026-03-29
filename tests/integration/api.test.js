import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

// Generate a valid JWT for testing
const generateTestToken = (payload = { userId: 'U456', email: 'test@test.com' }) => {
  return jwt.sign(payload, 'your-jwt-secret-key-change-in-production', { expiresIn: '1h' });
};

// Mock Stripe before importing app
jest.unstable_mockModule('stripe', () => {
  const mockStripe = {
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded',
        latest_charge: {
          payment_method_details: {
            card: { last4: '4242' },
          },
        },
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded',
      }),
    },
    refunds: {
      create: jest.fn().mockResolvedValue({
        id: 're_test_123',
        status: 'succeeded',
      }),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  };

  return {
    default: jest.fn(() => mockStripe),
  };
});

const { default: app } = await import('../../app.js');
const { default: supertest } = await import('supertest');

const request = supertest(app);
const token = generateTestToken();

describe('Health Check', () => {
  it('GET /health should return 200', async () => {
    const res = await request.get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('payment-service');
  });
});

describe('404 Handler', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request
      .get('/api/nonexistent')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('Authentication', () => {
  it('should reject requests without token', async () => {
    const res = await request.get('/api/payments/user/U456');
    expect(res.status).toBe(401);
  });

  it('should reject requests with invalid token', async () => {
    const res = await request
      .get('/api/payments/user/U456')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
  });
});

describe('Payment Validation', () => {
  it('POST /api/payments should reject missing required fields', async () => {
    const res = await request
      .post('/api/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Validation error');
  });

  it('POST /api/payments should reject negative amount', async () => {
    const res = await request
      .post('/api/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderId: 'ORD789',
        userId: 'U456',
        amount: -100,
        stripePaymentMethodId: 'pm_123',
      });

    expect(res.status).toBe(400);
  });
});

describe('Wallet Validation', () => {
  it('POST /api/wallet/topup should reject missing fields', async () => {
    const res = await request
      .post('/api/wallet/topup')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('Refund Validation', () => {
  it('POST /api/payments/refund should reject missing paymentId', async () => {
    const res = await request
      .post('/api/payments/refund')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'test' });

    expect(res.status).toBe(400);
  });
});
