//routes/login_api.js

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
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

  try {
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .ilike('username', username)
      .single();

    if (error) {
    logger.error('Database query error', {
        message: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details
      });

      // Check if it's a timeout error specifically
      if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        return res.status(503).json({
          success: false,
          error: 'Service temporarily unavailable due to timeout'
        });
      }

      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    if (!userData) {
      logger.info('No user found for username', username);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const isValidPassword = userData.password_version === 1
      ? await verifyPassword(password, userData.hashed_password)
      : hashPasswordSha256(password) === userData.hashed_password;

    if (!isValidPassword) {
      logger.info('Password verification failed for username:', username);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    req.session.user = { id: userData.id, username: username };
    return res.json({ success: true });

  } catch (err) {
    logger.error('Unexpected error in login route:', {
      message: err.message,
      stack: err.stack,
      username // Include for debugging, remove in production if sensitive
    });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Change Password route
router.post('/changepassword', async (req, res) => {
  const { newpassword } = req.body;

  // Check if user is authenticated
  if (!req.session.user) {
    logger.info('Attempted password change without authentication');
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - Please log in first'
    });
  }

  try {
    // Hash the new password
    const hashedPassword = await hashPasswordArgon2(newpassword);

    // Update the password in the database
    const { data, error } = await supabase
      .from('users')
      .update({
        hashed_password: hashedPassword,
        password_version: 1
      })
      .eq('id', req.session.user.id)
      .select()
      .single();

    if (error) {
      logger.error('Database update error in changepassword:', {
        message: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details
      });
      return res.status(500).json({
        success: false,
        error: 'Failed to update password'
      });
    }

    if (!data) {
      logger.info('No user found for update:', req.session.user.id);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    logger.info('Password changed successfully for user:', req.session.user.username);
    return res.json({ success: true });

  } catch (err) {
    logger.error('Unexpected error in changepassword route:', {
      message: err.message,
      stack: err.stack,
      userId: req.session.user.id
    });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
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

module.exports = router;