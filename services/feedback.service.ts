import { connectToDatabase } from '@/lib/db/mongodb';
import { FeedbackModel } from '@/models/Feedback';
import { IFeedback, FeedbackReason, FEEDBACK_REASON_LABELS } from '@/types/feedback';
import { createAuditLog } from '@/services/audit.service';

export interface CreateFeedbackParams {
  feedbackType?: IFeedback['feedbackType'];
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
}

export async function createFeedback(data: CreateFeedbackParams): Promise<IFeedback> {
  await connectToDatabase();

  const reasonLabel = data.reasonLabel || FEEDBACK_REASON_LABELS[data.reason] || data.reason;

  const feedbackDoc = await FeedbackModel.create({
    feedbackType: data.feedbackType || 'LISTING_DELETION',
    propertyId: data.propertyId,
    propertyTitle: data.propertyTitle,
    propertyLocation: data.propertyLocation,
    sellerId: data.sellerId,
    sellerName: data.sellerName,
    sellerEmail: data.sellerEmail,
    sellerPhone: data.sellerPhone,
    reason: data.reason,
    reasonLabel,
    comments: data.comments?.trim() || undefined,
    rating: data.rating,
    ipAddress: data.ipAddress,
  });

  if (data.sellerId) {
    await createAuditLog({
      actorId: data.sellerId,
      actorName: data.sellerName || 'Seller',
      actorEmail: data.sellerEmail || '',
      actorRole: 'SELLER',
      action: 'FEEDBACK_SUBMITTED',
      entityType: 'PROPERTY',
      entityId: data.propertyId || String(feedbackDoc._id),
      metadata: {
        reason: data.reason,
        reasonLabel,
        propertyId: data.propertyId,
        propertyTitle: data.propertyTitle,
      },
    }).catch((err) => {
      console.warn('Failed to create audit log for feedback:', err);
    });
  }

  return {
    ...feedbackDoc.toObject(),
    _id: String(feedbackDoc._id),
  } as unknown as IFeedback;
}

export async function getAllFeedbacks(params?: {
  limit?: number;
  skip?: number;
  reason?: string;
  search?: string;
}): Promise<{ feedbacks: IFeedback[]; total: number }> {
  await connectToDatabase();

  const limit = Math.min(200, Math.max(1, params?.limit || 50));
  const skip = Math.max(0, params?.skip || 0);

  const query: Record<string, any> = {};

  if (params?.reason && params.reason !== 'ALL') {
    query.reason = params.reason;
  }

  if (params?.search) {
    const searchRegex = new RegExp(params.search.trim(), 'i');
    query.$or = [
      { propertyTitle: searchRegex },
      { propertyLocation: searchRegex },
      { sellerName: searchRegex },
      { sellerEmail: searchRegex },
      { comments: searchRegex },
    ];
  }

  const [docs, total] = await Promise.all([
    FeedbackModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    FeedbackModel.countDocuments(query),
  ]);

  const feedbacks = (docs || []).map((d) => ({
    ...d,
    _id: String(d._id),
  })) as unknown as IFeedback[];

  return { feedbacks, total };
}

export async function getFeedbackStats(): Promise<{
  total: number;
  soldOnPlatform: number;
  soldExternally: number;
  notUseful: number;
  priceChangeRelist: number;
  decidedNotToSell: number;
  other: number;
}> {
  await connectToDatabase();

  const [
    total,
    soldOnPlatform,
    soldExternally,
    notUseful,
    priceChangeRelist,
    decidedNotToSell,
    other,
  ] = await Promise.all([
    FeedbackModel.countDocuments({}),
    FeedbackModel.countDocuments({ reason: 'SOLD_ON_PLATFORM' }),
    FeedbackModel.countDocuments({ reason: 'SOLD_EXTERNALLY' }),
    FeedbackModel.countDocuments({ reason: 'NOT_USEFUL' }),
    FeedbackModel.countDocuments({ reason: 'PRICE_CHANGE_RELIST' }),
    FeedbackModel.countDocuments({ reason: 'DECIDED_NOT_TO_SELL' }),
    FeedbackModel.countDocuments({ reason: 'OTHER' }),
  ]);

  return {
    total,
    soldOnPlatform,
    soldExternally,
    notUseful,
    priceChangeRelist,
    decidedNotToSell,
    other,
  };
}
