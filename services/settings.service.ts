import { PlatformSettingsModel, IPlatformSettings } from '@/models/PlatformSettings';
import { connectToDatabase } from '@/lib/db/mongodb';
import { createAuditLog } from '@/services/audit.service';

// In-memory fallback cache for platform settings
let cachedSettings: {
  requireGoogleLogin: boolean;
  requirePhoneOtp: boolean;
  listingFeeAmount: number;
  listingFeeDurationDays: number;
  updatedBy: string;
  updatedAt: Date;
} = {
  requireGoogleLogin: true,
  requirePhoneOtp: true,
  listingFeeAmount: 10,
  listingFeeDurationDays: 30,
  updatedBy: 'SYSTEM',
  updatedAt: new Date(),
};

/**
 * Get authoritative platform settings from MongoDB
 * If no document exists, create default settings record
 */
export async function getPlatformSettings(): Promise<IPlatformSettings> {
  try {
    const conn = await connectToDatabase();
    if (conn) {
      let doc = await PlatformSettingsModel.findOne({}).lean();
      if (!doc) {
        // Create initial default settings record
        const created = await PlatformSettingsModel.create({
          requireGoogleLogin: true,
          requirePhoneOtp: true,
          listingFeeAmount: 10,
          listingFeeDurationDays: 30,
          updatedBy: 'SYSTEM',
        });
        doc = created.toObject();
      }

      cachedSettings = {
        requireGoogleLogin: Boolean(doc.requireGoogleLogin),
        requirePhoneOtp: Boolean(doc.requirePhoneOtp),
        listingFeeAmount: typeof doc.listingFeeAmount === 'number' ? doc.listingFeeAmount : 10,
        listingFeeDurationDays: typeof doc.listingFeeDurationDays === 'number' ? doc.listingFeeDurationDays : 30,
        updatedBy: doc.updatedBy || 'SYSTEM',
        updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
      };

      return doc as unknown as IPlatformSettings;
    }
  } catch (error) {
    console.error('Error fetching platform settings from MongoDB:', error);
  }

  return {
    requireGoogleLogin: cachedSettings.requireGoogleLogin,
    requirePhoneOtp: cachedSettings.requirePhoneOtp,
    listingFeeAmount: cachedSettings.listingFeeAmount,
    listingFeeDurationDays: cachedSettings.listingFeeDurationDays,
    updatedBy: cachedSettings.updatedBy,
    updatedAt: cachedSettings.updatedAt,
  };
}

/**
 * Update platform settings (Admin only)
 */
export async function updatePlatformSettings(
  updates: {
    requireGoogleLogin?: boolean;
    requirePhoneOtp?: boolean;
    listingFeeAmount?: number;
    listingFeeDurationDays?: number;
  },
  adminUser: { id: string; name: string; email: string; role: string }
): Promise<IPlatformSettings> {
  const updatePayload: Partial<IPlatformSettings> = {
    updatedBy: `${adminUser.name} (${adminUser.email})`,
    updatedAt: new Date(),
  };

  if (typeof updates.requireGoogleLogin === 'boolean') {
    updatePayload.requireGoogleLogin = updates.requireGoogleLogin;
  }

  if (typeof updates.requirePhoneOtp === 'boolean') {
    updatePayload.requirePhoneOtp = updates.requirePhoneOtp;
  }

  if (typeof updates.listingFeeAmount === 'number' && Number.isFinite(updates.listingFeeAmount)) {
    const sanitizedFee = Math.round(updates.listingFeeAmount);
    if (sanitizedFee < 1 || sanitizedFee > 100000) {
      throw new Error('Listing fee must be between ₹1 and ₹1,00,000.');
    }
    updatePayload.listingFeeAmount = sanitizedFee;
  }

  if (typeof updates.listingFeeDurationDays === 'number' && Number.isFinite(updates.listingFeeDurationDays)) {
    const sanitizedDuration = Math.round(updates.listingFeeDurationDays);
    if (sanitizedDuration < 1 || sanitizedDuration > 365) {
      throw new Error('Listing duration must be between 1 and 365 days.');
    }
    updatePayload.listingFeeDurationDays = sanitizedDuration;
  }

  try {
    const conn = await connectToDatabase();
    if (conn) {
      const doc = await PlatformSettingsModel.findOneAndUpdate(
        {},
        { $set: updatePayload },
        { returnDocument: 'after', upsert: true }
      ).lean();

      if (doc) {
        cachedSettings = {
          requireGoogleLogin: Boolean(doc.requireGoogleLogin),
          requirePhoneOtp: Boolean(doc.requirePhoneOtp),
          listingFeeAmount: typeof doc.listingFeeAmount === 'number' ? doc.listingFeeAmount : 10,
          listingFeeDurationDays: typeof doc.listingFeeDurationDays === 'number' ? doc.listingFeeDurationDays : 30,
          updatedBy: doc.updatedBy || adminUser.email,
          updatedAt: new Date(),
        };

        // Record audit log
        await createAuditLog({
          actorId: adminUser.id,
          actorName: adminUser.name,
          actorEmail: adminUser.email,
          actorRole: adminUser.role,
          action: 'PLATFORM_SETTINGS_UPDATED',
          entityType: 'SYSTEM',
          entityId: 'platform_settings',
          metadata: {
            requireGoogleLogin: doc.requireGoogleLogin,
            requirePhoneOtp: doc.requirePhoneOtp,
            listingFeeAmount: doc.listingFeeAmount,
            listingFeeDurationDays: doc.listingFeeDurationDays,
            updatedBy: updatePayload.updatedBy,
          },
        });

        return doc as unknown as IPlatformSettings;
      }
    }
  } catch (error) {
    console.error('Error updating platform settings in MongoDB:', error);
    if (error instanceof Error && error.message.includes('Listing fee')) {
      throw error;
    }
  }

  // Update cached state if DB temporarily unavailable
  if (typeof updates.requireGoogleLogin === 'boolean') {
    cachedSettings.requireGoogleLogin = updates.requireGoogleLogin;
  }
  if (typeof updates.requirePhoneOtp === 'boolean') {
    cachedSettings.requirePhoneOtp = updates.requirePhoneOtp;
  }
  if (typeof updatePayload.listingFeeAmount === 'number') {
    cachedSettings.listingFeeAmount = updatePayload.listingFeeAmount;
  }
  if (typeof updatePayload.listingFeeDurationDays === 'number') {
    cachedSettings.listingFeeDurationDays = updatePayload.listingFeeDurationDays;
  }
  cachedSettings.updatedBy = updatePayload.updatedBy || adminUser.email;
  cachedSettings.updatedAt = new Date();

  return {
    requireGoogleLogin: cachedSettings.requireGoogleLogin,
    requirePhoneOtp: cachedSettings.requirePhoneOtp,
    listingFeeAmount: cachedSettings.listingFeeAmount,
    listingFeeDurationDays: cachedSettings.listingFeeDurationDays,
    updatedBy: cachedSettings.updatedBy,
    updatedAt: cachedSettings.updatedAt,
  };
}
