# Deployment Guide: Minimalist Design Portfolio

This portfolio application runs as a lightweight, zero-native-dependency Node.js 18+ application with atomic JSON file persistence.

> [!NOTE]
> **Static hosting services (like GitHub Pages, Cloudflare Pages, or Netlify static hosting) cannot host this application alone** because the secure admin dashboard, atomic JSON database, session management, and media upload features require a running Node.js server.

---

## 1. Deploying to Render (Recommended Free/Low-Cost Option)

1. Push your repository to GitHub.
2. Sign in to [Render](https://render.com) and click **New + > Web Service**.
3. Connect your GitHub repository.
4. Configure the service:
   - **Environment**: `Node`
   - **Build Command**: `npm install && node scripts/seed.js`
   - **Start Command**: `npm start`
   - **Plan**: Free or Starter
5. Add Environment Variables in the Render dashboard:
   - `PORT`: `3000` (or leave default, Render sets `PORT` automatically)
   - `SESSION_SECRET`: A long random string (e.g. 32+ characters)
   - `ADMIN_USER`: `admin`
   - `ADMIN_PASSWORD`: Your desired initial password
6. **Persistent Disk (Optional but Recommended for Production)**:
   - In Render, attach a Persistent Disk mounted at `/data` and `/uploads` so that uploads and edits persist across redeployments.

---

## 2. Deploying to Railway

1. Sign in to [Railway](https://railway.app).
2. Click **New Project > Deploy from GitHub repo**.
3. Select this repository.
4. In **Variables**, add:
   - `SESSION_SECRET`: `your-random-32-character-secret`
   - `ADMIN_USER`: `admin`
   - `ADMIN_PASSWORD`: `ChangeMe123!`
5. Add a **Volume** mounted to `/app/data` and `/app/uploads` to persist uploads and database changes across restarts.
6. Railway will automatically detect Node.js, install dependencies, and launch `npm start`.

---

## 3. Deploying to Fly.io

1. Install the `flyctl` CLI and run `fly auth login`.
2. In the project directory, run:
   ```bash
   fly launch
   ```
3. Set your secrets:
   ```bash
   fly secrets set SESSION_SECRET="your-super-secret-key" ADMIN_PASSWORD="your-strong-password"
   ```
4. Create persistent storage volumes:
   ```bash
   fly volumes create portfolio_data --size 1
   ```
5. Deploy:
   ```bash
   fly deploy
   ```

---

## 4. Deploying to a VPS (Ubuntu / Debian with PM2 & Nginx)

1. SSH into your VPS:
   ```bash
   ssh user@your-server-ip
   ```
2. Install Node.js 18+ and PM2:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```
3. Clone your repository:
   ```bash
   git clone https://github.com/your-username/your-portfolio.git /var/www/portfolio
   cd /var/www/portfolio
   npm install --production
   node scripts/seed.js
   ```
4. Create production `.env` file:
   ```bash
   cp .env.example .env
   nano .env
   ```
5. Start the process with PM2:
   ```bash
   pm2 start server.js --name "portfolio"
   pm2 save
   pm2 startup
   ```
6. Setup Nginx reverse proxy with SSL via Certbot:
   ```nginx
   server {
       server_name yourdomain.com www.yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
