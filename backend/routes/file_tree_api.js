// routes/file_tree_api.js
const express = require('express');
const router = express.Router();
const { UserFileTreeModel, UserContentModel } = require('../dao/userDao');
const authenticateUser = require('../middleware/auth');

// Route to retrieve file tree
router.get('/getfiletree', authenticateUser, async (req, res) => {
  try {
    const fileTreeDoc = await UserFileTreeModel.findOne({
      supabase_user_id: req.user.id.toString(),
    });

    if (!fileTreeDoc) {
      const newFileTree = await UserFileTreeModel.findOneAndUpdate(
        { supabase_user_id: req.user.id.toString() },
        {
          supabase_user_id: req.user.id.toString(),
          file_tree: '[]',
          created_at: new Date(),
          updated_at: new Date(),
        },
        { upsert: true, new: true }
      );
      return res.json({ file_tree: [] });
    }

    let fileTree;
    try {
      fileTree = fileTreeDoc.file_tree ? JSON.parse(fileTreeDoc.file_tree) : [];
    } catch (error) {
      console.error('Invalid file_tree JSON:', fileTreeDoc.file_tree, error);
      return res.status(500).json({ error: 'Invalid file tree format' });
    }

    if (!Array.isArray(fileTree) || !fileTree.every(file =>
      typeof file.file_name === 'string' && file.file_name.trim() && typeof file.uuid === 'string'
    )) {
      console.error('Invalid file tree format:', fileTree);
      return res.status(500).json({ error: 'Invalid file tree format' });
    }

    res.json({ file_tree: fileTree });
  } catch (error) {
    console.error('Get file tree error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Route to update file tree
router.post('/updatefiletree', authenticateUser, async (req, res) => {
  const { file_tree } = req.body;

  if (!Array.isArray(file_tree)) {
    return res.status(400).json({ error: 'file_tree must be an array' });
  }

  if (!file_tree.every(file =>
    typeof file.file_name === 'string' && file.file_name.trim() && typeof file.uuid === 'string'
  )) {
    return res.status(400).json({ error: 'Invalid file tree entries' });
  }

  try {
    const updatedAt = new Date();
    await UserFileTreeModel.findOneAndUpdate(
      { supabase_user_id: req.user.id.toString() },
      {
        file_tree: JSON.stringify(file_tree),
        updated_at: updatedAt,
        $setOnInsert: {
          supabase_user_id: req.user.id.toString(),
          created_at: updatedAt,
        },
      },
      { upsert: true }
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

  if (!file_path || typeof file_path !== 'string' || !file_path.trim()) {
    return res.status(400).json({ error: 'Valid file_path is required' });
  }

  try {
    await UserContentModel.deleteOne({
      supabase_user_id: req.user.id.toString(),
      file_path,
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Remove file error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Route to remove a folder
router.post('/remove_folder', authenticateUser, async (req, res) => {
  const { folder_path } = req.body;

  if (!folder_path || typeof folder_path !== 'string' || !folder_path.trim()) {
    return res.status(400).json({ error: 'Valid folder_path is required' });
  }

  try {
    await UserContentModel.deleteMany({
      supabase_user_id: req.user.id.toString(),
      file_path: { $regex: `^${folder_path}/` },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Remove folder error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Route to rename
router.post('/rename', authenticateUser, async (req, res) => {
  const { old_path, new_path } = req.body;

  if (!old_path || !new_path || typeof old_path !== 'string' || typeof new_path !== 'string') {
    return res.status(400).json({ error: 'Valid old_path and new_path are required' });
  }

  try {
    const isFolder = old_path.endsWith('/');
    if (isFolder) {
      const contents = await UserContentModel.find({
        supabase_user_id: req.user.id.toString(),
        file_path: { $regex: `^${old_path}` },
      });

      for (const content of contents) {
        const newFilePath = content.file_path.replace(old_path, new_path);
        await UserContentModel.updateOne(
          { _id: content._id },
          { file_path: newFilePath, updated_at: new Date() }
        );
      }
    } else {
      await UserContentModel.updateOne(
        { supabase_user_id: req.user.id.toString(), file_path: old_path },
        { file_path: new_path, updated_at: new Date() }
      );
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Rename error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;