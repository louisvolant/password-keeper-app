import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';

export const runtime = 'nodejs';

// Session check now validates the cookie against the user document,
// including the password-rotation counter, so revoked sessions are
// reported as unauthenticated even before their 24h cookie expiry.
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (user) {
      return NextResponse.json({ success: true, isAuthenticated: true });
    } else {
      return NextResponse.json({ success: false, isAuthenticated: false, error: 'Not authenticated' });
    }
  } catch {
    return NextResponse.json({ success: false, isAuthenticated: false, error: 'Not authenticated' }, { status: 500 });
  }
}
