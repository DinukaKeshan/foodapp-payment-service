import { Router } from 'express';
import { topUpWallet, getWallet } from '../controllers/walletController.js';
import authenticate from '../middlewares/authenticate.js';
import validate from '../middlewares/validate.js';
import { walletTopupSchema } from '../utils/validators.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Wallet management
 */

/**
 * @swagger
 * /api/wallet/topup:
 *   post:
 *     summary: Top up wallet via Stripe
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - amount
 *               - stripePaymentMethodId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: U456
 *               amount:
 *                 type: number
 *                 example: 5000
 *               currency:
 *                 type: string
 *                 default: LKR
 *               stripePaymentMethodId:
 *                 type: string
 *                 example: pm_1234567890
 *     responses:
 *       200:
 *         description: Wallet topped up successfully
 *       400:
 *         description: Validation error
 *       402:
 *         description: Payment failed
 */
router.post('/topup', authenticate, validate(walletTopupSchema), topUpWallet);

/**
 * @swagger
 * /api/wallet/{userId}:
 *   get:
 *     summary: Get wallet balance and transactions
 *     tags: [Wallet]
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
 *         description: Wallet details with transactions
 *       404:
 *         description: Wallet not found
 */
router.get('/:userId', authenticate, getWallet);

export default router;
