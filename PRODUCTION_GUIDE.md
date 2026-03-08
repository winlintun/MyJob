# Production Deployment & Security Checklist

## Security Improvements Added ✅

### 1. **Security Headers**
- ✅ X-Content-Type-Options: Prevents MIME type sniffing
- ✅ X-Frame-Options: Prevents clickjacking attacks
- ✅ X-XSS-Protection: Enables browser XSS protection
- ✅ Strict-Transport-Security: Forces HTTPS
- ✅ Content-Security-Policy: Restricts resource loading

### 2. **Rate Limiting**
- ✅ 100 requests per 15 minutes per IP
- ✅ Prevents brute force attacks
- ✅ Protects against DoS attacks

### 3. **CORS Configuration**
- ✅ Whitelist specific origins (localhost, Railway domain, custom domain)
- ✅ Prevents cross-origin attacks
- ✅ Configurable via environment variables

### 4. **Session Security**
- ✅ HttpOnly cookies (prevents XSS token theft)
- ✅ Secure flag (HTTPS only)
- ✅ SameSite strict (prevents CSRF)
- ✅ 24-hour expiration
- ✅ Random session secret generation

### 5. **Data Backup**
- ✅ Daily automatic backups scheduled
- ✅ Last 7 backups retained
- ✅ Admin-only restore functionality
- ✅ Full database export (JSON format)

### 6. **Mobile Security**
- ✅ Viewport configured for mobile
- ✅ Apple Web App capable
- ✅ Touch-friendly interface
- ✅ Responsive security for small screens

---

## Pre-Deployment Checklist

### Environment Variables

Required settings in `.env`:

```bash
# Core
NODE_ENV=production
PORT=3000

# Supabase Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Security
SESSION_SECRET=generate-random-32-char-string

# Optional: AI Features
GEMINI_API_KEY=your-api-key

# Railway Settings (auto-populated)
RAILWAY_PUBLIC_DOMAIN=your-app.up.railway.app
```

### Critical Production Steps

1. **Change Admin Password**
   ```bash
   # After deployment, immediately change default admin credentials
   # Default: admin / admin123
   # Update in Supabase users table
   ```

2. **Generate Strong SESSION_SECRET**
   ```powershell
   # Windows PowerShell
   [Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Max 256) }))
   ```
   ```bash
   # Linux/Mac
   openssl rand -base64 32
   ```

3. **Configure Custom Domain** (if using Railway)
   - Add DNS records pointing to Railway
   - Enable auto-renewal for SSL certificate

4. **Enable Production Mode**
   ```bash
   NODE_ENV=production
   ```

5. **Verify Backup Service**
   - Check `/backups` directory exists
   - Test manual backup via `/api/admin/backup` endpoint
   - Monitor logs for backup errors

---

## Railway Deployment Steps

### Step 1: Repository Setup
```bash
git init
git add .
git commit -m "Production ready with security and mobile fixes"
git push origin main
```

### Step 2: Railway Project Creation
1. Go to https://railway.app
2. Click "New Project"
3. Connect GitHub account
4. Select this repository

### Step 3: Environment Variables
In Railway Dashboard:
1. Go to Variables tab
2. Add all required `.env` variables
3. Click "Deploy"

### Step 4: Post-Deployment
1. Check logs: `npm run start:supabase` executed successfully
2. Test health endpoint: `https://your-url/api/health`
3. Test login: admin / admin123
4. Change admin password
5. Create test data

### Step 5: Monitoring
- Set up log monitoring in Railway
- Configure error alerts
- Monitor backup execution daily

---

## Mobile Deployment Verification

### Responsive Design Checklist
- ✅ Mobile header with hamburger menu
- ✅ Full-width content on small screens
- ✅ Touch-friendly buttons (48px minimum)
- ✅ Optimized charts (scrollable on mobile)
- ✅ Drawer menu (not collapsible sidebar)
- ✅ Proper font sizing for mobile
- ✅ Single-column layouts on mobile

### Test on Real Devices
1. **iPhone/iPad**: Safari browser
2. **Android**: Chrome browser
3. **Tablet**: Both orientations
4. **Desktop**: Chrome, Firefox, Safari

### Performance Targets
- First Contentful Paint: < 2s
- Interactive: < 4s
- Lighthouse Score: > 80

---

## Security Testing

### 1. Test Rate Limiting
```bash
# Make 101 requests - 101st should be rate limited
for i in {1..101}; do
  curl -X GET http://localhost:3000/api/health
done
```

### 2. Test CORS
```bash
# Should fail from different origin
curl -H "Origin: https://evil.com" \
  -H "Access-Control-Request-Method: POST" \
  http://localhost:3000/api/login
```

### 3. Test Session Hijacking Prevention
- Verify secure/httpOnly flags on cookies
- Confirm SameSite=Strict is set
- Test with browser dev tools

### 4. Test XSS Protection
- Try injecting `<script>alert('xss')</script>` in input
- Verify it's rendered as text, not executed

---

## Backup & Disaster Recovery

### Manual Backup
```bash
# Via API (admin user required)
curl -X POST http://localhost:3000/api/admin/backup \
  -H "Authorization: Bearer session-cookie"
```

### Restore Backup
```bash
# List available backups
curl http://localhost:3000/api/admin/backups

# Restore specific backup
curl -X POST http://localhost:3000/api/admin/restore/backup-1234567890.json
```

### Backup Schedule
- Daily automatic backup at server start
- 7 backups retention
- Stored in `/backups` directory

---

## Maintenance Tasks

### Weekly
- [ ] Check error logs
- [ ] Verify backup creation
- [ ] Monitor database size

### Monthly
- [ ] Review security logs
- [ ] Update dependencies
- [ ] Test restore procedure

### Quarterly
- [ ] Security audit
- [ ] Performance optimization
- [ ] Database cleanup

---

## Rollback Procedure

If deployment has critical issues:

1. **In Railway Dashboard**:
   - Go to Deployments tab
   - Select previous working deployment
   - Click "Redeploy"

2. **Manual Rollback**:
   - Restore from backup
   - Redeploy previous git commit

3. **Data Recovery**:
   - Use `/api/admin/restore` endpoint
   - Load specific backup file

---

## Support & Troubleshooting

### Common Issues

**"Supabase not configured" error**
- Verify all SUPABASE_* variables are set
- Check connection to Supabase project
- Ensure credentials are correct

**Rate limiting too aggressive**
- Increase limit in server.ts (line ~30)
- Check if behind reverse proxy (adjust IP detection)

**Backups not creating**
- Verify `/backups` directory exists and is writable
- Check disk space
- Review server logs for errors

**Mobile app freezing**
- Clear browser cache
- Check network connection
- Test on different browser/device
- Check browser console for errors

---

## Performance Optimization

### Already Implemented
- ✅ Compression headers
- ✅ efficient JSON endpoints
- ✅ Database connection pooling
- ✅ Client-side caching

### Recommended
- [ ] Redis caching layer
- [ ] CDN for static assets
- [ ] Database query optimization
- [ ] Background job processing

---

## Next Steps

1. Deploy to Railway
2. Change admin password
3. Run security tests
4. Set up monitoring
5. Test on mobile devices
6. Configure custom domain
7. Set up SSL certificate auto-renewal
8. Monitor for 24 hours

**Deployment Status**: 🟢 READY FOR PRODUCTION
