import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['TOPUP', 'PAYMENT', 'REFUND'],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'LKR',
      uppercase: true,
    },
    orderId: {
      type: String,
    },
    paymentId: {
      type: String,
    },
    description: {
      type: String,
    },
    balanceBefore: {
      type: Number,
    },
    balanceAfter: {
      type: Number,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ paymentId: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
