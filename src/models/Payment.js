import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'LKR',
      uppercase: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['CARD', 'WALLET', 'BANK_TRANSFER'],
      default: 'CARD',
    },
    cardLast4: {
      type: String,
      maxlength: 4,
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'VOIDED'],
      default: 'PENDING',
      index: true,
    },
    transactionId: {
      type: String,
      index: true,
    },
    stripePaymentIntentId: {
      type: String,
    },
    paymentGateway: {
      type: String,
      default: 'Stripe',
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ orderId: 1, status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
