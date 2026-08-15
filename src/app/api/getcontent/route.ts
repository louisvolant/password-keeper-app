import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getSession } from '@/lib/session';
import { UserContentModel } from '@/lib/userDao';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await getSession(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let file_path = request.nextUrl.searchParams.get('file_path');
  if (!file_path) file_path = 'default';

  try {
    await connectToDatabase();
    const content = await UserContentModel.findOne({
      supabase_user_id: user.id.toString(),
      file_path,
    });

    if (!content) {
      await UserContentModel.findOneAndUpdate(
        { supabase_user_id: user.id.toString(), file_path },
        {
          supabase_user_id: user.id.toString(),
          encoded_content: '',
          file_path,
          created_at: new Date(),
          updated_at: new Date(),
        },
        { upsert: true, new: true }
      );
      return NextResponse.json({ encoded_content: '', file_path });
    }

    return NextResponse.json({
      encoded_content: content.encoded_content,
      file_path: content.file_path,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error retrieving content:', error);
    return NextResponse.json({ error: 'Server error', details: message }, { status: 500 });
  }
}
