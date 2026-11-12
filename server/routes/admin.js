const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const archiver = require('archiver');
const AdmZip = require('adm-zip');
const config = require('../config');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { ensureCsrfToken, verifyCsrfToken } = require('../middleware/csrf');
const { loginLimiter } = require('../middleware/security');
const upload = require('../middleware/upload');

const router = express.Router();

/**
 * Helper to slugify string
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// Ensure all admin API responses are never cached by browsers or proxies
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// Ensure CSRF token is present on any admin session
router.use((req, res, next) => {
  if (req.session) {
    ensureCsrfToken(req);
  }
  next();
});

/* ============================================================
   AUTHENTICATION & SESSION ROUTES
============================================================ */

/**
 * POST /admin/api/login
 * Authenticates admin credentials and initiates session
 */
router.post('/api/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const data = db.getDb();
    const adminUser = (data.users || []).find(u => u.username.toLowerCase() === username.trim().toLowerCase());

    if (!adminUser) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, adminUser.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Set session data
    req.session.userId = adminUser.id;
    req.session.username = adminUser.username;
    req.session.mustChangePassword = !!adminUser.mustChangePassword;
    const csrfToken = ensureCsrfToken(req);

    res.json({
      success: true,
      user: {
        id: adminUser.id,
        username: adminUser.username,
        mustChangePassword: adminUser.mustChangePassword
      },
      csrfToken
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'An error occurred during login.' });
  }
});

/**
 * POST /admin/api/logout
 */
router.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Failed to log out.' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logged out successfully.' });
  });
});

/**
 * GET /admin/api/me
 * Returns current authenticated user state and CSRF token
 */
router.get('/api/me', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const data = db.getDb();
  const user = (data.users || []).find(u => u.id === req.session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  const csrfToken = ensureCsrfToken(req);
  res.json({
    user: {
      id: user.id,
      username: user.username,
      mustChangePassword: !!user.mustChangePassword
    },
    csrfToken
  });
});

/**
 * GET /admin/api/csrf-token
 */
router.get('/api/csrf-token', (req, res) => {
  const token = ensureCsrfToken(req);
  res.json({ csrfToken: token });
});

/**
 * POST /admin/api/change-password
 * Updates the admin password and clears mustChangePassword flag
 */
router.post('/api/change-password', requireAuth, verifyCsrfToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    const data = db.getDb();
    const userIndex = (data.users || []).findIndex(u => u.id === req.session.userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = data.users[userIndex];

    // Check current password only if not forced first-time change
    if (user.passwordHash && !req.session.mustChangePassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Incorrect current password.' });
      }
    } else if (user.passwordHash && currentPassword) {
      // If current password was provided during initial change, verify it
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Incorrect current password.' });
      }
    }

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 10);

    await db.updateDb(current => {
      current.users[userIndex].passwordHash = newHash;
      current.users[userIndex].mustChangePassword = false;
      current.users[userIndex].updatedAt = new Date().toISOString();
      return current;
    });

    req.session.mustChangePassword = false;

    res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

/* ============================================================
   ALL SUBSEQUENT ADMIN ROUTES REQUIRE AUTH AND CSRF
============================================================ */
router.use('/api', requireAuth);
router.use('/api', verifyCsrfToken);

/* ============================================================
   PROJECTS CRUD & REORDERING
============================================================ */

/**
 * GET /admin/api/projects
 */
router.get('/api/projects', (req, res) => {
  const data = db.getDb();
  const projects = (data.projects || []).sort((a, b) => (a.order || 0) - (b.order || 0));
  res.json({ projects });
});

/**
 * GET /admin/api/projects/:id
 */
router.get('/api/projects/:id', (req, res) => {
  const data = db.getDb();
  const project = (data.projects || []).find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }
  res.json({ project });
});

/**
 * POST /admin/api/projects
 * Create a new project
 */
