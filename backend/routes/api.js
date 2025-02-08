const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authenticateUser = require('../middleware/auth');
const crypto = require('crypto');

const TABLE_USER_CONTENT = "usercontent";

const hashPassword = (password) => {
  const salt = process.env.SALT_SHA_256_HASHING;
  return crypto.createHash('sha256').update(password + salt).digest('hex');
};

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = hashPassword(password);
    // console.log("HashPassword : " + hashedPassword);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('hashedpassword', hashedPassword)
      .single();

    if (!data) {
          return res.json({ success: false, error: 'Invalid credentials' });
    } else if (error) {
      return res.status(401).json({ success: false, error: 'Error in calling Login function' });
    } else {
        // Store user in session
        req.session.user = { id: data.id, username: username };

        // DO NOT use `res.cookie()` here, express-session already handles `connect.sid`
        res.json({ success: true });
    }

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/check-auth', (req, res) => {
    if (req.session.user) {
        res.json({ isAuthenticated: true });
    } else {
        res.json({ isAuthenticated: false });
    }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      res.status(500).json({ error: 'Logout failed' });
    } else {
      res.clearCookie('connect.sid'); // Clear the session cookie
      res.json({ success: true });
    }
  });
});

// Route to retrieve content
router.get('/getcontent', authenticateUser, async (req, res) => {
  try {
    let { data, error } = await supabase
      .from(TABLE_USER_CONTENT)
      .select('encodedContent')
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) {
      // 🛠️ Insert empty content
      const { error: insertError } = await supabase
        .from(TABLE_USER_CONTENT)
        .insert([{ user_id: req.user.id, encodedContent: '' }]);

      if (insertError) {
        console.error('Insert error:', insertError);
        return res.status(500).json({ error: 'Error creating content' });
      }

      return res.json({ encodedContent: '' });
    }

    res.json({ encodedContent: data.encodedContent });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Route to update content
router.post('/updatecontent', authenticateUser, async (req, res) => {
  const { encodedContent } = req.body;

  try {
    // First, check if a record exists
    const { data: existingContent } = await supabase
      .from(TABLE_USER_CONTENT)
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    let result;

    if (existingContent) {
      // Update if record exists
      result = await supabase
        .from(TABLE_USER_CONTENT)
        .update({
          encodedContent: encodedContent,  // Make sure column name matches your schema
          updated_at: new Date().toISOString()
        })
        .eq('user_id', req.user.id);
    } else {
      // Create if record doesn't exist
      result = await supabase
        .from(TABLE_USER_CONTENT)
        .insert({
          user_id: req.user.id,
          encoded_content: encodedContent,  // Make sure column name matches your schema
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }

    if (result.error) {
      console.error('Supabase error:', result.error);
      return res.status(500).json({
        error: 'Save error',
        details: result.error.message
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Server error',
      details: error.message
    });
  }
});


router.get('/test-users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');

    console.log('All users:', { data, error });
    res.json({ data, error });
  } catch (error) {
    console.log('Test error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    console.log('Test DB response:', { data, error });
    res.json({ data, error });
  } catch (error) {
    console.log('Test DB error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;