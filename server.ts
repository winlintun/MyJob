import 'dotenv/config';
import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import session from "express-session";
import { supabaseServer, initializeSupabaseDatabase } from "./src/lib/supabaseClient";
import { scheduleBackup, createBackup, getBackupList, restoreBackup } from "./src/lib/backupService";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple password hashing (in production, use bcrypt)
const hashPassword = (password: string) => crypto.createHash('sha256').update(password).digest('hex');

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  let isSupabaseEnabled = false;

  // Health endpoint should be available even if DB init fails,
  // so Railway can still get a response from the service.
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: isSupabaseEnabled ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      railway: !!process.env.RAILWAY_PUBLIC_DOMAIN,
      supabase: isSupabaseEnabled,
    });
  });

  // ==================== SECURITY MIDDLEWARE ====================
  
  // Security headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self' https://cwjjuphpyaahpcjwaewb.supabase.co;");
    next();
  });

  // CORS
  app.use((req: Request, res: Response, next: NextFunction) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      process.env.RAILWAY_PUBLIC_DOMAIN,
      process.env.APP_URL
    ].filter(Boolean);
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin as string)) {
      res.setHeader('Access-Control-Allow-Origin', origin as string);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Initialize Supabase
  isSupabaseEnabled = await initializeSupabaseDatabase();
  
  if (!isSupabaseEnabled) {
    console.error("⚠️ Supabase not configured or not reachable. API routes will return 503 until fixed.");
  }

  // Schedule daily backups only when DB is ready
  if (isSupabaseEnabled) {
    scheduleBackup(24);
  }

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));
  
  app.use(session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Auth Middleware
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    next();
  };

  const getUserId = (req: express.Request) => {
    return req.session.userId || 1;
  };

  // Check if admin exists, if not seed the database
  const seedAdminUser = async () => {
    const { data: adminUser } = await supabaseServer
      .from('users')
      .select('*')
      .eq('username', 'admin')
      .single();
    
    if (!adminUser) {
      await supabaseServer
        .from('users')
        .insert([{
          username: 'admin',
          password_hash: hashPassword('admin123'),
          role: 'admin'
        }]);
      console.log('✅ Admin user created (username: admin, password: admin123)');
    }
  };

  seedAdminUser().catch(err => console.error('Seed error:', err));

  // Block DB-dependent API routes when Supabase is unavailable.
  app.use('/api', (req, res, next) => {
    if (req.path === '/health') return next();
    if (!isSupabaseEnabled) {
      return res.status(503).json({ error: 'Service temporarily unavailable: database not ready' });
    }
    next();
  });

  // ==================== BACKUP ROUTES ====================

  // Backup endpoints (admin only)
  app.post('/api/admin/backup', requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { data: admin } = await supabaseServer
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (admin?.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const success = await createBackup();
      if (success) {
        res.json({ success: true, message: "Backup created successfully" });
      } else {
        res.status(500).json({ error: "Backup failed" });
      }
    } catch (error) {
      console.error('Backup error:', error);
      res.status(500).json({ error: "Backup failed" });
    }
  });

  app.get('/api/admin/backups', requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { data: admin } = await supabaseServer
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (admin?.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const backups = getBackupList();
      res.json({ backups });
    } catch (error) {
      console.error('Backup list error:', error);
      res.status(500).json({ error: "Failed to fetch backups" });
    }
  });

  app.post('/api/admin/restore/:filename', requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { data: admin } = await supabaseServer
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (admin?.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const success = await restoreBackup(req.params.filename);
      if (success) {
        res.json({ success: true, message: "Backup restored successfully" });
      } else {
        res.status(500).json({ error: "Restore failed" });
      }
    } catch (error) {
      console.error('Restore error:', error);
      res.status(500).json({ error: "Restore failed" });
    }
  });

  // ==================== AUTH ROUTES ====================
  
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const { data: user, error } = await supabaseServer
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', hashPassword(password))
        .single();
      
      if (error || !user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      req.session.userId = user.id;
      res.json({ id: user.id, username: user.username, role: user.role });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const { data: newUser, error } = await supabaseServer
        .from('users')
        .insert([{
          username,
          password_hash: hashPassword(password),
          role: 'user'
        }])
        .select()
        .single();
      
      if (error) {
        return res.status(400).json({ error: error.message || "Username already exists" });
      }
      
      req.session.userId = newUser.id;
      res.json({ id: newUser.id, username: newUser.username, role: newUser.role });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ error: "Logout failed" });
      } else {
        res.json({ success: true });
      }
    });
  });

  // ==================== JOB ROUTES ====================

  app.get("/api/jobs", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { data: jobs, error } = await supabaseServer
        .from('jobs')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      res.json(jobs || []);
    } catch (error) {
      console.error('Get jobs error:', error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.post("/api/jobs", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { name, hourly_rate, hours_per_day, color = '#18181b' } = req.body;
      
      const { data: job, error } = await supabaseServer
        .from('jobs')
        .insert([{
          user_id: userId,
          name,
          hourly_rate,
          hours_per_day,
          color
        }])
        .select()
        .single();
      
      if (error) throw error;
      res.json(job);
    } catch (error) {
      console.error('Create job error:', error);
      res.status(500).json({ error: "Failed to create job" });
    }
  });

  app.put("/api/jobs/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { name, hourly_rate, hours_per_day, color } = req.body;
      
      const { data: job, error } = await supabaseServer
        .from('jobs')
        .update({
          name,
          hourly_rate,
          hours_per_day,
          color
        })
        .eq('id', req.params.id)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      res.json(job);
    } catch (error) {
      console.error('Update job error:', error);
      res.status(500).json({ error: "Failed to update job" });
    }
  });

  app.delete("/api/jobs/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const jobId = parseInt(req.params.id);
      
      // First delete all income records for this job
      const { error: incomeError } = await supabaseServer
        .from('income')
        .delete()
        .eq('job_id', jobId)
        .eq('user_id', userId);
      
      if (incomeError) throw incomeError;
      
      // Then delete the job itself
      const { error: jobError } = await supabaseServer
        .from('jobs')
        .delete()
        .eq('id', jobId)
        .eq('user_id', userId);
      
      if (jobError) throw jobError;
      res.json({ success: true });
    } catch (error) {
      console.error('Delete job error:', error);
      res.status(500).json({ error: "Failed to delete job" });
    }
  });

  // ==================== INCOME ROUTES ====================

  app.get("/api/income", async (req, res) => {
    try {
      const userId = getUserId(req);
      
      const { data: income, error } = await supabaseServer
        .from('income')
        .select('*, jobs(name)')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Transform to match frontend expectations
      const transformed = income?.map(i => ({
        ...i,
        job_name: (i.jobs as any)?.name || ''
      })) || [];
      
      res.json(transformed);
    } catch (error) {
      console.error('Get income error:', error);
      res.status(500).json({ error: "Failed to fetch income" });
    }
  });

  app.post("/api/income", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { job_id, date, amount } = req.body;
      
      // Check if record exists
      const { data: existing } = await supabaseServer
        .from('income')
        .select('id')
        .eq('user_id', userId)
        .eq('job_id', job_id)
        .eq('date', date)
        .single();
      
      let result;
      if (existing) {
        // Update
        const { data, error } = await supabaseServer
          .from('income')
          .update({ amount })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        // Insert
        const { data, error } = await supabaseServer
          .from('income')
          .insert([{
            user_id: userId,
            job_id,
            date,
            amount
          }])
          .select()
          .single();
        if (error) throw error;
        result = data;
      }
      
      res.json(result);
    } catch (error) {
      console.error('Post income error:', error);
      res.status(500).json({ error: "Failed to save income" });
    }
  });

  app.delete("/api/income/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      
      const { error } = await supabaseServer
        .from('income')
        .delete()
        .eq('id', req.params.id)
        .eq('user_id', userId);
      
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      console.error('Delete income error:', error);
      res.status(500).json({ error: "Failed to delete income" });
    }
  });

  // ==================== TARGET ROUTES ====================

  app.get("/api/targets", async (req, res) => {
    try {
      const userId = getUserId(req);
      
      const { data: targets, error } = await supabaseServer
        .from('targets')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      res.json(targets || []);
    } catch (error) {
      console.error('Get targets error:', error);
      res.status(500).json({ error: "Failed to fetch targets" });
    }
  });

  app.post("/api/targets", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { month, amount } = req.body;
      
      // Check if record exists
      const { data: existing } = await supabaseServer
        .from('targets')
        .select('id')
        .eq('user_id', userId)
        .eq('month', month)
        .single();
      
      let result;
      if (existing) {
        // Update
        const { data, error } = await supabaseServer
          .from('targets')
          .update({ amount })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        // Insert
        const { data, error } = await supabaseServer
          .from('targets')
          .insert([{
            user_id: userId,
            month,
            amount
          }])
          .select()
          .single();
        if (error) throw error;
        result = data;
      }
      
      res.json(result);
    } catch (error) {
      console.error('Post targets error:', error);
      res.status(500).json({ error: "Failed to save target" });
    }
  });

  // ==================== ADMIN ROUTES ====================

  app.get("/api/admin/users", async (req, res) => {
    try {
      const userId = getUserId(req);
      
      // Check if user is admin
      const { data: admin, error: adminError } = await supabaseServer
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (adminError || admin?.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const { data: users, error } = await supabaseServer
        .from('users')
        .select('id, username, role');
      
      if (error) throw error;
      res.json(users || []);
    } catch (error) {
      console.error('Get admin users error:', error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // API fallback (must be before Vite/static handlers)
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
  });

  // ==================== VITE & STATIC ROUTES ====================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    // SPA fallback (exclude /api)
    app.get(/^\/(?!api).*/, (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`
    ╔════════════════════════════════════════╗
    ║   🚀 Income Tracker Server Started     ║
    ║   📡 Database: Supabase PostgreSQL     ║
    ║   🌐 http://localhost:${PORT}            ║
    ╚════════════════════════════════════════╝
    `);
  });
}

startServer().catch(err => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
});
