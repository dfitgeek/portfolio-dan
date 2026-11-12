require('dotenv').config();
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

module.exports = {
  PORT: parseInt(process.env.PORT, 10) || 3000,
  SESSION_SECRET: process.env.SESSION_SECRET || 'dev-secret-session-change-in-production-12345678',
  ADMIN_USER: process.env.ADMIN_USER || 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
  
  // Storage paths
  ROOT_DIR,
  DATA_DIR: path.join(ROOT_DIR, 'data'),
  DB_PATH: path.join(ROOT_DIR, 'data', 'db.json'),
  SEED_PATH: path.join(ROOT_DIR, 'data', 'db.seed.json'),
  UPLOADS_DIR: path.join(ROOT_DIR, 'uploads'),
  
  // SMTP Config (optional)
  SMTP: {
    host: process.env.SMTP_HOST || null,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: (process.env.SMTP_USER && process.env.SMTP_PASS) ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    } : null,
    from: process.env.SMTP_FROM || '"Portfolio Contact Form" <noreply@example.com>',
    notificationEmail: process.env.CONTACT_NOTIFICATION_EMAIL || null
  }
};
