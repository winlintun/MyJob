# 🚀 Deployment Guide

This guide covers deploying the Income Tracker application to production.

## Choose Your Deployment Platform

### Option 1: Vercel (Recommended for Full-Stack)
- ✅ Free tier available
- ✅ Built-in Node.js support
- ✅ Environment variables management
- ✅ Auto deployments from Git
- ✅ Serverless functions

### Option 2: Heroku
- ✅ Simple Git-based deployment
- ✅ Free tier (limited)
- ✅ Easy scaling

### Option 3: Railway
- ✅ Modern deployment platform
- ✅ Pay-as-you-go pricing
- ✅ Database hosting included

### Option 4: Docker + Self-Hosted
- ✅ Full control
- ✅ Cost-effective for scale
- ✅ Complex setup

---

## Deployment Steps (Vercel + Supabase)

### 1. Prepare Code for Production

#### Update `.env.production`:
```env
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
```

#### Update `server.ts` for production:
```typescript
// Change session config for production
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,        // HTTPS only
    httpOnly: true,      // Prevent XSS
    sameSite: 'strict',  // CSRF protection
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}))
```

#### Build & Test Locally:
```bash
npm run build
npm start
```

### 2. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/income-tracker.git
git push -u origin main
```

### 3. Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
npm i -g vercel
vercel login
vercel
```

#### Option B: Using Vercel Dashboard
1. Visit [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Select your `income-tracker` repository
5. Configure:
   - **Framework**: Other (Node.js)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. Add Environment Variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SESSION_SECRET` (generate a strong random string)
7. Click "Deploy"

### 4. Configure Custom Domain (Optional)

1. In Vercel Dashboard → Settings → Domains
2. Add your domain
3. Update DNS records:
   ```
   CNAME: your-app.vercel.app
   ```

### 5. Set Up Monitoring

#### Error Tracking (Sentry)
```bash
npm install @sentry/node
```

```typescript
import * as Sentry from "@sentry/node"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
})
```

#### Logging (Pino)
```bash
npm install pino pino-pretty
```

---

## Alternative: Railway Deployment

### 1. Push to GitHub

```bash
git push origin main
```

### 2. Create Railway Project

1. Visit [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account
5. Select your `income-tracker` repo

### 3. Add Service

1. Click "Add Service"
2. Select "PostgreSQL" (for Supabase alternative)
3. Or click "Deploy" for Node.js only

### 4. Configure Environment

1. Go to Variables tab
2. Add all environment variables
3. Click "Deploy"

---

## Alternative: Heroku Deployment

### 1. Install Heroku CLI

```bash
curl https://cli.heroku.com/install.sh | sh
```

### 2. Create Procfile

```
web: npm start
```

### 3. Deploy

```bash
heroku login
heroku create income-tracker
git push heroku main
heroku config:set SUPABASE_URL=...
heroku config:set SUPABASE_ANON_KEY=...
```

---

## Docker Deployment

### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### 2. Create .dockerignore

```
node_modules
dist
.env
.git
.gitignore
README.md
```

### 3. Build & Run

```bash
docker build -t income-tracker .
docker run -p 3000:3000 \
  -e SUPABASE_URL=... \
  -e SUPABASE_ANON_KEY=... \
  income-tracker
```

### 4. Push to Docker Hub

```bash
docker tag income-tracker your-username/income-tracker
docker push your-username/income-tracker
```

---

## Security Checklist

- [ ] Enable HTTPS/SSL
- [ ] Set strong `SESSION_SECRET`
- [ ] Use environment variables for all secrets
- [ ] Enable database backups
- [ ] Set up rate limiting
- [ ] Enable CORS with specific origins
- [ ] Use bcrypt for passwords
- [ ] Enable security headers (Helmet.js)
- [ ] Monitor for vulnerabilities
- [ ] Set up error tracking (Sentry)
- [ ] Enable logging
- [ ] Regular security audits

### Add Security Headers

```bash
npm install helmet
```

```typescript
import helmet from 'helmet'

app.use(helmet())
```

### Add Rate Limiting

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})

app.use('/api/', limiter)
```

---

## Scaling Considerations

### Database
- Use Supabase for automatic scaling
- Enable connection pooling in production
- Set up read replicas for heavy traffic

### Application
- Use CDN for static assets (Vercel CDN included)
- Enable caching headers
- Consider API rate limiting
- Monitor performance with tools like New Relic

### Monitoring
- Set up uptime monitoring
- Create alerts for errors
- Track performance metrics
- Monitor database queries

---

## Troubleshooting

### Build Fails on Deploy
```bash
# Check logs
vercel logs
# or
heroku logs --tail
```

### Environment Variables Not Found
- Verify variable names in platform (case-sensitive)
- Check `.env.example` matches your setup
- Redeploy after adding variables

### Database Connection Issues
- Verify `SUPABASE_URL` and keys are correct
- Check IP whitelist in Supabase
- Test connection locally first

### Port Issues
- Use `process.env.PORT || 3000`
- Don't hardcode port numbers
- Platform assigns port automatically

---

## Performance Optimization

### Frontend
- Code splitting with dynamic imports
- Image optimization
- CSS minification (automatic with Vite)
- Bundle analysis: `npm install --save-dev rollup-plugin-visualizer`

### Backend
- Database query optimization
- Connection pooling
- Caching strategies
- Compression middleware

```typescript
import compression from 'compression'

app.use(compression())
```

---

## Maintenance

### Regular Tasks
- Update dependencies: `npm update`
- Security patches: `npm audit fix`
- Database backups: Daily automatic (Supabase)
- Monitor logs: Weekly review

### Updates Process
1. Test locally: `npm run dev`
2. Run tests: `npm run lint`
3. Build check: `npm run build`
4. Commit & push
5. Verify deployment

---

## Support Resources

- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Heroku Docs](https://devcenter.heroku.com)
- [Docker Docs](https://docs.docker.com)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)