router.post('/api/projects', async (req, res) => {
  try {
    const { title, slug, year, shortDescription, thumbnailUrl, hoverOverlayColor, published, blocks, seo, showSocialLinks, socialLinks } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Project title is required.' });
    }

    const data = db.getDb();
    let baseSlug = slugify(slug || title);
    if (!baseSlug) baseSlug = 'project-' + Date.now();

    // Ensure unique slug
    let finalSlug = baseSlug;
    let count = 1;
    while ((data.projects || []).some(p => p.slug === finalSlug)) {
      finalSlug = `${baseSlug}-${count++}`;
    }

    const newProject = {
      id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: title.trim(),
      slug: finalSlug,
      year: year ? year.toString().trim() : new Date().getFullYear().toString(),
      shortDescription: shortDescription ? shortDescription.trim() : '',
      thumbnailUrl: thumbnailUrl || '',
      hoverOverlayColor: hoverOverlayColor || data.settings?.accentColor || '#7ec8b8',
      published: published !== false,
      showSocialLinks: showSocialLinks !== false,
      socialLinks: Array.isArray(socialLinks) ? socialLinks : undefined,
      blocks: Array.isArray(blocks) ? blocks : [],
      order: (data.projects || []).length,
      seo: seo || {
        metaTitle: '',
        metaDescription: ''
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.updateDb(current => {
      if (!current.projects) current.projects = [];
      current.projects.push(newProject);
      return current;
    });

    res.status(201).json({
      success: true,
      project: newProject
    });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create project.' });
  }
});

/**
 * PUT /admin/api/projects/:id
 * Update an existing project
 */
router.put('/api/projects/:id', async (req, res) => {
  try {
    const { title, slug, year, shortDescription, thumbnailUrl, hoverOverlayColor, published, blocks, seo, showSocialLinks, socialLinks } = req.body;
    const data = db.getDb();
    const index = (data.projects || []).findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    let finalSlug = data.projects[index].slug;
    if (slug && slug.trim() && slug !== finalSlug) {
      const candidateSlug = slugify(slug);
      const isTaken = data.projects.some(p => p.id !== req.params.id && p.slug === candidateSlug);
      if (isTaken) {
        return res.status(400).json({ error: 'Slug is already used by another project.' });
      }
      finalSlug = candidateSlug;
    }

    let updatedProject;
    await db.updateDb(current => {
      const target = current.projects[index];
      target.title = title ? title.trim() : target.title;
      target.slug = finalSlug;
      target.year = year !== undefined ? year.toString().trim() : target.year;
      target.shortDescription = shortDescription !== undefined ? shortDescription.trim() : target.shortDescription;
      target.thumbnailUrl = thumbnailUrl !== undefined ? thumbnailUrl : target.thumbnailUrl;
      target.hoverOverlayColor = hoverOverlayColor !== undefined ? hoverOverlayColor : target.hoverOverlayColor;
      target.published = published !== undefined ? !!published : target.published;
      if (showSocialLinks !== undefined) target.showSocialLinks = !!showSocialLinks;
      if (socialLinks !== undefined && Array.isArray(socialLinks)) target.socialLinks = socialLinks;
      target.blocks = Array.isArray(blocks) ? blocks : target.blocks;
      target.seo = seo !== undefined ? seo : target.seo;
      target.updatedAt = new Date().toISOString();
      updatedProject = target;
      return current;
    });

    res.json({
      success: true,
      project: updatedProject
    });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Failed to update project.' });
  }
});

/**
 * POST /admin/api/projects/:id/duplicate
 * Duplicate project
 */
router.post('/api/projects/:id/duplicate', async (req, res) => {
  try {
    const data = db.getDb();
    const source = (data.projects || []).find(p => p.id === req.params.id);
    if (!source) {
      return res.status(404).json({ error: 'Source project not found.' });
    }

    let baseSlug = source.slug + '-copy';
    let finalSlug = baseSlug;
    let count = 1;
    while (data.projects.some(p => p.slug === finalSlug)) {
      finalSlug = `${baseSlug}-${count++}`;
    }

    const duplicate = JSON.parse(JSON.stringify(source));
    duplicate.id = 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    duplicate.title = `${source.title} (Copy)`;
    duplicate.slug = finalSlug;
    duplicate.published = false; // default duplicated project to draft
    duplicate.order = data.projects.length;
    duplicate.createdAt = new Date().toISOString();
    duplicate.updatedAt = new Date().toISOString();

    await db.updateDb(current => {
      current.projects.push(duplicate);
      return current;
    });

    res.json({
      success: true,
      project: duplicate
    });
  } catch (err) {
    console.error('Duplicate project error:', err);
    res.status(500).json({ error: 'Failed to duplicate project.' });
  }
});

/**
 * DELETE /admin/api/projects/:id
 */
router.delete('/api/projects/:id', async (req, res) => {
  try {
    let deleted = false;
    await db.updateDb(current => {
      const initialLen = current.projects.length;
      current.projects = current.projects.filter(p => p.id !== req.params.id);
      deleted = current.projects.length < initialLen;
      // Re-index orders
      current.projects.forEach((p, idx) => {
        p.order = idx;
      });
      return current;
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Failed to delete project.' });
  }
});

/**
 * PUT /admin/api/projects-reorder
 * Bulk reorder projects: { order: [projectId1, projectId2, ...] }
 */
router.put('/api/projects-reorder', async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'Expected order array of project IDs.' });
    }

    await db.updateDb(current => {
      const idMap = new Map();
      order.forEach((id, index) => {
        idMap.set(id, index);
      });

      current.projects.forEach(p => {
        if (idMap.has(p.id)) {
          p.order = idMap.get(p.id);
        }
      });

      current.projects.sort((a, b) => (a.order || 0) - (b.order || 0));
      return current;
    });

    res.json({ success: true, message: 'Projects reordered successfully.' });
  } catch (err) {
    console.error('Reorder projects error:', err);
    res.status(500).json({ error: 'Failed to reorder projects.' });
  }
});

