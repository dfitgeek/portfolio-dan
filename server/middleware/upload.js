const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const config = require('../config');

// Allowed MIME types and extensions (images and CV/portfolio documents)
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

const ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.svg',
  '.pdf',
  '.doc',
  '.docx'
]);

// Configure disk storage with sanitised filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // Sanitize base name: alphanumeric, dashes, underscores only
    const baseName = path.basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 40);
    
    const randomHex = crypto.randomBytes(4).toString('hex');
    const safeFilename = `${Date.now()}-${baseName || 'upload'}-${randomHex}${ext}`;
    cb(null, safeFilename);
  }
});

// File filter checking MIME type and extension
function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error('Invalid file type. Only images (JPG, PNG, WEBP, GIF, SVG) and PDF documents are permitted.'), false);
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new Error('Invalid image MIME type: ' + file.mimetype), false);
  }

  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB maximum
  }
});

module.exports = upload;
