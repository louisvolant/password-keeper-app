const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { UserFileTreeModel } = require('../dao/userDao');
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

      // Insert into Mongoose
      await UserFileTreeModel.findOneAndUpdate(
        { supabase_user_id: req.user.id.toString() }, // Convert to string for consistency
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

    // Sync to Mongoose
    await UserFileTreeModel.findOneAndUpdate(
      { supabase_user_id: req.user.id.toString() },
      { file_tree: data.file_tree, updated_at: new Date() },
      { upsert: true, new: true }
    );

    res.json({ file_tree: data.file_tree });
  } catch (error) {
    console.error('Get file tree error:', error); // Improved logging
    res.status(500).json({ error: 'Server error', details: error.message });
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
    const updatedAt = new Date();

    if (existingTree) {
      result = await supabase
        .from(TABLE_USER_FILE_TREE)
        .update({ file_tree, updated_at: updatedAt.toISOString() })
        .eq('user_id', req.user.id);
    } else {
      result = await supabase
        .from(TABLE_USER_FILE_TREE)
        .insert({
          user_id: req.user.id,
          file_tree,
          created_at: updatedAt.toISOString(),
          updated_at: updatedAt.toISOString()
        });
    }

    if (result.error) {
      console.error('Supabase error:', result.error);
      return res.status(500).json({ error: 'Save error', details: result.error.message });
    }

    // Sync to Mongoose
    await UserFileTreeModel.findOneAndUpdate(
      { supabase_user_id: req.user.id.toString() },
      { file_tree, updated_at: updatedAt },
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
    const { data: currentData, error: fetchError } = await supabase
      .from(TABLE_USER_FILE_TREE)
      .select('file_tree')
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !currentData) {
      return res.status(500).json({ error: 'Error fetching file tree' });
    }

    let fileTree = JSON.parse(currentData.file_tree || '[]');
    if (!fileTree.includes(file_path)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const updatedFileTree = fileTree.filter(path => path !== file_path);
    const updatedAt = new Date();

    const { error: updateError } = await supabase
      .from(TABLE_USER_FILE_TREE)
      .update({
        file_tree: JSON.stringify(updatedFileTree),
        updated_at: updatedAt.toISOString()
      })
      .eq('user_id', req.user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({ error: 'Error removing file', details: updateError.message });
    }

    // Sync to Mongoose
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
    const { data: currentData, error: fetchError } = await supabase
      .from(TABLE_USER_FILE_TREE)
      .select('file_tree')
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !currentData) {
      return res.status(500).json({ error: 'Error fetching file tree' });
    }

    let fileTree = JSON.parse(currentData.file_tree || '[]');
    const folderExists = fileTree.some(path => path.startsWith(folder_path + '/'));

    if (!folderExists) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const updatedFileTree = fileTree.filter(path => !path.startsWith(folder_path + '/'));
    const updatedAt = new Date();

    const { error: updateError } = await supabase
      .from(TABLE_USER_FILE_TREE)
      .update({
        file_tree: JSON.stringify(updatedFileTree),
        updated_at: updatedAt.toISOString()
      })
      .eq('user_id', req.user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({ error: 'Error removing folder', details: updateError.message });
    }

    // Sync to Mongoose
    await UserFileTreeModel.findOneAndUpdate(
      { supabase_user_id: req.user.id.toString() },
      { file_tree: JSON.stringify(updatedFileTree), updated_at: updatedAt },
      { upsert: true, new: true }
    );

    res.json({
      success: true, // Fixed typo: removed "冬天"
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
    const { data: currentData, error: fetchError } = await supabase
      .from(TABLE_USER_FILE_TREE)
      .select('file_tree')
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !currentData) {
      return res.status(500).json({ error: 'Error fetching file tree' });
    }

    let fileTree = JSON.parse(currentData.file_tree || '[]');
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

    const { error: updateError } = await supabase
      .from(TABLE_USER_FILE_TREE)
      .update({
        file_tree: JSON.stringify(updatedFileTree),
        updated_at: updatedAt.toISOString()
      })
      .eq('user_id', req.user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({ error: 'Error renaming', details: updateError.message });
    }

    // Sync to Mongoose
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