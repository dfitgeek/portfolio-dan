# Minimalist Personal Design Portfolio & Admin CMS

A complete, ultra-minimal personal design-portfolio website inspired by the iconic Adobe Portfolio "Thomas Moeller" aesthetic, accompanied by a powerful, secure admin dashboard and atomic JSON database.

Built with clean vanilla HTML, CSS, and JavaScript with smooth client-side History API transitions and a robust Node.js / Express backend.

---

## Features

### Public Portfolio (Replicating Reference Design)
- **Ultra-minimal Aesthetic**: Pure white background, airy typography with Google Fonts (*Bitter* slab serif and *Source Sans 3*), and generous whitespace.
- **Edge-to-Edge 3×3 Grid**: Full-bleed responsive project grid (3 columns desktop, 2 columns tablet, 1 column mobile) with zero gaps.
- **Mint-Teal Hover Overlay**: Soft `#7ec8b8` (85% opacity) overlay on hover with left-aligned white slab serif project titles.
- **Client-Side SPA Routing**: Instant, smooth page transitions without page reloads using the HTML5 History API.
- **Multi-Type Content Block Builder**: Detail pages feature standard images, full-width breakout images, two-image comparison rows, rich text paragraphs, responsive video embeds (YouTube, Vimeo, MP4), and adjustable spacers.
- **About Me Page**: Off-center 25% grid layout with storytelling copy, styled pull-quote, and optional portrait photo.
- **Interactive Contact Page**: Contact list, honeypot anti-spam protection, rate limiting, and instant feedback.
- **Micro-Interactions**: Floating circular "↑ Back to Top" button, lazy-loaded images, and mobile hamburger navigation drawer.

### Secure Admin Dashboard (`/admin`)
- **Single Account Authentication**: Secure session cookies (`httpOnly`, `sameSite: 'lax'`) with bcrypt password hashing.
- **Forced First-Login Password Change**: Enforces an immediate password update upon first login with default credentials.
- **CSRF Protection & Rate Limiting**: Anti-CSRF token verification on all write requests; brute-force protection on login.
- **Visual Projects Manager**: Drag-and-drop homepage grid reordering, duplicate projects, draft/published toggle, and direct site preview links.
- **Drag-and-Drop Content Builder**: Live multi-image upload dropzone, move up/down blocks, edit alt text and captions, and unsaved changes warnings.
- **About & Contact Page Editors**: Edit paragraphs, pull-quotes, direct contact numbers, social links, and form feedback.
- **Contact Inbox**: Review submitted inquiries, mark read/unread, delete, and reply with one click via `mailto:`.
- **Site Settings & Customization**: Customize site name, nav labels, social icons (Twitter/X, Behance, LinkedIn, Dribbble, custom), accent colors, footer text, and SEO meta tags.
- **Media Library**: Visual grid of all uploaded assets with one-click clipboard URL copying.
- **Complete Backups**: One-click export downloading your entire database (`db.json`) and uploaded media as a single `.zip` file, with full import restoration.

---

## Tech Stack & Architecture

- **Backend**: Node.js 18+ with Express.
- **Database**: Atomic single-file JSON storage (`data/db.json`) with safe temporary-file write-rename and in-memory queue.
- **Zero Native Dependencies**: 100% pure JavaScript dependencies (`bcryptjs`, `multer`, `express-session`, `helmet`, `archiver`, `adm-zip`, `dotenv`). Runs on macOS, Linux, and Windows without build tools.
- **Frontend**: Vanilla HTML5, CSS3, and JavaScript (ES6+). Zero build steps or bundlers required.

---

## Quick Start (Local Setup)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/your-portfolio.git
cd your-portfolio
npm install
```

### 2. Environment Configuration

Copy the example configuration file:

```bash
cp .env.example .env
```

Review `.env` settings:
```env
PORT=3000
SESSION_SECRET=your-random-32-character-secret
ADMIN_USER=admin
ADMIN_PASSWORD=ChangeMe123!
```

### 3. Generate Seed Content & Assets

```bash
npm run seed
```

This generates 9 placeholder projects with custom high-resolution SVG visual assets and initializes the database.

### 4. Start the Application

```bash
npm start
```

Visit:
- **Public Site**: [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## How to Log In & First-Time Setup

1. Open [http://localhost:3000/admin](http://localhost:3000/admin).
2. Enter the default credentials:
   - **Username**: `admin`
   - **Password**: `ChangeMe123!`
3. On first login, the application will prompt you to set a secure new password (minimum 8 characters).
4. Once updated, you will be redirected to the full admin dashboard.

---

## How to Add and Edit Projects

1. Log in to the Admin Dashboard.
2. Under **Projects**, click **+ Add New Project**.
3. Fill in the **Title**, **Year**, and **Short Description**.
4. Upload a thumbnail image or select one from the Media Library.
5. In the **Content Builder** section:
   - Click **+ Add Block** to append an Image, Wide Image, Two-Image Row, Text Paragraph, or Video Embed.
   - Alternatively, drag multiple image files directly onto the dropzone to quickly append blocks.
   - Use the **↑** and **↓** buttons on each block to reorder them.
6. Click **Save Project** (or **Save & View** to preview the published page).
7. On the projects table, drag any row to rearrange its position on the homepage 3×3 grid.

---

## Backups & Data Portability

### Exporting a Backup
1. In the admin panel, navigate to **Account & Backups**.
2. Click **Export Complete Backup (.zip)**.
3. Your browser will download a zip archive containing:
   - `db.json`: All site settings, project copy, blocks, and inbox messages.
   - `uploads/`: All uploaded images and visual assets.

### Restoring a Backup
1. Under **Account & Backups**, locate **Import / Restore Backup**.
2. Choose your backup `.zip` file.
3. Click **Restore from Backup**. The database and image files will be unpacked and verified automatically.

---

## Automated Testing

Run the automated test suite verifying all public API endpoints, spam honeypot filters, session authentication, CSRF tokens, project CRUD, and atomic database write integrity:

```bash
npm test
```

---

## Deployment Notes

> [!IMPORTANT]
> **Static hosting (such as GitHub Pages) cannot run the admin dashboard or database** because it requires a Node.js server.

You can deploy this application easily to any Node.js hosting platform:

- **Render**: Connect your repo, set Build Command to `npm install && node scripts/seed.js`, and Start Command to `npm start`. Add environment variables for `SESSION_SECRET` and `ADMIN_PASSWORD`.
- **Railway**: Click *New Project > Deploy from GitHub*. Add a persistent volume for `/app/data` and `/app/uploads`.
- **Fly.io**: Run `fly launch` and configure secrets with `fly secrets set`.
- **VPS (DigitalOcean / Linode / EC2)**: Install Node.js 20+, run with `pm2 start server.js`, and use Nginx with Certbot SSL.

Detailed deployment configurations and Nginx setup are available in [docs/DEPLOYMENT.md](file:///Users/dukemac/Downloads/Danp/docs/DEPLOYMENT.md).

---

## License

MIT License. Free to use for personal and commercial portfolio projects.
