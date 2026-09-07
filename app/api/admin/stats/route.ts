import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { PropertyModel } from '@/models/Property';
import { PaymentModel } from '@/models/Payment';
import { ReportModel } from '@/models/Inquiry';
import { UserModel } from '@/models/User';

export const dynamic = 'force-dynamic';

/**
 * Admin Stats API
 * Fixes D-2: High-efficiency MongoDB aggregation pipelines replacing in-memory 1,000 doc filtering.
 * Fixes G-5: Explicit HTTP 503 response if MongoDB connection is unavailable.
 */
export async function GET(req: NextRequest) {
  const adminUser = await requireRole(req, ['ADMIN']);
  if (adminUser instanceof NextResponse) return adminUser;

  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json(
        { error: 'Database service is temporarily unavailable. Please try again shortly.' },
        { status: 503 }
      );
    }

    const [
      propertyStatsResult,
      paymentStatsResult,
      totalReportsCount,
      pendingReportsCount,
      totalUsersResult,
      distinctSellersResult,
      totalAdminsResult,
    ] = await Promise.all([
      // 1. Property counts aggregated by status in a single pass
      PropertyModel.aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            published: [
              { $match: { listingStatus: 'PUBLISHED' } },
              { $count: 'count' },
            ],
            pending: [
              { $match: { verificationStatus: 'PENDING' } },
              { $count: 'count' },
            ],
            verified: [
              { $match: { verificationStatus: 'VERIFIED' } },
              { $count: 'count' },
            ],
            rejected: [
              { $match: { verificationStatus: 'REJECTED' } },
              { $count: 'count' },
            ],
          },
        },
      ]),

      // 2. Financial totals calculated across ALL payments
      PaymentModel.aggregate([
        {
          $facet: {
            totalCount: [{ $count: 'count' }],
            paidTotal: [
              { $match: { paymentStatus: 'PAID' } },
              { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
            ],
          },
        },
      ]),

      // 3. Reports count
      ReportModel.countDocuments({}),
      ReportModel.countDocuments({ status: 'PENDING' }),

      // 4. User counts by dynamic listing criteria
      UserModel.countDocuments({}),
      PropertyModel.distinct('sellerId'),
      UserModel.countDocuments({ role: 'ADMIN' }),
    ]);

    const totalUsers = totalUsersResult || 0;
    const totalSellers = Array.isArray(distinctSellersResult)
      ? distinctSellersResult.filter(Boolean).length
      : 0;
    const totalAdmins = totalAdminsResult || 0;
    const totalBuyers = Math.max(0, totalUsers - totalSellers - totalAdmins);

    const propStats = propertyStatsResult?.[0];
    const totalProperties = propStats?.total?.[0]?.count || 0;
    const publishedProperties = propStats?.published?.[0]?.count || 0;
    const pendingProperties = propStats?.pending?.[0]?.count || 0;
    const verifiedProperties = propStats?.verified?.[0]?.count || 0;
    const rejectedProperties = propStats?.rejected?.[0]?.count || 0;

    const payStats = paymentStatsResult?.[0];
    const totalPaymentsCount = payStats?.totalCount?.[0]?.count || 0;
    const totalPublishingFees = payStats?.paidTotal?.[0]?.totalAmount || 0;

    return NextResponse.json({
      metrics: {
        totalProperties,
        publishedProperties,
        pendingProperties,
        verifiedProperties,
        rejectedProperties,
        totalPublishingFees,
        totalPaymentsCount,
        totalReportsCount,
        pendingReportsCount,
        totalUsers,
        totalSellers,
        totalBuyers,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch admin stats';
    console.error('[admin:stats] Aggregation query failed:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
