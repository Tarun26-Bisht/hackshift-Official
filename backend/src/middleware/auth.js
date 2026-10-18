const passport = require('passport');

const authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Unauthorized' });
    req.user = user;
    next();
  })(req, res, next);
};

const requireRole = (role) => (req, res, next) => {
  if (req.user?.role !== role) {
    return res.status(403).json({ error: 'Forbidden: insufficient role' });
  }
  next();
};

module.exports = { authenticate, requireRole };
