const assert = require('assert');
const http = require('http');
const path = require('path');
const fs = require('fs');
const app = require('../server');
const config = require('../server/config');
const db = require('../server/db');

let server;
const TEST_PORT = 3199;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Helper for making HTTP requests with cookie support
function request(method, urlPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const reqHeaders = { ...headers };
    let postData = null;

    if (body) {
      if (typeof body === 'object' && !(body instanceof Buffer)) {
        postData = JSON.stringify(body);
        reqHeaders['Content-Type'] = 'application/json';
        reqHeaders['Content-Length'] = Buffer.byteLength(postData);
      } else {
        postData = body;
      }
    }

    const req = http.request(url, { method, headers: reqHeaders }, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          json
        });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

const { generateSeedDb } = require('./seed');

async function runTests() {
  console.log('\n========================================');
  console.log('STARTING AUTOMATED TEST SUITE');
  console.log('========================================\n');

  // Preserve existing database so user's manual edits are never destroyed by test suite
  const userDbSnapshot = fs.existsSync(config.DB_PATH) ? fs.readFileSync(config.DB_PATH, 'utf8') : null;

  // Reset database before testing
  await generateSeedDb(true);

  // Start server on test port
  await new Promise(resolve => {
    server = app.listen(TEST_PORT, resolve);
  });
  console.log(`✓ Test server running on ${BASE_URL}`);

  let sessionCookie = '';
  let csrfToken = '';

  try {
    /* ------------------------------------------------------------
       1. PUBLIC API TESTS
    ------------------------------------------------------------ */
    console.log('\n[1/5] Testing Public API Endpoints...');

    // GET /api/settings
    const resSettings = await request('GET', '/api/settings');
    assert.strictEqual(resSettings.status, 200);
    assert.strictEqual(resSettings.json.settings.siteName, 'THOMAS MOELLER');
    console.log('  ✓ GET /api/settings returns valid settings');

    // GET /api/projects
    const resProjects = await request('GET', '/api/projects');
    assert.strictEqual(resProjects.status, 200);
    assert(Array.isArray(resProjects.json.projects), 'Projects should be an array');
    assert.strictEqual(resProjects.json.projects.length, 9, 'Should have 9 seeded projects');
    const hbo = resProjects.json.projects.find(p => p.slug === 'hbo-go');
    assert(hbo, 'Should find HBO GO project');
    console.log('  ✓ GET /api/projects returns 9 published projects including HBO GO');

    // GET /api/projects/hbo-go
    const resDetail = await request('GET', '/api/projects/hbo-go');
    assert.strictEqual(resDetail.status, 200);
    assert.strictEqual(resDetail.json.project.title, 'HBO GO');
    assert(resDetail.json.project.blocks.length >= 4, 'HBO GO should have content blocks');
    console.log('  ✓ GET /api/projects/:slug returns project detail with content blocks');

    // GET /api/about
    const resAbout = await request('GET', '/api/about');
    assert.strictEqual(resAbout.status, 200);
    assert.strictEqual(resAbout.json.about.heading, 'About me');
    assert(resAbout.json.about.paragraphs.length >= 3, 'About should have body paragraphs');
    console.log('  ✓ GET /api/about returns About me content');

    // GET /api/contact
    const resContact = await request('GET', '/api/contact');
    assert.strictEqual(resContact.status, 200);
    assert.strictEqual(resContact.json.contact.heading, 'Contact');
    assert(resContact.json.contact.directMethods.length >= 4, 'Contact should list phone & socials');
    console.log('  ✓ GET /api/contact returns contact channels');

    /* ------------------------------------------------------------
       2. CONTACT FORM & ANTI-SPAM TESTS
    ------------------------------------------------------------ */
    console.log('\n[2/5] Testing Contact Form & Spam Protection...');

    // Honeypot spam test
    const resSpam = await request('POST', '/api/contact', {}, {
      name: 'Bot Spammer',
      email: 'bot@spam.com',
      message: 'Buy cheap watches',
      _honeypot: 'filled_by_bot'
    });
    assert.strictEqual(resSpam.status, 200);
    assert(resSpam.json.success, 'Spam honeypot silently returns success');
    const dbCheckSpam = db.getDb();
    const spamMsg = (dbCheckSpam.inbox || []).find(m => m.name === 'Bot Spammer');
    assert(!spamMsg, 'Spam message was NOT stored in database');
    console.log('  ✓ Honeypot correctly discards bot submissions');

    // Validation failure test
    const resInvalid = await request('POST', '/api/contact', {}, {
      name: 'Jane Doe',
      email: 'not-an-email',
      message: 'Hello'
    });
    assert.strictEqual(resInvalid.status, 400);
    console.log('  ✓ Invalid email address properly rejected with 400');

    // Valid contact submission test
    const resValidMsg = await request('POST', '/api/contact', {}, {
      name: 'Alice Design Director',
      email: 'alice@designagency.com',
      message: 'Loved your HBO GO interface concept. Let us talk!'
    });
    assert.strictEqual(resValidMsg.status, 200);
    assert(resValidMsg.json.success);

    // Verify stored in DB
    const dbAfterMsg = db.getDb();
    const storedMsg = (dbAfterMsg.inbox || []).find(m => m.email === 'alice@designagency.com');
    assert(storedMsg, 'Contact message successfully saved to database inbox');
    assert.strictEqual(storedMsg.read, false, 'Message defaults to unread');
    console.log('  ✓ Legitimate contact form submission successfully saved to inbox');

    /* ------------------------------------------------------------
       3. AUTHENTICATION & SECURITY TESTS
    ------------------------------------------------------------ */
    console.log('\n[3/5] Testing Authentication, Sessions & Security...');

    // Unauthorized access should be blocked
    const resBlocked = await request('GET', '/admin/api/projects');
    assert.strictEqual(resBlocked.status, 401);
    console.log('  ✓ Unauthorized access to /admin/api/projects returns 401');

    // Admin login with invalid credentials
    const resBadLogin = await request('POST', '/admin/api/login', {}, {
      username: 'admin',
      password: 'WrongPassword!'
    });
    assert.strictEqual(resBadLogin.status, 401);
    console.log('  ✓ Invalid password rejected with 401');

    // Admin login with valid credentials (from seed)
    const resLogin = await request('POST', '/admin/api/login', {}, {
      username: config.ADMIN_USER,
      password: config.ADMIN_PASSWORD
    });
    assert.strictEqual(resLogin.status, 200);
    assert(resLogin.json.success);
    assert.strictEqual(resLogin.json.user.mustChangePassword, true, 'Seed user must have mustChangePassword=true');

    // Extract session cookie and CSRF token
    const rawCookies = resLogin.headers['set-cookie'];
    assert(rawCookies && rawCookies.length > 0, 'Should receive session cookie');
    sessionCookie = rawCookies[0].split(';')[0];
    csrfToken = resLogin.json.csrfToken;
    assert(csrfToken, 'Should receive CSRF token');
    console.log('  ✓ Admin logged in, received httpOnly session cookie and CSRF token');

    // Check mandatory password change block
    const resBlockedByMustChange = await request('POST', '/admin/api/projects', {
      Cookie: sessionCookie,
      'x-csrf-token': csrfToken
    }, { title: 'Test' });
    assert.strictEqual(resBlockedByMustChange.status, 403);
    assert.strictEqual(resBlockedByMustChange.json.code, 'MUST_CHANGE_PASSWORD');
    console.log('  ✓ Mutations blocked while mustChangePassword is true');

    // Change password
    const NEW_PASS = 'SuperSecurePass2026!';
    const resPassChange = await request('POST', '/admin/api/change-password', {
      Cookie: sessionCookie,
      'x-csrf-token': csrfToken
    }, {
      currentPassword: config.ADMIN_PASSWORD,
      newPassword: NEW_PASS
    });
    assert.strictEqual(resPassChange.status, 200);
    assert(resPassChange.json.success);
    console.log('  ✓ Password changed successfully, mustChangePassword cleared');

    /* ------------------------------------------------------------
       4. ADMIN CRUD & CSRF PROTECTION TESTS
    ------------------------------------------------------------ */
    console.log('\n[4/5] Testing Admin CRUD & Content Builder...');

    // CSRF rejection test (missing token)
    const resNoCsrf = await request('POST', '/admin/api/projects', {
      Cookie: sessionCookie
    }, { title: 'No CSRF' });
    assert.strictEqual(resNoCsrf.status, 403);
    console.log('  ✓ Request missing CSRF token rejected with 403');

    // Create new project
    const resCreateProj = await request('POST', '/admin/api/projects', {
      Cookie: sessionCookie,
      'x-csrf-token': csrfToken
    }, {
      title: 'Neon Brand Identity',
      year: '2025',
      shortDescription: 'Cyberpunk branding and design system.',
      blocks: [
        { id: 'b1', type: 'text', content: '<p>Brand exploration narrative</p>' }
      ]
    });
    assert.strictEqual(resCreateProj.status, 201);
    const createdProject = resCreateProj.json.project;
    assert.strictEqual(createdProject.title, 'Neon Brand Identity');
    assert.strictEqual(createdProject.slug, 'neon-brand-identity');
    console.log('  ✓ Created new project with auto-slug generation');

    // Update project
    const resUpdateProj = await request('PUT', `/admin/api/projects/${createdProject.id}`, {
      Cookie: sessionCookie,
      'x-csrf-token': csrfToken
    }, {
      title: 'Neon Brand Identity (Updated)',
      year: '2026',
      showSocialLinks: false,
      socialLinks: [
        { id: 'custom_ig', name: 'Instagram', icon: 'instagram', url: 'https://instagram.com/test', visible: true }
      ]
    });
    assert.strictEqual(resUpdateProj.status, 200);
    assert.strictEqual(resUpdateProj.json.project.title, 'Neon Brand Identity (Updated)');
    assert.strictEqual(resUpdateProj.json.project.showSocialLinks, false);
    assert.strictEqual(resUpdateProj.json.project.socialLinks.length, 1);
    assert.strictEqual(resUpdateProj.json.project.socialLinks[0].icon, 'instagram');

    // Verify public API returns updated social links configuration
    const resPublicProj = await request('GET', `/api/projects/${createdProject.slug}`);
    assert.strictEqual(resPublicProj.status, 200);
    assert.strictEqual(resPublicProj.json.project.showSocialLinks, false);
    assert.strictEqual(resPublicProj.json.project.socialLinks[0].icon, 'instagram');
    console.log('  ✓ Updated project successfully (including showSocialLinks: false and custom socialLinks)');

    // Reorder projects
    const allProjsRes = await request('GET', '/admin/api/projects', {
      Cookie: sessionCookie
    });
    const ids = allProjsRes.json.projects.map(p => p.id).reverse();
    const resReorder = await request('PUT', '/admin/api/projects-reorder', {
      Cookie: sessionCookie,
      'x-csrf-token': csrfToken
    }, { order: ids });
    assert.strictEqual(resReorder.status, 200);
    console.log('  ✓ Reordered projects successfully');

    // Delete project
    const resDelProj = await request('DELETE', `/admin/api/projects/${createdProject.id}`, {
      Cookie: sessionCookie,
      'x-csrf-token': csrfToken
    });
    assert.strictEqual(resDelProj.status, 200);
    console.log('  ✓ Deleted test project successfully');

    // Mark inbox message as read
    const resMarkRead = await request('PUT', `/admin/api/messages/${storedMsg.id}/read`, {
      Cookie: sessionCookie,
      'x-csrf-token': csrfToken
    }, { read: true });
    assert.strictEqual(resMarkRead.status, 200);
    console.log('  ✓ Updated contact inbox message read status');

    /* ------------------------------------------------------------
       5. ATOMIC DB & SECURITY TESTS
    ------------------------------------------------------------ */
    console.log('\n[5/5] Testing Atomic DB & Path Traversal Protection...');

    // Test Path Traversal Protection in Media Delete
    const resTraversal = await request('DELETE', '/admin/api/media/..%2F..%2Fpackage.json', {
      Cookie: sessionCookie,
      'x-csrf-token': csrfToken
    });
    assert(resTraversal.status === 400 || resTraversal.status === 404, 'Path traversal must be safely rejected');
    console.log('  ✓ Directory traversal attempt safely blocked');

    // Verify atomic DB integrity
    const dbFileRaw = fs.readFileSync(config.DB_PATH, 'utf8');
    const parsedDb = JSON.parse(dbFileRaw);
    assert(parsedDb.projects.length >= 9, 'db.json remains valid JSON with intact projects');
    console.log('  ✓ Atomic JSON database verified intact and uncorrupted');

    console.log('\n========================================');
    console.log('ALL TESTS PASSED SUCCESSFULLY! (100% OK)');
    console.log('========================================\n');
  } finally {
    if (server) {
      server.close();
    }
    if (userDbSnapshot) {
      fs.writeFileSync(config.DB_PATH, userDbSnapshot, 'utf8');
      db.initDb();
    } else {
      await generateSeedDb(true);
    }
  }
}

if (require.main === module) {
  runTests()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('\n❌ TEST FAILED:', err);
      process.exit(1);
    });
}

module.exports = { runTests };
