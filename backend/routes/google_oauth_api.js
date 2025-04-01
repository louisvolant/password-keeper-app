// routes/google_oauth_api.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { UsersModel } = require('../dao/userDao'); // Import Mongoose model
const argon2 = require('argon2');

// Google OAuth redirect URL
router.get('/auth/google', (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&response_type=code&scope=email profile`;
  res.redirect(url);
});

// Google OAuth callback
router.get('/auth/callback/google', async (req, res) => {
  const { code } = req.query;

  try {
    // Exchange code for tokens
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: 'authorization_code',
      }
    );

    const { access_token } = tokenResponse.data;

    // Get user info from Google
    const userInfo = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const { email } = userInfo.data;

    // Check if user exists by email (case-insensitive)
    let userData = await UsersModel.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

    if (!userData) {
      // Create new user with random username and password
      const randomStr = Math.random().toString(36).substring(2, 10);
      const username = `user_${randomStr}`;
      const password = Math.random().toString(36).slice(-15);
      const hashedPassword = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
      });

      // Create user in MongoDB
      userData = await UsersModel.create({
        email,
        username,
        hashed_password: hashedPassword,
        password_version: 1, // Consistent with login_api.js
        supabase_id: crypto.randomUUID(), // Generate a unique ID if needed
      });
    }

    // Set session with supabase_id (consistent with login_api.js)
    req.session.user = { id: userData.supabase_id, username: userData.username };
    res.redirect('http://localhost:3000/'); // Redirect to frontend
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

module.exports = router;