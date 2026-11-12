/**
 * Middleware ensuring the request comes from an authenticated admin session
 */
function requireAuth(req, res, next) {
  const original = req.originalUrl || req.url || '';

  // Never redirect on login routes
  if (req.path === '/login' || req.path === '/admin/login' || original.endsWith('/admin/login')) {
    return next();
  }

  const isApi = original.includes('/api/') || req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'));

  // Session check
  if (!req.session || !req.session.userId) {
    if (isApi) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    return res.redirect('/admin/login');
  }

  // If user must change password, block all other operations except password change, csrf-token, me, and logout
  if (req.session.mustChangePassword) {
    const allowed = ['change-password', 'logout', 'me', 'csrf-token'];
    const isAllowed = allowed.some(endpoint => original.includes(endpoint));
    if (!isAllowed) {
      if (isApi) {
        return res.status(403).json({
          error: 'Password change is required before proceeding.',
          code: 'MUST_CHANGE_PASSWORD'
        });
      }
      return res.redirect('/admin/login');
    }
  }

  next();
}

module.exports = {
  requireAuth
};
