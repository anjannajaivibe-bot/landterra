import { AuditLogModel } from '@/models/Inquiry';
import { connectToDatabase } from '@/lib/db/mongodb';

// In-memory audit log store for fallback preview
const memoryAuditLogs: Array<{
  _id: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: 'PROPERTY' | 'USER' | 'PAYMENT' | 'DOCUMENT' | 'REPORT' | 'SYSTEM';
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}> = [];

export async function createAuditLog({
  actorId,
  actorName,
  actorEmail,
  actorRole,
  action,
  entityType,
  entityId,
  metadata,
  ipAddress,
  eventKey,
}: {
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: 'PROPERTY' | 'USER' | 'PAYMENT' | 'DOCUMENT' | 'REPORT' | 'SYSTEM';
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  eventKey?: string;
}) {
  try {
    const conn = await connectToDatabase();
    if (conn) {
      if (eventKey) {
        return await AuditLogModel.findOneAndUpdate(
          { eventKey },
          {
            $setOnInsert: {
              actorId,
              eventKey,
              actorName,
              actorEmail,
              actorRole,
              action,
              entityType,
              entityId,
              metadata,
              ipAddress,
            },
          },
          { new: true, upsert: true, returnDocument: 'after' }
        );
      }

      return await AuditLogModel.create({
        actorId,
        actorName,
        actorEmail,
        actorRole,
        action,
        entityType,
        entityId,
        metadata,
        ipAddress,
      });
    }
  } catch (e) {
    console.error('Audit log mongo error:', e);
  }

  const logEntry = {
    _id: 'audit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    actorId,
    actorName,
    actorEmail,
    actorRole,
    action,
    entityType,
    entityId,
    metadata,
    ipAddress,
    createdAt: new Date(),
  };

  memoryAuditLogs.unshift(logEntry);
  return logEntry;
}

export async function getAuditLogs(limit = 50) {
  try {
    const conn = await connectToDatabase();
    if (conn) {
      return await AuditLogModel.find({}).sort({ createdAt: -1 }).limit(limit).lean();
    }
  } catch {
    // fallback
  }

  return memoryAuditLogs.slice(0, limit);
}
