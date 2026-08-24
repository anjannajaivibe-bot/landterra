import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/auth';
import { VerifyPropertyActionSchema } from '@/lib/validation/payment';
import { executePropertyVerification } from '@/services/verification.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await requireRole(req, ['ADMIN']);
  if (adminUser instanceof NextResponse) return adminUser;

  const { id } = await params;

  try {
    const body = await req.json();
    const validated = VerifyPropertyActionSchema.parse(body);

    const updated = await executePropertyVerification({
      propertyId: id,
      action: validated.action,
      rejectionReason: validated.rejectionReason,
      adminNotes: validated.adminNotes,
      adminUser: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Property ${validated.action === 'APPROVE' ? 'verified and published' : validated.action.toLowerCase() + 'ed'} successfully.`,
      property: updated,
    });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'issues' in err) {
      return NextResponse.json({ error: 'Validation failed', details: err }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : 'Verification action failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
