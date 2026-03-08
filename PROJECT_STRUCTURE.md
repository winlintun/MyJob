# Project Organization

This document outlines the current project structure and recommendations for keeping it clean.

## 📁 Essential Files (Keep)

### Source Code
- ✅ `src/` - All React/TypeScript frontend code
- ✅ `server.ts` - Express backend server
- ✅ `index.html` - HTML entry point
- ✅ `vite.config.ts` - Vite configuration
- ✅ `tsconfig.json` - TypeScript configuration

### Configuration
- ✅ `package.json` - Dependencies and scripts
- ✅ `package-lock.json` - Dependency lock file
- ✅ `.env` - Local environment variables (Git ignored)
- ✅ `.env.example` - Template for environment variables
- ✅ `.gitignore` - Git ignore rules

### Documentation
- ✅ `README.md` - Project documentation
- ✅ `SUPABASE_SETUP.md` - Supabase integration guide

### Database
- ✅ `income_tracker.db` - Local SQLite database (for development)

## 🗑️ Files to Remove

### Unnecessary Files
- ❌ `Prepare the necessary files for upl.txt` - Old requirements note
- ❌ `metadata.json` - No longer needed
- ❌ `.vscode/` - IDE-specific settings (optional to remove)

### Auto-Generated (Safe to Delete)
- ❌ `dist/` - Build output (regenerated on build)
- ❌ `node_modules/` - Dependencies (regenerated on npm install)
- ❌ `env/` - Python virtual environment (not used)

## 📋 Recommended Cleanup

Run these commands to clean up:

```bash
# Remove unnecessary files
rm "Prepare the necessary files for upl.txt"
rm metadata.json

# Remove generated directories (they'll be recreated)
rm -rf dist/
rm -rf node_modules/
rm -rf env/

# Reinstall dependencies
npm install
```

## 🔧 Project Dependencies Status

### Up to Date
- ✅ React 19 - Latest major version
- ✅ TypeScript 5.8 - Type safety
- ✅ Express 4.21 - Modern Node.js server
- ✅ Tailwind CSS 4.1 - Latest styling
- ✅ date-fns 4.1 - Date utilities
- ✅ Recharts 3.8 - Charts library

### Recommended Upgrades
- ⚠️ Password hashing - Upgrade from SHA-256 to bcrypt
  - Install: `npm install bcrypt`
  - Update: `server.ts` password hashing functions

## 📊 File Size Analysis

Current project sizes (approximate):
- `src/App.tsx` - ~85 KB (main component, consider splitting)
- `node_modules/` - ~500+ MB (required for dev)
- `dist/` - ~800 KB (production build output)
- `income_tracker.db` - <1 MB (SQLite database)

### Recommendations
- Split `App.tsx` into smaller components for better maintainability
- Use code-splitting with Vite for faster load times
- Consider monorepo structure if app grows

## 🚀 Build Artifacts

All build artifacts are safely ignored:

```gitignore
dist/              # Vite build output
node_modules/      # npm dependencies
.env*              # Sensitive environment variables
!.env.example       # Except the template
```

## 📦 Production Checklist

Before deploying:

- [ ] Update `NODE_ENV=production` in .env
- [ ] Remove `"dev"` script from package.json (optional)
- [ ] Upgrade password hashing to bcrypt
- [ ] Enable secure session cookies
- [ ] Set strong session secrets
- [ ] Configure CORS if needed
- [ ] Update SUPABASE credentials for production
- [ ] Test all API endpoints
- [ ] Run full build: `npm run build`
- [ ] Test production build: `npm start`

## 📚 Additional Resources

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express Security Checklist](https://expressjs.com/en/advanced/best-practice-security.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev)
