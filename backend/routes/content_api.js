//routes/content_api.js

const express = require('express');
const router = express.Router();
const { UserContentModel } = require('../dao/userDao');
const authenticateUser = require('../middleware/auth');

// Route to retrieve content
router.get('/getcontent', authenticateUser, async (req, res) => {
  let { file_path } = req.query;
  if (!file_path) file_path = "default";

  try {
    // Fetch content from MongoDB
    const content = await UserContentModel.findOne({
      supabase_user_id: req.user.id.toString(),
      file_path
    });

    if (!content) {
      // If no content exists, create a new document
      const newContent = await UserContentModel.findOneAndUpdate(
        { supabase_user_id: req.user.id.toString(), file_path },
        {
          supabase_user_id: req.user.id.toString(),
          encoded_content: '',
          file_path,
          created_at: new Date(),
          updated_at: new Date()
        },
        { upsert: true, new: true }
      );

      return res.json({ encoded_content: '', file_path: 'default' });
    }

    // Return existing content
    res.json({
      encoded_content: content.encoded_content,
      file_path: content.file_path
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

    // Update or insert content in MongoDB
    const updatedContent = await UserContentModel.findOneAndUpdate(
      { supabase_user_id: req.user.id.toString(), file_path },
      {
        encoded_content,
        updated_at: updatedAt,
        // Include supabase_user_id and created_at only if not exists (for upsert)
        $setOnInsert: {
          supabase_user_id: req.user.id.toString(),
          created_at: updatedAt
        }
      },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;