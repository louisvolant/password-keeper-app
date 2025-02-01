// routes/api.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authenticateUser = require('../middleware/auth');



// Route de login
router.post('/login', async (req, res) => {
  const { username, hashedpassword } = req.body;
  console.log({ username, hashedpassword });

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('hashedpassword', hashedpassword)
      .single();

    console.log('Supabase response:', { data, error });

    if (error || !data) {
      return res.status(401).json({ success: false, error: 'Identifiants invalides' });
    } else if (data.username === username && data.hashedpassword === hashedpassword) {
        req.session.user = { id: 1, username: username };
        res.json({ success: true });
    }
    else {
      return res.status(401).json({ error: 'Erreur de création de session' });
    }
  } catch (error) {
    console.log('Erreur : ' + error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour récupérer le contenu
router.get('/getcontent', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contents')
      .select('encodedContent')
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Contenu non trouvé' });
    }

    res.json({ encodedContent: data?.encodedContent || '' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour mettre à jour le contenu
router.post('/updatecontent', authenticateUser, async (req, res) => {
  const { encodedContent } = req.body;

  try {
    const { error } = await supabase
      .from('contents')
      .upsert({
        user_id: req.user.id,
        encodedContent: encodedContent
      });

    if (error) {
      return res.status(500).json({ error: 'Erreur de sauvegarde' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


router.get('/test-users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');

    console.log('All users:', { data, error });
    res.json({ data, error });
  } catch (error) {
    console.log('Test error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/create-test-user', async (req, res) => {
  try {
    const testUser = {
      username: 'testuser',
      hashedpassword: '1234567890', // Mettez ici le hash que vous utilisez pour tester
      email: 'test@test.com'
    };

    const { data, error } = await supabase
      .from('users')
      .insert([testUser])
      .select();

    console.log('Create user result:', { data, error });
    res.json({ data, error });
  } catch (error) {
    console.log('Create user error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    console.log('Test DB response:', { data, error });
    res.json({ data, error });
  } catch (error) {
    console.log('Test DB error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;