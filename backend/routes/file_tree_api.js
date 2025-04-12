// routes/file_tree_api.js
const express = require('express');
const router = express.Router();
const { UserFileTreeModel } = require('../dao/userDao');
const authenticateUser = require('../middleware/auth');

// Route to retrieve file tree
router.get('/getfiletree', authenticateUser, async (req, res) => {
  try {
    const fileTreeDoc = await UserFileTreeModel.findOne({
      supabase_user_id: req.user.id.toString(),
    });

    if (!fileTreeDoc) {
      // Initialize with empty encrypted file tree
      const newFileTree = await UserFileTreeModel.findOneAndUpdate(
        { supabase_user_id: req.user.id.toString() },
        {
          supabase_user_id: req.user.id.toString(),
          file_tree: '', // Empty encrypted string
          created_at: new Date(),
          updated_at: new Date(),
        },
        { upsert: true, new: true }
      );
      return res.json({ file_tree: '' });
    }

    res.json({ file_tree: fileTreeDoc.file_tree || '' });
  } catch (error) {
    console.error('Get file tree error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Route to update file tree
router.post('/updatefiletree', authenticateUser, async (req, res) => {
  const { file_tree } = req.body; // Expect encrypted string

  if (file_tree === undefined) {
    return res.status(400).json({ error: 'file_tree is required' });
  }

  try {
    const updatedAt = new Date();
    const updatedFileTree = await UserFileTreeModel.findOneAndUpdate(
      { supabase_user_id: req.user.id.toString() },
      {
        file_tree, // Store as-is (encrypted)
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
    console.error('Update file tree error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Route to remove a file
router.post('/remove_file', authenticateUser, async (req, res) => {
  const { file_path } = req.body;

  if (!file_path) {
    return res.status(400).json({ error: 'File path is required' });
  }

  try {
    const fileTreeDoc = await UserFileTreeModel.findOne({
      supabase_user_id: req.user.id.toString(),
    });

    if (!fileTreeDoc || !fileTreeDoc.file_tree) {
      return res.status(404).json({ error: 'File tree not found' });
    }

    // Client decrypts and re-encrypts file_tree
    res.json({ success: true }); // Client updates via /updatefiletree
  } catch (error) {
    console.error('Remove file error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Route to remove a folder
router.post('/remove_folder', authenticateUser, async (req, res) => {
  const { folder_path } = req.body;

  if (!folder_path) {
    return res.status(400).json({ error: 'Folder path is required' });
  }

  try {
    const fileTreeDoc = await UserFileTreeModel.findOne({
      supabase_user_id: req.user.id.toString(),
    });

    if (!fileTreeDoc || !fileTreeDoc.file_tree) {
      return res.status(404).json({ error: 'File tree not found' });
    }

    // Client decrypts and re-encrypts file_tree
    res.json({ success: true });
  } catch (error) {
    console.error('Remove folder error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Route to rename
router.post('/rename', authenticateUser, async (req, res) => {
  const { old_path, new_path } = req.body;

  if (!old_path || !new_path) {
    return res.status(400).json({ error: 'Old and new paths are required' });
  }

  try {
    const fileTreeDoc = await UserFileTreeModel.findOne({
      supabase_user_id: req.user.id.toString(),
    });

    if (!fileTreeDoc || !fileTreeDoc.file_tree) {
      return res.status(404).json({ error: 'File tree not found' });
    }

    // Client decrypts and re-encrypts file_tree
    res.json({ success: true });
  } catch (error) {
    console.error('Rename error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;