const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authenticateUser = require('../middleware/auth');

const TABLE_USER_FILE_TREE = "user_file_tree";

// Route to retrieve file tree
router.get('/getfiletree', authenticateUser, async (req, res) => {
  try {
    let { data, error } = await supabase
      .from(TABLE_USER_FILE_TREE)
      .select('file_tree')
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) {
      const { error: insertError } = await supabase
        .from(TABLE_USER_FILE_TREE)
        .insert([{ user_id: req.user.id, file_tree: '{}' }]);

      if (insertError) {
        console.error('Insert error:', insertError);
        return res.status(500).json({ error: 'Error creating file tree' });
      }

      return res.json({ file_tree: '{}' });
    }

    res.json({ file_tree: data.file_tree });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Route to update file tree
router.post('/updatefiletree', authenticateUser, async (req, res) => {
  const { file_tree } = req.body;

  try {
    const { data: existingTree } = await supabase
      .from(TABLE_USER_FILE_TREE)
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    let result;

    if (existingTree) {
      result = await supabase
        .from(TABLE_USER_FILE_TREE)
        .update({
          file_tree,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', req.user.id);
    } else {
      result = await supabase
        .from(TABLE_USER_FILE_TREE)
        .insert({
          user_id: req.user.id,
          file_tree,
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
