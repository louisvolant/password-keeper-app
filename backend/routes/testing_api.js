const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

router.get('/test-users', async (req, res) => {
  const { data, error } = await supabase.from('users').select('*');
  res.json({ data, error });
});

router.get('/test-db', async (req, res) => {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  res.json({ data, error });
});

module.exports = router;
