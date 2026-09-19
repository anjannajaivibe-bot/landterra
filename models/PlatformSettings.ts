import mongoose, { Schema, Model } from 'mongoose';

export interface IPlatformSettings {
  _id?: string;
  requireGoogleLogin: boolean;
  requirePhoneOtp: boolean;
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
