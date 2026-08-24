export type PaymentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED';

export type PaymentPurpose =
  | 'LISTING_SUBSCRIPTION'
  | 'SUBSCRIPTION_RENEWAL';

export interface IListingSubscription {
  _id: string;
  propertyId: string;
  propertyTitle?: string;
  sellerId: string;
  amount: number; // in INR
  ratePerSquareYard: number; // ₹10
  landAreaYards: number;
  periodStart: string | Date;
  periodEnd: string | Date;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'PAUSED' | 'CANCELLED';
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  autoRenew?: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IPayment {
  _id: string;
  sellerId: string;
  propertyId: string;
  propertyTitle?: string;
  subscriptionId?: string;
  amount: number; // in INR
  currency: string;
  landAreaYards: number;
  ratePerYard: number; // ₹10
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentStatus: PaymentStatus;
  paymentPurpose: PaymentPurpose;
  paidAt?: string | Date;
  receiptNumber: string;
  metadata?: Record<string, unknown>;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateOrderRequest {
  propertyId: string;
  landAreaYards: number;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number; // In paise for Razorpay
  amountInRupees: number;
  currency: string;
  keyId: string;
  propertyId: string;
  landAreaYards: number;
}

export interface VerifyPaymentRequest {
  propertyId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}
