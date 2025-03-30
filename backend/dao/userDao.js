// dao/userDao.js
const mongoose = require('../config/mongoose');

const usersSchema = new mongoose.Schema({
  supabase_id: { type: String, required: true, unique: true }, // Store Supabase ID here
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
  encoded_content: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});
const UserContentModel = mongoose.model('UserContent', userContentSchema, 'UserContent');

const userFileTreeSchema = new mongoose.Schema({
  supabase_user_id: { type: String, required: true }, // Match Supabase ID format
  file_tree: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});
const UserFileTreeModel = mongoose.model('UserFileTree', userFileTreeSchema, 'UserFileTree');

const temporaryContentSchema = new mongoose.Schema({
  supabase_user_id: { type: String, required: true }, // Change to String to match Supabase ID
  identifier: { type: String, required: true, unique: true },
  hashed_password: { type: String },
  max_date: { type: Date, required: true },
  encoded_content: { type: String, required: true },
  iv: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});
const TemporaryContentModel = mongoose.model('TemporaryContent', temporaryContentSchema, 'TemporaryContent');

module.exports = { UsersModel, PasswordResetTokensModel, UserContentModel, UserFileTreeModel, TemporaryContentModel };