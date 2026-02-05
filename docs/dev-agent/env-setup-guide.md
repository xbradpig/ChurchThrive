# ChurchThrive Environment Setup Guide

## Overview

This guide walks you through setting up a complete local development environment for ChurchThrive, including web app, mobile app, and backend services.

**Time Required**: 30-60 minutes

---

## Prerequisites

### System Requirements

- **OS**: macOS, Windows 10/11, or Linux
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 5GB free space minimum
- **Internet**: Stable connection for downloading dependencies

### Required Software

Install the following before proceeding:

1. **Node.js 18.17.0 or higher**
   ```bash
   # Check version
   node --version  # Should be v18.17.0 or higher

   # Install via nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   ```

2. **npm** (comes with Node.js)
   ```bash
   npm --version  # Should be 9.x or higher
   ```

3. **Git**
   ```bash
   git --version

   # Install if needed
   # macOS: xcode-select --install
   # Windows: https://git-scm.com/download/win
   # Linux: sudo apt-get install git
   ```

4. **Supabase CLI**
   ```bash
   npm install -g supabase

   # Verify installation
   supabase --version
   ```

5. **Expo CLI** (for mobile development)
   ```bash
   npm install -g eas-cli

   # Verify installation
   eas --version
   ```

6. **Docker Desktop** (for local Supabase)
   - Download: https://www.docker.com/products/docker-desktop
   - Ensure Docker is running before starting Supabase

---

## Part 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/ChurchThrive.git
cd ChurchThrive

# Navigate to project root
cd "docs/Church_Thrive"
```

**Project Structure:**
```
ChurchThrive/
└── docs/
    └── Church_Thrive/           # Monorepo root
        ├── package.json         # Root package with workspaces
        ├── app/                 # Next.js web app
        ├── mobile/              # Expo mobile app
        ├── packages/
        │   └── shared/          # Shared TypeScript types
        ├── supabase/
        │   ├── migrations/      # SQL migrations
        │   └── functions/       # Edge Functions
        ├── .env.example         # Environment template
        └── wrangler.toml        # Cloudflare config
```

---

## Part 2: Environment Variables Setup

### Step 1: Copy Environment Template

```bash
cp .env.example .env.local
```

### Step 2: Configure Environment Variables

Open `.env.local` and fill in the following. For local development, you'll use local Supabase values (we'll get these in Part 3):

```env
# Supabase (will be filled after Part 3)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=[get-from-supabase-start]
SUPABASE_SERVICE_ROLE_KEY=[get-from-supabase-start]

# Kakao OAuth (optional for local dev)
NEXT_PUBLIC_KAKAO_APP_KEY=your-kakao-app-key

# FCM (optional for local dev)
NEXT_PUBLIC_FCM_VAPID_KEY=your-vapid-key
FCM_SERVER_KEY=your-fcm-server-key
```

**Note:** For local development, Kakao OAuth and FCM can be configured later. Basic auth and database features will work without them.

---

## Part 3: Install Dependencies

ChurchThrive uses npm workspaces for monorepo management.

```bash
# Install all dependencies (root + workspaces)
npm install

# This installs:
# - Root dependencies
# - app/ dependencies (Next.js web app)
# - mobile/ dependencies (Expo mobile app)
# - packages/shared/ dependencies (shared types)
```

**Expected Output:**
```
added 1523 packages in 45s
```

### Verify Installation

```bash
# List workspaces
npm ls --workspaces

# Should show:
# - @churchthrive/shared
# - app
# - mobile
```

---

## Part 4: Setup Local Supabase

### Step 1: Initialize Supabase

```bash
# Initialize Supabase (if not already done)
supabase init

# Expected output: Creates supabase/config.toml
```

### Step 2: Start Local Supabase

```bash
# Start all Supabase services
supabase start

# This will:
# - Pull Docker images (first time only, ~5 minutes)
# - Start PostgreSQL database
# - Start PostgREST API
# - Start GoTrue (auth)
# - Start Realtime server
# - Start Storage server
# - Start Edge Runtime
```

**Expected Output:**
```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Copy API Keys to .env.local

