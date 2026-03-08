# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
Create `.env` file:
```env
NODE_ENV=development
PORT=3000
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Default Login
- Username: `admin`
- Password: `admin123`

⚠️ **Change this in production!**

---

## 📚 Available Scripts

### Development
```bash
npm run dev      # Start development server with hot reload
npm run lint     # Type check with TypeScript
npm run build    # Build for production
npm start        # Start production server
```

### Database
- SQLite: Automatically created as `income_tracker.db`
- Supabase: See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

---

## 🎯 Next Steps

1. **Create Account**
   - Click "Sign up here"
   - Create new user

2. **Add Jobs**
   - Go to "Job Profiles"
   - Add your work types

3. **Track Income**
   - Go to "Daily Tracking"
   - Click days to track work

4. **Set Targets**
   - Go to "Income Targets"
   - Set monthly goals

5. **View Dashboard**
   - See analytics and progress

---

## 🔧 Configuration

### Using SQLite (Default)
No configuration needed! Starts automatically.

### Using Supabase
1. Create Supabase project: [supabase.com](https://supabase.com)
2. Follow: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
3. Update `.env` with Supabase credentials

---

## 📖 Documentation

- **[README.md](./README.md)** - Full documentation
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Cloud database setup
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - File organization

---

## 🆘 Troubleshooting

### Port 3000 Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Dependencies Installation Failed
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
npm run lint
```

---

## 💡 Tips

- **Responsive Design** - Works on mobile, tablet, desktop
- **Color Customization** - Auto-generated or manual job colors
- **Real-time Updates** - Changes apply instantly
- **Calendar Navigation** - Use arrows to switch months
- **Analytics** - View charts on Dashboard

---

## 📱 Features Overview

| Feature | Location |
|---------|----------|
| Job Management | Job Profiles tab |
| Income Logging | Daily Tracking tab |
| Target Setting | Income Targets tab |
| Analytics | Dashboard tab |
| User Management | Admin Panel tab (admin only) |

---

## 🔐 Security Info

- **Authentication**: Session-based
- **Passwords**: Hashed (SHA-256, should upgrade to bcrypt)
- **Data**: User-isolated (can't see other users' data)
- **Default Account**: admin/admin123 (change in production!)

---

## 📞 Support

- Check [README.md](./README.md) for detailed docs
- Review [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for file organization
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup

Happy tracking! 📊💰
