import Payment from '../models/Payment.js';
import Transaction from '../models/Transaction.js';
import Invoice from '../models/Invoice.js';
import walletService from './walletService.js';
import stripeService from './stripeService.js';
import { generateId } from '../utils/helpers.js';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
  PaymentError,
  InsufficientFundsError,
} from '../utils/errors.js';
import logger from '../utils/logger.js';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

class PaymentService {
  /**
   * Process a new payment.
   * Supports CARD (via Stripe) and WALLET payment methods.
   * Implements idempotency to prevent duplicate charges.
   */
  async processPayment({
    orderId,
    userId,
    amount,
    currency = 'LKR',
    paymentMethod = 'CARD',
    stripePaymentMethodId,
    idempotencyKey,
    metadata = {},
  }) {
    // Idempotency check
    if (idempotencyKey) {
      const existingPayment = await Payment.findOne({ idempotencyKey });
      if (existingPayment) {
        logger.info(`Idempotent payment found: ${existingPayment.paymentId}`);
        return existingPayment;
      }
    }

    const paymentId = generateId('PAY');
    const transactionId = generateId('TXN');

    let payment = new Payment({
      paymentId,
      orderId,
      userId,
      amount,
      currency,
      paymentMethod,
      status: 'PENDING',
      transactionId,
      paymentGateway: paymentMethod === 'CARD' ? 'Stripe' : 'Wallet',
      idempotencyKey,
      metadata,
    });

    await payment.save();

    try {
      if (paymentMethod === 'CARD') {
        payment = await this._processCardPayment(payment, stripePaymentMethodId, idempotencyKey);
      } else if (paymentMethod === 'WALLET') {
        payment = await this._processWalletPayment(payment, userId, amount, currency);
      }

      // Create invoice on success
      if (payment.status === 'SUCCESS') {
        await this._createInvoice(payment);
      }

      return payment;
    } catch (error) {
      payment.status = 'FAILED';
      await payment.save();

      // Log failed transaction
      await this._logTransaction({
        userId,
        type: 'PAYMENT',
        amount,
        currency,
        orderId,
        paymentId,
        description: `Payment failed: ${error.message}`,
      });

      throw error;
    }
  }

