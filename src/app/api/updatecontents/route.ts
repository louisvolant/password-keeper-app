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

  const { updates } = await request.json();

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: 'updates array is required' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const updatedAt = new Date();
    const bulkOps = updates.map(({ file_path, encoded_content }: { file_path: string; encoded_content: string }) => ({
      updateOne: {
        filter: { supabase_user_id: user.id.toString(), file_path },
        update: {
          encoded_content,
          updated_at: updatedAt,
          $setOnInsert: {
            supabase_user_id: user.id.toString(),
            created_at: updatedAt,
          },
        },
        upsert: true,
      },
    }));

    await UserContentModel.bulkWrite(bulkOps);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error batch updating content:', error);
    return NextResponse.json({ error: 'Server error', details: message }, { status: 500 });
  }
}
