import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const user = await getSession(request);
  if (user) {
    return NextResponse.json({ success: true, isAuthenticated: true });
  } else {
    return NextResponse.json({ success: false, isAuthenticated: false, error: 'Not authenticated' });
  }
}
