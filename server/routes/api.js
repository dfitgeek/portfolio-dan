const express = require('express');
const nodemailer = require('nodemailer');
const config = require('../config');
const db = require('../db');
const { contactLimiter, escapeHtml } = require('../middleware/security');

const router = express.Router();

// Ensure public API responses are never cached by browsers or proxies
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

/**
 * GET /api/settings
 * Public site configuration and branding
 */
router.get('/settings', (req, res) => {
  const data = db.getDb();
  res.json({
    settings: data.settings || {}
  });
});

/**
 * GET /api/projects
 * List of published projects ordered by custom sequence
 */
router.get('/projects', (req, res) => {
  const data = db.getDb();
  const published = (data.projects || [])
    .filter(p => p.published !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      year: p.year,
      shortDescription: p.shortDescription || '',
      thumbnailUrl: p.thumbnailUrl || '',
      hoverOverlayColor: p.hoverOverlayColor || data.settings?.accentColor || '#7ec8b8',
      order: p.order || 0
    }));

  res.json({ projects: published });
});

/**
 * GET /api/projects/:slug
 * Full project details and navigation links (previous & next).
 * Allows authenticated admin users to preview drafts and matches by slug or ID.
 */
router.get('/projects/:slug', (req, res) => {
  const data = db.getDb();
  const isAdmin = !!(req.session && req.session.userId);
  const list = (data.projects || [])
    .filter(p => isAdmin || p.published !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const index = list.findIndex(p => p.slug === req.params.slug || p.id === req.params.slug);
  if (index === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const project = list[index];
  const prevProject = index > 0 ? {
    title: list[index - 1].title,
    slug: list[index - 1].slug
  } : null;

  const nextProject = index < list.length - 1 ? {
    title: list[index + 1].title,
    slug: list[index + 1].slug
  } : null;

  res.json({
    project,
    prevProject,
    nextProject
  });
});

/**
 * GET /api/about
 * Public About me page content
 */
router.get('/about', (req, res) => {
  const data = db.getDb();
  res.json({
    about: data.about || {}
  });
});

/**
 * GET /api/contact
 * Public Contact page info & form settings
 */
router.get('/contact', (req, res) => {
  const data = db.getDb();
  const contact = data.contact || {};
  res.json({
    contact: {
      heading: contact.heading || 'Contact',
      intro: contact.intro || 'Feel free to contact me in the following ways:',
      directMethods: contact.directMethods || [],
      formIntro: contact.formIntro || 'Or use the form below to send me an email!',
      successMessage: contact.successMessage || "Thank you for getting in touch! I'll get back to you shortly.",
      showPhone: contact.showPhone !== false,
      showSocials: contact.showSocials !== false
    }
  });
});

/**
 * POST /api/contact
 * Handle contact form submissions with honeypot spam protection & rate limiting
 */
router.post('/contact', contactLimiter, async (req, res) => {
  try {
    const { name, email, message, _honeypot } = req.body;

    // Honeypot spam trap: if field is filled, silently discard
    if (_honeypot && _honeypot.trim() !== '') {
      return res.json({
        success: true,
        message: 'Thank you for your message!'
      });
    }

    // Validation
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanMessage = (message || '').trim();

    if (!cleanName) {
      return res.status(400).json({ error: 'Please provide your name.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (!cleanMessage) {
      return res.status(400).json({ error: 'Please provide a message.' });
    }

    const newMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: cleanName,
      email: cleanEmail,
      message: cleanMessage,
      createdAt: new Date().toISOString(),
      read: false
    };

    // Store into database
    await db.updateDb(current => {
      if (!current.inbox) current.inbox = [];
      current.inbox.unshift(newMessage);
      return current;
    });

    // Optional SMTP notification
    if (config.SMTP.auth && config.SMTP.notificationEmail) {
      try {
        const transporter = nodemailer.createTransporter({
          host: config.SMTP.host,
          port: config.SMTP.port,
          secure: config.SMTP.secure,
          auth: config.SMTP.auth
        });

        await transporter.sendMail({
          from: config.SMTP.from,
          to: config.SMTP.notificationEmail,
          replyTo: cleanEmail,
          subject: `Portfolio Contact: Message from ${cleanName}`,
          text: `Name: ${cleanName}\nEmail: ${cleanEmail}\n\nMessage:\n${cleanMessage}`
        });
      } catch (smtpErr) {
        console.warn('SMTP notification failed (message still stored in inbox):', smtpErr.message);
      }
    }

    const data = db.getDb();
    const successMsg = data.contact?.successMessage || "Thank you for getting in touch! I'll get back to you shortly.";

    res.json({
      success: true,
      message: successMsg
    });
  } catch (err) {
    console.error('Contact form submission error:', err);
    res.status(500).json({ error: 'An error occurred while sending your message. Please try again later.' });
  }
});

module.exports = router;
