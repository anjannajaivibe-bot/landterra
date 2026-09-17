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

const PropertyVideoSchema = new Schema(
  {
    objectKey: { type: String, required: true },
    secureUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    duration: { type: Number },
    thumbnailUrl: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
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
      required: true,
      index: true,
    },
    transactionType: {
      type: String,
      enum: ['SALE', 'RENT', 'LEASE'],
      default: 'SALE',
      index: true,
    },
    propertyType: { type: String, index: true },
    bhk: { type: String, index: true },
    facing: { type: String },
    floorNumber: { type: String },
    totalFloors: { type: Number },
    furnishingStatus: { type: String },
    bathrooms: { type: Number },
    balconies: { type: Number },
    carpetAreaSqFt: { type: Number },
    superBuiltUpAreaSqFt: { type: Number },
    boundaryWall: { type: String },
    cornerPlot: { type: Boolean, default: false },
    gatedCommunity: { type: Boolean, default: false },
    amenities: [{ type: String }],
    approvals: [{ type: String }],
    waterSource: [{ type: String }],
    electricityPhase: { type: String },
    soilType: { type: String },
    propertyAttributes: { type: Schema.Types.Mixed, default: {} },
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
    locationCoordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
      },
    },
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
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PENDING', 'PAID', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
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
    video: { type: PropertyVideoSchema, default: null },
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
PropertySchema.index({ listingStatus: 1, createdAt: -1 });
PropertySchema.index({ listingStatus: 1, landType: 1, createdAt: -1 });
PropertySchema.index({ listingStatus: 1, propertyType: 1, createdAt: -1 });
PropertySchema.index({ listingStatus: 1, 'location.state': 1, 'location.city': 1, createdAt: -1 });
PropertySchema.index({ listingStatus: 1, totalPrice: 1 });
PropertySchema.index({ listingStatus: 1, totalPrice: -1 });
PropertySchema.index({ listingStatus: 1, landAreaYards: 1 });
PropertySchema.index({ listingStatus: 1, landAreaYards: -1 });
PropertySchema.index({ listingStatus: 1, verificationStatus: 1, 'location.city': 1 });
PropertySchema.index({ listingStatus: 1, landAreaYards: 1, totalPrice: 1 });
PropertySchema.index({ sellerId: 1, listingStatus: 1 });
PropertySchema.index({ 'location.pincode': 1, listingStatus: 1 });
PropertySchema.index({ createdAt: -1 });
PropertySchema.index({ locationCoordinates: '2dsphere' });

// Auto-synchronize GeoJSON coordinates from latitude and longitude
PropertySchema.pre('save', function () {
  if (
    typeof this.longitude === 'number' &&
    typeof this.latitude === 'number' &&
    !isNaN(this.longitude) &&
    !isNaN(this.latitude)
  ) {
    this.locationCoordinates = {
      type: 'Point',
      coordinates: [this.longitude, this.latitude],
    };
  }
});

export const PropertyModel: Model<IProperty> =
  (mongoose.models.Property as Model<IProperty>) ||
  mongoose.model<IProperty>('Property', PropertySchema);

export default PropertyModel;
