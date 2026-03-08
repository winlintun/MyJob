# Supabase Integration Guide

This guide explains how to migrate from local SQLite to Supabase (PostgreSQL) for cloud-based data storage.

## Why Supabase?

- ✅ Cloud-hosted PostgreSQL database
- ✅ Real-time subscriptions
- ✅ Built-in authentication
- ✅ Row-level security
- ✅ Automatic backups
- ✅ Scalable for production

## Step 1: Create Supabase Project

1. Visit [https://supabase.com](https://supabase.com)
2. Sign up and create a new project
3. Choose a region close to your users
4. Set a strong database password
5. Wait for project initialization (~2 minutes)

## Step 2: Get Your Credentials

In your Supabase dashboard:
1. Go to Project Settings → API
2. Copy:
   - `Project URL` → SUPABASE_URL
   - `anon public` key → SUPABASE_ANON_KEY
   - `service_role` key → SUPABASE_SERVICE_ROLE_KEY
3. Add to `.env` file

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 3: Create Database Tables

### Option A: Using Supabase SQL Editor (Recommended)

1. In Supabase dashboard, go to SQL Editor
2. Copy and run this SQL:

```sql
-- Users table
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Jobs table
CREATE TABLE jobs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hourly_rate DECIMAL(10, 2) NOT NULL,
  hours_per_day DECIMAL(5, 2) NOT NULL,
  color TEXT DEFAULT '#18181b',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Income table
CREATE TABLE income (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  job_id BIGINT REFERENCES jobs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Targets table
CREATE TABLE targets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE targets ENABLE ROW LEVEL SECURITY;

-- Create policies for users to access only their data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can read own jobs" ON jobs
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own jobs" ON jobs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own jobs" ON jobs
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own jobs" ON jobs
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Similar policies for income and targets tables
CREATE POLICY "Users can read own income" ON income
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own income" ON income
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own income" ON income
  FOR DELETE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can read own targets" ON targets
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage own targets" ON targets
  FOR ALL USING (auth.uid()::text = user_id::text);
```

## Step 4: Install Supabase Client

```bash
npm install @supabase/supabase-js
npm uninstall better-sqlite3
```

## Step 5: Create Supabase Client

Create `src/lib/supabaseClient.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## Step 6: Update Backend Routes

Replace `server.ts` database logic with Supabase queries:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Example: Get jobs
app.get('/api/jobs', async (req, res) => {
  const userId = req.session.userId
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', userId)
  
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Example: Create job
app.post('/api/jobs', async (req, res) => {
  const userId = req.session.userId
  const { name, hourly_rate, hours_per_day, color } = req.body
  
  const { data, error } = await supabase
    .from('jobs')
    .insert([{ 
      user_id: userId, 
      name, 
      hourly_rate, 
      hours_per_day, 
      color 
    }])
    .select()
  
  if (error) return res.status(500).json({ error: error.message })
  res.json(data[0])
})
```

## Step 7: Update Authentication

Use Supabase Auth:

```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: username,
  password: password
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: username,
  password: password
})

// Get user
const { data: { user } } = await supabase.auth.getUser()
```

## Step 8: Environment Variables

Update `.env`:

```env
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 9: Test

```bash
npm run dev
```

## Troubleshooting

### Error: "Invalid API key"
- Check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
- Verify the URL format: `https://your-project.supabase.co`

### Error: "row level security denied"
- Run the RLS policy SQL provided above
- Ensure policies match your authentication setup

### Error: "relation does not exist"
- Verify table names in SQL match your queries
- Ensure tables were created successfully in SQL Editor

## Security Tips

1. **Never expose service role key** in frontend
2. **Use RLS policies** to control data access
3. **Enable HTTPS** in production
4. **Use environment variables** for all secrets
5. **Rotate keys regularly** in production
6. **Monitor** database usage and performance

## Migrating from SQLite

To migrate existing SQLite data:

1. Export SQLite data to CSV
2. Transform JSON format if needed
3. Use Supabase import tool or INSERT statements
4. Verify data integrity
5. Test all API endpoints

## Support

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Forum](https://github.com/supabase/supabase/discussions)
- [API Reference](https://supabase.com/docs/reference/javascript)
