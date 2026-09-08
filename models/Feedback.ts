import mongoose, { Schema, Model } from 'mongoose';
import { IFeedback } from '@/types/feedback';

const FeedbackSchema = new Schema<IFeedback>(
  {
    feedbackType: {
      type: String,
      enum: ['LISTING_DELETION', 'GENERAL', 'PLATFORM_EXPERIENCE'],
      default: 'LISTING_DELETION',
      index: true,
    },
    propertyId: { type: String, index: true },
    propertyTitle: { type: String, trim: true },
    propertyLocation: { type: String, trim: true },
    sellerId: { type: String, index: true },
    sellerName: { type: String, trim: true },
    sellerEmail: { type: String, trim: true, lowercase: true },
    sellerPhone: { type: String, trim: true },
    reason: {
      type: String,
      required: true,
      enum: [
        'SOLD_ON_PLATFORM',
        'SOLD_EXTERNALLY',
        'NOT_USEFUL',
        'PRICE_CHANGE_RELIST',
        'DECIDED_NOT_TO_SELL',
        'OTHER',
      ],
      index: true,
    },
    reasonLabel: { type: String, trim: true },
    comments: { type: String, trim: true },
    rating: { type: Number, min: 1, max: 5 },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

export const FeedbackModel: Model<IFeedback> =
  mongoose.models.Feedback ||
  mongoose.model<IFeedback>('Feedback', FeedbackSchema);
