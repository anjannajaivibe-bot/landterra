import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/security/auth';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { CreateReportSchema } from '@/lib/validation/actions';
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

  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ipAddress = forwarded
    ? forwarded.split(',')[0].trim()
    : realIp || '127.0.0.1';

  // Per-user throttling (5 reports per 10 minutes)
  const userRate = await checkRateLimit(`report-user:${authUser.id}`, 5, 10 * 60 * 1000);
  if (!userRate.allowed) {
    return NextResponse.json(
      { error: 'Too many reports submitted. Please wait a few minutes before submitting additional reports.' },
      { status: 429, headers: { 'Retry-After': '600' } }
    );
  }

  // Per-IP throttling (10 reports per 10 minutes)
  const ipRate = await checkRateLimit(`report-ip:${ipAddress}`, 10, 10 * 60 * 1000);
  if (!ipRate.allowed) {
    return NextResponse.json(
      { error: 'Too many reports submitted from this network. Please wait a few minutes.' },
      { status: 429, headers: { 'Retry-After': '600' } }
    );
  }

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
