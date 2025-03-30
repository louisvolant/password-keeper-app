//routes/login_api.js

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { UsersModel, UserContentModel, UserFileTreeModel, TemporaryContentModel } = require('../dao/userDao'); // Ensure all models are imported
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
  let queryUsername = username;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmail = emailRegex.test(username);

  if (isEmail) queryUsername = null;

 try {
    let userData, error;
    if (isEmail) {
      const { data, error: emailError } = await supabase
        .from('users')
        .select('*')
        .ilike('email', username)
        .single();
      userData = data;
      error = emailError;
    } else {
      const { data, error: usernameError } = await supabase
        .from('users')
        .select('*')
        .ilike('username', username)
        .single();
      userData = data;
      error = usernameError;
    }

    if (error || !userData) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isValidPassword = userData.password_version === 1
      ? await verifyPassword(password, userData.hashed_password)
      : hashPasswordSha256(password) === userData.hashed_password;

    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Sync to Mongoose using supabase_id
    await UsersModel.findOneAndUpdate(
      { supabase_id: userData.id.toString() }, // Convert to string for consistency
      {
        supabase_id: userData.id.toString(),
        username: userData.username,
        email: userData.email,
        hashed_password: userData.hashed_password,
        password_version: userData.password_version,
        created_at: userData.created_at || new Date()
      },
      { upsert: true, new: true }
    );

    req.session.user = { id: userData.id, username: userData.username };
    return res.json({ success: true });
  } catch (err) {
    logger.error('Unexpected error in login route:', { message: err.message, stack: err.stack });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Rest of your routes remain unchanged
router.get('/check-auth', (req, res) => {
  res.json({ isAuthenticated: !!req.session.user });
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) res.status(500).json({ error: 'Logout failed' });
    else res.clearCookie('session').json({ success: true });
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
    // 1. Delete all temporary content from Supabase
    const { error: tempContentError } = await supabase
      .from('temporary_content')
      .delete()
      .eq('user_id', userId);

    if (tempContentError) {
      logger.error('Error deleting temporary content:', tempContentError);
      throw new Error('Failed to delete temporary content');
    }

    // Sync to Mongoose: Delete temporary content
    await TemporaryContentModel.deleteMany({ user_id: userId });

    // 2. Delete all content from Supabase
    const { error: contentError } = await supabase
      .from('user_content')
      .delete()
      .eq('user_id', userId);

    if (contentError) {
      logger.error('Error deleting user content:', contentError);
      throw new Error('Failed to delete user content');
    }

    // Sync to Mongoose: Delete user content
    await UserContentModel.deleteMany({ user_id: userId });

    // 3. Delete file tree from Supabase
    const { error: fileTreeError } = await supabase
      .from('user_file_tree')
      .delete()
      .eq('user_id', userId);

    if (fileTreeError) {
      logger.error('Error deleting file tree:', fileTreeError);
      throw new Error('Failed to delete file tree');
    }

    // Sync to Mongoose: Delete file tree
    await UserFileTreeModel.deleteMany({ user_id: userId });

    // 4. Delete the account from Supabase
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (userError) {
      logger.error('Error deleting user account:', userError);
      throw new Error('Failed to delete user account');
    }

    // Sync to Mongoose: Delete user
    await UsersModel.deleteOne({ _id: userId });

    // If everything succeeds, destroy the session
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