const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authenticateUser = require('../middleware/auth');

const TABLE_USER_CONTENT = "user_content";

// Route to retrieve content
router.get('/getcontent', authenticateUser, async (req, res) => {
  try {
    let { data, error } = await supabase
      .from(TABLE_USER_CONTENT)
      .select('encoded_content')
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) {
      const { error: insertError } = await supabase
        .from(TABLE_USER_CONTENT)
        .insert([{ user_id: req.user.id, encoded_content: '' }]);

      if (insertError) {
        console.error('Insert error:', insertError);
        return res.status(500).json({ error: 'Error creating content' });
      }

      return res.json({ encoded_content: '' });
    }

    res.json({ encoded_content: data.encoded_content });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Route to update content
router.post('/updatecontent', authenticateUser, async (req, res) => {
  const { encoded_content } = req.body;

  try {
    const { data: existingContent } = await supabase
      .from(TABLE_USER_CONTENT)
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    let result;

    if (existingContent) {
      result = await supabase
        .from(TABLE_USER_CONTENT)
        .update({
          encoded_content,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', req.user.id);
    } else {
      result = await supabase
        .from(TABLE_USER_CONTENT)
        .insert({
          user_id: req.user.id,
          encoded_content,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }

    if (result.error) {
      console.error('Supabase error:', result.error);
      return res.status(500).json({ error: 'Save error', details: result.error.message });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;
