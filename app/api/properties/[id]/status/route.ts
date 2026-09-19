import { NextRequest, NextResponse } from 'next/server';
import {
  getPropertyById,
  updateProperty,
  markPropertyAsSold,
  submitPropertyForReview,
} from '@/services/property.service';
import { requireAuth } from '@/lib/security/auth';
import { createAuditLog } from '@/services/audit.service';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await requireAuth(req);
  if (authUser instanceof NextResponse) return authUser;

  const { id } = await params;
  const existing = await getPropertyById(id);
  if (!existing) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  if (authUser.role !== 'ADMIN' && authUser.id !== existing.sellerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { action } = await req.json(); // 'PAUSE' | 'RESUME' | 'MARK_SOLD'
    if (
      action !== 'PAUSE' &&
      action !== 'RESUME' &&
      action !== 'MARK_SOLD' &&
      action !== 'SUBMIT_FOR_REVIEW'
    ) {
      return NextResponse.json(
        { error: 'Invalid action. Must be PAUSE, RESUME, MARK_SOLD, or SUBMIT_FOR_REVIEW' },
        { status: 400 }
      );
    }

    if (existing.listingStatus === 'DELETED') {
      return NextResponse.json(
        { error: 'Cannot update status of a deleted listing.' },
        { status: 400 }
      );
    }

    let updated = null;
    let newStatus = existing.listingStatus;

    if (action === 'SUBMIT_FOR_REVIEW') {
      updated = await submitPropertyForReview(id);
      newStatus = 'PENDING_VERIFICATION';
    } else if (action === 'MARK_SOLD') {
      updated = await markPropertyAsSold(id);
      newStatus = 'SOLD';
    } else if (action === 'RESUME') {
      if (existing.verificationStatus === 'REJECTED') {
        return NextResponse.json(
          { error: 'Cannot resume listing. This listing was rejected by moderation.' },
          { status: 400 }
        );
      }

      const hasPaid = existing.paymentStatus === 'PAID' || existing.isFeePaid === true;
      if (!hasPaid) {
        return NextResponse.json(
          { error: 'Cannot resume listing. Listing fee payment is required.' },
          { status: 400 }
        );
      }

      if (existing.subscriptionExpiresAt && new Date(existing.subscriptionExpiresAt) < new Date()) {
        return NextResponse.json(
          { error: 'Listing subscription has expired. Please renew to publish.' },
          { status: 400 }
        );
      }

      newStatus = 'PUBLISHED';
      updated = await updateProperty(id, { listingStatus: 'PUBLISHED' });
    } else if (action === 'PAUSE') {
      newStatus = 'PAUSED';
      updated = await updateProperty(id, { listingStatus: 'PAUSED' });
    }

    await createAuditLog({
      actorId: authUser.id,
      actorName: authUser.name,
      actorEmail: authUser.email,
      actorRole: authUser.role,
      action: action === 'MARK_SOLD' ? 'PROPERTY_MARKED_SOLD' : `PROPERTY_${action}D`,
      entityType: 'PROPERTY',
      entityId: id,
      metadata: { previousStatus: existing.listingStatus, newStatus, action },
    });

    return NextResponse.json({ success: true, property: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update status';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