  /**
   * Process card payment via Stripe with retry mechanism.
   */
  async _processCardPayment(payment, stripePaymentMethodId, idempotencyKey) {
    let lastError;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        payment.retryCount = attempt - 1;

        const paymentIntent = await stripeService.createPaymentIntent({
          amount: payment.amount,
          currency: payment.currency,
          paymentMethodId: stripePaymentMethodId,
          idempotencyKey: idempotencyKey ? `${idempotencyKey}_attempt_${attempt}` : undefined,
          metadata: {
            paymentId: payment.paymentId,
            orderId: payment.orderId,
            userId: payment.userId,
          },
        });

        payment.stripePaymentIntentId = paymentIntent.id;
        payment.cardLast4 = stripeService.extractCardLast4(paymentIntent) || '';

        if (paymentIntent.status === 'succeeded') {
          payment.status = 'SUCCESS';
          payment.completedAt = new Date();

          await this._logTransaction({
            userId: payment.userId,
            type: 'PAYMENT',
            amount: payment.amount,
            currency: payment.currency,
            orderId: payment.orderId,
            paymentId: payment.paymentId,
            description: `Card payment completed via Stripe`,
          });
        } else {
          payment.status = 'PENDING';
        }

        await payment.save();
        return payment;
      } catch (error) {
        lastError = error;
        logger.warn(`Payment attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`);

        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        }
      }
    }

    throw lastError || new PaymentError('Payment failed after maximum retries');
  }

  /**
   * Process wallet payment by deducting from user's balance.
   */
  async _processWalletPayment(payment, userId, amount, currency) {
    const wallet = await walletService.getOrCreateWallet(userId, currency);

    if (wallet.balance < amount) {
      throw new InsufficientFundsError(
        `Insufficient wallet balance. Available: ${wallet.balance}, Required: ${amount}`
      );
    }

    await walletService.deductBalance(userId, amount, {
      type: 'PAYMENT',
      orderId: payment.orderId,
      paymentId: payment.paymentId,
      description: 'Wallet payment deduction',
    });

    payment.status = 'SUCCESS';
    payment.completedAt = new Date();
    await payment.save();

    return payment;
  }

  /**
   * Get payments by order ID.
   */
  async getPaymentsByOrder(orderId) {
    const payments = await Payment.find({ orderId }).sort({ createdAt: -1 });
    if (!payments.length) {
      throw new NotFoundError(`No payments found for order: ${orderId}`);
    }
    return payments;
  }

  /**
   * Get payments by user ID.
   */
  async getPaymentsByUser(userId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      Payment.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Payment.countDocuments({ userId }),
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update payment status manually.
   */
  async updatePaymentStatus(paymentId, status) {
    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      throw new NotFoundError(`Payment not found: ${paymentId}`);
    }

    if (payment.status === 'VOIDED') {
      throw new BadRequestError('Cannot update status of a voided payment');
    }

    const previousStatus = payment.status;
    payment.status = status;

    if (status === 'SUCCESS' && !payment.completedAt) {
      payment.completedAt = new Date();
    }

    await payment.save();

    logger.info(`Payment ${paymentId} status updated: ${previousStatus} -> ${status}`);
    return payment;
  }

  /**
   * Void a pending payment.
   */
  async voidPayment(paymentId) {
    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      throw new NotFoundError(`Payment not found: ${paymentId}`);
    }

    if (payment.status !== 'PENDING') {
      throw new BadRequestError(`Cannot void payment with status: ${payment.status}. Only PENDING payments can be voided.`);
    }

    payment.status = 'VOIDED';
    await payment.save();

    logger.info(`Payment voided: ${paymentId}`);
    return payment;
  }

  /**
   * Process a refund for a completed payment.
   */
  async processRefund({ paymentId, reason, amount: refundAmount }) {
    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      throw new NotFoundError(`Payment not found: ${paymentId}`);
    }

    if (payment.status !== 'SUCCESS') {
      throw new BadRequestError(`Cannot refund payment with status: ${payment.status}`);
    }

    const amount = refundAmount || payment.amount;

    if (amount > payment.amount) {
      throw new BadRequestError('Refund amount exceeds original payment amount');
    }

    // Stripe refund for card payments
    if (payment.paymentGateway === 'Stripe' && payment.stripePaymentIntentId) {
      await stripeService.createRefund({
        paymentIntentId: payment.stripePaymentIntentId,
        amount: refundAmount, // undefined = full refund
        reason,
      });
    }

    // Credit wallet for wallet payments
    if (payment.paymentMethod === 'WALLET') {
      await walletService.addBalance(payment.userId, amount, {
        type: 'REFUND',
        orderId: payment.orderId,
        paymentId: payment.paymentId,
        description: `Refund: ${reason || 'No reason provided'}`,
      });
    }

    // Always credit wallet for card refunds too (optional business logic)
    if (payment.paymentMethod === 'CARD') {
      await this._logTransaction({
        userId: payment.userId,
        type: 'REFUND',
        amount,
        currency: payment.currency,
        orderId: payment.orderId,
        paymentId: payment.paymentId,
        description: `Card refund processed: ${reason || 'No reason provided'}`,
      });
    }

    // Update payment and invoice status
    payment.status = amount === payment.amount ? 'FAILED' : 'SUCCESS'; // full refund marks as failed
    await payment.save();

    await Invoice.findOneAndUpdate(
      { paymentId },
      { status: amount === payment.amount ? 'REFUNDED' : 'PAID' }
    );

    logger.info(`Refund processed for payment ${paymentId}: amount=${amount}`);

    return {
      paymentId,
      refundedAmount: amount,
      originalAmount: payment.amount,
      status: 'REFUNDED',
    };
  }

  /**
   * Handle Stripe webhook events.
   */
  async handleWebhookEvent(event) {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const paymentId = pi.metadata?.paymentId;
        if (paymentId) {
          await this.updatePaymentStatus(paymentId, 'SUCCESS');
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        const paymentId = pi.metadata?.paymentId;
        if (paymentId) {
          await this.updatePaymentStatus(paymentId, 'FAILED');
        }
        break;
      }
      default:
        logger.info(`Unhandled webhook event type: ${event.type}`);
    }
  }

  /**
   * Create an invoice for a successful payment.
   */
  async _createInvoice(payment) {
    const invoice = new Invoice({
      invoiceId: generateId('INV'),
      paymentId: payment.paymentId,
      userId: payment.userId,
      amount: payment.amount,
      currency: payment.currency,
      status: 'PAID',
      items: [
        {
          description: `Payment for order ${payment.orderId}`,
          quantity: 1,
          unitPrice: payment.amount,
          total: payment.amount,
        },
      ],
    });

    await invoice.save();
    logger.info(`Invoice created: ${invoice.invoiceId} for payment: ${payment.paymentId}`);
    return invoice;
  }

  /**
   * Log a transaction record.
   */
  async _logTransaction({ userId, type, amount, currency = 'LKR', orderId, paymentId, description }) {
    const transaction = new Transaction({
      transactionId: generateId('TXN'),
      userId,
      type,
      amount,
      currency,
      orderId,
      paymentId,
      description,
      date: new Date(),
    });

    await transaction.save();
    return transaction;
  }
}

export default new PaymentService();
