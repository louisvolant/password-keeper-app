const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authenticateUser = require('../middleware/auth');
const argon2 = require('argon2');
const crypto = require('crypto');

const TABLE_USER_CONTENT = "usercontent";

const hashPasswordSha256 = (password) => {
  const salt = process.env.SALT_SHA_256_HASHING;
  return crypto.createHash('sha256').update(password + salt).digest('hex');
};

// New password hashing function using Argon2
const hashPasswordArgon2 = async (password) => {
  try {
    // Argon2 automatically generates a secure salt
    const hash = await argon2.hash(password, {
      type: argon2.argon2id, // Recommended variant
      memoryCost: 2 ** 16, // 64MB memory usage
      timeCost: 3, // Number of iterations
      parallelism: 1, // Degree of parallelism
    });
    return hash;
  } catch (err) {
    throw new Error('Error hashing password');
  }
};

// New password verification function
const verifyPassword = async (password, hash) => {
  try {
    return await argon2.verify(hash, password);
  } catch (err) {
    throw new Error('Error verifying password');
  }
};

function cleanUsername(username) {
  const regex = /^[a-zA-Z0-9-_+=]+$/;
  if (regex.test(username)) {
    return username;
  } else {
    return null;
  }
}

// Updated login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  let isValidPassword = false;


  try {
    const cleanedUsername = cleanUsername(username);

    if (!cleanedUsername) {
      return res.status(400).json({
        success: false,
        error: 'Invalid username format. Only letters, numbers, hyphens, underscores, plus, and equals are allowed.'
      });
    }

    // First, get the user data including the hashed password
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .ilike('username', username)
      .single();

    if (!userData || userError) {
       console.log("No data error");

      return res.json({ success: false, error: 'Invalid credentials' });
    }

    if (userData
        && userData.password_version === 0) {
        console.log("Password version : 0");
        const hashedPasswordOldMethod = await hashPasswordSha256(password)

        if(userData.hashed_password === hashedPasswordOldMethod) {
          console.log("Hashed Password equals each other");

            // Update to new Argon2 hash
            const newHash = await hashPasswordArgon2(password);
            const { data: updateData, error: updateError } = await supabase
              .from('users')
              .update({
                hashed_password: newHash,
                password_version: 1
              })
              .eq('id', userData.id)
              .select();

            if (updateError) {
              console.error('Failed to update password hash:', updateError);
              // Continue with login even if update fails - we can try again next time
            }

            // Store user in session
            req.session.user = { id: userData.id, username: username };
            return res.json({ success: true });
        } else {
           console.log("userData.hashed_password:"+userData.hashed_password+" hashedPasswordOldMethod:"+hashedPasswordOldMethod)
        }
    } else if(userData.password_version === 1){
        console.log("Password version : 1");
        // Verify the password against the stored hash
        isValidPassword = await verifyPassword(password, userData.hashed_password);
    } else {
        console.log("Not recognised Password version : " +userDatadata.password_version);
    }

    console.log("isValidPassword value : " + isValidPassword);
    if (!isValidPassword) {
      return res.json({ success: false, error: 'Invalid credentials' });
    }

    // Store user in session
    req.session.user = { id: data.id, username: username };
    res.json({ success: true });



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