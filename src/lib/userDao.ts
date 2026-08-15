import mongoose, { Schema } from 'mongoose';

const usersSchema = new Schema({
  supabase_id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  hashed_password: { type: String, required: true },
  password_version: { type: Number, default: 1 },
  created_at: { type: Date, default: Date.now }
});

const passwordResetTokensSchema = new Schema({
  supabase_user_id: { type: String, required: true },
  token: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  expires_at: { type: Date, required: true }
});

const userContentSchema = new Schema({
  supabase_user_id: { type: String, required: true },
  file_path: { type: String, required: true },
  file_uuid: { type: String },
  encoded_content: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const userFileTreeSchema = new Schema({
  supabase_user_id: { type: String, required: true, unique: true },
  file_tree: {
    type: String,
    required: true,
    validate: {
      validator: function (value: string) {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) && parsed.every(file =>
            typeof file.file_name === 'string' && file.file_name.trim() && typeof file.uuid === 'string'
          );
        } catch {
          return false;
        }
      },
      message: 'file_tree must be a valid JSON string representing an array of { file_name: string, uuid: string } objects'
    }
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const temporaryContentSchema = new Schema({
  supabase_user_id: { type: String, required: true },
  identifier: { type: String, required: true, unique: true },
  hashed_password: { type: String },
  max_date: { type: Date, required: true },
  encoded_content: { type: String, required: true },
  iv: { type: String, required: true },
  strategy: { type: String },
  created_at: { type: Date, default: Date.now }
});

export const UsersModel = mongoose.models.Users || mongoose.model('Users', usersSchema, 'Users');
export const PasswordResetTokensModel = mongoose.models.PasswordResetTokens || mongoose.model('PasswordResetTokens', passwordResetTokensSchema, 'PasswordResetTokens');
export const UserContentModel = mongoose.models.UserContent || mongoose.model('UserContent', userContentSchema, 'UserContent');
export const UserFileTreeModel = mongoose.models.UserFileTree || mongoose.model('UserFileTree', userFileTreeSchema, 'UserFileTree');
export const TemporaryContentModel = mongoose.models.TemporaryContent || mongoose.model('TemporaryContent', temporaryContentSchema, 'TemporaryContent');