/* ============================================================
   PAGES CONTENT EDITORS (ABOUT & CONTACT)
============================================================ */

/**
 * GET & PUT /admin/api/pages/about
 */
router.get('/api/pages/about', (req, res) => {
  const data = db.getDb();
  res.json({ about: data.about || {} });
});

router.put('/api/pages/about', async (req, res) => {
  try {
    const { heading, paragraphs, pullquote, photoUrl, showPhoto } = req.body;

    let updatedAbout;
    await db.updateDb(current => {
      if (!current.about) current.about = {};
      if (heading !== undefined) current.about.heading = heading.trim();
      if (paragraphs !== undefined) {
        current.about.paragraphs = Array.isArray(paragraphs)
          ? paragraphs.map(p => typeof p === 'string' ? p.trim() : '').filter(Boolean)
          : [];
      }
      if (pullquote !== undefined) current.about.pullquote = pullquote.trim();
      if (photoUrl !== undefined) current.about.photoUrl = photoUrl;
      if (showPhoto !== undefined) current.about.showPhoto = !!showPhoto;
      updatedAbout = current.about;
      return current;
    });

    res.json({ success: true, about: updatedAbout });
  } catch (err) {
    console.error('Update about page error:', err);
    res.status(500).json({ error: 'Failed to update about page.' });
  }
});

/**
 * GET & PUT /admin/api/pages/contact
 */
router.get('/api/pages/contact', (req, res) => {
  const data = db.getDb();
  res.json({ contact: data.contact || {} });
});

router.put('/api/pages/contact', async (req, res) => {
  try {
    const { heading, intro, directMethods, formIntro, contactEmail, successMessage, showPhone, showSocials } = req.body;

    let updatedContact;
    await db.updateDb(current => {
      if (!current.contact) current.contact = {};
      if (heading !== undefined) current.contact.heading = heading.trim();
      if (intro !== undefined) current.contact.intro = intro.trim();
      if (directMethods !== undefined && Array.isArray(directMethods)) {
        current.contact.directMethods = directMethods;
      }
      if (formIntro !== undefined) current.contact.formIntro = formIntro.trim();
      if (contactEmail !== undefined) current.contact.contactEmail = contactEmail.trim();
      if (successMessage !== undefined) current.contact.successMessage = successMessage.trim();
      if (showPhone !== undefined) current.contact.showPhone = !!showPhone;
      if (showSocials !== undefined) current.contact.showSocials = !!showSocials;
      updatedContact = current.contact;
      return current;
    });

    res.json({ success: true, contact: updatedContact });
  } catch (err) {
    console.error('Update contact page error:', err);
    res.status(500).json({ error: 'Failed to update contact page.' });
  }
});

/* ============================================================
   CONTACT INBOX
============================================================ */

/**
 * GET /admin/api/messages
 */
router.get('/api/messages', (req, res) => {
  const data = db.getDb();
  const inbox = (data.inbox || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ messages: inbox });
});

