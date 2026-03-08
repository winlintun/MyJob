# 🚀 Supabase Setup Guide for Income Tracker

This guide will help you set up Supabase PostgreSQL database for the Income Tracker application.

## 📋 Prerequisites

- Supabase account (free at https://supabase.com)
- Internet connection
- Access to Supabase dashboard

---

## Step 1: Create Supabase Project ✅

### 1.1 Sign Up / Sign In

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Sign In" (or "Sign Up" if new)
3. Use GitHub, Google, or email to create account

### 1.2 Create a New Project

1. Click "New Project"
2. Fill in project details:
   - **Project Name**: `income-tracker` (or your preference)
   - **Database Password**: Generate strong password (copy and save!)
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Free tier is fine for development

3. Click "Create new project" and wait 2-3 minutes
4. Project is ready when you see the dashboard

---

## Step 2: Get Your Credentials 🔑

### 2.1 Copy Project Credentials

1. Navigate to **Project Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Configuration")
   - **anon public** key
   - **service_role** key

### 2.2 Update Your .env File

Create/edit `.env` in your project root:

```env
NODE_ENV=development
PORT=3000
SESSION_SECRET=your-random-secret-here

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**⚠️ Important**: Never share these keys publicly!

---

## Step 3: Create Database Tables 📊

### 3.1 Open SQL Editor

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy the entire SQL script below

### 3.2 Copy & Run This SQL

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  hourly_rate DECIMAL(10, 2) NOT NULL,
  hours_per_day DECIMAL(5, 2) NOT NULL,
  color TEXT DEFAULT '#18181b',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Income table
CREATE TABLE IF NOT EXISTS income (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  job_id BIGINT REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Targets table
CREATE TABLE IF NOT EXISTS targets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  month TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Create indexes for better performance
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_income_user_id ON income(user_id);
CREATE INDEX idx_income_job_id ON income(job_id);
CREATE INDEX idx_targets_user_id ON targets(user_id);
```

4. Click **"Run"** button (or Ctrl+Enter)
5. You should see "Success" message

---

## Step 4: Switch Project to Supabase Mode 🔄

### Option A: Use Supabase Server (Recommended)

```bash
# Install Supabase dependencies
npm install

# Replace server.ts with Supabase version
mv server.ts server-sqlite.ts
mv server-supabase.ts server.ts

# Start development server
npm run dev
```

The app will now use Supabase!

### Option B: Keep Original Server Setup

If you want to keep using SQLite, just update `.env` and the app will use SQLite.

---

## Step 5: Create Admin Account 👤

### 5.1 Seed Admin User

When you run the server for the first time with Supabase enabled, an admin user is automatically created:

- **Username**: `admin`
- **Password**: `admin123`

### 5.2 Login

1. Open [http://localhost:3000](http://localhost:3000)
2. Enter credentials:
   - Username: `admin`
   - Password: `admin123`
3. You should see the dashboard!

⚠️ **Change this password in production!**

---

## Step 6: Verify Setup ✅

### 6.1 Test the Connection

Check these features to ensure Supabase is working:

1. **Sign In** - Login works
2. **Create Job** - Can add a job profile
3. **Track Income** - Can mark days on calendar
4. **Set Target** - Can set monthly target
5. **View Analytics** - Dashboard shows data

### 6.2 Check Database

Return to Supabase dashboard:

1. Go to **Table Editor**
2. You should see:
   - ✅ `users` table (with admin user)
   - ✅ `jobs` table
   - ✅ `income` table
   - ✅ `targets` table

---

## Troubleshooting 🔧

### Error: "SUPABASE_URL is not valid"

- Check `.env` file has correct format
- Verify URL is like: `https://abc1234def.supabase.co`
- No trailing slashes!

### Error: "Invalid API key"

- Copy key directly from Supabase dashboard
- Make sure you're using `service_role` key, not `anon` key
- Verify no extra spaces or quotes

### Error: "relation users does not exist"

- Return to Supabase SQL Editor
- Copy and run the SQL script again
- Tables might not have been created

### Server Won't Start

```bash
# Check npm packages installed
npm install

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Try again
npm run dev
```

### Data Not Saving

1. Check browser console for errors (F12)
2. Check server terminal for error messages
3. Verify `.env` has correct SUPABASE_SERVICE_ROLE_KEY
4. Try creating a new job and check Supabase Table Editor

---

## Security Notes 🔐

### Never Do This ❌

- Don't commit `.env` to Git
- Don't share your service role key
- Don't use weak passwords
- Don't run in production with defaults

### Best Practices ✅

1. **Use strong SESSION_SECRET**
   ```bash
   # Generate random secret
   openssl rand -base64 32
   ```

2. **Keep keys secure**
   - Rotate keys monthly
   - Use different keys for dev/production
   - Monitor key access in Supabase dashboard

3. **Enable security features**
   - Use HTTPS in production
   - Set secure cookie options
   - Implement rate limiting

4. **Data privacy**
   - Consider enabling Row Level Security (RLS)
   - Users only see their own data
   - See SUPABASE_SETUP.md for RLS examples

---

## Production Deployment 🚀

### Before Deploying:

1. **Create separate Supabase project** for production
   - Never use development credentials in production!

2. **Update .env for production**
   ```env
   NODE_ENV=production
   SESSION_SECRET=your-very-strong-random-secret
   SUPABASE_URL=https://your-production-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=production-key-only
   ```

3. **Enable security**
   - Set `secure: true` in session cookie
   - Use HTTPS only
   - Enable Supabase database backups
   - Monitor usage and costs

4. **Test thoroughly**
   - Test all features locally first
   - Test with production credentials
   - Verify database backups work

### Deploy to Vercel:

```bash
# Push to GitHub
git add .
git commit -m "Add Supabase integration"
git push

# In Vercel dashboard:
# 1. Import your GitHub repo
# 2. Add Environment Variables:
#    - SUPABASE_URL
#    - SUPABASE_SERVICE_ROLE_KEY
#    - SESSION_SECRET
# 3. Deploy!
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guide.

---

## Migrate from SQLite 📥

### Export SQLite Data

```bash
# If you have existing data in SQLite
sqlite3 income_tracker.db ".dump" > backup.sql
```

### Import to Supabase

1. Export data to CSV (easier format)
2. Use Supabase Data Import wizard
3. Or manually INSERT statements

See SUPABASE_SETUP.md for detailed migration steps.

---

## Monitoring & Maintenance 📈

### Check Database Performance

In Supabase dashboard:

1. Go to **Reporting** → **Network Activity**
   - See API calls and performance
2. Go to **Database** → **Query Inspector**
   - Monitor slow queries
3. Check **Usage** page
   - See database size and operations

### Backups

Supabase automatically backs up daily (free plan):
- Go to **Backups** tab
- View backup history
- Manage backup retention

### Monthly Tasks

- [ ] Review security
- [ ] Check for unused data
- [ ] Monitor database size
- [ ] Update dependencies
- [ ] Test disaster recovery

---

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Getting Started**: https://supabase.com/docs/guides/getting-started
- **Database Guide**: https://supabase.com/docs/guides/database
- **GitHub Discussions**: https://github.com/supabase/supabase/discussions
- **Discord Community**: https://discord.gg/supabase

---

## Quick Reference

| Task | Location |
|------|----------|
| Get API Keys | Settings → API |
| Create Tables | SQL Editor |
| View Data | Table Editor |
| Monitor Usage | Reporting → Usage |
| Manage Backups | Settings → Backups |
| View Docs | Help → Documentation |

---

## Next Steps

1. ✅ Setup complete!
2. 📚 Read [README.md](./README.md) for feature documentation
3. 🚀 Deploy to production with [DEPLOYMENT.md](./DEPLOYMENT.md)
4. 🔒 Enable Row Level Security for multi-tenant setup

Happy tracking! 💰📊
