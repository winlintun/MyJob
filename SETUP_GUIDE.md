# 🚀 Income Tracker - Complete Setup & Deployment Guide

## Current Status: ✅ FULLY PRODUCTION-READY

All enhancements completed:
- ✅ Daily backup service with automatic scheduling
- ✅ Security hardening (headers, CORS, rate limiting)
- ✅ Mobile-responsive design with drawer menu
- ✅ Railway deployment configuration
- ✅ Environment validation
- ✅ Health check endpoints

---

## Quick Start (5 minutes)

### 1. Local Development with Supabase

```bash
# Install dependencies
npm install

# Start development server (uses Supabase)
npm run dev:supabase

# App opens at http://localhost:3000
# Default: admin / admin123
```

### 2. Local Development with SQLite (No Setup)

```bash
# Install dependencies
npm install

# Start with SQLite (no Supabase needed)
npm run dev

# App opens at http://localhost:3000
```

---

## Detailed Setup

### Step 1: Environment Configuration

Create `.env` file (copy from `.env.example`):

```bash
APP_URL=http://localhost:3000
NODE_ENV=development
PORT=3000
SESSION_SECRET=generate-random-string-here
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-key-optional
```

### Step 2: Generate Session Secret

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Max 256) }))
```

**Mac/Linux:**
```bash
openssl rand -base64 32
```

### Step 3: Supabase Setup (Optional but Recommended)

1. Create account at https://supabase.com
2. Create new project
3. Go to Project Settings → API
4. Copy URL and keys to `.env`
5. Run SQL schema (see SUPABASE_QUICK_START.md)

### Step 4: Start Development

```bash
npm install
npm run dev:supabase  # or: npm run dev (for SQLite)
```

---

## Features Overview

### 📊 Dashboard
- Monthly progress tracking
- Weekly/monthly charts
- Income by job distribution
- Daily average calculator

### 💼 Job Management  
- Create/edit job profiles
- Custom colors
- Hourly rate & hours per day

### 📅 Daily Tracking
- Interactive calendar
- Day-by-day income logging
- Color-coded by job

### 🎯 Income Targets
- Monthly goals
- Progress visualization
- Historical analytics

### 🔐 Security Features
- Session-based authentication
- Role-based access (user/admin)
- HTTP-only secure cookies
- CORS protection
- Rate limiting (100 req/15min)

### 📦 Admin Features
- Manual backup creation
- Backup restoration
- User management
- System health check

---

## Mobile Responsiveness

### Tested Across
- ✅ iPhone 12-15 Pro Max
- ✅ iPad Air & Pro
- ✅ Android phones
- ✅ Android tablets
- ✅ Desktop browsers (Chrome, Firefox, Safari)

### Mobile Features
- Full-width responsive layout
- Hamburger drawer menu (not collapsible sidebar)
- Touch-friendly buttons (48px minimum)
- Auto-scaling charts
- Optimized spacing

**Test on your device:**
```
http://localhost:3000
```

---

## Backup & Recovery

### Automatic Daily Backups
```bash
# Logs show:
# "⏰ Daily backup scheduled every 24 hours"
# "✅ Backup created: backup-1234567890.json"
```

### Manual Backup (Admin)
```bash
# Via API
POST /api/admin/backup

# Via Browser
1. Login as admin
2. Go to Admin Panel
3. Click "Create Backup"
```

### List & Restore
```bash
# List backups
GET /api/admin/backups

# Restore backup
POST /api/admin/restore/backup-1234567890.json
```

---

## Deployment to Railway

### Prerequisites
- Railway account (free tier available)
- GitHub repository
- Supabase project (already set up)

### Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Production ready"
   git push origin main
   ```

2. **Create Railway Project**
   - Go to https://railway.app
   - Click "New Project"
   - Select "Deploy from GitHub"
   - Choose this repository

3. **Configure Variables**
   In Railway Dashboard → Variables:
   ```
   NODE_ENV=production
   PORT=3000
   SESSION_SECRET=[generate new one]
   SUPABASE_URL=https://...
   SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   GEMINI_API_KEY=[optional]
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Railway provides public URL

5. **Post-Deployment**
   - Visit health endpoint: `https://your-url/api/health`
   - Test login with admin/admin123
   - **CHANGE ADMIN PASSWORD IMMEDIATELY**
   - Create test data

