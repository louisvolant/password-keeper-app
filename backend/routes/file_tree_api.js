//routes/file_tree_api.js

const express = require('express');
const router = express.Router();
const { UserFileTreeModel } = require('../dao/userDao');
const authenticateUser = require('../middleware/auth');

// Route to retrieve file tree
router.get('/getfiletree', authenticateUser, async (req, res) => {
  try {
    // Fetch file tree from MongoDB
    const fileTreeDoc = await UserFileTreeModel.findOne({
      supabase_user_id: req.user.id.toString()
    });

    if (!fileTreeDoc) {
      // If no file tree exists, create a new document
      const newFileTree = await UserFileTreeModel.findOneAndUpdate(
        { supabase_user_id: req.user.id.toString() },
        {
          supabase_user_id: req.user.id.toString(),
          file_tree: '{}',
          created_at: new Date(),
          updated_at: new Date()
        },
        { upsert: true, new: true }
      );

      return res.json({ file_tree: '{}' });
    }

    // Return existing file tree
    res.json({ file_tree: fileTreeDoc.file_tree });
  } catch (error) {
    console.error('Get file tree error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Route to update file tree
router.post('/updatefiletree', authenticateUser, async (req, res) => {
  const { file_tree } = req.body;

  try {
    const updatedAt = new Date();

    // Update or insert file tree in MongoDB
    const updatedFileTree = await UserFileTreeModel.findOneAndUpdate(
      { supabase_user_id: req.user.id.toString() },
      {
        file_tree,
        updated_at: updatedAt,
        $setOnInsert: {
          supabase_user_id: req.user.id.toString(),
          created_at: updatedAt
        }
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
    // Fetch current file tree from MongoDB
    const fileTreeDoc = await UserFileTreeModel.findOne({
      supabase_user_id: req.user.id.toString()
    });

    if (!fileTreeDoc) {
      return res.status(500).json({ error: 'Error fetching file tree' });
    }

    let fileTree = JSON.parse(fileTreeDoc.file_tree || '[]');
    if (!fileTree.includes(file_path)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const updatedFileTree = fileTree.filter(path => path !== file_path);
    const updatedAt = new Date();

    // Update file tree in MongoDB
    await UserFileTreeModel.findOneAndUpdate(
      { supabase_user_id: req.user.id.toString() },
      { file_tree: JSON.stringify(updatedFileTree), updated_at: updatedAt },
      { upsert: true, new: true }
    );

    res.json({ success: true, file_tree: JSON.stringify(updatedFileTree) });
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
    // Fetch current file tree from MongoDB
    const fileTreeDoc = await UserFileTreeModel.findOne({
      supabase_user_id: req.user.id.toString()
    });

    if (!fileTreeDoc) {
      return res.status(500).json({ error: 'Error fetching file tree' });
    }

    let fileTree = JSON.parse(fileTreeDoc.file_tree || '[]');
    const folderExists = fileTree.some(path => path.startsWith(folder_path + '/'));

    if (!folderExists) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const updatedFileTree = fileTree.filter(path => !path.startsWith(folder_path + '/'));
    const updatedAt = new Date();

    // Update file tree in MongoDB
    await UserFileTreeModel.findOneAndUpdate(
      { supabase_user_id: req.user.id.toString() },
      { file_tree: JSON.stringify(updatedFileTree), updated_at: updatedAt },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      file_tree: JSON.stringify(updatedFileTree)
    });
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
    // Fetch current file tree from MongoDB
    const fileTreeDoc = await UserFileTreeModel.findOne({
      supabase_user_id: req.user.id.toString()
    });

    if (!fileTreeDoc) {
      return res.status(500).json({ error: 'Error fetching file tree' });
    }

    let fileTree = JSON.parse(fileTreeDoc.file_tree || '[]');
    const isFolder = fileTree.some(path => path.startsWith(old_path + '/'));

    let updatedFileTree = [...fileTree];

    if (isFolder) {
      updatedFileTree = fileTree.map(path =>
        path.startsWith(old_path + '/') ? path.replace(old_path, new_path) : path
      );
    } else {
      if (!fileTree.includes(old_path)) {
        return res.status(404).json({ error: 'File not found' });
      }
      updatedFileTree = fileTree.map(path => path === old_path ? new_path : path);
    }

    const updatedAt = new Date();

    // Update file tree in MongoDB
    await UserFileTreeModel.findOneAndUpdate(
      { supabase_user_id: req.user.id.toString() },
      { file_tree: JSON.stringify(updatedFileTree), updated_at: updatedAt },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      file_tree: JSON.stringify(updatedFileTree)
    });
  } catch (error) {
    console.error('Rename error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;