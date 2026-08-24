import { z } from 'zod';

export const PropertyLocationSchema = z.object({
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid Indian 6-digit PIN code'),
  district: z.string().optional(),
});

export const PropertyImageInputSchema = z.object({
  objectKey: z.string().min(1),
  secureUrl: z.string().url(),
  fileName: z.string().min(1),
  mimeType: z.string().regex(/^image\/(jpeg|png|webp|jpg)$/i, 'Only JPEG, PNG, and WebP images allowed'),
  size: z.number().max(10 * 1024 * 1024, 'Image must be under 10MB'),
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().default(0),
});

export const PropertyDocumentInputSchema = z.object({
  documentType: z.enum([
    'TITLE_DEED',
    'KHATA_7_12_CERTIFICATE',
    'TAX_RECEIPT',
    'ENCUMBRANCE_CERTIFICATE',
    'GOVT_SURVEY_RECORD',
    'POA_OR_OTHER',
  ]),
  objectKey: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().regex(/^(application\/pdf|image\/(jpeg|png|jpg))$/i, 'Only PDF, JPEG, PNG documents allowed'),
  size: z.number().max(25 * 1024 * 1024, 'Document must be under 25MB'),
});

export const CreatePropertySchema = z.object({
  title: z.string().min(6, 'Title must be at least 6 characters').max(150, 'Title too long'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  landAreaYards: z.number().min(20, 'Minimum land area is 20 square yards').max(1000000),
  pricePerYard: z.number().min(50, 'Minimum price is ₹50 per sq yard').max(50000000),
  totalPrice: z.number().optional(),
  priceNegotiable: z.boolean().default(false),
  landType: z.enum([
    'RESIDENTIAL_PLOT',
    'COMMERCIAL_LAND',
    'AGRICULTURAL_LAND',
    'INDUSTRIAL_PLOT',
    'FARM_HOUSE_LAND',
    'INSTITUTIONAL',
  ]),
  roadAccess: z.string().min(2, 'Road access details required').default('Direct road access'),
  nearbyLandmarks: z.array(z.string()).default([]),
  location: PropertyLocationSchema,
  googleMapsShareLink: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  approximateLocation: z.boolean().default(false),
  governmentRegistrationId: z.string().max(100).optional(), // Optional Government Registration / Survey ID
  sellerPhone: z.preprocess(
    (val) => (typeof val === 'string' ? val.replace(/^\+91/, '').replace(/\D/g, '').slice(-10) : val),
    z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian 10-digit mobile number').optional().or(z.literal(''))
  ),
  sellerEmail: z.string().email().optional().or(z.literal('')),
  sellerType: z.enum(['INDIVIDUAL', 'COMPANY', 'AGENT']).default('INDIVIDUAL'),
  images: z.array(PropertyImageInputSchema).min(1, 'At least one property image is required'),
  documents: z.array(PropertyDocumentInputSchema).optional().default([]),
  sellerDeclarationAccepted: z.preprocess((val) => val === true || val === 'true' || val === 1, z.boolean()).default(true),
});

export const UpdatePropertySchema = CreatePropertySchema.partial();

/**
 * STRICT BUSINESS LOGIC CALCULATION:
 * Returns authoritative server-calculated totalPrice and monthly listing subscription fee
 * Business Rule: Monthly Listing Fee = Land Area (sq. yards) × ₹10 / month
 */
export function calculateAuthoritativeFees(landAreaYards: number, pricePerYard: number) {
  const sanitizedArea = Math.max(0, Math.round(landAreaYards));
  const sanitizedPricePerYard = Math.max(0, Math.round(pricePerYard));
  const totalPrice = sanitizedArea * sanitizedPricePerYard;
  const monthlyListingFee = sanitizedArea * 10; // ₹10 per sq. yard per month
  const publishingFee = monthlyListingFee;

  return {
    landAreaYards: sanitizedArea,
    pricePerYard: sanitizedPricePerYard,
    totalPrice,
    monthlyListingFee,
    publishingFee,
  };
}
