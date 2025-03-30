const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { TemporaryContentModel } = require('../dao/userDao');
const argon2 = require('argon2');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console()
  ]
});

const TABLE_TEMPORARY_CONTENT = "temporary_content";

// Middleware to authenticate user
const authenticateUser = (req, res, next) => {
  if (!req.session.user) {
    logger.info('Unauthorized access attempt to temporary content');
    return res.status(401).json({ success: false, error: 'Unauthorized - Please log in' });
  }
  next();
};

// Save temporary content
router.post('/savetemporarycontent', authenticateUser, async (req, res) => {
  const { strategy, max_date, password, iv, encoded_content } = req.body;

  if (!strategy || !max_date || !encoded_content || !iv || !['oneread', 'multipleread'].includes(strategy)) {
    return res.status(400).json({ success: false, error: 'Invalid input' });
  }

  try {
    const identifier = uuidv4();
    const hashedPassword = password ? await argon2.hash(password, { type: argon2.argon2id, memoryCost: 2 ** 16, timeCost: 3, parallelism: 1 }) : null;
    const createdAt = new Date();

    const { data, error } = await supabase
      .from(TABLE_TEMPORARY_CONTENT)
      .insert({
        created_at: createdAt.toISOString(),
        identifier,
        hashed_password: hashedPassword,
        max_date,
        encoded_content,
        iv,
        user_id: req.session.user.id
      })
      .select('identifier')
      .single();

    if (error) {
      logger.error('Database insert error:', error);
      return res.status(500).json({ success: false, error: 'Failed to save content' });
    }

    // Sync to Mongoose
    await TemporaryContentModel.findOneAndUpdate(
      { identifier },
      {
        supabase_user_id: req.session.user.id.toString(), // Convert to string for consistency
        identifier,
        hashed_password: hashedPassword,
        max_date,
        encoded_content,
        iv,
        created_at: createdAt
      },
      { upsert: true, new: true }
    );

    return res.json({ success: true, identifier: data.identifier });
  } catch (err) {
    logger.error('Unexpected error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get User's produced temporary content (authentication required)
router.get('/getusertemporarycontent', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from(TABLE_TEMPORARY_CONTENT)
      .select('identifier, max_date')
      .eq('user_id', req.session.user.id);

    if (error) {
      logger.error('Database fetch error in getusertemporarycontent:', {
        message: error.message,
        code: error.code,
        userId: req.session.user.id,
      });
      return res.status(500).json({ success: false, error: 'Failed to fetch links' });
    }

    // Sync to Mongoose
    for (const item of data) {
      await TemporaryContentModel.findOneAndUpdate(
        { identifier: item.identifier },
        {
          supabase_user_id: req.session.user.id.toString(),
          identifier: item.identifier,
          max_date: item.max_date,
          created_at: new Date()
        },
        { upsert: true, new: true }
      );
    }

    logger.info('User temporary content fetched successfully:', {
      userId: req.session.user.id,
      linkCount: data.length,
    });
    return res.json({ success: true, links: data });
  } catch (err) {
    logger.error('Unexpected error in getusertemporarycontent:', {
      message: err.message,
      stack: err.stack,
      userId: req.session.user.id,
    });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete User's specific temporary content (authentication required)
router.post('/deleteusertemporarycontent', authenticateUser, async (req, res) => {
  const { identifier } = req.body;

  if (!identifier) {
    logger.info('Missing identifier in deleteusertemporarycontent');
    return res.status(400).json({ success: false, error: 'Identifier is required' });
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_TEMPORARY_CONTENT)
      .delete()
      .eq('identifier', identifier)
      .eq('user_id', req.session.user.id)
      .select('identifier')
      .single();

    if (error || !data) {
      logger.info('Content not found or unauthorized deletion attempt:', {
        identifier,
        userId: req.session.user.id,
      });
      return res.status(404).json({ success: false, error: 'Content not found or unauthorized' });
    }

    // Sync to Mongoose
    await TemporaryContentModel.deleteOne({
      identifier,
      supabase_user_id: req.session.user.id.toString()
    });

    logger.info('Temporary content deleted successfully:', {
      identifier,
      userId: req.session.user.id,
    });
    return res.json({ success: true });
  } catch (err) {
    logger.error('Unexpected error in deleteusertemporarycontent:', {
      message: err.message,
      stack: err.stack,
      userId: req.session.user.id,
    });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get temporary content (no authentication required)
router.get('/gettemporarycontent', async (req, res) => {
  const { identifier, password } = req.query;

  if (!identifier) {
    return res.status(400).json({ success: false, error: 'Identifier is required' });
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_TEMPORARY_CONTENT)
      .select('*')
      .eq('identifier', identifier)
      .single();

    if (error || !data) {
      logger.info('Content not found or expired:', { identifier });
      return res.status(404).json({ success: false, error: 'Content not found or expired' });
    }

    const now = new Date();
    if (new Date(data.max_date) < now) {
      await supabase.from(TABLE_TEMPORARY_CONTENT).delete().eq('identifier', identifier);
      await TemporaryContentModel.deleteOne({ identifier });
      logger.info('Expired content deleted:', { identifier });
      return res.status(410).json({ success: false, error: 'Content has expired' });
    }

    if (data.hashed_password) {
      if (!password) {
        return res.status(403).json({ success: false, error: 'Password required' });
      }
      const isValid = await argon2.verify(data.hashed_password, password);
      if (!isValid) {
        return res.status(403).json({ success: false, error: 'Invalid password' });
      }
    }

    // Sync to Mongoose
    await TemporaryContentModel.findOneAndUpdate(
      { identifier },
      {
        supabase_user_id: data.user_id.toString(),
        identifier,
        hashed_password: data.hashed_password,
        max_date: data.max_date,
        encoded_content: data.encoded_content,
        iv: data.iv,
        created_at: data.created_at || new Date()
      },
      { upsert: true, new: true }
    );

    const response = {
      success: true,
      content: data.encoded_content,
      iv: data.iv
    };

    if (data.strategy === 'oneread') {
      await supabase.from(TABLE_TEMPORARY_CONTENT).delete().eq('identifier', identifier);
      await TemporaryContentModel.deleteOne({ identifier });
      logger.info('One-read content deleted after access:', { identifier });
    }

    return res.json(response);
  } catch (err) {
    logger.error('Error in gettemporarycontent:', {
      message: err.message,
      stack: err.stack,
      identifier
    });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;