//routes/login_api.js

const express = require('express');
const router = express.Router();
const { UsersModel, UserContentModel, UserFileTreeModel, TemporaryContentModel } = require('../dao/userDao');
const argon2 = require('argon2');
const crypto = require('crypto');
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console()
  ]
});

const hashPasswordSha256 = (password) => {
  const salt = process.env.SALT_SHA_256_HASHING;
  return crypto.createHash('sha256').update(password + salt).digest('hex');
};

const hashPasswordArgon2 = async (password) => {
  return await argon2.hash(password, { type: argon2.argon2id, memoryCost: 2 ** 16, timeCost: 3, parallelism: 1 });
};

const verifyPassword = async (password, hash) => {
  return await argon2.verify(hash, password);
};

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmail = emailRegex.test(username);

  try {
    // Query MongoDB for user by email or username
    let userData;
    if (isEmail) {
      userData = await UsersModel.findOne({ email: { $regex: new RegExp(username, 'i') } });
    } else {
      userData = await UsersModel.findOne({ username: { $regex: new RegExp(username, 'i') } });
    }

    if (!userData) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isValidPassword = userData.password_version === 1
      ? await verifyPassword(password, userData.hashed_password)
      : hashPasswordSha256(password) === userData.hashed_password;

    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Set session with supabase_id (used as the primary identifier)
    req.session.user = { id: userData.supabase_id, username: userData.username };
    return res.json({ success: true });
  } catch (err) {
    logger.error('Unexpected error in login route:', { message: err.message, stack: err.stack });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Check authentication status
router.post('/check-auth', (req, res) => {
  res.json({ isAuthenticated: !!req.session.user });
});

// Logout route
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      logger.error('Session destruction failed:', err);
      res.status(500).json({ error: 'Logout failed' });
    } else {
      res.clearCookie('session').json({ success: true });
    }
  });
});

// Route to delete account
router.post('/delete_my_account', async (req, res) => {
  if (!req.session.user) {
    logger.info('Attempted account deletion without authentication');
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - Please log in first'
    });
  }

  const userId = req.session.user.id;

  try {
    // Delete all temporary content from MongoDB
    await TemporaryContentModel.deleteMany({ supabase_user_id: userId });

    // Delete all user content from MongoDB
    await UserContentModel.deleteMany({ supabase_user_id: userId });

    // Delete file tree from MongoDB
    await UserFileTreeModel.deleteMany({ supabase_user_id: userId });

    // Delete the user account from MongoDB
    await UsersModel.deleteOne({ supabase_id: userId });

    // Destroy the session
    req.session.destroy((err) => {
      if (err) {
        logger.error('Session destruction failed:', err);
        return res.status(500).json({
          success: false,
          error: 'Account deleted but session cleanup failed'
        });
      }

      res.clearCookie('session').json({
        success: true,
        message: 'Account and all associated data successfully deleted'
      });
    });
  } catch (error) {
    logger.error('Account deletion failed:', {
      message: error.message,
      userId: userId
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to delete account',
      details: error.message
    });
  }
});

module.exports = router;