Update `.env.local` with the keys from `supabase start`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Apply Database Migrations

```bash
# Apply all migrations to local database
supabase migration up

# Expected output:
# ✓ Applied 17 migrations
```

### Step 5: Verify Database Setup

Open Supabase Studio: http://localhost:54323

You should see:
- **Tables**: churches, members, sermons, sermon_notes, etc.
- **Storage**: Buckets for avatars, sermon-audio, etc.
- **Auth**: Users table (empty initially)

### Step 6: Seed Database (Optional)

Create a seed file `supabase/seed.sql`:

```sql
-- Insert test church
INSERT INTO churches (id, name, denomination, subscription_tier)
VALUES ('00000000-0000-0000-0000-000000000001', 'Test Church', 'Presbyterian', 'free');

-- Insert test member (admin)
INSERT INTO members (id, church_id, name, phone, email, role, status)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Admin User',
  '010-1234-5678',
  'admin@test.com',
  'admin',
  'active'
);

-- Insert test sermon
INSERT INTO sermons (church_id, title, sermon_date, service_type)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'The Gospel of John',
  '2025-02-02',
  'sunday_morning'
);
```

Apply seed:
```bash
supabase db reset --seed
```

---

## Part 5: Build Shared Package

The shared package contains TypeScript types used by both web and mobile apps.

```bash
# Build shared package
npm run build:shared

# This runs: tsc --build in packages/shared/
```

**Expected Output:**
```
> @churchthrive/shared@0.1.0 build
> tsc --build

✓ Built successfully
```

---

## Part 6: Start Web App Development

### Option A: Development Mode (Recommended)

```bash
# Start web app with hot reload
npm run dev:web

# This runs: next dev in app/ workspace
```

**Expected Output:**
```
> app@0.1.0 dev
> next dev

▲ Next.js 14.1.0
- Local:        http://localhost:3000
- Network:      http://192.168.1.100:3000

✓ Ready in 2.3s
```

### Option B: Production Build (Testing)

```bash
# Build for production
npm run build:web

# Start production server
cd app
npm run start
```

### Access Web App

Open browser: http://localhost:3000

**Default Pages:**
- `/` - Landing page
- `/auth/login` - Login page
- `/dashboard` - Main dashboard (requires auth)

### Verify Features

1. **Authentication**: Try logging in with test credentials
2. **Database**: Check members list loads
3. **Realtime**: Open in two tabs, make changes, verify sync

---

## Part 7: Start Mobile App Development

### Step 1: Install Expo Go App

On your physical device:
- **iOS**: Download "Expo Go" from App Store
- **Android**: Download "Expo Go" from Google Play Store

### Step 2: Start Expo Dev Server

```bash
# Start mobile app
npm run dev:mobile

# Or directly from mobile workspace
cd mobile
npm run dev
```

**Expected Output:**
```
> mobile@0.1.0 dev
> expo start

Starting Metro Bundler
› Metro waiting on exp://192.168.1.100:8081

› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

### Step 3: Connect Device

**Option A: QR Code (Physical Device)**
- Scan QR code with Expo Go app
- App will load on your device

**Option B: iOS Simulator (macOS only)**
```bash
# Press 'i' in Expo terminal
# or
npm run ios
```

**Option C: Android Emulator**
```bash
# Press 'a' in Expo terminal
# or
npm run android
```

### Step 4: Configure Network Access

For mobile to access local Supabase:

1. **Find your local IP**:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "

   # Windows
   ipconfig
   ```

2. **Update mobile/.env.local**:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=http://[YOUR_LOCAL_IP]:54321
   EXPO_PUBLIC_SUPABASE_ANON_KEY=[same-as-web-app]
   ```

3. **Restart Expo**:
   ```bash
   # Press 'r' to reload
   ```

### Verify Mobile App

- App should load without errors
- Try navigating between screens
- Test data fetching (members list, sermons, etc.)

---

## Part 8: Supabase Edge Functions (Local)

### Start Edge Functions Runtime

```bash
# Serve all functions locally
supabase functions serve

