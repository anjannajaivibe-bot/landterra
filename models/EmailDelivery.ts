import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmailDelivery extends Document {
  eventKey: string; // e.g. "LISTING_CONFIRMATION:order_123"
  recipientEmail: string;
  recipientName: string;
  template: 'LISTING_SUBMITTED' | 'VERIFICATION_RESULT' | 'SUBSCRIPTION_RENEWED';
  payload: Record<string, unknown>;
  status: 'PENDING' | 'SENT' | 'FAILED';
  attempts: number;
  lastAttemptAt?: Date;
  sentAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmailDeliverySchema = new Schema<IEmailDelivery>(
  {
    eventKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    recipientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    recipientName: {
      type: String,
      default: 'Valued Customer',
    },
    template: {
      type: String,
      required: true,
      enum: ['LISTING_SUBMITTED', 'VERIFICATION_RESULT', 'SUBSCRIPTION_RENEWED'],
    },
    payload: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastAttemptAt: {
      type: Date,
    },
    sentAt: {
      type: Date,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export const EmailDeliveryModel: Model<IEmailDelivery> =
  mongoose.models.EmailDelivery ||
  mongoose.model<IEmailDelivery>('EmailDelivery', EmailDeliverySchema);
