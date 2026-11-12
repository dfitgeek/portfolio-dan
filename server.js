const path = require('path');
const express = require('express');
const session = require('express-session');
const config = require('./server/config');
const db = require('./server/db');
const { securityHeaders } = require('./server/middleware/security');
const apiRouter = require('./server/routes/api');
const adminRouter = require('./server/routes/admin');

// Initialize database
db.initDb();

const app = express();

// Security headers
app.use(securityHeaders);

// Body parsers
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Session management
app.use(session({
  name: 'portfolio_sid',
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE === 'true',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Static uploads serving
app.use('/uploads', express.static(config.UPLOADS_DIR, {
  maxAge: '1d',
  immutable: false
}));

// Mount public API
app.use('/api', apiRouter);

// Serve Admin login page
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

// Admin panel shell (requires session)
app.get(['/admin', '/admin/index.html'], (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.redirect('/admin/login');
  }
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Serve admin static assets (css, js)
app.use('/admin', express.static(path.join(__dirname, 'admin'), { index: false }));

// Mount Admin API router
app.use('/admin', adminRouter);

// Serve public static assets (css, js)
app.use(express.static(path.join(__dirname, 'public')));

// Fallback: any other GET route serves the public SPA shell (HTML5 History API)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.set('Cache-Control', 'no-cache');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected internal server error occurred.'
  });
});

// Start listening if run directly
if (require.main === module) {
  const startServer = (port) => {
    const srv = app.listen(port, () => {
      console.log(`=======================================================`);
      console.log(`Portfolio site running on http://localhost:${port}`);
      console.log(`Admin dashboard available at http://localhost:${port}/admin`);
      console.log(`Default login: username "${config.ADMIN_USER}"`);
      console.log(`=======================================================`);
    });
    srv.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${port} in use, attempting port ${port + 1}...`);
        startServer(port + 1);
      } else {
        console.error('Server error:', err);
      }
    });
    return srv;
  };

  startServer(config.PORT);
}

module.exports = app;
