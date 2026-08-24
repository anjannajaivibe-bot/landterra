import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/auth';
import { getPlatformSettings, updatePlatformSettings } from '@/services/settings.service';

export async function GET(req: NextRequest) {
  const adminUser = await requireRole(req, ['ADMIN']);
  if (adminUser instanceof NextResponse) return adminUser;

  try {
    const settings = await getPlatformSettings();
    return NextResponse.json({ success: true, settings });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch platform settings';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const adminUser = await requireRole(req, ['ADMIN']);
  if (adminUser instanceof NextResponse) return adminUser;

  try {
    const body = await req.json();
    const { requireGoogleLogin, requirePhoneOtp, listingFeeAmount, listingFeeDurationDays } = body;

    const updates: {
      requireGoogleLogin?: boolean;
      requirePhoneOtp?: boolean;
      listingFeeAmount?: number;
      listingFeeDurationDays?: number;
    } = {};

    if (typeof requireGoogleLogin === 'boolean') {
      updates.requireGoogleLogin = requireGoogleLogin;
    }
    if (typeof requirePhoneOtp === 'boolean') {
      updates.requirePhoneOtp = requirePhoneOtp;
    }
    if (typeof listingFeeAmount === 'number') {
      updates.listingFeeAmount = listingFeeAmount;
    }
    if (typeof listingFeeDurationDays === 'number') {
      updates.listingFeeDurationDays = listingFeeDurationDays;
    }

    const updatedSettings = await updatePlatformSettings(updates, adminUser);

    return NextResponse.json({
      success: true,
      message: 'Platform settings updated successfully',
      settings: updatedSettings,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update platform settings';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
