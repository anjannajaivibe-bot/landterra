import mongoose, { Schema, Model } from 'mongoose';

export interface IPlatformSettings {
  _id?: string;
  requireGoogleLogin: boolean;
  requirePhoneOtp: boolean;
  listingFeeAmount: number; // Flat fee in INR (e.g. ₹10)
  listingFeeDurationDays: number; // Validity duration (e.g. 30 days)
  updatedBy: string;
  updatedAt: Date;
  createdAt?: Date;
}

const PlatformSettingsSchema = new Schema<IPlatformSettings>(
  {
    requireGoogleLogin: {
      type: Boolean,
      default: true,
      required: true,
    },
    requirePhoneOtp: {
      type: Boolean,
      default: true,
      required: true,
    },
    listingFeeAmount: {
      type: Number,
      default: 10,
      min: 1,
      max: 100000,
      required: true,
    },
    listingFeeDurationDays: {
      type: Number,
      default: 30,
      min: 1,
      max: 365,
      required: true,
    },
    updatedBy: {
      type: String,
      default: 'SYSTEM',
    },
  },
  {
    timestamps: true,
  }
);

export const PlatformSettingsModel: Model<IPlatformSettings> =
  mongoose.models.PlatformSettings ||
  mongoose.model<IPlatformSettings>('PlatformSettings', PlatformSettingsSchema);

export default PlatformSettingsModel;
