import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, verifySessionToken, SESSION_COOKIE, invalidateUserSessionCache } from '@/lib/security/auth';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    const payload = verifySessionToken(token);
    if (payload?.userId) {
      invalidateUserSessionCache(payload.userId);
    }
  }

  const response = NextResponse.json({
    success: true,
    message: 'Signed out successfully',
  });

  clearSessionCookie(response);
  response.cookies.delete('verified_phone');
  response.cookies.delete('landterra_active_role');
  response.cookies.delete('landterra_dev_role');

  return response;
}
