import { AuditLogModel } from '@/models/Inquiry';
import { connectToDatabase } from '@/lib/db/mongodb';

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
  await connectToDatabase();

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
      { upsert: true, returnDocument: 'after' }
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

export async function getAuditLogs(limit = 50) {
  await connectToDatabase();
  const docs = await AuditLogModel.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return (docs || []).map((d) => ({
    ...d,
    _id: String(d._id),
  }));
}
