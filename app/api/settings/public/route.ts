import { NextResponse } from 'next/server';
import { getPlatformSettings } from '@/services/settings.service';

export async function GET() {
  try {
    const settings = await getPlatformSettings();
    return NextResponse.json({
      requireGoogleLogin: settings.requireGoogleLogin,
      requirePhoneOtp: settings.requirePhoneOtp,
      listingFeeAmount: settings.listingFeeAmount || 10,
      listingFeeDurationDays: settings.listingFeeDurationDays || 30,
    });
  } catch {
    return NextResponse.json({
      requireGoogleLogin: true,
      requirePhoneOtp: true,
      listingFeeAmount: 10,
      listingFeeDurationDays: 30,
    });
  }
}
