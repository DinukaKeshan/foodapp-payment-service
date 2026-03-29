import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import { generateId } from '../utils/helpers.js';
import { NotFoundError, InsufficientFundsError } from '../utils/errors.js';
import stripeService from './stripeService.js';
import logger from '../utils/logger.js';

class WalletService {
  /**
   * Get or create a wallet for the given user.
   */
  async getOrCreateWallet(userId, currency = 'LKR') {
    let wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      wallet = new Wallet({
        walletId: generateId('WAL'),
        userId,
        balance: 0,
        currency,
      });
      await wallet.save();
      logger.info(`Wallet created for user: ${userId}`);
    }

    return wallet;
  }

  /**
   * Get wallet details with recent transactions.
   */
  async getWalletWithTransactions(userId, { page = 1, limit = 20 } = {}) {
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      throw new NotFoundError(`Wallet not found for user: ${userId}`);
    }

    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      Transaction.find({ userId }).sort({ date: -1 }).skip(skip).limit(limit),
      Transaction.countDocuments({ userId }),
    ]);

    return {
      wallet: {
        walletId: wallet.walletId,
        userId: wallet.userId,
        balance: wallet.balance,
        currency: wallet.currency,
        isActive: wallet.isActive,
      },
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Top up wallet balance via Stripe.
   */
  async topUp({ userId, amount, currency = 'LKR', stripePaymentMethodId }) {
    const wallet = await this.getOrCreateWallet(userId, currency);

    // Process top-up payment via Stripe
    const paymentIntent = await stripeService.createPaymentIntent({
      amount,
      currency,
      paymentMethodId: stripePaymentMethodId,
      metadata: {
        type: 'WALLET_TOPUP',
        userId,
        walletId: wallet.walletId,
      },
    });

    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Top-up payment was not completed');
    }

    // Credit wallet
    const balanceBefore = wallet.balance;
    wallet.balance += amount;
    await wallet.save();

    // Log transaction
    const transaction = new Transaction({
      transactionId: generateId('TXN'),
      userId,
      type: 'TOPUP',
      amount,
      currency,
      description: 'Wallet top-up via Stripe',
      balanceBefore,
      balanceAfter: wallet.balance,
      date: new Date(),
    });
    await transaction.save();

    logger.info(`Wallet topped up: user=${userId}, amount=${amount}, newBalance=${wallet.balance}`);

    return {
      wallet: {
        walletId: wallet.walletId,
        balance: wallet.balance,
        currency: wallet.currency,
      },
      transaction,
    };
  }

  /**
   * Deduct balance from wallet.
   * Used internally by payment service.
   */
  async deductBalance(userId, amount, { type = 'PAYMENT', orderId, paymentId, description } = {}) {
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      throw new NotFoundError(`Wallet not found for user: ${userId}`);
    }

    if (wallet.balance < amount) {
      throw new InsufficientFundsError(
        `Insufficient balance. Available: ${wallet.balance}, Required: ${amount}`
      );
    }

    const balanceBefore = wallet.balance;
    wallet.balance -= amount;
    await wallet.save();

    const transaction = new Transaction({
      transactionId: generateId('TXN'),
      userId,
      type,
      amount,
      currency: wallet.currency,
      orderId,
      paymentId,
      description: description || `Wallet deduction`,
      balanceBefore,
      balanceAfter: wallet.balance,
      date: new Date(),
    });
    await transaction.save();

    logger.info(`Wallet debited: user=${userId}, amount=${amount}, newBalance=${wallet.balance}`);
    return { wallet, transaction };
  }

  /**
   * Add balance to wallet (used for refunds).
   */
  async addBalance(userId, amount, { type = 'REFUND', orderId, paymentId, description } = {}) {
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      throw new NotFoundError(`Wallet not found for user: ${userId}`);
    }

    const balanceBefore = wallet.balance;
    wallet.balance += amount;
    await wallet.save();

    const transaction = new Transaction({
      transactionId: generateId('TXN'),
      userId,
      type,
      amount,
      currency: wallet.currency,
      orderId,
      paymentId,
      description: description || `Wallet credit`,
      balanceBefore,
      balanceAfter: wallet.balance,
      date: new Date(),
    });
    await transaction.save();

    logger.info(`Wallet credited: user=${userId}, amount=${amount}, newBalance=${wallet.balance}`);
    return { wallet, transaction };
  }
}

export default new WalletService();
