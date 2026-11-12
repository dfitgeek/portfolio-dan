const crypto = require('crypto');

/**
 * Ensures session has a CSRF token
 */
function ensureCsrfToken(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  return req.session.csrfToken;
}

/**
 * Verifies CSRF token on state-changing methods (POST, PUT, DELETE, PATCH)
 */
function verifyCsrfToken(req, res, next) {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Exempt public login route from CSRF if starting fresh session, but login can also use token
  // Specifically: /admin/api/login generates/uses session CSRF
  if (req.path === '/login' || req.path === '/api/login') {
    return next();
  }

  const token = req.headers['x-csrf-token'] || (req.body && req.body._csrf);
  const sessionToken = req.session ? req.session.csrfToken : null;

  if (!sessionToken || !token || token !== sessionToken) {
    return res.status(403).json({
      error: 'Invalid or missing CSRF token. Please refresh the page.'
    });
  }

  next();
}

module.exports = {
  ensureCsrfToken,
  verifyCsrfToken
};
