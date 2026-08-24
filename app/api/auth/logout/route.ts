import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Signed out successfully',
  });

  response.cookies.delete('landterra_session');
  response.cookies.delete('verified_phone');
  response.cookies.delete('landterra_active_role');
  response.cookies.delete('landterra_dev_role');

  return response;
}
