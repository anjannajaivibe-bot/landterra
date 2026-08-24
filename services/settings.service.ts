import { PlatformSettingsModel, IPlatformSettings } from '@/models/PlatformSettings';
import { connectToDatabase } from '@/lib/db/mongodb';
import { createAuditLog } from '@/services/audit.service';

// In-memory cache for settings
let cachedSettings: {
  requireGoogleLogin: boolean;
  requirePhoneOtp: boolean;
  updatedBy: string;
  updatedAt: Date;
} = {
  requireGoogleLogin: true,
  requirePhoneOtp: true,
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
          updatedBy: 'SYSTEM',
        });
        doc = created.toObject();
      }

      cachedSettings = {
        requireGoogleLogin: Boolean(doc.requireGoogleLogin),
        requirePhoneOtp: Boolean(doc.requirePhoneOtp),
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

  try {
    const conn = await connectToDatabase();
    if (conn) {
      const doc = await PlatformSettingsModel.findOneAndUpdate(
        {},
        { $set: updatePayload },
        { new: true, upsert: true }
      ).lean();

      if (doc) {
        cachedSettings = {
          requireGoogleLogin: Boolean(doc.requireGoogleLogin),
          requirePhoneOtp: Boolean(doc.requirePhoneOtp),
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
            updatedBy: updatePayload.updatedBy,
          },
        });

        return doc as unknown as IPlatformSettings;
      }
    }
  } catch (error) {
    console.error('Error updating platform settings in MongoDB:', error);
  }

  // Update cached state if DB temporarily unavailable
  if (typeof updates.requireGoogleLogin === 'boolean') {
    cachedSettings.requireGoogleLogin = updates.requireGoogleLogin;
  }
  if (typeof updates.requirePhoneOtp === 'boolean') {
    cachedSettings.requirePhoneOtp = updates.requirePhoneOtp;
  }
  cachedSettings.updatedBy = updatePayload.updatedBy || adminUser.email;
  cachedSettings.updatedAt = new Date();

  return {
    requireGoogleLogin: cachedSettings.requireGoogleLogin,
    requirePhoneOtp: cachedSettings.requirePhoneOtp,
    updatedBy: cachedSettings.updatedBy,
    updatedAt: cachedSettings.updatedAt,
  };
}
