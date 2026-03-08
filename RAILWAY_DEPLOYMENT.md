# Income Tracker - Railway Deployment Guide

## Prerequisites
- Supabase account with project setup (done)
- Railway account at https://railway.app
- GitHub repository with this code

## Step 1: Prepare Your Code
```bash
# Make sure everything is committed
git add .
git commit -m "Ready for Railway deployment"
git push
```

## Step 2: Deploy on Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Choose this repository
5. Railway will auto-detect it's a Node.js project

## Step 3: Configure Environment Variables

In Railway Dashboard, go to **Variables** tab and add:

```
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://cwjjuphpyaahpcjwaewb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3amp1cGhweWFhaHBjandhZXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NzgyMDMsImV4cCI6MjA4ODU1NDIwM30.D6Ihd2wnUe73yjcUKSRqCOCgbm-LQ4YtjzcaqWVG9s0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3amp1cGhweWFhaHBjandhZXdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk3ODIwMywiZXhwIjoyMDg4NTU0MjAzfQ.JQE_KjPze0fo_0JXZzlahXxAL4ln5FRiH7DQmSZm6uI
SESSION_SECRET=your-random-secret-min-32-chars
GEMINI_API_KEY=AIzaSyBjJoGOpsPMO0qTZegU7U0tb6A6ogKIJ7s
```

## Step 4: Deploy

1. Click "Deploy" button
2. Railway will:
   - Install dependencies
   - Build the project
   - Start the server
   - Assign a public URL

## Step 5: Verification

After deployment:
1. Check the logs to ensure no errors
2. Visit your Railway URL to access the app
3. Test login with admin/admin123
4. Verify daily backup is running (check logs)

## Step 6: Custom Domain (Optional)

In Railway Settings:
1. Go to "Domains"
2. Add your custom domain
3. Point DNS to Railway

## Security Checklist

✅ HTTPS enabled (Railway auto-provides this)
✅ Environment variables not in code
✅ Security headers added
✅ CORS configured
✅ Rate limiting enabled
✅ Session secure cookies
✅ Daily backups scheduled
✅ Admin credentials in environment (change password in production)

## Monitoring

- **Health Check**: Visit `/api/health` to verify service is running
- **Logs**: Monitor real-time logs in Railway Dashboard
- **Backups**: Check `/backups` directory for daily backup files

## Rollback

If deployment fails:
1. Go to "Deployments" tab
2. Select previous working deployment
3. Click "Redeploy"

## Support

For Railway issues: https://docs.railway.app
For app issues: Check server logs in Railway Dashboard
