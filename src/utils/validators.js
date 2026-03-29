import Joi from 'joi';

export const processPaymentSchema = Joi.object({
  orderId: Joi.string().required().messages({
    'string.empty': 'Order ID is required',
    'any.required': 'Order ID is required',
  }),
  userId: Joi.string().required().messages({
    'string.empty': 'User ID is required',
    'any.required': 'User ID is required',
  }),
  amount: Joi.number().positive().required().messages({
    'number.base': 'Amount must be a number',
    'number.positive': 'Amount must be positive',
    'any.required': 'Amount is required',
  }),
  currency: Joi.string().uppercase().default('LKR'),
  paymentMethod: Joi.string().valid('CARD', 'WALLET', 'BANK_TRANSFER').default('CARD'),
  stripePaymentMethodId: Joi.string().when('paymentMethod', {
    is: 'CARD',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  idempotencyKey: Joi.string().optional(),
  metadata: Joi.object().optional(),
});

export const updatePaymentStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'SUCCESS', 'FAILED').required().messages({
    'any.only': 'Status must be one of: PENDING, SUCCESS, FAILED',
    'any.required': 'Status is required',
  }),
});

export const walletTopupSchema = Joi.object({
  userId: Joi.string().required(),
  amount: Joi.number().positive().required().messages({
    'number.positive': 'Top-up amount must be positive',
    'any.required': 'Amount is required',
  }),
  currency: Joi.string().uppercase().default('LKR'),
  stripePaymentMethodId: Joi.string().required().messages({
    'any.required': 'Stripe payment method ID is required',
  }),
});

export const refundSchema = Joi.object({
  paymentId: Joi.string().required().messages({
    'any.required': 'Payment ID is required',
  }),
  reason: Joi.string().optional().default('Refund requested'),
  amount: Joi.number().positive().optional(), // partial refund support
});
