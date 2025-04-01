// routes/google_oauth_api.js

const express = require('express');
const router = express.Router();
const { UserContentModel } = require('../dao/userDao');
const authenticateUser = require('../middleware/auth');


// Google OAuth redirect URL
router.get("/auth/google", (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&response_type=code&scope=email profile`;
  res.redirect(url);
});

// Google OAuth callback
router.get("/auth/callback/google", async (req, res) => {
  const { code } = req.query;

  try {
    // Exchange code for tokens
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: "authorization_code",
      }
    );

    const { access_token } = tokenResponse.data;

    // Get user info
    const userInfo = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const { email } = userInfo.data;

    // Check if user exists
    let user = users.find((u) => u.email === email);
    if (!user) {
      // Create new user with random username and password
      const randomStr = Math.random().toString(36).substring(2, 10);
      const username = `user_${randomStr}`;
      const password = Math.random().toString(36).slice(-15);
      const hashedPassword = await bcrypt.hash(password, 10);

      user = { email, username, password: hashedPassword };
      users.push(user);
    }

    // Set session
    req.session.user = { email: user.email, username: user.username };
    res.redirect("http://localhost:3000/"); // Redirect to frontend
  } catch (error) {
    console.error("Google OAuth error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

module.exports = router;