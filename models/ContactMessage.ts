import mongoose, { Schema, Model } from 'mongoose';
import { IContactMessage } from '@/types/inquiry';

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    phone: { type: String, trim: true },
    subject: { type: String, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['NEW', 'READ', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED'],
      default: 'NEW',
      index: true,
    },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

export const ContactMessageModel: Model<IContactMessage> =
  mongoose.models.ContactMessage ||
  mongoose.model<IContactMessage>('ContactMessage', ContactMessageSchema);
