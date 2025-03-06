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

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  if (password.length < 15) {
    return res.status(400).json({ error: 'Password must be at least 15 characters long' });
  }

  try {
    // Check if username or email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`)
      .maybeSingle();

    if (checkError) {
      logger.error('Check error:', checkError);
      return res.status(500).json({ error: 'Server error' });
    }

    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await hashPasswordArgon2(password);

    // Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({ username, email, hashed_password: hashedPassword, password_version: 1 })
      .select('id')
      .single();

    if (insertError) {
      logger.error('Insert error:', insertError);
      return res.status(500).json({ error: 'Failed to register user' });
    }

    // Initialize user data
    await supabase
      .from('user_file_tree')
      .insert({ user_id: newUser.id, file_tree: '["default"]' });

    await supabase
      .from('user_content')
      .insert({ user_id: newUser.id, file_path: 'default', encoded_content: '' });

    // Set session for auto-login
    req.session.user = { id: newUser.id, username };

    res.json({ success: true });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;