import mongoose, { Schema, Model } from 'mongoose';

export interface IOtpChallenge {
  _id?: string;
  phone: string;
  hashedOtp: string;
  expiresAt: Date;
  attempts: number;
  isConsumed: boolean;
  consumedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const OtpChallengeSchema = new Schema<IOtpChallenge>(
  {
    phone: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    hashedOtp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Automatic TTL purge after expiration
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    isConsumed: {
      type: Boolean,
      default: false,
      index: true,
    },
    consumedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookup of active unconsumed challenges
OtpChallengeSchema.index({ phone: 1, isConsumed: 1, expiresAt: 1 });

export const OtpChallengeModel: Model<IOtpChallenge> =
  mongoose.models.OtpChallenge ||
  mongoose.model<IOtpChallenge>('OtpChallenge', OtpChallengeSchema);
