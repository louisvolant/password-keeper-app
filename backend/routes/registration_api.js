// routes/registration_api.js
const express = require('express');
const router = express.Router();
const { UsersModel, UserFileTreeModel, UserContentModel } = require('../dao/userDao');
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
    // Check for existing user in MongoDB
    const existingUser = await UsersModel.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const hashedPassword = await hashPasswordArgon2(password);
    const createdAt = new Date();

    // Create new user in MongoDB
    const newUser = await UsersModel.create({
      supabase_id: null,
      username,
      email,
      hashed_password: hashedPassword,
      password_version: 1,
      created_at: createdAt
    });

    // Use MongoDB-generated _id as the user ID if supabase_id isn't required
    const userId = newUser._id.toString();

    // Initialize user file tree in MongoDB
    await UserFileTreeModel.findOneAndUpdate(
      { supabase_user_id: userId },
      {
        supabase_user_id: userId,
        file_tree: '["default"]',
        created_at: createdAt,
        updated_at: createdAt
      },
      { upsert: true, new: true }
    );

    // Initialize user content in MongoDB
    await UserContentModel.findOneAndUpdate(
      { supabase_user_id: userId, file_path: 'default' },
      {
        supabase_user_id: userId,
        file_path: 'default',
        encoded_content: '',
        created_at: createdAt,
        updated_at: createdAt
      },
      { upsert: true, new: true }
    );

    // Set session with the MongoDB-generated ID
    req.session.user = { id: userId, username };
    res.json({ success: true });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;