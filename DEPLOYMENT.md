# Deployment Guide - Cloudritz CRM

## Server-Based Deployment Options

### Option 1: Railway (Recommended - Easiest)

1. **Create account**: https://railway.app
2. **New Project** → **Deploy from GitHub**
3. **Select repository**: Cloudritztech/Cloudritz_crm
4. **Add variables**:
   ```
   MONGODB_URI=mongodb+srv://cloudritztech_db_user:tZznSThXsWpolcG4@cluster0.pouxy6j.mongodb.net/cloudritz_crm
   JWT_SECRET=59582354854624850585425984862485
   JWT_EXPIRE=7d
   NODE_ENV=production
   PORT=3000
   ```
5. **Deploy** - Railway auto-detects Node.js and runs `npm start`

**Cost**: Free tier available, then $5/month

---

### Option 2: Render

1. **Create account**: https://render.com
2. **New** → **Web Service**
3. **Connect GitHub** → Select repo
4. **Settings**:
   - Name: `cloudritz-crm`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. **Environment Variables**: Add same as above
6. **Create Web Service**

**Cost**: Free tier available (spins down after inactivity)

---

### Option 3: DigitalOcean App Platform

1. **Create account**: https://cloud.digitalocean.com
2. **Apps** → **Create App**
3. **GitHub** → Select repo
4. **Configure**:
   - Build Command: `npm install && npm run build`
   - Run Command: `npm start`
5. **Environment Variables**: Add same as above
6. **Deploy**

**Cost**: $5/month minimum

---

### Option 4: VPS (Ubuntu Server) - Most Control

**Providers**: DigitalOcean, Linode, Vultr ($5-10/month)

#### Setup Steps:

```bash
# 1. SSH into server
ssh root@your-server-ip

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PM2
npm install -g pm2

# 4. Clone repo
git clone https://github.com/Cloudritztech/Cloudritz_crm.git
cd Cloudritz_crm

# 5. Install dependencies
npm install

# 6. Create .env file
nano .env
# Paste your environment variables

# 7. Build frontend
npm run build

# 8. Seed database
npm run seed

# 9. Start with PM2
pm2 start server/index.js --name cloudritz-crm
pm2 save
pm2 startup

# 10. Install Nginx
sudo apt install nginx

# 11. Configure Nginx
sudo nano /etc/nginx/sites-available/cloudritz
```

**Nginx config**:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/cloudritz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install SSL (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Environment Variables Required

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key_min_32_chars
JWT_EXPIRE=7d
NODE_ENV=production
PORT=3000
```

---

## Post-Deployment

### 1. Seed Database
```bash
npm run seed
```

### 2. Test Login
- URL: https://your-domain.com
- Email: admin@cloudritz.com
- Password: Cloudritz@2024

### 3. Create First Organization
Use super admin to create organizations via API or build admin panel.

---

## Monitoring & Maintenance

### Railway/Render
- Built-in logs and metrics
- Auto-restarts on crash
- Easy rollbacks

### VPS with PM2
```bash
# View logs
pm2 logs cloudritz-crm

# Restart
pm2 restart cloudritz-crm

# Monitor
pm2 monit

# Update code
cd Cloudritz_crm
git pull
npm install
npm run build
pm2 restart cloudritz-crm
```

---

## Recommended: Railway

**Why?**
- ✅ Easiest setup (5 minutes)
- ✅ Auto-deploys on git push
- ✅ Free SSL
- ✅ Built-in monitoring
- ✅ No server management
- ✅ Scales automatically

**Cost**: Free tier → $5/month for production

---

## Domain Setup

1. **Buy domain** (Namecheap, GoDaddy, etc.)
2. **Add DNS records**:
   - Type: A
   - Name: @
   - Value: Your server IP (or CNAME for Railway/Render)
3. **Wait 5-30 minutes** for DNS propagation

---

## Backup Strategy

1. **MongoDB Atlas** - Auto-backups enabled
2. **Code** - GitHub repository
3. **Uploads** - Use Cloudinary (already configured)

---

## Support

Issues? Check:
1. Server logs
2. MongoDB connection
3. Environment variables
4. Port availability (3000)
