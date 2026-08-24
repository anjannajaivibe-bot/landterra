import mongoose, { Schema, Model } from 'mongoose';
import { IPayment } from '@/types/payment';

const PaymentSchema = new Schema<IPayment>(
  {
    sellerId: { type: String, required: true, index: true },
    propertyId: { type: String, required: true, index: true },
    propertyTitle: { type: String },
    subscriptionId: { type: String, index: true },
    amount: { type: Number, required: true }, // in INR
    currency: { type: String, default: 'INR' },
    listingFeeDurationDays: { type: Number, default: 30 },
    landAreaYards: { type: Number, required: true },
    ratePerYard: { type: Number },
    razorpayOrderId: { type: String, required: true, unique: true, index: true },
    razorpayPaymentId: { type: String, sparse: true },
    razorpaySignature: { type: String },
    paymentStatus: {
      type: String,
      enum: ['CREATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'CREATED',
      index: true,
    },
    paymentPurpose: {
      type: String,
      enum: ['LISTING_SUBSCRIPTION', 'SUBSCRIPTION_RENEWAL'],
      default: 'LISTING_SUBSCRIPTION',
    },
    paidAt: { type: Date },
    confirmationEmailSentAt: { type: Date },
    auditLoggedAt: { type: Date },
    receiptNumber: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

PaymentSchema.index(
  { razorpayPaymentId: 1 },
  { unique: true, sparse: true }
);

export const PaymentModel: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default PaymentModel;
