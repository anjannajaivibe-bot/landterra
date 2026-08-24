import mongoose, { Schema, Model } from 'mongoose';
import { IProperty } from '@/types/property';

const PropertyImageSchema = new Schema(
  {
    objectKey: { type: String, required: true },
    secureUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    isPrimary: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const PropertyDocumentSchema = new Schema(
  {
    sellerId: { type: String, required: true },
    documentType: {
      type: String,
      enum: [
        'TITLE_DEED',
        'KHATA_7_12_CERTIFICATE',
        'TAX_RECEIPT',
        'ENCUMBRANCE_CERTIFICATE',
        'GOVT_SURVEY_RECORD',
        'POA_OR_OTHER',
      ],
      required: true,
    },
    objectKey: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
    },
    uploadedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    reviewedBy: { type: String },
    rejectionReason: { type: String },
  },
  { _id: true }
);

const PropertySchema = new Schema<IProperty>(
  {
    sellerId: { type: String, required: true, index: true },
    sellerName: { type: String, required: true },
    sellerPhone: { type: String },
    sellerEmail: { type: String },
    sellerType: {
      type: String,
      enum: ['INDIVIDUAL', 'COMPANY', 'AGENT'],
      default: 'INDIVIDUAL',
    },
    title: { type: String, required: true, trim: true, index: 'text' },
    description: { type: String, required: true, trim: true },
    landAreaYards: { type: Number, required: true, min: 1, index: true },
    pricePerYard: { type: Number, required: true, min: 1, index: true },
    totalPrice: { type: Number, required: true, min: 1, index: true },
    priceNegotiable: { type: Boolean, default: false },
    publishingFee: { type: Number, required: true, min: 0 },
    monthlyListingFee: { type: Number },
    subscriptionStartedAt: { type: Date },
    subscriptionExpiresAt: { type: Date, index: true },
    landType: {
      type: String,
      enum: [
        'RESIDENTIAL_PLOT',
        'COMMERCIAL_LAND',
        'AGRICULTURAL_LAND',
        'INDUSTRIAL_PLOT',
        'FARM_HOUSE_LAND',
        'INSTITUTIONAL',
      ],
      required: true,
      index: true,
    },
    roadAccess: { type: String, default: 'Road access available' },
    nearbyLandmarks: [{ type: String }],
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true, index: true },
      state: { type: String, required: true, index: true },
      pincode: { type: String, required: true },
      district: { type: String },
    },
    googleMapsShareLink: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    approximateLocation: { type: Boolean, default: false },
    governmentRegistrationId: { type: String, trim: true, index: true, required: false },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED', 'VERIFICATION_REQUIRED'],
      default: 'PENDING',
      index: true,
    },
    verificationReviewedAt: { type: Date },
    verificationReviewedBy: { type: String },
    listingStatus: {
      type: String,
      enum: [
        'DRAFT',
        'PAYMENT_PENDING',
        'PENDING_VERIFICATION',
        'PUBLISHED',
        'EXPIRING_SOON',
        'EXPIRED',
        'PAUSED',
        'SOLD',
        'REJECTED',
        'DELETED',
      ],
      default: 'PAYMENT_PENDING',
      index: true,
    },
    images: [PropertyImageSchema],
    documents: [PropertyDocumentSchema],
    rejectionReason: { type: String },
    publishedAt: { type: Date },
    viewsCount: { type: Number, default: 0 },
    inquiriesCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal marketplace query performance
PropertySchema.index({ listingStatus: 1, verificationStatus: 1, 'location.city': 1 });
PropertySchema.index({ listingStatus: 1, landAreaYards: 1, totalPrice: 1 });
PropertySchema.index({ createdAt: -1 });

export const PropertyModel: Model<IProperty> =
  mongoose.models.Property || mongoose.model<IProperty>('Property', PropertySchema);

export default PropertyModel;