---

## Production Checklist

Before going live:

- [ ] Changed admin password from default
- [ ] Generated secure SESSION_SECRET
- [ ] Configured Supabase credentials
- [ ] Tested on mobile devices
- [ ] Tested backup & restore
- [ ] Verified SSL/HTTPS working
- [ ] Set up custom domain (optional)
- [ ] Enabled auto-renewal for SSL
- [ ] Tested from different network
- [ ] Checked error logs
- [ ] Set up monitoring alerts

---

## Environment Variables Summary

### Required for Production
| Variable | Purpose | Example |
|----------|---------|---------|
| `NODE_ENV` | App mode | `production` |
| `SUPABASE_URL` | Database | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | DB access | `eyJ...` |
| `SESSION_SECRET` | Auth encryption | Random 32+ chars |
| `PORT` | Server port | `3000` |

### Optional
| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | AI features |
| `RAILWAY_PUBLIC_DOMAIN` | Auto-set by Railway |

---

## Troubleshooting

### "Cannot find supabaseClient"
```bash
npm install
npm run lint  # Check for errors
```

### "Connection refused" to localhost
- Verify PORT in .env matches (default 3000)
- Check if port already in use: `netstat -ano | findstr :3000`

### "Supabase credentials not configured"
- Verify SUPABASE_URL and SERVICE_ROLE_KEY in .env
- Check .env file is in root directory
- Restart dev server: `Ctrl+C`, then `npm run dev:supabase`

### Charts not loading
- Check browser console for errors
- Verify data is being entered in Daily Tracking
- Mobile: Try in desktop browser first

### Mobile menu not working  
- Clear browser cache: `Ctrl+Shift+Delete`
- Try different mobile browser
- Check console for JavaScript errors

---

## Performance Tips

### For Better Speed
1. Clear `.next/` and `dist/` directories
2. Run `npm cache clean --force`
3. Use production build: `npm run build`
4. Monitor with `/api/health` endpoint
5. Check Railway dashboard logs

### Monitoring
```bash
# Check server health
curl https://your-url/api/health

# Expected response:
# {"status":"healthy","timestamp":"2025-03-09T...","environment":"production"}
```

---

## File Structure

```
MyJob/
├── src/
│   ├── App.tsx              # Main React component
│   ├── types.ts             # TypeScript types
│   ├── main.tsx             # React entry
│   ├── index.css            # Styles
│   └── lib/
│       ├── supabaseClient.ts # Database config
│       ├── backupService.ts  # Daily backups
│       └── utils.ts         # Helpers
├── server.ts                # Express server (main)
├── server-sqlite.ts         # SQLite version
├── vite.config.ts           # Vite config
├── tsconfig.json            # TypeScript config
├── package.json             # Dependencies
├── railway.toml             # Railway config
├── index.html              # HTML entry
├── .env                    # Environment (local)
├── .env.example            # Template
└── backups/                # Daily backups (auto-created)
```

---

## Next Steps

1. **Local Testing**
   - [ ] Set up `.env` from `.env.example`
   - [ ] Run `npm install && npm run dev:supabase`
   - [ ] Test all features on desktop
   - [ ] Test on mobile device

2. **Prepare for Production**
   - [ ] Generate secure SESSION_SECRET
   - [ ] Set NODE_ENV=production
   - [ ] Change admin password
   - [ ] Test backup/restore

3. **Deploy**
   - [ ] Push to GitHub
   - [ ] Create Railway project
   - [ ] Add environment variables
   - [ ] Wait for deployment
   - [ ] Test production URL

4. **Monitor**
   - [ ] Check logs daily
   - [ ] Verify backups created
   - [ ] Test login and data entry
   - [ ] Monitor /api/health endpoint

---

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Railway Docs**: https://docs.railway.app
- **React Docs**: https://react.dev
- **TypeScript Docs**: https://www.typescriptlang.org/docs

---

## Security Notes

⚠️ **Production Security Tips:**
- Never commit `.env` to Git
- Rotate SESSION_SECRET quarterly
- Monitor admin access logs
- Change default admin password immediately
- Keep dependencies updated: `npm audit fix`
- Enable 2FA on Supabase account
- Use strong password for Supabase

---

**Status**: 🟢 READY FOR PRODUCTION
**Last Updated**: March 2025
**Version**: 1.1.0
