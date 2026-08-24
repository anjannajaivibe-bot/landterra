import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/auth';
import { getProperties } from '@/services/property.service';
import { getAllPayments } from '@/services/payment.service';
import { getAllReports } from '@/services/inquiry.service';
import { UserModel } from '@/models/User';
import { connectToDatabase } from '@/lib/db/mongodb';

export async function GET(req: NextRequest) {
  const adminUser = await requireRole(req, ['ADMIN']);
  if (adminUser instanceof NextResponse) return adminUser;

  try {
    const allProps = await getProperties({ limit: 1000, listingStatus: 'ALL' });
    const payments = await getAllPayments(100);
    const reports = await getAllReports();

    let totalUsers = 0;
    let totalSellers = 0;
    let totalBuyers = 0;

    try {
      const conn = await connectToDatabase();
      if (conn) {
        totalUsers = await UserModel.countDocuments({});
        totalSellers = await UserModel.countDocuments({ role: 'SELLER' });
        totalBuyers = await UserModel.countDocuments({ role: 'BUYER' });
      }
    } catch (e) {
      console.error('Error counting users:', e);
    }

    const properties = allProps.data;
    const totalProperties = properties.length;
    const publishedProperties = properties.filter((p) => p.listingStatus === 'PUBLISHED').length;
    const pendingProperties = properties.filter((p) => p.verificationStatus === 'PENDING').length;
    const verifiedProperties = properties.filter((p) => p.verificationStatus === 'VERIFIED').length;
    const rejectedProperties = properties.filter((p) => p.verificationStatus === 'REJECTED').length;

    const totalPublishingFees = payments
      .filter((p) => p.paymentStatus === 'PAID')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const pendingReports = reports.filter((r) => r.status === 'PENDING').length;

    return NextResponse.json({
      metrics: {
        totalProperties,
        publishedProperties,
        pendingProperties,
        verifiedProperties,
        rejectedProperties,
        totalPublishingFees,
        totalPaymentsCount: payments.length,
        totalReportsCount: reports.length,
        pendingReportsCount: pendingReports,
        totalUsers,
        totalSellers,
        totalBuyers,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch admin stats';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
