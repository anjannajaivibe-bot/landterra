import { NextResponse } from 'next/server';
import { getPlatformSettings } from '@/services/settings.service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await getPlatformSettings();
    const payload = {
      requireGoogleLogin: Boolean(settings.requireGoogleLogin),
      requirePhoneOtp: Boolean(settings.requirePhoneOtp),
      listingFeeAmount: typeof settings.listingFeeAmount === 'number' ? settings.listingFeeAmount : 10,
      listingFeeDurationDays: typeof settings.listingFeeDurationDays === 'number' ? settings.listingFeeDurationDays : 30,
    };

    return NextResponse.json(
      {
        ...payload,
        settings: payload, // Support both root properties and nested .settings access
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch {
    const fallback = {
      requireGoogleLogin: true,
      requirePhoneOtp: false, // Default to false on failure so sellers aren't blocked unexpectedly
      listingFeeAmount: 10,
      listingFeeDurationDays: 30,
    };

    return NextResponse.json(
      {
        ...fallback,
        settings: fallback,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  }
}
