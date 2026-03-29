import walletService from '../services/walletService.js';
import { asyncHandler, apiResponse } from '../utils/helpers.js';

/**
 * @desc    Top up wallet via Stripe
 * @route   POST /api/wallet/topup
 * @access  Private
 */
export const topUpWallet = asyncHandler(async (req, res) => {
  const { userId, amount, currency, stripePaymentMethodId } = req.body;
  const result = await walletService.topUp({ userId, amount, currency, stripePaymentMethodId });
  return apiResponse(res, 200, 'Wallet topped up successfully', result);
});

/**
 * @desc    Get wallet balance and transactions
 * @route   GET /api/wallet/:userId
 * @access  Private
 */
export const getWallet = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page, limit } = req.query;
  const result = await walletService.getWalletWithTransactions(userId, {
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 20,
  });
  return apiResponse(res, 200, 'Wallet retrieved successfully', result);
});