# Or serve specific function
supabase functions serve send-notification --env-file .env.local
```

**Expected Output:**
```
Serving functions on http://localhost:54321/functions/v1/
  - send-notification
  - process-stt
  - daily-digest
```

### Test Edge Function

```bash
# Test send-notification function
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-notification' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  --header 'Content-Type: application/json' \
  --data '{
    "tokens": ["test-token"],
    "title": "Test Notification",
    "body": "Hello from local dev!"
  }'
```

---

## Part 9: Development Workflow

### Typical Daily Workflow

```bash
# 1. Start Supabase (if not running)
supabase start

# 2. Start web app
npm run dev:web

# 3. In separate terminal: Start mobile app
npm run dev:mobile

# 4. Open Supabase Studio for database inspection
# Browser: http://localhost:54323
```

### Making Database Changes

```bash
# 1. Create new migration
supabase migration new add_events_table

# 2. Edit migration file in supabase/migrations/

# 3. Apply migration
supabase migration up

# 4. Generate updated TypeScript types
supabase gen types typescript --local > packages/shared/src/types/database.ts

# 5. Rebuild shared package
npm run build:shared

# 6. Restart dev servers to pick up new types
```

### Code Changes Auto-Reload

- **Web app**: Hot Module Replacement (HMR) - instant updates
- **Mobile app**: Fast Refresh - updates on save
- **Shared package**: Rebuild required (`npm run build:shared`)

---

## Part 10: Troubleshooting

### Docker Not Running

**Error:**
```
Error: Cannot connect to the Docker daemon
```

**Solution:**
```bash
# macOS: Open Docker Desktop app
# Windows: Start Docker Desktop
# Linux: sudo systemctl start docker
```

### Port Already in Use

**Error:**
```
Error: Port 3000 is already in use
```

**Solution:**
```bash
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 [PID]  # macOS/Linux
taskkill /PID [PID] /F  # Windows

# Or use different port
PORT=3001 npm run dev:web
```

### Supabase Migration Fails

**Error:**
```
Error: migration up failed
```

**Solution:**
```bash
# Check migration syntax
cat supabase/migrations/[migration-file].sql

# Reset database (WARNING: deletes all data)
supabase db reset

# Or fix migration and reapply
supabase migration repair [version] --status reverted
supabase migration up
```

### Module Not Found

**Error:**
```
Error: Cannot find module '@churchthrive/shared'
```

**Solution:**
```bash
# Rebuild shared package
npm run build:shared

# Or reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Expo QR Code Not Working

**Error:**
```
Unable to open URL: exp://...
```

**Solution:**
1. Ensure phone and computer are on same WiFi network
2. Check firewall settings (allow port 8081)
3. Try tunnel mode:
   ```bash
   npx expo start --tunnel
   ```

### Supabase Auth Not Working

**Error:**
```
User not authenticated
```

**Solution:**
```bash
# Check environment variables are set
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Verify Supabase is running
supabase status

# Check browser console for detailed errors
```

### TypeScript Errors After Schema Change

**Error:**
```
Property 'new_column' does not exist on type...
```

**Solution:**
```bash
# Regenerate types
supabase gen types typescript --local > packages/shared/src/types/database.ts

# Rebuild shared package
npm run build:shared

# Restart dev servers
```

---

## Part 11: Database Management

### Supabase Studio

Access at: http://localhost:54323

**Features:**
- **Table Editor**: View and edit data
- **SQL Editor**: Run custom queries
- **Auth**: Manage users
- **Storage**: Manage files
- **Database**: View schema
- **API Docs**: Auto-generated API documentation

### Common SQL Queries

