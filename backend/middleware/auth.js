// middleware/auth.js
const supabase = require('../config/supabase');

const authenticateUser = async (req, res, next) => {
  const session = req.headers.authorization;
  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(session);
    if (error || !user) {
      return res.status(401).json({ error: 'Session invalide' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Erreur d\'authentification' });
  }
};

module.exports = authenticateUser;
