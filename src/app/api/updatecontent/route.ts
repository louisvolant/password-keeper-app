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

  const { encoded_content, file_path } = await request.json();

  if (!file_path) {
    return NextResponse.json({ error: 'file_path is required' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const updatedAt = new Date();
    await UserContentModel.findOneAndUpdate(
      { supabase_user_id: user.id.toString(), file_path },
      {
        encoded_content,
        updated_at: updatedAt,
        $setOnInsert: {
          supabase_user_id: user.id.toString(),
          created_at: updatedAt,
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating content:', error);
    return NextResponse.json({ error: 'Server error', details: message }, { status: 500 });
  }
}
