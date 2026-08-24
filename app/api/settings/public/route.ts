import { NextResponse } from 'next/server';
import { getPlatformSettings } from '@/services/settings.service';

export async function GET() {
  try {
    const settings = await getPlatformSettings();
    return NextResponse.json({
      requireGoogleLogin: settings.requireGoogleLogin,
      requirePhoneOtp: settings.requirePhoneOtp,
    });
  } catch {
    return NextResponse.json({
      requireGoogleLogin: true,
      requirePhoneOtp: true,
    });
  }
}
