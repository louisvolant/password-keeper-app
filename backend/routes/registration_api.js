// routes/registration_api.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const argon2 = require('argon2');
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console()
  ]
});

const hashPasswordArgon2 = async (password) => {
  return await argon2.hash(password, { type: argon2.argon2id, memoryCost: 2 ** 16, timeCost: 3, parallelism: 1 });
};

// Registration route
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password || password.length < 15) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`)
      .maybeSingle();

    if (checkError || existingUser) {
      return res.status(existingUser ? 409 : 500).json({ error: existingUser ? 'Username or email already exists' : 'Server error' });
    }

    const hashedPassword = await hashPasswordArgon2(password);
    const createdAt = new Date();

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({ username, email, hashed_password: hashedPassword, password_version: 1, created_at: createdAt.toISOString() })
      .select('id')
      .single();

    if (insertError) {
      logger.error('Insert error:', insertError);
      return res.status(500).json({ error: 'Failed to register user' });
    }

    // Sync to Mongoose
    const mongooseUser = await UsersModel.findOneAndUpdate(
      { supabase_id: newUser.id.toString() }, // Convert to string for consistency
      {
        supabase_id: newUser.id.toString(),
       username, email, hashed_password: hashedPassword, password_version: 1, created_at: createdAt },
      { upsert: true, new: true }
    );

    await supabase.from('user_file_tree').insert({ user_id: newUser.id, file_tree: '["default"]' });
    await UserFileTreeModel.findOneAndUpdate(
      { user_id: newUser.id },
      { user_id: newUser.id, file_tree: '["default"]', created_at: createdAt, updated_at: createdAt },
      { upsert: true, new: true }
    );

    await supabase.from('user_content').insert({ user_id: newUser.id, file_path: 'default', encoded_content: '' });
    await UserContentModel.findOneAndUpdate(
      { user_id: newUser.id, file_path: 'default' },
      { user_id: newUser.id, file_path: 'default', encoded_content: '', created_at: createdAt, updated_at: createdAt },
      { upsert: true, new: true }
    );

    req.session.user = { id: newUser.id, username };
    res.json({ success: true });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;