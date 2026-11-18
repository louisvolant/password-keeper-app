// Authenticated-request helper.
//
// The session cookie is stateless; this module is the single place that
// binds it back to the user document and enforces the password-rotation
// check. A session stays valid only while the user's current
// `password_rotation` matches the value embedded in the cookie, so changing
// or resetting a password immediately revokes every session issued before
// the rotation (e.g. a cookie stolen from a shared computer or malware).
//
// Routes that additionally re-verify identity (password change, account
// deletion) also use the returned `hashed_password` /
// `password_version` to check the submitted current password.

import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getSession } from '@/lib/session';
import { UsersModel } from '@/lib/userDao';

export interface AuthenticatedUser {
  id: string;
  username: string;
  hashed_password: string;
  password_version?: number;
}

interface UserDoc {
  supabase_id: string;
  username: string;
  hashed_password: string;
  password_version?: number;
  password_rotation?: number;
}

export async function getAuthenticatedUser(request?: NextRequest): Promise<AuthenticatedUser | null> {
  const session = await getSession(request);
  if (!session) {
    return null;
  }

  await connectToDatabase();
  const user = await UsersModel.findOne({ supabase_id: session.id }).lean<UserDoc>();
  if (!user) {
    return null;
  }

  // Reject sessions issued before the latest password rotation. Both sides
  // are undefined for pre-migration users, keeping them logged in until
  // they next rotate their password.
  if (user.password_rotation !== session.password_rotation) {
    return null;
  }

  return {
    id: user.supabase_id,
    username: user.username,
    hashed_password: user.hashed_password,
    password_version: user.password_version,
  };
}
