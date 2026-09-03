import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/auth';
import { UserModel } from '@/models/User';
import { connectToDatabase } from '@/lib/db/mongodb';
import { createAuditLog } from '@/services/audit.service';

export async function GET(req: NextRequest) {
  const adminUser = await requireRole(req, ['ADMIN']);
  if (adminUser instanceof NextResponse) return adminUser;

  try {
    const conn = await connectToDatabase();
    if (conn) {
      const dbUsers = await UserModel.find({}).sort({ createdAt: -1 }).lean();
      return NextResponse.json({ users: dbUsers });
    }
  } catch (error) {
    console.error('Error fetching admin users:', error);
  }

  return NextResponse.json({ users: [] });
}

export async function PATCH(req: NextRequest) {
  const adminUser = await requireRole(req, ['ADMIN']);
  if (adminUser instanceof NextResponse) return adminUser;

  try {
    const { userId, role, isActive } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ error: 'Database is not connected' }, { status: 500 });
    }

    const updateFields: Record<string, any> = {};
    if (role) updateFields.role = role;
    if (isActive !== undefined) updateFields.isActive = isActive;

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await createAuditLog({
      actorId: adminUser.id,
      actorName: adminUser.name,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'USER_ROLE_OR_STATUS_UPDATED',
      entityType: 'USER',
      entityId: userId,
      metadata: { role, isActive },
    });

    return NextResponse.json({ success: true, message: 'User updated successfully', user: updatedUser });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update user';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
