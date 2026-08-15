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

  const { old_path, new_path } = await request.json();

  if (!old_path || !new_path || typeof old_path !== 'string' || typeof new_path !== 'string') {
    return NextResponse.json({ error: 'Valid old_path and new_path are required' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const isFolder = old_path.endsWith('/');
    if (isFolder) {
      const contents = await UserContentModel.find({
        supabase_user_id: user.id.toString(),
        file_path: { $regex: `^${old_path}` },
      });

      for (const content of contents) {
        const newFilePath = content.file_path.replace(old_path, new_path);
        await UserContentModel.updateOne(
          { _id: content._id },
          { file_path: newFilePath, updated_at: new Date() }
        );
      }
    } else {
      await UserContentModel.updateOne(
        { supabase_user_id: user.id.toString(), file_path: old_path },
        { file_path: new_path, updated_at: new Date() }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Rename error:', error);
    return NextResponse.json({ error: 'Server error', details: message }, { status: 500 });
  }
}
