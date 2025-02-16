const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const argon2 = require('argon2');
const crypto = require('crypto');

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

  const { data: userData, error } = await supabase
    .from('users')
    .select('*')
    .ilike('username', username)
    .single();

  if (!userData || error) {
    return res.json({ success: false, error: 'Invalid credentials' });
  }

  let isValidPassword = userData.password_version === 1
    ? await verifyPassword(password, userData.hashed_password)
    : hashPasswordSha256(password) === userData.hashed_password;

  if (!isValidPassword) return res.json({ success: false, error: 'Invalid credentials' });

  req.session.user = { id: userData.id, username: username };
  res.json({ success: true });
});

router.get('/check-auth', (req, res) => {
  res.json({ isAuthenticated: !!req.session.user });
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) res.status(500).json({ error: 'Logout failed' });
    else res.clearCookie('connect.sid').json({ success: true });
  });
});

module.exports = router;
