//routes/content_api.js

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { UserContentModel } = require('../dao/userDao');
const authenticateUser = require('../middleware/auth');

const TABLE_USER_CONTENT = "user_content";

// Route to retrieve content
router.get('/getcontent', authenticateUser, async (req, res) => {
  let { file_path } = req.query;
  if (!file_path) file_path = "default";

  try {
    let { data, error } = await supabase
      .from(TABLE_USER_CONTENT)
      .select('encoded_content, file_path')
      .eq('user_id', req.user.id)
      .eq('file_path', file_path)
      .single();

    if (error || !data) {
      const { error: insertError } = await supabase
        .from(TABLE_USER_CONTENT)
        .insert([{ user_id: req.user.id, encoded_content: '', file_path }]);

      if (insertError) {
        console.error('Insert error:', insertError);
        return res.status(500).json({ error: 'Error creating content' });
      }

      // Insert into Mongoose
      await UserContentModel.findOneAndUpdate(
        { supabase_user_id: req.user.id, file_path },
        { supabase_user_id: req.user.id, encoded_content: '', file_path, created_at: new Date(), updated_at: new Date() },
        { upsert: true, new: true }
      );

      return res.json({ encoded_content: '', file_path: 'default' });
    }

    // Sync to Mongoose
    await UserContentModel.findOneAndUpdate(
      { supabase_user_id: req.user.id, file_path: data.file_path },
      { encoded_content: data.encoded_content, updated_at: new Date() },
      { upsert: true, new: true }
    );

    res.json({ encoded_content: data.encoded_content, file_path: data.file_path });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Route to update content
router.post('/updatecontent', authenticateUser, async (req, res) => {
  const { encoded_content, file_path } = req.body;

  if (!file_path) {
    return res.status(400).json({ error: 'file_path is required' });
  }

  try {
    const { data: existingContent } = await supabase
      .from(TABLE_USER_CONTENT)
      .select('*')
      .eq('user_id', req.user.id)
      .eq('file_path', file_path)
      .single();

    let result;
    const updatedAt = new Date();

    if (existingContent) {
      result = await supabase
        .from(TABLE_USER_CONTENT)
        .update({ encoded_content, updated_at: updatedAt.toISOString() })
        .eq('user_id', req.user.id)
        .eq('file_path', file_path);
    } else {
      result = await supabase
        .from(TABLE_USER_CONTENT)
        .insert({
          user_id: req.user.id,
          encoded_content,
          file_path,
          created_at: updatedAt.toISOString(),
          updated_at: updatedAt.toISOString()
        });
    }

    if (result.error) {
      console.error('Supabase error:', result.error);
      return res.status(500).json({ error: 'Save error', details: result.error.message });
    }

    // Sync to Mongoose
    await UserContentModel.findOneAndUpdate(
      { supabase_user_id: req.user.id, file_path },
      { encoded_content, updated_at: updatedAt },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;