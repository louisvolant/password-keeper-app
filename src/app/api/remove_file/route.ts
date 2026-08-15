import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getSession } from '@/lib/session';
import { UserContentModel } from '@/lib/userDao';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const user = await getSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { file_path } = await request.json();

  if (!file_path || typeof file_path !== 'string' || !file_path.trim()) {
    return NextResponse.json({ error: 'Valid file_path is required' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    await UserContentModel.deleteOne({
      supabase_user_id: user.id.toString(),
      file_path,
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Remove file error:', error);
    return NextResponse.json({ error: 'Server error', details: message }, { status: 500 });
  }
}
