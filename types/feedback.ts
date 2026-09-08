export type FeedbackReason =
  | 'SOLD_ON_PLATFORM'
  | 'SOLD_EXTERNALLY'
  | 'NOT_USEFUL'
  | 'PRICE_CHANGE_RELIST'
  | 'DECIDED_NOT_TO_SELL'
  | 'OTHER';

export interface IFeedback {
  _id: string;
  feedbackType: 'LISTING_DELETION' | 'GENERAL' | 'PLATFORM_EXPERIENCE';
  propertyId?: string;
  propertyTitle?: string;
  propertyLocation?: string;
  sellerId?: string;
  sellerName?: string;
  sellerEmail?: string;
  sellerPhone?: string;
  reason: FeedbackReason;
  reasonLabel?: string;
  comments?: string;
  rating?: number;
  ipAddress?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export const FEEDBACK_REASON_LABELS: Record<FeedbackReason, string> = {
  SOLD_ON_PLATFORM: 'Sold via BhoomiMitra (Found buyer here)',
  SOLD_EXTERNALLY: 'Sold Elsewhere / Offline deal',
  NOT_USEFUL: 'Not useful / Low buyer inquiries',
  PRICE_CHANGE_RELIST: 'Price change / Will relist later',
  DECIDED_NOT_TO_SELL: 'Decided not to sell / Retaining land',
  OTHER: 'Other reason',
};
