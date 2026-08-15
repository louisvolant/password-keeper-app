import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getSession } from '@/lib/session';
import { UserFileTreeModel } from '@/lib/userDao';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const user = await getSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { file_tree } = await request.json();

  if (!Array.isArray(file_tree)) {
    return NextResponse.json({ error: 'file_tree must be an array' }, { status: 400 });
  }

  if (!file_tree.every(file =>
    typeof file.file_name === 'string' && file.file_name.trim() && typeof file.uuid === 'string'
  )) {
    return NextResponse.json({ error: 'Invalid file tree entries' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const updatedAt = new Date();
    await UserFileTreeModel.findOneAndUpdate(
      { supabase_user_id: user.id.toString() },
      {
        file_tree: JSON.stringify(file_tree),
        updated_at: updatedAt,
        $setOnInsert: {
          supabase_user_id: user.id.toString(),
          created_at: updatedAt,
        },
      },
      { upsert: true }
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Update file tree error:', error);
    return NextResponse.json({ error: 'Server error', details: message }, { status: 500 });
  }
}
