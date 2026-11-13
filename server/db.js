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
      siteName: "OLUSANYA DANIEL",
      navLabels: {
        projects: "PROJECTS",
        about: "ABOUT ME",
        contact: "CONTACT"
      },
      socialLinks: [
        { id: "twitter", name: "Twitter/X", url: "https://twitter.com", icon: "twitter", visible: false },
        { id: "behance", name: "Behance", url: "https://behance.net/", icon: "behance", visible: false },
        { id: "linkedin", name: "LinkedIn", url: "https://linkedin.com/in/", icon: "linkedin", visible: false },
        { id: "dribbble", name: "Dribbble", url: "https://dribbble.com/", icon: "dribbble", visible: false }
      ],
      accentColor: "#7ec8b8",
      fontHeading: "Bitter",
      fontBody: "Source Sans 3",
      footerText: "Powered by Olusanya Daniel. All rights reserved.",
      faviconUrl: "",
      seo: {
        metaTitle: "Olusanya Daniel — Design Portfolio",
        metaDescription: "Creative Designer",
      }
    },
    about: {
      heading: "About me",
      paragraphs: [
        `I'm Daniel, a multidisciplinary creative with a passion for turning ideas into meaningful digital experiences and solutions.

My work sits at the intersection of design, technology and business. I enjoy exploring ideas, understanding problems and creating solutions that are not only visually engaging but also practical and impactful.

Over the years, I've worked with brands and businesses across different industries, contributing to brand identity, graphic design, social media management, print and packaging design, and digital product experiences.

Beyond design, my background in Economics has shaped how I approach problems, think strategically and understand the bigger picture behind businesses.

I'm always curious, eager to learn and excited about opportunities to collaborate, experiment and create work that makes a difference.`,
        "I seek to learn what works and do more of it. Learn what doesn't and change it.",
        "As a design leader, I seek to own creative excellence at every touch-point. I'm a passionate student of real-world design, users, consumers, trends, competitors and culture. Through listening, learning and mining insights, I fight for work that directs my client's brand into amazing places."
      ],
      pullquote: `I'm Daniel, a multidisciplinary creative with a passion for turning ideas into meaningful digital experiences and solutions.

My work sits at the intersection of design, technology and business. I enjoy exploring ideas, understanding problems and creating solutions that are not only visually engaging but also practical and impactful.`,
      photoUrl: "",
      showPhoto: false
    },
    contact: {
      heading: "Contact",
      intro: "Feel free to contact me in the following ways:",
      directMethods: [
        { label: "Phone", value: "+234 810 101 4695", link: "tel:+2348101014695" },
        { label: "Twitter", value: "twitter.com/thomas_moeller", link: "https://twitter.com/thomas_moeller" },
        { label: "Behance", value: "behance.net/ThomasMoeller", link: "https://behance.net/ThomasMoeller" },
        { label: "Dribbble", value: "dribbble.com/thomas_moeller", link: "https://dribbble.com/thomas_moeller" },
        { label: "Linkedin", value: "linkedin.com/in/thomasjmoeller/", link: "https://linkedin.com/in/thomasjmoeller/" }
      ],
      formIntro: "Or use the form below to send me an email!",
      contactEmail: "olusanyadaniel03@gmail.com",
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
