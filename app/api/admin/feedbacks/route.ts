import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/auth';
import { getAllFeedbacks, getFeedbackStats } from '@/services/feedback.service';

export async function GET(req: NextRequest) {
  const adminUser = await requireRole(req, ['ADMIN']);
  if (adminUser instanceof NextResponse) return adminUser;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || undefined;
  const reason = searchParams.get('reason') || undefined;
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 30));
  const skip = (page - 1) * limit;

  try {
    const [{ feedbacks, total }, stats] = await Promise.all([
      getAllFeedbacks({ limit, skip, reason, search }),
      getFeedbackStats(),
    ]);

    return NextResponse.json({
      success: true,
      feedbacks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      stats,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch admin feedbacks';
    console.error('Error fetching feedbacks:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
