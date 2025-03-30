//routes/password_api.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { PasswordResetTokensModel, UsersModel } = require('../dao/userDao'); // Import necessary models
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

// Request password reset
router.post('/password_reset/request', async (req, res) => {
  const { email } = req.body;

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.json({ success: true });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      logger.error('Failed to store reset token:', tokenError);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }

    // Sync to Mongoose
    await PasswordResetTokensModel.findOneAndUpdate(
      { user_id: user.id, token },
      { user_id: user.id, token, expires_at: expiresAt, created_at: new Date() },
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
    const { data, error } = await supabase
      .from('password_reset_tokens')
      .select('user_id, expires_at')
      .eq('token', token)
      .single();

    if (error || !data || new Date(data.expires_at) < new Date()) {
      return res.json({ success: false, error: 'Invalid or expired token' });
    }

    // Sync to Mongoose (ensure token exists in Mongoose if it exists in Supabase)
    await PasswordResetTokensModel.findOneAndUpdate(
      { token },
      { user_id: data.user_id, token, expires_at: new Date(data.expires_at), created_at: new Date() },
      { upsert: true, new: true }
    );

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
    // Verify token
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('user_id, expires_at')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData || new Date(tokenData.expires_at) < new Date()) {
      return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }

    // Hash new password
    const hashedPassword = await hashPasswordArgon2(newpassword);

    // Update password in Supabase
    const { error: updateError } = await supabase
      .from('users')
      .update({
        hashed_password: hashedPassword,
        password_version: 1
      })
      .eq('id', tokenData.user_id);

    if (updateError) {
      logger.error('Failed to update password:', updateError);
      return res.status(500).json({ success: false, error: 'Failed to reset password' });
    }

    // Sync to Mongoose: Update user password
    await UsersModel.findOneAndUpdate(
      { supabase_id: userData.id.toString() }, // Convert to string for consistency
      {
        supabase_id: userData.id.toString(),
       hashed_password: hashedPassword,
       password_version: 1
       },
      { upsert: true, new: true } // Upsert in case user doesn't exist yet in Mongoose
    );

    // Delete used token in Supabase
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('token', token);

    // Sync to Mongoose: Delete used token
    await PasswordResetTokensModel.deleteOne({ token });

    return res.json({ success: true });
  } catch (err) {
    logger.error('Error in password reset:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;