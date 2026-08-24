import mongoose, { Schema, Model } from 'mongoose';
import { IInquiry, IFavorite, IReport, IAuditLog } from '@/types/inquiry';

// Inquiry Schema
const InquirySchema = new Schema<IInquiry>(
  {
    propertyId: { type: String, required: true, index: true },
    propertyTitle: { type: String },
    propertyLocation: { type: String },
    propertyImage: { type: String },
    buyerId: { type: String, required: true, index: true },
    buyerName: { type: String, required: true },
    buyerEmail: { type: String, required: true },
    buyerPhone: { type: String },
    sellerId: { type: String, required: true, index: true },
    message: { type: String, required: true, trim: true },
    phoneShared: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['PENDING', 'RESPONDED', 'CLOSED'],
      default: 'PENDING',
      index: true,
    },
  },
  { timestamps: true }
);

export const InquiryModel: Model<IInquiry> =
  mongoose.models.Inquiry || mongoose.model<IInquiry>('Inquiry', InquirySchema);

// Favorite Schema with UNIQUE compound index
const FavoriteSchema = new Schema<IFavorite>(
  {
    userId: { type: String, required: true, index: true },
    propertyId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

FavoriteSchema.index({ userId: 1, propertyId: 1 }, { unique: true });

export const FavoriteModel: Model<IFavorite> =
  mongoose.models.Favorite || mongoose.model<IFavorite>('Favorite', FavoriteSchema);

// Report Schema
const ReportSchema = new Schema<IReport>(
  {
    propertyId: { type: String, required: true, index: true },
    propertyTitle: { type: String },
    reporterId: { type: String, required: true, index: true },
    reporterName: { type: String },
    reporterEmail: { type: String },
    reason: {
      type: String,
      enum: [
        'SUSPICIOUS_LISTING',
        'INCORRECT_INFORMATION',
        'POSSIBLE_FRAUD',
        'WRONG_LOCATION',
        'DUPLICATE_LISTING',
        'INAPPROPRIATE_CONTENT',
        'OTHER',
      ],
      required: true,
    },
    description: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'],
      default: 'PENDING',
      index: true,
    },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
    actionTaken: { type: String },
  },
  { timestamps: true }
);

export const ReportModel: Model<IReport> =
  mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);

// AuditLog Schema
const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: String, required: true, index: true },
    actorName: { type: String, required: true },
    actorEmail: { type: String, required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true, index: true },
    entityType: {
      type: String,
      enum: ['PROPERTY', 'USER', 'PAYMENT', 'DOCUMENT', 'REPORT', 'SYSTEM'],
      required: true,
      index: true,
    },
    entityId: { type: String, required: true, index: true },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });

export const AuditLogModel: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
