import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getSession } from '@/lib/session';
import { UserFileTreeModel } from '@/lib/userDao';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await getSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const fileTreeDoc = await UserFileTreeModel.findOne({
      supabase_user_id: user.id.toString(),
    });

    if (!fileTreeDoc) {
      await UserFileTreeModel.findOneAndUpdate(
        { supabase_user_id: user.id.toString() },
        {
          supabase_user_id: user.id.toString(),
          file_tree: '[]',
          created_at: new Date(),
          updated_at: new Date(),
        },
        { upsert: true, new: true }
      );
      return NextResponse.json({ file_tree: [] });
    }

    let fileTree;
    try {
      fileTree = fileTreeDoc.file_tree ? JSON.parse(fileTreeDoc.file_tree) : [];
    } catch (error) {
      console.error('Invalid file_tree JSON:', fileTreeDoc.file_tree, error);
      return NextResponse.json({ error: 'Invalid file tree format' }, { status: 500 });
    }

    if (!Array.isArray(fileTree) || !fileTree.every(file =>
      typeof file.file_name === 'string' && file.file_name.trim() && typeof file.uuid === 'string'
    )) {
      console.error('Invalid file tree format:', fileTree);
      return NextResponse.json({ error: 'Invalid file tree format' }, { status: 500 });
    }

    return NextResponse.json({ file_tree: fileTree });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Get file tree error:', error);
    return NextResponse.json({ error: 'Server error', details: message }, { status: 500 });
  }
}
