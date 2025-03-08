// routes/temporary_content_api.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
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

  if (!strategy || !max_date || !encoded_content || !iv) {
    logger.info('Missing required fields in savetemporarycontent');
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  if (!['oneread', 'multipleread'].includes(strategy)) {
    logger.info('Invalid strategy provided:', strategy);
    return res.status(400).json({ success: false, error: 'Invalid strategy' });
  }

  try {
    const identifier = uuidv4();
    const hashedPassword = password ? await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1
    }) : null;

    const { data, error } = await supabase
      .from(TABLE_TEMPORARY_CONTENT)
      .insert({
        created_at: new Date().toISOString(),
        identifier,
        hashed_password: hashedPassword,
        max_date: max_date,
        encoded_content,
        iv, // Store IV with the content
        user_id: req.session.user.id
      })
      .select('identifier')
      .single();

    if (error) {
      logger.error('Database insert error in savetemporarycontent:', {
        message: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details
      });
      return res.status(500).json({ success: false, error: 'Failed to save content' });
    }

    logger.info('Temporary content saved successfully:', { identifier, userId: req.session.user.id });
    return res.json({ success: true, identifier: data.identifier });
  } catch (err) {
    logger.error('Unexpected error in savetemporarycontent:', {
      message: err.message,
      stack: err.stack,
      userId: req.session.user.id
    });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});


// Get User's produced temporary content (authentication required)

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
      .eq('user_id', req.session.user.id) // Ensure only the owner can delete
      .select('identifier')
      .single();

    if (error || !data) {
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

    const response = {
      success: true,
      content: data.encoded_content,
      iv: data.iv
    };

    if (data.strategy === 'oneread') {
      await supabase.from(TABLE_TEMPORARY_CONTENT).delete().eq('identifier', identifier);
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