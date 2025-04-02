//routes/password_api.js
const express = require('express');
const router = express.Router();
const { PasswordResetTokensModel, UsersModel } = require('../dao/userDao');
const argon2 = require('argon2');
const crypto = require('crypto');
const winston = require('winston');
const Mailjet = require('node-mailjet');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console()
  ]
});

const mailjet = new Mailjet({
  apiKey: process.env.MAILJET_API_KEY,
  apiSecret: process.env.MAILJET_API_SECRET
});

const hashPasswordArgon2 = async (password) => {
  return await argon2.hash(password, { type: argon2.argon2id, memoryCost: 2 ** 16, timeCost: 3, parallelism: 1 });
};


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


// Request password reset
router.post('/password_reset/request', async (req, res) => {
  const { email } = req.body;

  try {
    // Fetch user from MongoDB
    const user = await UsersModel.findOne({ email });

    if (!user) {
      // Return success to prevent enumeration attacks
      return res.json({ success: true });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Store reset token in MongoDB
    await PasswordResetTokensModel.findOneAndUpdate(
      { supabase_user_id: user.supabase_id, token },
      {
        supabase_user_id: user.supabase_id,
        token,
        expires_at: expiresAt,
        created_at: new Date()
      },
      { upsert: true, new: true }
    );

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL}/passwordrenew?token=${token}`;
    await mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [{
        From: {
          Email: process.env.MAILJET_SENDER_EMAIL,
          Name: "Your App"
        },
        To: [{
          Email: email
        }],
        Subject: "Password Reset Request",
        TextPart: `Click this link to reset your password: ${resetUrl}`,
        HTMLPart: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 24 hours.</p>`
      }]
    });

    return res.json({ success: true });
  } catch (err) {
    logger.error('Error in password reset request:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Verify reset token
router.get('/password_reset/verify', async (req, res) => {
  const { token } = req.query;

  try {
    // Fetch token from MongoDB
    const tokenDoc = await PasswordResetTokensModel.findOne({ token });

    if (!tokenDoc || new Date(tokenDoc.expires_at) < new Date()) {
      return res.json({ success: false, error: 'Invalid or expired token' });
    }

    return res.json({ success: true });
  } catch (err) {
    logger.error('Error verifying reset token:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Reset password
router.post('/password_reset/reset', async (req, res) => {
  const { token, newpassword } = req.body;

  try {
    // Verify token in MongoDB
    const tokenDoc = await PasswordResetTokensModel.findOne({ token });

    if (!tokenDoc || new Date(tokenDoc.expires_at) < new Date()) {
      return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }

    // Hash new password
    const hashedPassword = await hashPasswordArgon2(newpassword);

    // Update user password in MongoDB
    const userUpdate = await UsersModel.findOneAndUpdate(
      { supabase_id: tokenDoc.supabase_user_id },
      { hashed_password: hashedPassword, password_version: 1 },
      { new: true }
    );

    if (!userUpdate) {
      logger.error('Failed to update password: User not found');
      return res.status(500).json({ success: false, error: 'Failed to reset password' });
    }

    // Delete used token in MongoDB
    await PasswordResetTokensModel.deleteOne({ token });

    return res.json({ success: true });
  } catch (err) {
    logger.error('Error in password reset:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;