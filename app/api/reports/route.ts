import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/security/auth';
import { CreateReportSchema } from '@/lib/validation/payment';
import { createReport, getAllReports, updateReportStatus } from '@/services/inquiry.service';
import { z } from 'zod';

const UpdateReportStatusSchema = z.object({
  reportId: z.string().min(1, 'Report ID is required'),
  status: z.enum(['RESOLVED', 'DISMISSED']),
});

export async function GET(req: NextRequest) {
  const adminUser = await requireRole(req, ['ADMIN']);
  if (adminUser instanceof NextResponse) return adminUser;

  try {
    const reports = await getAllReports();
    return NextResponse.json({ reports });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch reports';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authUser = await requireAuth(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const body = await req.json();
    const validated = CreateReportSchema.parse(body);

    const report = await createReport({
      propertyId: validated.propertyId,
      reporterId: authUser.id,
      reporterName: authUser.name,
      reporterEmail: authUser.email,
      reason: validated.reason,
      description: validated.description,
    });

    return NextResponse.json({
      success: true,
      message: 'Report submitted. Our trust and safety team will review this listing.',
      report,
    });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'issues' in err) {
      return NextResponse.json({ error: 'Validation failed', details: err }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : 'Failed to submit report';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const adminUser = await requireRole(req, ['ADMIN']);
  if (adminUser instanceof NextResponse) return adminUser;

  try {
    const body = await req.json();
    const validated = UpdateReportStatusSchema.parse(body);

    const updated = await updateReportStatus(
      validated.reportId,
      validated.status,
      {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Report marked as ${validated.status.toLowerCase()}.`,
      report: updated,
    });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'issues' in err) {
      return NextResponse.json({ error: 'Validation failed', details: err }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : 'Failed to update report';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
