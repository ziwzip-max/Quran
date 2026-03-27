# Al-Hifz Quran App - Deployment & Self-Hosting Guide

## Table of Contents
1. [Tech Stack Overview](#tech-stack-overview)
2. [Dependencies & Versions](#dependencies--versions)
3. [System Requirements](#system-requirements)
4. [Self-Hosting Walkthrough](#self-hosting-walkthrough)
5. [Initial Deployment Issues & Solutions](#initial-deployment-issues--solutions)

---

## Tech Stack Overview

**Al-Hifz** is a comprehensive Quran application built with modern technologies. It's a cross-platform app supporting mobile (iOS/Android) and web platforms.

### Architecture
- **Frontend**: React Native (Expo) with Expo Router for navigation
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Build System**: Metro (React Native), Expo, esbuild
- **Language**: TypeScript with React Compiler enabled

### Core Technologies
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Expo 54.0.27 | React Native framework for cross-platform apps |
| Navigation | Expo Router 6.0.17 | File-based routing for React Native |
| Backend | Express 5.0.1 | REST API server |
| Database | PostgreSQL + Drizzle ORM | Data persistence |
| Runtime | Node.js 20+ | JavaScript runtime |
| Language | TypeScript 5.9.2 | Type-safe JavaScript |
| Runtime Compiler | React Compiler 19.0.0 | Automatic performance optimization |

---

## Dependencies & Versions

### Core Dependencies

```json
{
  "Frontend Framework": {
    "react": "19.1.0",
    "react-native": "0.81.5",
    "expo": "~54.0.27",
    "expo-router": "~6.0.17",
    "react-native-web": "^0.21.0"
  },
  
  "Expo Modules": {
    "expo-av": "^16.0.8",
    "expo-blur": "~15.0.8",
    "expo-clipboard": "^55.0.8",
    "expo-constants": "~18.0.11",
    "expo-font": "~14.0.10",
    "expo-glass-effect": "~0.1.4",
    "expo-haptics": "~15.0.8",
    "expo-image": "~3.0.11",
    "expo-image-picker": "~17.0.9",
    "expo-linear-gradient": "~15.0.8",
    "expo-linking": "~8.0.10",
    "expo-location": "~19.0.8",
    "expo-notifications": "^55.0.11",
    "expo-splash-screen": "~31.0.12",
    "expo-status-bar": "~3.0.9",
    "expo-symbols": "~1.0.8",
    "expo-system-ui": "~6.0.9",
    "expo-web-browser": "~15.0.10",
    "expo-vector-icons": "^15.0.3"
  },
  
  "Arabic Fonts": {
    "@expo-google-fonts/amiri": "^0.4.1",
    "@expo-google-fonts/amiri-quran": "^0.4.1",
    "@expo-google-fonts/cairo": "^0.4.2",
    "@expo-google-fonts/inter": "^0.4.0",
    "@expo-google-fonts/lateef": "^0.4.2",
    "@expo-google-fonts/noto-naskh-arabic": "^0.4.5",
    "@expo-google-fonts/scheherazade-new": "^0.4.2",
    "@expo-google-fonts/tajawal": "^0.4.1"
  },
  
  "UI & Animation": {
    "react-native-reanimated": "~4.1.1",
    "react-native-gesture-handler": "~2.28.0",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
    "react-native-keyboard-controller": "^1.20.6",
    "react-native-svg": "15.12.1",
    "react-native-worklets": "0.5.1"
  },
  
  "Backend": {
    "express": "^5.0.1",
    "http-proxy-middleware": "^3.0.5",
    "pg": "^8.16.3",
    "ws": "^8.18.0",
    "tsx": "^4.21.0"
  },
  
  "Database": {
    "drizzle-orm": "^0.39.3",
    "drizzle-zod": "^0.7.0"
  },
  
  "State Management & Data": {
    "@tanstack/react-query": "^5.83.0",
    "@react-native-async-storage/async-storage": "2.2.0",
    "zod": "^3.24.2",
    "zod-validation-error": "^3.4.0"
  },
  
  "Utilities": {
    "@stardazed/streams-text-encoding": "^1.0.2",
    "@ungap/structured-clone": "^1.3.0",
    "react-dom": "19.1.0"
  }
}
```

### Dev Dependencies

```json
{
  "@babel/core": "^7.25.2",
  "@expo/ngrok": "^4.1.0",
  "@types/express": "^5.0.0",
  "@types/react": "~19.1.10",
  "babel-plugin-react-compiler": "^19.0.0-beta-e993439-20250117",
  "drizzle-kit": "^0.31.4",
  "eslint": "^9.31.0",
  "eslint-config-expo": "~10.0.0",
  "patch-package": "^8.0.0",
  "typescript": "~5.9.2"
}
```

---

## System Requirements

### Minimum Requirements
- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher (comes with Node.js)
- **OS**: Linux, macOS, or Windows
- **RAM**: 2GB minimum (4GB+ recommended)
- **Disk Space**: 5GB for node_modules and build artifacts

### Additional Tools Required
- **PostgreSQL**: v12 or higher (for database)
- **Git**: v2.0 or higher (for version control)
- **Docker** (optional): Recommended for containerized deployment

---

## Self-Hosting Walkthrough

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd al-hifz
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all dependencies from `package.json`.

### Step 3: Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/alhifz_db
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_NAME=alhifz_db

# Frontend Configuration
EXPO_PUBLIC_DOMAIN=yourdomain.com:5000
```

### Step 4: Set Up PostgreSQL Database

```bash
# Create a new database
createdb alhifz_db

# Run database migrations
npm run db:push
```

### Step 5: Build the Frontend (Static Build)

```bash
npm run expo:static:build
```

This creates optimized static builds for the Expo app in the `static-build/` directory.

### Step 6: Build the Backend

```bash
npm run server:build
```

This bundles the Express server using esbuild and outputs to `server_dist/`.

### Step 7: Start the Production Server

```bash
npm run server:prod
```

The server will start on the port specified in your `.env` file (default: 5000).

### Step 8: Verify Deployment

Open your browser and navigate to:
```
https://yourdomain.com:5000
```

You should see the Al-Hifz Quran app loaded and running.

---

## Initial Deployment Issues & Solutions

### Issue 1: `tsx: not found`

**Error Message:**
```
sh: 1: tsx: not found
```

**Cause**: The `tsx` package was listed in dependencies but not installed.

**Solution**:
```bash
npm install
# or
npm install tsx@^4.21.0
```

Ensure `tsx` is installed before running the development server. It's required for running TypeScript directly with `npm run server:dev`.

---

### Issue 2: Babel Configuration Conflict (ES Module vs CommonJS)

**Error Message:**
```
ReferenceError: module is not defined in ES module scope
This file is being treated as an ES module because it has a '.js' file extension 
and '/home/runner/workspace/package.json' contains "type": "module". 
To treat it as a CommonJS script, rename it to use the '.cjs' file extension.
```

**Cause**: 
- `package.json` has `"type": "module"` (ES modules)
- `babel.config.js` uses `module.exports` (CommonJS syntax)
- Node treats `.js` files as ES modules when `"type": "module"` is set, causing the conflict

**Solution**:
Rename `babel.config.js` to `babel.config.cjs`:

```bash
mv babel.config.js babel.config.cjs
```

**Why This Works**: Files ending in `.cjs` are always treated as CommonJS, regardless of the `"type"` setting in `package.json`.

**Alternative Solution** (not recommended):
You could convert the file to ES module syntax, but `.cjs` is the standard approach for build config files that need CommonJS.

---

### Issue 3: Expo Installer Prompts (npx expo)

**Error Behavior**:
```
Need to install the following packages:
expo@55.0.9
Ok to proceed? (y/n)
```

The `npx expo` command tries to install a newer version of Expo than what's specified in `package.json`, blocking the startup.

**Cause**: 
`npx expo` bypasses the installed version and attempts to use the latest version from npm registry.

**Solution**:
Use the local installed binary instead of `npx`:

Change in `package.json`:
```json
// Before (problematic)
"expo:dev": "npx expo start --localhost"

// After (fixed)
"expo:dev": "./node_modules/.bin/expo start --localhost"
```

This ensures your installed version (`~54.0.27`) is used instead of fetching a newer one.

---

### Issue 4: Metro Bundler Not Ready

**Error Message** (in browser):
```
Failed to load resource: the server responded with a status of 502 (Bad Gateway)
```

**Cause**: The Metro bundler (Expo's JavaScript bundler) takes time to start and compile the app.

**Solution**:
- Wait 30-60 seconds for the bundler to fully initialize
- Check the frontend workflow logs: `npm run expo:dev`
- Look for the message: `Metro waiting on exp://...`
- This indicates the bundler is ready

In `api.replit` configuration, use:
```toml
waitForPort = 8081
ensurePreviewReachable = "/status"
```

---

### Issue 5: Package Version Mismatches

**Error Message** (in console):
```
The following packages should be updated for best compatibility with the installed expo version:
  expo-clipboard@55.0.8 - expected version: ~8.0.8
  expo-notifications@55.0.11 - expected version: ~0.32.16
```

**Cause**: Version conflicts between installed packages and the Expo version.

**Solution**:
Option A: Update packages to match expected versions
```bash
npm install expo-clipboard@8.0.8 expo-notifications@0.32.16
```

Option B: Ignore warnings (they're usually non-critical)

These are typically minor compatibility warnings that don't prevent the app from running. Monitor the app for actual errors before updating.

---

### Issue 6: Database Connection Errors

**Error Message**:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Cause**: PostgreSQL is not running or the connection string is incorrect.

**Solution**:

1. **Check if PostgreSQL is running:**
```bash
pg_isready -h localhost -p 5432
```

2. **Verify DATABASE_URL in .env:**
```env
DATABASE_URL=postgresql://username:password@localhost:5432/alhifz_db
```

3. **Start PostgreSQL** (if stopped):
```bash
# macOS
brew services start postgresql

# Linux (systemd)
sudo systemctl start postgresql

# Docker
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15
```

4. **Run migrations:**
```bash
npm run db:push
```

---

### Issue 7: Port Already in Use

**Error Message**:
```
Error: listen EADDRINUSE :::5000
```

**Cause**: Another process is using port 5000.

**Solution**:

```bash
# Find process using port 5000
lsof -i :5000

# Kill the process (macOS/Linux)
kill -9 <PID>

# Or change the port in .env
PORT=3000
```

---

### Issue 8: CORS Errors in Production

**Browser Error**:
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource...
```

**Cause**: The server's CORS configuration doesn't allow requests from your frontend domain.

**Solution**:
The Express server automatically handles CORS for:
- Replit domains (via `REPLIT_DOMAINS` env var)
- Localhost origins (for development)

For custom domains, update `server/index.ts`:

```typescript
const origins = new Set<string>();
origins.add("https://yourdomain.com");
origins.add("https://www.yourdomain.com");

// ... rest of CORS setup
```

---

### Issue 9: Static Build Missing

**Error Message**:
```
Error: ENOENT: no such file or directory, open '.../static-build/ios/manifest.json'
```

**Cause**: The static build hasn't been generated.

**Solution**:
```bash
npm run expo:static:build
npm run server:build
```

These commands must be run before starting the production server.

---

### Issue 10: TypeScript/Build Errors

**Error Message**:
```
error TS1005: ',' expected.
```

**Cause**: TypeScript compilation errors in source files.

**Solution**:

1. **Check tsconfig.json** - Ensure it's properly configured:
```bash
cat tsconfig.json
```

2. **Run type check**:
```bash
npx tsc --noEmit
```

3. **Fix reported errors** and rebuild:
```bash
npm run server:build
```

---

## Docker Deployment (Recommended for Production)

Create a `Dockerfile` for containerized deployment:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build the app
RUN npm run expo:static:build && npm run server:build

# Expose port
EXPOSE 5000

# Start the server
CMD ["npm", "run", "server:prod"]
```

Build and run:
```bash
docker build -t alhifz:latest .
docker run -p 5000:5000 \
  -e DATABASE_URL="postgresql://..." \
  -e NODE_ENV=production \
  alhifz:latest
```

---

## Troubleshooting Checklist

Before deploying, ensure:

- [ ] Node.js v20+ is installed
- [ ] PostgreSQL is running and accessible
- [ ] All environment variables are set in `.env`
- [ ] `npm install` completes without errors
- [ ] `npm run server:build` completes successfully
- [ ] `npm run expo:static:build` completes successfully
- [ ] Port 5000 is available (or configured port)
- [ ] `babel.config.js` is renamed to `babel.config.cjs`
- [ ] Database migrations have been run (`npm run db:push`)
- [ ] CORS origins are correctly configured for your domain

---

## Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong database credentials
- [ ] Configure HTTPS/SSL certificates
- [ ] Set up monitoring and logging
- [ ] Configure regular database backups
- [ ] Use a process manager (PM2, systemd) to keep the server running
- [ ] Set up a reverse proxy (Nginx, Apache) in front of the Express server
- [ ] Enable rate limiting on API endpoints
- [ ] Set up error tracking (Sentry, etc.)

---

## Useful Commands

```bash
# Development
npm run server:dev          # Start backend in dev mode
npm run expo:dev            # Start Expo dev server
npm run lint                # Run ESLint
npm run lint:fix            # Fix ESLint issues

# Building
npm run expo:static:build   # Build static Expo files
npm run server:build        # Build server bundle
npm run db:push             # Run database migrations

# Production
npm run server:prod         # Start production server

# Debugging
npm run expo:start:static:build  # Build Expo with minification
```

---

## Support & Additional Resources

- **Expo Documentation**: https://docs.expo.dev/
- **React Native Docs**: https://reactnative.dev/
- **Express.js Docs**: https://expressjs.com/
- **Drizzle ORM Docs**: https://orm.drizzle.team/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

## Notes

- The app uses React Compiler for automatic performance optimizations
- Tajweed (Quranic recitation rules) visualization is color-coded in the UI
- The app supports multiple Qira'at (recitation styles) and Arabic fonts
- Audio functionality requires proper CORS configuration for external audio URLs
- Mobile deployment requires iOS and Android certificates (not covered in this guide)

---

**Last Updated**: March 2026
**Version**: 1.0.0
