// middleware/auth.js

const authenticateUser = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  req.user = req.session.user;
  next();
};

module.exports = authenticateUser;
