import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/security/auth';

export async function POST() {
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
