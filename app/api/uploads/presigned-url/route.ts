import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/auth';
import { generateUploadTicket } from '@/services/upload.service';

export async function POST(req: NextRequest) {
  const authUser = await requireAuth(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const { fileName, mimeType, isPrivate } = await req.json();

    if (!fileName || !mimeType) {
      return NextResponse.json({ error: 'fileName and mimeType are required' }, { status: 400 });
    }

    const ticket = await generateUploadTicket(fileName, mimeType, Boolean(isPrivate));
    return NextResponse.json(ticket);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate upload ticket';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
