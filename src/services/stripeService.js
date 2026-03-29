import Stripe from 'stripe';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { PaymentError } from '../utils/errors.js';

const stripe = new Stripe(config.stripe.secretKey);

class StripeService {
  /**
   * Create a Stripe PaymentIntent.
   * @param {Object} params
   * @param {number} params.amount - Amount in smallest currency unit
   * @param {string} params.currency - ISO currency code
   * @param {string} params.paymentMethodId - Stripe payment method ID
   * @param {string} [params.idempotencyKey] - Idempotency key for safe retries
   * @param {Object} [params.metadata] - Additional metadata
   * @returns {Promise<import('stripe').Stripe.PaymentIntent>}
   */
  async createPaymentIntent({ amount, currency, paymentMethodId, idempotencyKey, metadata = {} }) {
    try {
      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount,
          currency: currency.toLowerCase(),
          payment_method: paymentMethodId,
          confirm: true,
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never',
          },
          metadata,
        },
        idempotencyKey ? { idempotencyKey } : undefined
      );

      logger.info(`Stripe PaymentIntent created: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      logger.error(`Stripe PaymentIntent creation failed: ${error.message}`);
      throw new PaymentError(`Stripe error: ${error.message}`);
    }
  }

  /**
   * Create a Stripe Refund.
   * @param {Object} params
   * @param {string} params.paymentIntentId - Original PaymentIntent ID
   * @param {number} [params.amount] - Partial refund amount (omit for full refund)
   * @param {string} [params.reason] - Refund reason
   * @returns {Promise<import('stripe').Stripe.Refund>}
   */
  async createRefund({ paymentIntentId, amount, reason }) {
    try {
      const refundParams = {
        payment_intent: paymentIntentId,
        ...(amount && { amount }),
        ...(reason && { reason: 'requested_by_customer' }),
      };

      const refund = await stripe.refunds.create(refundParams);
      logger.info(`Stripe refund created: ${refund.id} for PaymentIntent: ${paymentIntentId}`);
      return refund;
    } catch (error) {
      logger.error(`Stripe refund failed: ${error.message}`);
      throw new PaymentError(`Stripe refund error: ${error.message}`);
    }
  }

  /**
   * Retrieve a PaymentIntent by ID.
   * @param {string} paymentIntentId
   * @returns {Promise<import('stripe').Stripe.PaymentIntent>}
   */
  async getPaymentIntent(paymentIntentId) {
    try {
      return await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      logger.error(`Stripe retrieve failed: ${error.message}`);
      throw new PaymentError(`Could not retrieve payment: ${error.message}`);
    }
  }

  /**
   * Construct and verify a Stripe webhook event.
   * @param {Buffer} payload - Raw request body
   * @param {string} signature - Stripe-Signature header
   * @returns {import('stripe').Stripe.Event}
   */
  constructWebhookEvent(payload, signature) {
    try {
      return stripe.webhooks.constructEvent(payload, signature, config.stripe.webhookSecret);
    } catch (error) {
      logger.error(`Stripe webhook verification failed: ${error.message}`);
      throw new PaymentError(`Webhook Error: ${error.message}`, 400);
    }
  }

  /**
   * Extract card last4 digits from a PaymentIntent.
   * @param {import('stripe').Stripe.PaymentIntent} paymentIntent
   * @returns {string|null}
   */
  extractCardLast4(paymentIntent) {
    try {
      const charges = paymentIntent.latest_charge;
      if (typeof charges === 'object' && charges?.payment_method_details?.card) {
        return charges.payment_method_details.card.last4;
      }
      return null;
    } catch {
      return null;
    }
  }
}

export default new StripeService();
