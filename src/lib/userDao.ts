import mongoose, { Schema } from 'mongoose';

const usersSchema = new Schema({
  supabase_id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  hashed_password: { type: String, required: true },
  password_version: { type: Number, default: 1 },
  hasVault: { type: Boolean, default: false },
  vaultLastSync: { type: Date, default: null },
  created_at: { type: Date, default: Date.now }
});

const passwordResetTokensSchema = new Schema({
  supabase_user_id: { type: String, required: true },
  token: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  expires_at: { type: Date, required: true }
});

const temporaryContentSchema = new Schema({
  supabase_user_id: { type: String, required: true },
  identifier: { type: String, required: true, unique: true },
  hashed_password: { type: String },
  max_date: { type: Date, required: true },
  // Server-sealed AES-256-GCM payload (see src/lib/temporary_content_crypto.ts).
  // `auth_tag` also marks the storage generation: records created by the
  // removed client-side encryption lack it and are purged as unreadable.
  encrypted_content: { type: String, required: true },
  iv: { type: String, required: true },
  auth_tag: { type: String, required: true },
  strategy: { type: String },
  created_at: { type: Date, default: Date.now }
});

export const UsersModel = mongoose.models.Users || mongoose.model('Users', usersSchema, 'Users');
export const PasswordResetTokensModel = mongoose.models.PasswordResetTokens || mongoose.model('PasswordResetTokens', passwordResetTokensSchema, 'PasswordResetTokens');
export const TemporaryContentModel = mongoose.models.TemporaryContent || mongoose.model('TemporaryContent', temporaryContentSchema, 'TemporaryContent');

