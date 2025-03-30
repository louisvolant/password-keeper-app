// routes/temporary_content_api.js
const express = require('express');
const router = express.Router();
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

    // Save to MongoDB
    const newContent = await TemporaryContentModel.create({
      supabase_user_id: req.session.user.id.toString(),
      identifier,
      hashed_password: hashedPassword,
      max_date,
      encoded_content,
      iv,
      created_at: createdAt,
      strategy // Add strategy field to schema if not already present
    });

    return res.json({ success: true, identifier: newContent.identifier });
  } catch (err) {
    logger.error('Unexpected error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get User's produced temporary content (authentication required)
router.get('/getusertemporarycontent', authenticateUser, async (req, res) => {
  try {
    // Fetch user's temporary content from MongoDB
    const contents = await TemporaryContentModel.find(
      { supabase_user_id: req.session.user.id.toString() },
      'identifier max_date' // Select only identifier and max_date
    );

    const links = contents.map(item => ({
      identifier: item.identifier,
      max_date: item.max_date
    }));

    logger.info('User temporary content fetched successfully:', {
      userId: req.session.user.id,
      linkCount: links.length,
    });
    return res.json({ success: true, links });
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
    // Delete from MongoDB
    const result = await TemporaryContentModel.deleteOne({
      identifier,
      supabase_user_id: req.session.user.id.toString()
    });

    if (result.deletedCount === 0) {
      logger.info('Content not found or unauthorized deletion attempt:', {
        identifier,
        userId: req.session.user.id,
      });
      return res.status(404).json({ success: false, error: 'Content not found or unauthorized' });
    }

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
    // Fetch content from MongoDB
    const content = await TemporaryContentModel.findOne({ identifier });

    if (!content) {
      logger.info('Content not found or expired:', { identifier });
      return res.status(404).json({ success: false, error: 'Content not found or expired' });
    }

    const now = new Date();
    if (new Date(content.max_date) < now) {
      await TemporaryContentModel.deleteOne({ identifier });
      logger.info('Expired content deleted:', { identifier });
      return res.status(410).json({ success: false, error: 'Content has expired' });
    }

    if (content.hashed_password) {
      if (!password) {
        return res.status(403).json({ success: false, error: 'Password required' });
      }
      const isValid = await argon2.verify(content.hashed_password, password);
      if (!isValid) {
        return res.status(403).json({ success: false, error: 'Invalid password' });
      }
    }

    const response = {
      success: true,
      content: content.encoded_content,
      iv: content.iv
    };

    if (content.strategy === 'oneread') {
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