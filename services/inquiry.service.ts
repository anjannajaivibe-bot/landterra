import { IInquiry, IFavorite, IReport } from '@/types/inquiry';
import { IProperty } from '@/types/property';
import { InquiryModel, FavoriteModel, ReportModel } from '@/models/Inquiry';
import { PropertyModel } from '@/models/Property';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getPropertyById, updateProperty, PUBLIC_PROPERTY_PROJECTION } from '@/services/property.service';
import { notifySellerInquiry } from '@/services/email.service';
import { createAuditLog } from '@/services/audit.service';

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class InquiryBusinessError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'InquiryBusinessError';
    this.status = status;
  }
}

// ============================================================================
// INQUIRY METHODS (Strict MongoDB Persistence)
// ============================================================================

export async function createInquiry(data: {
  propertyId: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  message: string;
  phoneShared?: boolean;
}): Promise<IInquiry> {
  const property = await getPropertyById(data.propertyId);
  if (!property) {
    throw new Error('Property not found');
  }

  if (property.listingStatus !== 'PUBLISHED' && property.listingStatus !== 'EXPIRING_SOON') {
    throw new Error('This listing is currently in draft and is not open for inquiries.');
  }

  if (property.sellerId === data.buyerId) {
    throw new Error('You cannot send an inquiry on your own property listing.');
  }

  await connectToDatabase();

  const newInquiry = {
    propertyId: data.propertyId,
    propertyTitle: property.title,
    propertyLocation: `${property.location.city}, ${property.location.state}`,
    propertyImage: property.images[0]?.secureUrl,
    buyerId: data.buyerId,
    buyerName: data.buyerName,
    buyerEmail: data.buyerEmail,
    buyerPhone: data.phoneShared ? data.buyerPhone : undefined,
    sellerId: property.sellerId,
    message: data.message,
    phoneShared: Boolean(data.phoneShared),
    status: 'PENDING' as const,
  };

  const createdDoc = await InquiryModel.create(newInquiry);

  // 1. Atomic non-blocking property inquiriesCount increment
  PropertyModel.updateOne(
    { _id: data.propertyId },
    { $inc: { inquiriesCount: 1 } },
  ).exec().catch((e) => {
    console.error('Failed to increment property inquiry count:', e);
  });

  // 2. Dispatch seller email asynchronously in the background so sender gets instant response
  if (property.sellerEmail) {
    setImmediate(() => {
      notifySellerInquiry(
        property.sellerEmail!,
        property.sellerName || 'Seller',
        data.buyerName,
        property.title,
        data.message,
        data.phoneShared ? data.buyerPhone : undefined,
        data.buyerEmail,
      ).catch((err) => {
        console.error('Failed to notify seller of inquiry:', err);
      });
    });
  }

  const docObj = createdDoc.toObject ? createdDoc.toObject() : createdDoc;
  return {
    ...docObj,
    _id: String(docObj._id),
  } as unknown as IInquiry;
}

export async function getInquiriesForSeller(sellerId: string): Promise<IInquiry[]> {
  await connectToDatabase();
  const docs = await InquiryModel.find({ sellerId }).sort({ createdAt: -1 }).lean();
  return (docs || []).map((d) => ({
    ...d,
    _id: String(d._id),
  })) as unknown as IInquiry[];
}

export async function getInquiriesForBuyer(buyerId: string): Promise<IInquiry[]> {
  await connectToDatabase();
  const docs = await InquiryModel.find({ buyerId }).sort({ createdAt: -1 }).lean();
  return (docs || []).map((d) => ({
    ...d,
    _id: String(d._id),
  })) as unknown as IInquiry[];
}

export async function updateInquiryStatus(
  inquiryId: string,
  sellerId: string,
  status: 'PENDING' | 'RESPONDED' | 'CLOSED'
): Promise<IInquiry | null> {
  await connectToDatabase();
  const updated = await InquiryModel.findOneAndUpdate(
    { _id: inquiryId, sellerId },
    { $set: { status, updatedAt: new Date() } },
    { returnDocument: 'after' }
  ).lean();

  if (!updated) return null;

  return {
    ...updated,
    _id: String(updated._id),
  } as unknown as IInquiry;
}

// ============================================================================
// FAVORITES METHODS (Strict MongoDB Persistence)
// ============================================================================

export async function toggleFavorite(
  userId: string,
  propertyId: string
): Promise<{ isFavorite: boolean }> {
  await connectToDatabase();

  const existing = await FavoriteModel.findOne({ userId, propertyId });
  if (existing) {
    await FavoriteModel.findByIdAndDelete(existing._id);
    return { isFavorite: false };
  } else {
    await FavoriteModel.create({ userId, propertyId });
    return { isFavorite: true };
  }
}

export async function removeFavorite(
  userId: string,
  propertyId: string
): Promise<{ isFavorite: boolean }> {
  await connectToDatabase();
  await FavoriteModel.findOneAndDelete({ userId, propertyId });
  return { isFavorite: false };
}

export async function getFavoritesForUser(userId: string): Promise<string[]> {
  await connectToDatabase();
  const docs = await FavoriteModel.find({ userId }).select('propertyId').lean();
  return (docs || []).map((d) => String(d.propertyId)).filter(Boolean);
}

