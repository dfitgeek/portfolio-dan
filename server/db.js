const fs = require('fs');
const path = require('path');
const config = require('./config');

let dbCache = null;
let writeQueue = Promise.resolve();

// Ensure data and uploads directory exist
function ensureDirs() {
  if (!fs.existsSync(config.DATA_DIR)) {
    fs.mkdirSync(config.DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(config.UPLOADS_DIR)) {
    fs.mkdirSync(config.UPLOADS_DIR, { recursive: true });
  }
}

// Default empty schema in case seed is missing
function getDefaultSchema() {
  return {
    settings: {
      siteName: "THOMAS MOELLER",
      navLabels: {
        projects: "PROJECTS",
        about: "ABOUT ME",
        contact: "CONTACT"
      },
      socialLinks: [
        { id: "twitter", name: "Twitter/X", url: "https://twitter.com/thomas_moeller", icon: "twitter", visible: true },
        { id: "behance", name: "Behance", url: "https://behance.net/ThomasMoeller", icon: "behance", visible: true },
        { id: "linkedin", name: "LinkedIn", url: "https://linkedin.com/in/thomasjmoeller/", icon: "linkedin", visible: true },
        { id: "dribbble", name: "Dribbble", url: "https://dribbble.com/thomas_moeller", icon: "dribbble", visible: true }
      ],
      accentColor: "#7ec8b8",
      fontHeading: "Bitter",
      fontBody: "Source Sans 3",
      footerText: "Powered by Adobe Portfolio",
      faviconUrl: "",
      seo: {
        metaTitle: "Thomas Moeller — Design Portfolio",
        metaDescription: "Senior Product Designer & Creative Director. Crafting digital experiences, systems, and visual design."
      }
    },
    about: {
      heading: "About me",
      paragraphs: [
        "I'm a believer in the fight. Keeping it simple. Being obsessive over craft, making it personal and giving a shit. I'm curious, empathetic, rigorous, and experimental. I appreciate a holistic way of solving design problems in collaborative teams. I like accelerated methodologies. Thinking quick, rapid prototyping, and learning through testing but not discounting a designer's intuition.",
        "I seek to learn what works and do more of it. Learn what doesn't and change it.",
        "As a design leader, I seek to own creative excellence at every touch-point. I'm a passionate student of real-world design, users, consumers, trends, competitors and culture. Through listening, learning and mining insights, I fight for work that directs my client's brand into amazing places."
      ],
      pullquote: "I'm a firm believer that simple is hard. And that design is truly about problem solving and making people's lives better.",
      photoUrl: "",
      showPhoto: false
    },
    contact: {
      heading: "Contact",
      intro: "Feel free to contact me in the following ways:",
      directMethods: [
        { label: "Phone", value: "(347) 668-1576", link: "tel:3476681576" },
        { label: "Twitter", value: "twitter.com/thomas_moeller", link: "https://twitter.com/thomas_moeller" },
        { label: "Behance", value: "behance.net/ThomasMoeller", link: "https://behance.net/ThomasMoeller" },
        { label: "Dribbble", value: "dribbble.com/thomas_moeller", link: "https://dribbble.com/thomas_moeller" },
        { label: "Linkedin", value: "linkedin.com/in/thomasjmoeller/", link: "https://linkedin.com/in/thomasjmoeller/" }
      ],
      formIntro: "Or use the form below to send me an email!",
      contactEmail: "thomas.moeller@example.com",
      successMessage: "Thank you for getting in touch! I'll get back to you shortly.",
      showPhone: true,
      showSocials: true
    },
    projects: [],
    inbox: [],
    users: [
      {
        id: "admin",
        username: config.ADMIN_USER,
        // Will be seeded with hashed password
        passwordHash: "",
        mustChangePassword: true,
        updatedAt: new Date().toISOString()
      }
    ]
  };
}

/**
 * Initializes database synchronously or from seed
 */
function initDb() {
  ensureDirs();

  if (fs.existsSync(config.DB_PATH)) {
    try {
      const data = fs.readFileSync(config.DB_PATH, 'utf8');
      dbCache = JSON.parse(data);
      return dbCache;
    } catch (err) {
      console.error("Failed to parse existing db.json, checking seed...", err);
    }
  }

  // If no db.json, check seed file
  if (fs.existsSync(config.SEED_PATH)) {
    try {
      const seedData = fs.readFileSync(config.SEED_PATH, 'utf8');
      dbCache = JSON.parse(seedData);
      fs.writeFileSync(config.DB_PATH, seedData, 'utf8');
      console.log("Initialized db.json from db.seed.json");
      return dbCache;
    } catch (err) {
      console.error("Failed to copy seed file, creating default schema...", err);
    }
  }

  // Fallback to default schema
  dbCache = getDefaultSchema();
  fs.writeFileSync(config.DB_PATH, JSON.stringify(dbCache, null, 2), 'utf8');
  console.log("Initialized new db.json with default schema");
  return dbCache;
}

let lastMtime = 0;

/**
 * Get in-memory database clone (with automatic reload if modified on disk)
 */
function getDb() {
  if (fs.existsSync(config.DB_PATH)) {
    try {
      const stats = fs.statSync(config.DB_PATH);
      if (!dbCache || stats.mtimeMs > lastMtime) {
        dbCache = JSON.parse(fs.readFileSync(config.DB_PATH, 'utf8'));
        lastMtime = stats.mtimeMs;
      }
    } catch (e) {
      // ignore read error and use existing cache if available
    }
  }
  if (!dbCache) {
    initDb();
  }
  return JSON.parse(JSON.stringify(dbCache));
}

/**
 * Atomically writes data to disk using a temp file and rename
 */
async function atomicWrite(data) {
  const tempPath = path.join(
    config.DATA_DIR,
    `db.json.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 8)}`
  );
  const jsonString = JSON.stringify(data, null, 2);

  await fs.promises.writeFile(tempPath, jsonString, 'utf8');
  await fs.promises.rename(tempPath, config.DB_PATH);
  try {
    const stats = fs.statSync(config.DB_PATH);
    lastMtime = stats.mtimeMs;
  } catch (e) {}
}

/**
 * Safe concurrent updater
 */
function updateDb(updaterFn) {
  writeQueue = writeQueue.then(async () => {
    if (!dbCache) {
      initDb();
    }
    const current = JSON.parse(JSON.stringify(dbCache));
    const updated = await Promise.resolve(updaterFn(current));
    
    // Save to cache and atomically write to disk
    dbCache = updated || current;
    await atomicWrite(dbCache);
    return JSON.parse(JSON.stringify(dbCache));
  });

  return writeQueue;
}

module.exports = {
  initDb,
  getDb,
  updateDb,
  getDefaultSchema
};
