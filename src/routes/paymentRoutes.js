import { Router } from 'express';
import {
  processPayment,
  getPaymentsByOrder,
  getPaymentsByUser,
  updatePaymentStatus,
  voidPayment,
  processRefund,
  handleStripeWebhook,
} from '../controllers/paymentController.js';
import authenticate from '../middlewares/authenticate.js';
import validate from '../middlewares/validate.js';
import {
  processPaymentSchema,
  updatePaymentStatusSchema,
  refundSchema,
} from '../utils/validators.js';
import express from 'express';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment processing and management
 */

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Process a new payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - userId
 *               - amount
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: ORD789
 *               userId:
 *                 type: string
 *                 example: U456
 *               amount:
 *                 type: number
 *                 example: 2790
 *               currency:
 *                 type: string
 *                 default: LKR
 *               paymentMethod:
 *                 type: string
 *                 enum: [CARD, WALLET, BANK_TRANSFER]
 *                 default: CARD
 *               stripePaymentMethodId:
 *                 type: string
 *                 description: Required for CARD payments
 *               idempotencyKey:
 *                 type: string
 *                 description: Unique key to prevent duplicate payments
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Payment processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponse'
 *       400:
 *         description: Validation error
 *       402:
 *         description: Payment failed
 */
router.post(
  '/',
  authenticate,
  validate(processPaymentSchema),
  processPayment
);

/**
 * @swagger
 * /api/payments/order/{orderId}:
 *   get:
 *     summary: Get payments by order ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 *       404:
 *         description: No payments found
 */
router.get('/order/:orderId', authenticate, getPaymentsByOrder);

/**
 * @swagger
 * /api/payments/user/{userId}:
 *   get:
 *     summary: Get payments by user ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: User payments retrieved with pagination
 */
router.get('/user/:userId', authenticate, getPaymentsByUser);

/**
 * @swagger
 * /api/payments/{paymentId}/status:
 *   put:
 *     summary: Update payment status
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, SUCCESS, FAILED]
 *     responses:
 *       200:
 *         description: Payment status updated
 *       404:
 *         description: Payment not found
 */
router.put(
  '/:paymentId/status',
  authenticate,
  validate(updatePaymentStatusSchema),
  updatePaymentStatus
);

/**
 * @swagger
 * /api/payments/{paymentId}:
 *   delete:
 *     summary: Void a pending payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment voided successfully
 *       400:
 *         description: Payment cannot be voided
 *       404:
 *         description: Payment not found
 */
router.delete('/:paymentId', authenticate, voidPayment);

/**
 * @swagger
 * /api/payments/refund:
 *   post:
 *     summary: Process a refund
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *             properties:
 *               paymentId:
 *                 type: string
 *                 example: PAY123
 *               reason:
 *                 type: string
 *                 example: Customer request
 *               amount:
 *                 type: number
 *                 description: Partial refund amount (omit for full refund)
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *       400:
 *         description: Cannot refund this payment
 *       404:
 *         description: Payment not found
 */
router.post(
  '/refund',
  authenticate,
  validate(refundSchema),
  processRefund
);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Stripe webhook handler
 *     tags: [Payments]
 *     description: Handles Stripe webhook events (payment_intent.succeeded, payment_intent.payment_failed)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook received
 */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

export default router;
