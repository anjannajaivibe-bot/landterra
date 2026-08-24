import { IInquiry, IFavorite, IReport } from '@/types/inquiry';
import { InquiryModel, FavoriteModel, ReportModel } from '@/models/Inquiry';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getPropertyById, updateProperty } from '@/services/property.service';
import { notifySellerInquiry } from '@/services/email.service';
import { createAuditLog } from '@/services/audit.service';

const memoryInquiries: IInquiry[] = [];
const memoryFavorites: IFavorite[] = [];
const memoryReports: IReport[] = [];

// INQUIRY METHODS
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

  const newInquiry: IInquiry = {
    _id: 'inq_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
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
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const conn = await connectToDatabase();
    if (conn) {
      await InquiryModel.create(newInquiry);
    }
  } catch (e) {
    console.error('Mongo inquiry error:', e);
  }

  memoryInquiries.unshift(newInquiry);

  // Increment property inquiriesCount
  await updateProperty(data.propertyId, {
    inquiriesCount: (property.inquiriesCount || 0) + 1,
  });

  // Notify seller via Resend email
  if (property.sellerEmail) {
    await notifySellerInquiry(
      property.sellerEmail,
      property.sellerName || 'Seller',
      data.buyerName,
      property.title,
      data.message,
      data.phoneShared ? data.buyerPhone : undefined
    );
  }

  return newInquiry;
}

export async function getInquiriesForSeller(sellerId: string): Promise<IInquiry[]> {
  try {
    const conn = await connectToDatabase();
    if (conn) {
      const docs = await InquiryModel.find({ sellerId }).sort({ createdAt: -1 }).lean();
      return docs as unknown as IInquiry[];
    }
  } catch {
    // fallback
  }

  return memoryInquiries.filter((i) => i.sellerId === sellerId);
}

export async function getInquiriesForBuyer(buyerId: string): Promise<IInquiry[]> {
  try {
    const conn = await connectToDatabase();
    if (conn) {
      const docs = await InquiryModel.find({ buyerId }).sort({ createdAt: -1 }).lean();
      return docs as unknown as IInquiry[];
    }
  } catch {
    // fallback
  }

  return memoryInquiries.filter((i) => i.buyerId === buyerId);
}

// FAVORITES METHODS
export async function toggleFavorite(userId: string, propertyId: string): Promise<{ isFavorite: boolean }> {
  try {
    const conn = await connectToDatabase();
    if (conn) {
      const existing = await FavoriteModel.findOne({ userId, propertyId });
      if (existing) {
        await FavoriteModel.findByIdAndDelete(existing._id);
        return { isFavorite: false };
      } else {
        await FavoriteModel.create({ userId, propertyId });
        return { isFavorite: true };
      }
    }
  } catch {
    // fallback
  }

  const idx = memoryFavorites.findIndex((f) => f.userId === userId && f.propertyId === propertyId);
  if (idx !== -1) {
    memoryFavorites.splice(idx, 1);
    return { isFavorite: false };
  } else {
    memoryFavorites.push({
      _id: 'fav_' + Date.now(),
      userId,
      propertyId,
      createdAt: new Date(),
    });
    return { isFavorite: true };
  }
}

export async function getFavoritesForUser(userId: string): Promise<string[]> {
  try {
    const conn = await connectToDatabase();
    if (conn) {
      const docs = await FavoriteModel.find({ userId }).select('propertyId').lean();
      return docs.map((d) => d.propertyId);
    }
  } catch {
    // fallback
  }

  return memoryFavorites.filter((f) => f.userId === userId).map((f) => f.propertyId);
}

// REPORT METHODS
export async function createReport(data: {
  propertyId: string;
  reporterId: string;
  reporterName?: string;
  reporterEmail?: string;
  reason: IReport['reason'];
  description: string;
}): Promise<IReport> {
  const property = await getPropertyById(data.propertyId);

  const report: IReport = {
    _id: 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    propertyId: data.propertyId,
    propertyTitle: property?.title || 'Reported Property',
    reporterId: data.reporterId,
    reporterName: data.reporterName,
    reporterEmail: data.reporterEmail,
    reason: data.reason,
    description: data.description,
    status: 'PENDING',
    createdAt: new Date(),
  };

  try {
    const conn = await connectToDatabase();
    if (conn) {
      await ReportModel.create(report);
    }
  } catch {
    // fallback
  }

  memoryReports.unshift(report);

  await createAuditLog({
    actorId: data.reporterId,
    actorName: data.reporterName || 'Buyer',
    actorEmail: data.reporterEmail || '',
    actorRole: 'BUYER',
    action: 'PROPERTY_REPORTED',
    entityType: 'REPORT',
    entityId: report._id,
    metadata: {
      propertyId: data.propertyId,
      reason: data.reason,
      description: data.description,
    },
  });

  return report;
}

export async function getAllReports(): Promise<IReport[]> {
  try {
    const conn = await connectToDatabase();
    if (conn) {
      const docs = await ReportModel.find({}).sort({ createdAt: -1 }).lean();
      return docs as unknown as IReport[];
    }
  } catch {
    // fallback
  }

  return memoryReports;
}