/**
 * PUT /admin/api/messages/:id/read
 */
router.put('/api/messages/:id/read', async (req, res) => {
  try {
    const { read } = req.body;
    let found = false;

    await db.updateDb(current => {
      const msg = (current.inbox || []).find(m => m.id === req.params.id);
      if (msg) {
        msg.read = read !== undefined ? !!read : true;
        found = true;
      }
      return current;
    });

    if (!found) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Update message error:', err);
    res.status(500).json({ error: 'Failed to update message.' });
  }
});

/**
 * DELETE /admin/api/messages/:id
 */
router.delete('/api/messages/:id', async (req, res) => {
  try {
    let deleted = false;
    await db.updateDb(current => {
      const initial = (current.inbox || []).length;
      current.inbox = (current.inbox || []).filter(m => m.id !== req.params.id);
      deleted = current.inbox.length < initial;
      return current;
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    res.json({ success: true, message: 'Message deleted successfully.' });
  } catch (err) {
    console.error('Delete message error:', err);
    res.status(500).json({ error: 'Failed to delete message.' });
  }
});

/* ============================================================
   SITE SETTINGS
============================================================ */

/**
 * GET & PUT /admin/api/settings
 */
router.get('/api/settings', (req, res) => {
  const data = db.getDb();
  res.json({ settings: data.settings || {} });
});

router.put('/api/settings', async (req, res) => {
  try {
    const { siteName, navLabels, navLinks, socialLinks, showProjectSocialLinks, projectSocialLinks, accentColor, backgroundColor, textColor, fontHeading, fontBody, footerText, faviconUrl, seo } = req.body;

    let updatedSettings;
    await db.updateDb(current => {
      if (!current.settings) current.settings = {};
      if (siteName !== undefined) current.settings.siteName = siteName.trim();
      if (navLabels !== undefined) current.settings.navLabels = { ...current.settings.navLabels, ...navLabels };
      if (navLinks !== undefined && Array.isArray(navLinks)) current.settings.navLinks = navLinks;
      if (socialLinks !== undefined && Array.isArray(socialLinks)) current.settings.socialLinks = socialLinks;
      if (showProjectSocialLinks !== undefined) current.settings.showProjectSocialLinks = !!showProjectSocialLinks;
      if (projectSocialLinks !== undefined && Array.isArray(projectSocialLinks)) current.settings.projectSocialLinks = projectSocialLinks;
      if (accentColor !== undefined) current.settings.accentColor = accentColor;
      if (backgroundColor !== undefined) current.settings.backgroundColor = backgroundColor;
      if (textColor !== undefined) current.settings.textColor = textColor;
      if (fontHeading !== undefined) current.settings.fontHeading = fontHeading;
      if (fontBody !== undefined) current.settings.fontBody = fontBody;
      if (footerText !== undefined) current.settings.footerText = footerText;
      if (faviconUrl !== undefined) current.settings.faviconUrl = faviconUrl;
      if (seo !== undefined) current.settings.seo = { ...current.settings.seo, ...seo };
      updatedSettings = current.settings;
      return current;
    });

    res.json({ success: true, settings: updatedSettings });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

/* ============================================================
   MEDIA LIBRARY & FILE UPLOADS
============================================================ */

/**
 * GET /admin/api/media
 * List all uploaded images
 */
router.get('/api/media', async (req, res) => {
  try {
    if (!fs.existsSync(config.UPLOADS_DIR)) {
      return res.json({ files: [] });
    }

    // Helper to scan directory recursively
    function scanDir(dir, prefix = '') {
      let results = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue; // ignore hidden files
        const fullPath = path.join(dir, entry.name);
        const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          results = results.concat(scanDir(fullPath, relPath));
        } else {
          const ext = path.extname(entry.name).toLowerCase();
          if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.pdf', '.doc', '.docx'].includes(ext)) {
            const stats = fs.statSync(fullPath);
            results.push({
              filename: relPath,
              url: `/uploads/${relPath}`,
              size: stats.size,
              mtime: stats.mtime
            });
          }
        }
      }
      return results;
    }

    const files = scanDir(config.UPLOADS_DIR);
    files.sort((a, b) => new Date(b.mtime) - new Date(a.mtime));

    res.json({ files });
  } catch (err) {
    console.error('List media error:', err);
    res.status(500).json({ error: 'Failed to list media files.' });
  }
});

/**
 * POST /admin/api/upload
 * Supports single or multi-file uploads
 */
router.post('/api/upload', (req, res) => {
  upload.array('images', 20)(req, res, err => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files were uploaded.' });
    }

    const files = req.files.map(f => ({
      filename: f.filename,
      url: `/uploads/${f.filename}`,
      size: f.size
    }));

    res.json({
      success: true,
      files,
      url: files[0].url // convenience for single uploads
    });
  });
});