```sql
-- View all members
SELECT * FROM members ORDER BY name;

-- View sermons with preacher names
SELECT s.*, m.name as preacher_name
FROM sermons s
LEFT JOIN members m ON s.preacher_id = m.id
ORDER BY s.sermon_date DESC;

-- Count sermon notes per sermon
SELECT
  s.title,
  COUNT(sn.id) as note_count
FROM sermons s
LEFT JOIN sermon_notes sn ON sn.sermon_id = s.id
GROUP BY s.id, s.title
ORDER BY note_count DESC;

-- View recent attendances
SELECT
  a.event_date,
  a.event_type,
  m.name as member_name,
  a.checked_in_at
FROM attendances a
JOIN members m ON m.id = a.member_id
ORDER BY a.checked_in_at DESC
LIMIT 50;
```

### Database Backup (Local)

```bash
# Dump database to file
supabase db dump -f backup.sql

# Restore from backup
psql postgres://postgres:postgres@localhost:54322/postgres < backup.sql
```

---

## Part 12: Testing

### Unit Tests

```bash
# Run all tests
npm run test

# Run tests for specific workspace
npm run test --workspace=app
npm run test --workspace=mobile
npm run test --workspace=@churchthrive/shared

# Run tests in watch mode
npm run test:watch --workspace=app
```

### Integration Tests

```bash
# Run integration tests (requires local Supabase running)
npm run test:integration
```

### E2E Tests

```bash
# Install Playwright
npm install -D @playwright/test

# Run E2E tests
npm run test:e2e
```

---

## Part 13: Code Quality Tools

### Linting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### Type Checking

```bash
# Check TypeScript types
npm run typecheck

# Check specific workspace
npm run typecheck --workspace=app
```

### Formatting

```bash
# Format code with Prettier
npm run format

# Check formatting without changing
npm run format:check
```

---

## Part 14: Useful Commands Reference

### Monorepo Management

```bash
# Install dependency to specific workspace
npm install [package] --workspace=app
npm install [package] --workspace=mobile
npm install [package] --workspace=@churchthrive/shared

# Run script in specific workspace
npm run [script] --workspace=app

# Clean all node_modules and reinstall
npm run clean
npm install
```

### Supabase Commands

```bash
# Start Supabase
supabase start

# Stop Supabase
supabase stop

# Restart Supabase
supabase stop && supabase start

# View status
supabase status

# Reset database (delete all data)
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > packages/shared/src/types/database.ts

# Create new migration
supabase migration new [name]

# List migrations
supabase migration list

# Deploy Edge Function locally
supabase functions serve [function-name]

# View logs
supabase logs
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/[feature-name]

# Stage changes
git add .

# Commit with conventional commit format
git commit -m "feat: add sermon search feature"

# Push to remote
git push origin feature/[feature-name]

# Create PR on GitHub
```

---

## Part 15: VS Code Setup (Recommended)

### Recommended Extensions

Install these VS Code extensions:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "supabase.supabase-vscode",
    "expo.vscode-expo-tools",
    "mikestead.dotenv"
  ]
}
```

### Workspace Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev --workspace=app"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

---

## Part 16: Next Steps

After completing this setup:

1. **Explore the codebase**:
   - Review component structure in `app/src/components/`
   - Check hooks in `app/src/hooks/`
   - Understand state management in `app/src/stores/`

2. **Read documentation**:
   - [API Documentation](./api-docs.md)
   - [Contributing Guide](./contributing-guide.md)
   - [Deployment Guide](./deployment-guide.md)

3. **Try making changes**:
   - Add a new page
   - Create a new component
   - Add a database migration
   - Implement a new feature

4. **Join the team**:
   - Set up team communication (Slack/Discord)
   - Attend daily standup
   - Review open issues and PRs

---

## Support

If you encounter issues not covered in this guide:

1. Check [Troubleshooting](#part-10-troubleshooting) section
2. Search existing GitHub issues
3. Ask in team chat
4. Create new issue with:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment details (OS, Node version, etc.)

---

## Conclusion

You now have a fully functional local development environment! 🎉

**Quick Start Commands:**
```bash
# Terminal 1: Start Supabase
supabase start

# Terminal 2: Start web app
npm run dev:web

# Terminal 3: Start mobile app
npm run dev:mobile

# Browser: Open Supabase Studio
http://localhost:54323
```

Happy coding! 🚀
