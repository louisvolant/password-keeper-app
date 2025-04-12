// routes/content_api.js
const express = require('express');
const router = express.Router();
const { UserContentModel } = require('../dao/userDao');
const authenticateUser = require('../middleware/auth');

// Route to retrieve content
router.get('/getcontent', authenticateUser, async (req, res) => {
  let { file_path } = req.query;
  if (!file_path) file_path = "default";

  try {
    const content = await UserContentModel.findOne({
      supabase_user_id: req.user.id.toString(),
      file_path,
    });

    if (!content) {
      const newContent = await UserContentModel.findOneAndUpdate(
        { supabase_user_id: req.user.id.toString(), file_path },
        {
          supabase_user_id: req.user.id.toString(),
          encoded_content: '',
          file_path,
          created_at: new Date(),
          updated_at: new Date(),
        },
        { upsert: true, new: true }
      );
      return res.json({ encoded_content: '', file_path });
    }

    res.json({
      encoded_content: content.encoded_content,
      file_path: content.file_path,
    });
  } catch (error) {
    console.error('Error retrieving content:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Route to update content
router.post('/updatecontent', authenticateUser, async (req, res) => {
  const { encoded_content, file_path } = req.body;

  if (!file_path) {
    return res.status(400).json({ error: 'file_path is required' });
  }

  try {
    const updatedAt = new Date();
    const updatedContent = await UserContentModel.findOneAndUpdate(
      { supabase_user_id: req.user.id.toString(), file_path },
      {
        encoded_content,
        updated_at: updatedAt,
        $setOnInsert: {
          supabase_user_id: req.user.id.toString(),
          created_at: updatedAt,
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Route to batch update contents
router.post('/updatecontents', authenticateUser, async (req, res) => {
  const { updates } = req.body; // Array of { file_path, encoded_content }

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: 'updates array is required' });
  }

  try {
    const updatedAt = new Date();
    const bulkOps = updates.map(({ file_path, encoded_content }) => ({
      updateOne: {
        filter: { supabase_user_id: req.user.id.toString(), file_path },
        update: {
          encoded_content,
          updated_at: updatedAt,
          $setOnInsert: {
            supabase_user_id: req.user.id.toString(),
            created_at: updatedAt,
          },
        },
        upsert: true,
      },
    }));

    await UserContentModel.bulkWrite(bulkOps);
    res.json({ success: true });
  } catch (error) {
    console.error('Error batch updating content:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;