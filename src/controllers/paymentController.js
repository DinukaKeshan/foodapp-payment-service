import paymentService from '../services/paymentService.js';
import stripeService from '../services/stripeService.js';
import { asyncHandler, apiResponse } from '../utils/helpers.js';
import logger from '../utils/logger.js';

/**
 * @desc    Process a new payment
 * @route   POST /api/payments
 * @access  Private
 */
export const processPayment = asyncHandler(async (req, res) => {
  const {
    orderId,
    userId,
    amount,
    currency,
    paymentMethod,
    stripePaymentMethodId,
    idempotencyKey,
    metadata,
  } = req.body;

  const payment = await paymentService.processPayment({
    orderId,
    userId,
    amount,
    currency,
    paymentMethod,
    stripePaymentMethodId,
    idempotencyKey: idempotencyKey || req.headers['idempotency-key'],
    metadata,
  });

  const statusCode = payment.status === 'SUCCESS' ? 201 : 202;
  return apiResponse(res, statusCode, 'Payment processed successfully', payment);
});

/**
 * @desc    Get payments by order ID
 * @route   GET /api/payments/order/:orderId
 * @access  Private
 */
export const getPaymentsByOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const payments = await paymentService.getPaymentsByOrder(orderId);
  return apiResponse(res, 200, 'Payments retrieved successfully', payments);
});

/**
 * @desc    Get payments by user ID
 * @route   GET /api/payments/user/:userId
 * @access  Private
 */
export const getPaymentsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page, limit } = req.query;
  const result = await paymentService.getPaymentsByUser(userId, {
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 20,
  });
  return apiResponse(res, 200, 'User payments retrieved successfully', result);
});

/**
 * @desc    Update payment status
 * @route   PUT /api/payments/:paymentId/status
 * @access  Private
 */
export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const { status } = req.body;
  const payment = await paymentService.updatePaymentStatus(paymentId, status);
  return apiResponse(res, 200, 'Payment status updated successfully', payment);
});

/**
 * @desc    Void a pending payment
 * @route   DELETE /api/payments/:paymentId
 * @access  Private
 */
export const voidPayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const payment = await paymentService.voidPayment(paymentId);
  return apiResponse(res, 200, 'Payment voided successfully', payment);
});

/**
 * @desc    Process a refund
 * @route   POST /api/payments/refund
 * @access  Private
 */
export const processRefund = asyncHandler(async (req, res) => {
  const { paymentId, reason, amount } = req.body;
  const refund = await paymentService.processRefund({ paymentId, reason, amount });
  return apiResponse(res, 200, 'Refund processed successfully', refund);
});

/**
 * @desc    Handle Stripe webhooks
 * @route   POST /api/payments/webhook
 * @access  Public (verified by Stripe signature)
 */
export const handleStripeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const event = stripeService.constructWebhookEvent(req.body, signature);

  logger.info(`Stripe webhook received: ${event.type}`);
  await paymentService.handleWebhookEvent(event);

  return res.status(200).json({ received: true });
});