/**
 * DELETE /admin/api/media/:filename
 * Delete an uploaded media file safely
 */
router.delete('/api/media/:filename', (req, res) => {
  try {
    const rawParam = req.params.filename;
    // Prevent directory traversal attacks
    const safeRelPath = rawParam.replace(/\.\./g, '').replace(/^\/+/, '');
    const filePath = path.join(config.UPLOADS_DIR, safeRelPath);

    if (!filePath.startsWith(config.UPLOADS_DIR)) {
      return res.status(400).json({ error: 'Invalid file path.' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File does not exist.' });
    }

    fs.unlinkSync(filePath);
    res.json({ success: true, message: 'File deleted successfully.' });
  } catch (err) {
    console.error('Delete media error:', err);
    res.status(500).json({ error: 'Failed to delete file.' });
  }
});

/* ============================================================
   BACKUP & RESTORE
============================================================ */

/**
 * GET /admin/api/backup/export
 * Downloads a zip archive containing data/db.json and uploads/
 */
router.get('/api/backup/export', (req, res) => {
  try {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const filename = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.zip`;

    res.attachment(filename);

    archive.on('error', err => {
      console.error('Archiver error:', err);
      res.status(500).end();
    });

    archive.pipe(res);

    // Append database file
    if (fs.existsSync(config.DB_PATH)) {
      archive.file(config.DB_PATH, { name: 'db.json' });
    }

    // Append uploads directory
    if (fs.existsSync(config.UPLOADS_DIR)) {
      archive.directory(config.UPLOADS_DIR, 'uploads');
    }

    archive.finalize();
  } catch (err) {
    console.error('Backup export error:', err);
    res.status(500).json({ error: 'Failed to export backup.' });
  }
});

/**
 * POST /admin/api/backup/import
 * Restores database and uploaded assets from a zip archive
 */
router.post('/api/backup/import', (req, res) => {
  // Use memory or temporary upload
  upload.single('backup')(req, res, async err => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No backup file uploaded.' });
    }

    try {
      const zipPath = req.file.path;
      const zip = new AdmZip(zipPath);
      const zipEntries = zip.getEntries();

      // Look for db.json inside zip
      const dbEntry = zipEntries.find(e => e.entryName === 'db.json' || e.entryName.endsWith('/db.json'));
      if (!dbEntry) {
        fs.unlinkSync(zipPath);
        return res.status(400).json({ error: 'Invalid backup: missing db.json inside zip.' });
      }

      const importedJson = JSON.parse(dbEntry.getData().toString('utf8'));
      if (!importedJson.projects || !importedJson.settings) {
        fs.unlinkSync(zipPath);
        return res.status(400).json({ error: 'Invalid backup structure: db.json missing essential schema fields.' });
      }

      // Extract uploads if present
      zipEntries.forEach(entry => {
        if (!entry.isDirectory && (entry.entryName.startsWith('uploads/') || entry.entryName.includes('/uploads/'))) {
          const subPath = entry.entryName.substring(entry.entryName.indexOf('uploads/') + 8);
          if (subPath && !subPath.includes('..')) {
            const destPath = path.join(config.UPLOADS_DIR, subPath);
            fs.mkdirSync(path.dirname(destPath), { recursive: true });
            fs.writeFileSync(destPath, entry.getData());
          }
        }
      });

      // Update database atomically
      await db.updateDb(() => importedJson);

      // Clean up uploaded temp zip file
      fs.unlinkSync(zipPath);

      res.json({
        success: true,
        message: 'Backup imported successfully. Refreshing site state.'
      });
    } catch (importErr) {
      console.error('Backup import error:', importErr);
      res.status(500).json({ error: 'Failed to process backup file: ' + importErr.message });
    }
  });
});

module.exports = router;
