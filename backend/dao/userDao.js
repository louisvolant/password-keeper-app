// dao/userDao.js
const mongoose = require('../config/mongoose');

const usersSchema = new mongoose.Schema({
  supabase_id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  hashed_password: { type: String, required: true },
  password_version: { type: Number, default: 1 },
  created_at: { type: Date, default: Date.now }
});
const UsersModel = mongoose.model('Users', usersSchema, 'Users');

const passwordResetTokensSchema = new mongoose.Schema({
  supabase_user_id: { type: String, required: true },
  token: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  expires_at: { type: Date, required: true }
});
const PasswordResetTokensModel = mongoose.model('PasswordResetTokens', passwordResetTokensSchema, 'PasswordResetTokens');

const userContentSchema = new mongoose.Schema({
  supabase_user_id: { type: String, required: true },
  file_path: { type: String, required: true },
  file_uuid: { type: String },
  encoded_content: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  indexes: [
    { key: { supabase_user_id: 1, file_path: 1 }, unique: true },
    { key: { supabase_user_id: 1, file_uuid: 1 } }
  ]
});
const UserContentModel = mongoose.model('UserContent', userContentSchema, 'UserContent');

const userFileTreeSchema = new mongoose.Schema({
  supabase_user_id: { type: String, required: true, unique: true },
  file_tree: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
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
const UserFileTreeModel = mongoose.model('UserFileTree', userFileTreeSchema, 'UserFileTree');

const temporaryContentSchema = new mongoose.Schema({
  supabase_user_id: { type: String, required: true },
  identifier: { type: String, required: true, unique: true },
  hashed_password: { type: String },
  max_date: { type: Date, required: true },
  encoded_content: { type: String, required: true },
  iv: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});
const TemporaryContentModel = mongoose.model('TemporaryContent', temporaryContentSchema, 'TemporaryContent');

module.exports = { UsersModel, PasswordResetTokensModel, UserContentModel, UserFileTreeModel, TemporaryContentModel };