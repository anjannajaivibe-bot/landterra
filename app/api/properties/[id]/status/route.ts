import { NextRequest, NextResponse } from 'next/server';
import { getPropertyById, updateProperty } from '@/services/property.service';
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
    const { action } = await req.json(); // 'PAUSE' | 'RESUME'
    if (action !== 'PAUSE' && action !== 'RESUME') {
      return NextResponse.json({ error: 'Invalid action. Must be PAUSE or RESUME' }, { status: 400 });
    }

    if (action === 'RESUME' && existing.verificationStatus !== 'VERIFIED') {
      return NextResponse.json(
        { error: 'Cannot resume listing. Only verified properties can be published live.' },
        { status: 400 }
      );
    }

    const newStatus = action === 'PAUSE' ? 'PAUSED' : 'PUBLISHED';
    const updated = await updateProperty(id, { listingStatus: newStatus });

    await createAuditLog({
      actorId: authUser.id,
      actorName: authUser.name,
      actorEmail: authUser.email,
      actorRole: authUser.role,
      action: `PROPERTY_${action}D`,
      entityType: 'PROPERTY',
      entityId: id,
      metadata: { previousStatus: existing.listingStatus, newStatus },
    });

    return NextResponse.json({ success: true, property: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update status';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
