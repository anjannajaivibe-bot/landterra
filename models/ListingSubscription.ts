import mongoose, { Schema, Model } from 'mongoose';
import { IListingSubscription } from '@/types/payment';

const ListingSubscriptionSchema = new Schema<IListingSubscription>(
  {
    propertyId: { type: String, required: true, index: true },
    propertyTitle: { type: String },
    sellerId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    listingFeeDurationDays: { type: Number, default: 30 },
    ratePerSquareYard: { type: Number },
    landAreaYards: { type: Number, required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'PAUSED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true,
    },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    autoRenew: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

ListingSubscriptionSchema.index({
  sellerId: 1,
  status: 1,
});

ListingSubscriptionSchema.index({
  periodEnd: 1,
  status: 1,
});

ListingSubscriptionSchema.index(
  { razorpayOrderId: 1 },
  { unique: true },
);

export const ListingSubscriptionModel: Model<IListingSubscription> =
  mongoose.models.ListingSubscription ||
  mongoose.model<IListingSubscription>(
    'ListingSubscription',
    ListingSubscriptionSchema,
  );

export default ListingSubscriptionModel;
