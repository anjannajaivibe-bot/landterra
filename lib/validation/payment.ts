import { z } from 'zod';

export const CreateOrderSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  landAreaYards: z.number().optional(),
  purpose: z
    .enum(['LISTING_SUBSCRIPTION', 'SUBSCRIPTION_RENEWAL'])
    .optional()
    .default('LISTING_SUBSCRIPTION'),
});

export const VerifyPaymentSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  razorpayOrderId: z.string().min(1, 'Razorpay order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
  razorpaySignature: z.string().min(1, 'Razorpay signature is required'),
});

export const CreateInquirySchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  message: z.string().min(10, 'Inquiry message must be at least 10 characters').max(1000),
  phoneShared: z.boolean().default(true),
  buyerPhone: z.string().regex(/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian mobile number (e.g. 9876543210)'),
  buyerEmail: z.string().email('Please provide a valid contact email address'),
});

export const CreateReportSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  reason: z.enum([
    'SUSPICIOUS_LISTING',
    'INCORRECT_INFORMATION',
    'POSSIBLE_FRAUD',
    'WRONG_LOCATION',
    'DUPLICATE_LISTING',
    'INAPPROPRIATE_CONTENT',
    'OTHER',
  ]),
  description: z.string().min(10, 'Please provide details about your report').max(2000),
});

export const VerifyPropertyActionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'REQUEST_INFO', 'SUSPEND']),
  rejectionReason: z.string().optional(),
  adminNotes: z.string().optional(),
});

export const CreateContactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .max(200),
  phone: z
    .string()
    .trim()
    .max(30, 'Phone number cannot exceed 30 characters')
    .optional()
    .or(z.literal('')),
  subject: z.string().trim().max(200).optional(),
  message: z
    .string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(3000, 'Message cannot exceed 3000 characters'),
});
