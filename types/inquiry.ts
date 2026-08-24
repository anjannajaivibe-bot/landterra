export type InquiryStatus = 'PENDING' | 'RESPONDED' | 'CLOSED';

export interface IInquiry {
  _id: string;
  propertyId: string;
  propertyTitle?: string;
  propertyLocation?: string;
  propertyImage?: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  sellerId: string;
  message: string;
  phoneShared: boolean;
  status: InquiryStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IFavorite {
  _id: string;
  userId: string;
  propertyId: string;
  property?: unknown;
  createdAt: string | Date;
}

export type ReportReason =
  | 'SUSPICIOUS_LISTING'
  | 'INCORRECT_INFORMATION'
  | 'POSSIBLE_FRAUD'
  | 'WRONG_LOCATION'
  | 'DUPLICATE_LISTING'
  | 'INAPPROPRIATE_CONTENT'
  | 'OTHER';

export type ReportStatus = 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';

export interface IReport {
  _id: string;
  propertyId: string;
  propertyTitle?: string;
  reporterId: string;
  reporterName?: string;
  reporterEmail?: string;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  reviewedBy?: string;
  reviewedAt?: string | Date;
  actionTaken?: string;
  createdAt: string | Date;
}

export interface IAuditLog {
  _id: string;
  eventKey?: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: 'PROPERTY' | 'USER' | 'PAYMENT' | 'DOCUMENT' | 'REPORT' | 'SYSTEM';
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string | Date;
}