export async function getFavoritePropertiesForUser(userId: string): Promise<{
  favoriteIds: string[];
  properties: IProperty[];
}> {
  await connectToDatabase();

  const favDocs = await FavoriteModel.find({ userId }).select('propertyId').lean();
  const favIds = (favDocs || []).map((d) => String(d.propertyId)).filter(Boolean);

  if (favIds.length === 0) {
    return { favoriteIds: [], properties: [] };
  }

  // Fetch actual valid properties from MongoDB: strictly public and published listings only
  const propertyDocs = await PropertyModel.find({
    _id: { $in: favIds },
    listingStatus: { $in: ['PUBLISHED', 'EXPIRING_SOON'] },
  })
    .select(PUBLIC_PROPERTY_PROJECTION)
    .sort({ createdAt: -1 })
    .lean();

  const validProperties = (propertyDocs || []).map((p) => {
    const doc = { ...p } as any;
    doc._id = String(doc._id);
    return doc as IProperty;
  });

  return {
    favoriteIds: favIds,
    properties: validProperties,
  };
}

// ============================================================================
// REPORT METHODS (Strict MongoDB Persistence)
// ============================================================================

export async function createReport(data: {
  propertyId: string;
  reporterId: string;
  reporterName?: string;
  reporterEmail?: string;
  reason: IReport['reason'];
  description: string;
}): Promise<IReport> {
  const property = await getPropertyById(data.propertyId);

  await connectToDatabase();

  const reportData = {
    propertyId: data.propertyId,
    propertyTitle: property?.title || 'Reported Property',
    reporterId: data.reporterId,
    reporterName: data.reporterName,
    reporterEmail: data.reporterEmail,
    reason: data.reason,
    description: data.description,
    status: 'PENDING' as const,
  };

  const createdDoc = await ReportModel.create(reportData);

  // Record audit log in MongoDB
  await createAuditLog({
    actorId: data.reporterId,
    actorName: data.reporterName || 'Buyer',
    actorEmail: data.reporterEmail || '',
    actorRole: 'BUYER',
    action: 'PROPERTY_REPORTED',
    entityType: 'REPORT',
    entityId: String(createdDoc._id),
    metadata: {
      propertyId: data.propertyId,
      reason: data.reason,
      description: data.description,
    },
  }).catch((err) => {
    console.error('Audit log for report error:', err);
  });

  const docObj = createdDoc.toObject ? createdDoc.toObject() : createdDoc;
  return {
    ...docObj,
    _id: String(docObj._id),
  } as unknown as IReport;
}

export async function getAllReports(): Promise<IReport[]> {
  await connectToDatabase();
  const docs = await ReportModel.find({}).sort({ createdAt: -1 }).lean();
  return (docs || []).map((d) => ({
    ...d,
    _id: String(d._id),
  })) as unknown as IReport[];
}

// ============================================================================
// BUYER CALL SELLER ACTION (Database Tracking & Audit Logging)
// ============================================================================

export async function recordBuyerCallAction(data: {
  propertyId: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  ipAddress?: string;
}): Promise<{
  success: boolean;
  sellerName: string;
  sellerPhone: string;
  sellerEmail?: string;
  propertyTitle: string;
}> {
  const property = await getPropertyById(data.propertyId);
  if (!property) {
    throw new InquiryBusinessError('Property not found', 404);
  }

  if (property.listingStatus !== 'PUBLISHED' && property.listingStatus !== 'EXPIRING_SOON') {
    throw new InquiryBusinessError('This listing is not available for direct calls.', 403);
  }

  if (property.sellerId === data.buyerId) {
    throw new InquiryBusinessError('You cannot record a call action on your own property listing.', 403);
  }

  await connectToDatabase();

  // 1. Record call lead in InquiryModel so seller sees the phone inquiry in dashboard
  const callInquiry = {
    propertyId: data.propertyId,
    propertyTitle: property.title,
    propertyLocation: `${property.location?.city || ''}, ${property.location?.state || ''}`,
    propertyImage: property.images?.[0]?.secureUrl,
    buyerId: data.buyerId,
    buyerName: data.buyerName,
    buyerEmail: data.buyerEmail,
    buyerPhone: data.buyerPhone,
    sellerId: property.sellerId,
    message: `[Phone Call Lead] Buyer initiated direct phone contact regarding "${property.title}".`,
    phoneShared: Boolean(data.buyerPhone),
    status: 'PENDING' as const,
  };

  await InquiryModel.create(callInquiry).catch((err) => {
    console.error('Failed to log call inquiry record:', err);
  });

  // 2. Increment property inquiries counter
  await updateProperty(data.propertyId, {
    inquiriesCount: (property.inquiriesCount || 0) + 1,
  }).catch(() => {});

  // 3. Record full audit log for safety, compliance, and dispute resolution
  await createAuditLog({
    actorId: data.buyerId,
    actorName: data.buyerName,
    actorEmail: data.buyerEmail,
    actorRole: 'BUYER',
    action: 'BUYER_CALL_SELLER',
    entityType: 'PROPERTY',
    entityId: data.propertyId,
    ipAddress: data.ipAddress,
    metadata: {
      buyerId: data.buyerId,
      buyerEmail: data.buyerEmail,
      buyerName: data.buyerName,
      buyerPhone: data.buyerPhone,
      sellerId: property.sellerId,
      sellerName: property.sellerName,
      sellerPhone: property.sellerPhone,
      sellerEmail: property.sellerEmail,
      propertyId: data.propertyId,
      propertyTitle: property.title,
      propertyLocation: `${property.location?.city || ''}, ${property.location?.state || ''}`,
      timestamp: new Date().toISOString(),
    },
  }).catch((err) => {
    console.error('Failed to create audit log for buyer call:', err);
  });

  if (!property.sellerPhone) {
    throw new InquiryBusinessError('Seller phone number is not available for this listing.', 404);
  }

  const sellerPhone = property.sellerPhone;

  return {
    success: true,
    sellerName: property.sellerName || 'Landowner',
    sellerPhone,
    sellerEmail: property.sellerEmail,
    propertyTitle: property.title,
  };
}
