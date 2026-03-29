import { jest } from '@jest/globals';
import {
  processPaymentSchema,
  updatePaymentStatusSchema,
  walletTopupSchema,
  refundSchema,
} from '../../src/utils/validators.js';

describe('Validation Schemas', () => {
  describe('processPaymentSchema', () => {
    it('should validate a correct card payment payload', () => {
      const payload = {
        orderId: 'ORD789',
        userId: 'U456',
        amount: 2790,
        currency: 'LKR',
        paymentMethod: 'CARD',
        stripePaymentMethodId: 'pm_12345',
      };

      const { error, value } = processPaymentSchema.validate(payload);
      expect(error).toBeUndefined();
      expect(value.orderId).toBe('ORD789');
    });

    it('should reject payment without orderId', () => {
      const payload = {
        userId: 'U456',
        amount: 2790,
      };

      const { error } = processPaymentSchema.validate(payload);
      expect(error).toBeDefined();
    });

    it('should reject negative amount', () => {
      const payload = {
        orderId: 'ORD789',
        userId: 'U456',
        amount: -100,
        stripePaymentMethodId: 'pm_12345',
      };

      const { error } = processPaymentSchema.validate(payload);
      expect(error).toBeDefined();
    });

    it('should require stripePaymentMethodId for CARD payments', () => {
      const payload = {
        orderId: 'ORD789',
        userId: 'U456',
        amount: 2790,
        paymentMethod: 'CARD',
      };

      const { error } = processPaymentSchema.validate(payload);
      expect(error).toBeDefined();
    });

    it('should not require stripePaymentMethodId for WALLET payments', () => {
      const payload = {
        orderId: 'ORD789',
        userId: 'U456',
        amount: 2790,
        paymentMethod: 'WALLET',
      };

      const { error } = processPaymentSchema.validate(payload);
      expect(error).toBeUndefined();
    });

    it('should default currency to LKR', () => {
      const payload = {
        orderId: 'ORD789',
        userId: 'U456',
        amount: 2790,
        paymentMethod: 'WALLET',
      };

      const { value } = processPaymentSchema.validate(payload);
      expect(value.currency).toBe('LKR');
    });
  });

  describe('updatePaymentStatusSchema', () => {
    it('should accept valid status values', () => {
      ['PENDING', 'SUCCESS', 'FAILED'].forEach((status) => {
        const { error } = updatePaymentStatusSchema.validate({ status });
        expect(error).toBeUndefined();
      });
    });

    it('should reject invalid status', () => {
      const { error } = updatePaymentStatusSchema.validate({ status: 'INVALID' });
      expect(error).toBeDefined();
    });
  });

  describe('walletTopupSchema', () => {
    it('should validate correct top-up payload', () => {
      const payload = {
        userId: 'U456',
        amount: 5000,
        stripePaymentMethodId: 'pm_12345',
      };

      const { error } = walletTopupSchema.validate(payload);
      expect(error).toBeUndefined();
    });

    it('should reject zero amount', () => {
      const payload = {
        userId: 'U456',
        amount: 0,
        stripePaymentMethodId: 'pm_12345',
      };

      const { error } = walletTopupSchema.validate(payload);
      expect(error).toBeDefined();
    });
  });

  describe('refundSchema', () => {
    it('should validate with paymentId only', () => {
      const { error } = refundSchema.validate({ paymentId: 'PAY123' });
      expect(error).toBeUndefined();
    });

    it('should accept optional amount for partial refund', () => {
      const { error, value } = refundSchema.validate({
        paymentId: 'PAY123',
        amount: 1000,
        reason: 'Customer request',
      });

      expect(error).toBeUndefined();
      expect(value.amount).toBe(1000);
    });

    it('should reject without paymentId', () => {
      const { error } = refundSchema.validate({ reason: 'test' });
      expect(error).toBeDefined();
    });
  });
});
