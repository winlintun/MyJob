import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import session from "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple password hashing (in production, use bcrypt)
const hashPassword = (password: string) => crypto.createHash('sha256').update(password).digest('hex');

const db = new Database("income_tracker.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT,
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    hourly_rate REAL,
    hours_per_day REAL,
    color TEXT DEFAULT '#18181b',
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS income (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    job_id INTEGER,
    date TEXT,
    amount REAL,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(job_id) REFERENCES jobs(id)
  );

  CREATE TABLE IF NOT EXISTS targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    month TEXT, -- YYYY-MM
    amount REAL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Add color column if it doesn't exist (for migration)
try {
  db.exec("ALTER TABLE jobs ADD COLUMN color TEXT DEFAULT '#18181b'");
} catch (e) {
  // Column might already exist, ignore error
}

// Seed admin if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
if (!adminExists) {
  db.prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)").run("admin", hashPassword("admin123"), "admin");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(session({
    secret: 'income-tracker-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
  }));

  // Auth Middleware
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    next();
  };

  const getUserId = (req: express.Request) => {
    return req.session.userId || 1; // Fallback for demo
  };

  // Auth Routes
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password_hash = ?").get(username, hashPassword(password)) as any;
    if (user) {
      req.session.userId = user.id;
      res.json({ id: user.id, username: user.username, role: user.role });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/register", (req, res) => {
    const { username, password } = req.body;
    try {
      const result = db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").run(username, hashPassword(password));
      res.json({ id: result.lastInsertRowid, username });
    } catch (e) {
      res.status(400).json({ error: "Username already exists" });
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

  // Job Routes
  app.get("/api/jobs", (req, res) => {
    const userId = getUserId(req);
    const jobs = db.prepare("SELECT * FROM jobs WHERE user_id = ?").all(userId);
    res.json(jobs);
  });

  app.post("/api/jobs", (req, res) => {
    const userId = getUserId(req);
    const { name, hourly_rate, hours_per_day, color = '#18181b' } = req.body;
    const result = db.prepare("INSERT INTO jobs (user_id, name, hourly_rate, hours_per_day, color) VALUES (?, ?, ?, ?, ?)").run(userId, name, hourly_rate, hours_per_day, color);
    res.json({ id: result.lastInsertRowid, name, hourly_rate, hours_per_day, color });
  });

  app.delete("/api/jobs/:id", (req, res) => {
    const userId = getUserId(req);
    const jobId = req.params.id;
    
    // Delete all income records for this job first
    db.prepare("DELETE FROM income WHERE job_id = ? AND user_id = ?").run(jobId, userId);
    
    // Then delete the job itself
    db.prepare("DELETE FROM jobs WHERE id = ? AND user_id = ?").run(jobId, userId);
    res.json({ success: true });
  });

  // Income Routes
  app.get("/api/income", (req, res) => {
    const userId = getUserId(req);
    const income = db.prepare(`
      SELECT i.*, j.name as job_name 
      FROM income i 
      JOIN jobs j ON i.job_id = j.id 
      WHERE i.user_id = ?
    `).all(userId);
    res.json(income);
  });

  app.post("/api/income", (req, res) => {
    const userId = getUserId(req);
    const { job_id, date, amount } = req.body;
    // Upsert income for a specific day and job
    const existing = db.prepare("SELECT id FROM income WHERE user_id = ? AND job_id = ? AND date = ?").get(userId, job_id, date) as any;
    if (existing) {
      db.prepare("UPDATE income SET amount = ? WHERE id = ?").run(amount, existing.id);
      res.json({ id: existing.id, job_id, date, amount });
    } else {
      const result = db.prepare("INSERT INTO income (user_id, job_id, date, amount) VALUES (?, ?, ?, ?)").run(userId, job_id, date, amount);
      res.json({ id: result.lastInsertRowid, job_id, date, amount });
    }
  });

  app.delete("/api/income/:id", (req, res) => {
    const userId = getUserId(req);
    db.prepare("DELETE FROM income WHERE id = ? AND user_id = ?").run(req.params.id, userId);
    res.json({ success: true });
  });

  // Target Routes
  app.get("/api/targets", (req, res) => {
    const userId = getUserId(req);
    const targets = db.prepare("SELECT * FROM targets WHERE user_id = ?").all(userId);
    res.json(targets);
  });

  app.post("/api/targets", (req, res) => {
    const userId = getUserId(req);
    const { month, amount } = req.body;
    const existing = db.prepare("SELECT id FROM targets WHERE user_id = ? AND month = ?").get(userId, month) as any;
    if (existing) {
      db.prepare("UPDATE targets SET amount = ? WHERE id = ?").run(amount, existing.id);
      res.json({ id: existing.id, month, amount });
    } else {
      const result = db.prepare("INSERT INTO targets (user_id, month, amount) VALUES (?, ?, ?)").run(userId, month, amount);
      res.json({ id: result.lastInsertRowid, month, amount });
    }
  });

  // Admin Routes
  app.get("/api/admin/users", (req, res) => {
    const userId = getUserId(req);
    const admin = db.prepare("SELECT role FROM users WHERE id = ?").get(userId) as any;
    if (admin?.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    
    const users = db.prepare("SELECT id, username, role FROM users").all();
    res.json(users);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
