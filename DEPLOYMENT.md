# trustbridge — Deployment & Production Guide

This guide covers live production deployment for **TrustBridge**:
1. **Backend** → Railway or AWS EC2
2. **Frontend** → Vercel
3. **Database** → MongoDB Atlas
4. **Environment Variables & Security**

---

## 1. Backend Deployment: Railway (Recommended for Hackathons)

Railway allows 1-click deployment with automatic SSL, continuous GitHub deployment, and zero-config port detection.

### Steps:
1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: complete TrustBridge with Admin, Polish, and Production Deploy"
   git remote add origin https://github.com/your-username/trustbridge.git
   git push -u origin main
   ```
2. Go to [railway.app](https://railway.app) and create a **New Project**.
3. Select **Deploy from GitHub repo** and pick the repository.
4. Set the **Root Directory** to `/backend`.
5. Under **Variables**, add the required environment variables:
   - `PORT`: `5001`
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `mongodb+srv://...`
   - `JWT_SECRET`: `<your_secret_key>`
   - `GEMINI_API_KEY`: `<your_gemini_key>`
   - `CLIENT_URL`: `https://your-frontend.vercel.app`
   - `EMAIL_USER`: `your_email@gmail.com`
   - `EMAIL_PASS`: `<gmail_app_password>`
   - `ADMIN_EMAIL`: `admin@trustbridge.com`
   - `ADMIN_PASSWORD`: `<your_admin_password>`
6. Deploy! Railway will automatically detect Node.js, run `npm ci`, and start with `node src/index.js`.
7. Run the admin seed script (once) in Railway via the Service Terminal:
   ```bash
   npm run seed:admin
   ```
8. Copy your generated Railway URL (e.g. `https://trustbridge-backend.up.railway.app`).

---

## 2. Backend Deployment: AWS EC2 (Alternative)

For enterprise or AWS-native deployment:

### Steps:
1. Launch an **Ubuntu 22.04 LTS** EC2 instance (`t3.small` recommended).
2. Configure **Security Group** inbound rules:
   - Port 22 (SSH)
   - Port 80 (HTTP)
   - Port 443 (HTTPS)
   - Port 5001 (Node API, optional if using Nginx reverse proxy)
3. SSH into instance and install Node.js 20 & PM2:
   ```bash
   sudo apt update && sudo apt upgrade -y
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs nginx git
   sudo npm install -g pm2
   ```
4. Clone and install backend:
   ```bash
   git clone https://github.com/your-username/trustbridge.git
   cd trustbridge/backend
   npm install --production
   cp .env.example .env
   nano .env # Paste your production keys
   npm run seed:admin # Creates admin account
   ```
5. Start backend using PM2 cluster mode:
   ```bash
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```
6. Setup Nginx reverse proxy (`/etc/nginx/sites-available/trustbridge`):
   ```nginx
   server {
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:5001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
7. Enable site & install Certbot for free SSL:
   ```bash
   sudo ln -s /etc/nginx/sites-available/trustbridge /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d api.yourdomain.com
   ```

---

## 3. Frontend Deployment: Vercel

Vercel is the native platform for Next.js 16 with instant edge routing and global CDN.

### Steps:
1. Log in to [vercel.com](https://vercel.com) and click **Add New... → Project**.
2. Import your GitHub repository.
3. Configure the Project:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
4. Set Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend-domain.com` (from Railway or EC2)
5. Click **Deploy**. Vercel will build and serve your app globally.
6. Once deployed, note down your production domain (e.g. `https://trustbridge.vercel.app`) and update `CLIENT_URL` in your backend environment variables!

---

## 4. Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Description | Example |
|---|---|---|
| `PORT` | Server listening port | `5001` |
| `NODE_ENV` | Environment mode | `production` |
| `MONGODB_URI` | MongoDB Atlas Connection String | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for JWT auth tokens | `secure_token_secret_123` |
| `GEMINI_API_KEY` | Google Gemini AI Key for audits | `AIzaSy...` |
| `CLIENT_URL` | Frontend origin for CORS | `https://trustbridge.vercel.app` |
| `AWS_ACCESS_KEY_ID` | AWS Rekognition / Comprehend key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret key | `wJalrXUtn...` |
| `AWS_REGION` | AWS Region | `us-east-1` |
| `EMAIL_USER` | Gmail address for Nodemailer | `your_email@gmail.com` |
| `EMAIL_PASS` | Gmail 16-character App Password | `abcd efgh ijkl mnop` |
| `ADMIN_EMAIL` | Default administrator account | `admin@trustbridge.com` |
| `ADMIN_PASSWORD` | Default administrator password | `Admin@123456` |

### Frontend (`frontend/.env.local` / Vercel Environment)
| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend URL for API calls | `https://your-backend.up.railway.app` |

---

## 5. Post-Deployment Verification Checklist

1. **Health Check**:
   - Hit `GET https://your-backend/health` → returns `status: "ok"`, `db: "connected"`.
2. **Admin Authentication**:
   - Navigate to `/admin/login`.
   - Log in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
   - Verify that `/admin/dashboard` loads live platform statistics.
3. **Audit Pipeline**:
   - Log in as recruiter and submit a job at `/post-job`.
   - Verify Gemini AI analysis, TrustScore calculation, and approval/block status.
   - Verify email notification triggered via Nodemailer.
4. **Listings & Search**:
   - Navigate to `/`.
   - Test keyword search, skill dropdown, job type filter, and pagination.
5. **Mobile Responsiveness**:
   - Check mobile layout across iPhone/Android viewports.
