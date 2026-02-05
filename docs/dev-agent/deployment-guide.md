# ChurchThrive Deployment Guide

## Overview

This guide covers deploying ChurchThrive to production environments:
- **Web App**: Cloudflare Pages
- **Mobile App**: Expo Application Services (EAS)
- **Backend**: Supabase Cloud
- **CI/CD**: GitHub Actions

---

## Prerequisites

### Required Accounts
- [ ] GitHub account (for repository and Actions)
- [ ] Cloudflare account (for Pages deployment)
- [ ] Supabase account (for backend)
- [ ] Expo account (for mobile builds)
- [ ] Domain registrar account (for churchthrive.kr)

### Required CLI Tools
- [ ] Node.js 18.17.0 or higher
- [ ] npm (comes with Node.js)
- [ ] Supabase CLI (`npm install -g supabase`)
- [ ] Expo CLI (`npm install -g eas-cli`)
- [ ] Wrangler CLI (`npm install -g wrangler`)

---

## Part 1: Supabase Backend Setup

### Step 1: Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Choose organization or create one
4. Fill in project details:
   - **Name**: `churchthrive-prod`
   - **Database Password**: Generate strong password (save securely!)
   - **Region**: Choose closest to South Korea (e.g., Singapore, Tokyo)
   - **Pricing Plan**: Start with Free, upgrade to Pro when ready

### Step 2: Run Database Migrations

```bash
cd "docs/Church_Thrive"

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Push all migrations
supabase db push

# Verify migrations
supabase migration list
```

**Expected Output:**
```
✓ Linked to project: churchthrive-prod
✓ Applied 17 migrations
  - 20250101000001_create_initial_schema.sql
  - 20250101000002_add_rls_policies.sql
  - ...
```

### Step 3: Configure Storage Buckets

```bash
# Create storage buckets
supabase storage create avatars --public
supabase storage create sermon-audio --public
supabase storage create sermon-notes --private
supabase storage create attachments --private
```

Or via Supabase Dashboard:
1. Go to **Storage** section
2. Click **New Bucket**
3. Create each bucket with appropriate privacy settings

### Step 4: Enable Realtime

1. Go to **Database** → **Replication**
2. Enable replication for tables:
   - `sermon_notes`
   - `announcements`
   - `attendances`
   - `note_feedbacks`

### Step 5: Deploy Edge Functions

```bash
cd supabase/functions

# Deploy all functions
supabase functions deploy send-notification --no-verify-jwt
supabase functions deploy process-stt --no-verify-jwt
supabase functions deploy daily-digest

# Verify deployment
supabase functions list
```

### Step 6: Set Environment Variables (Supabase)

Go to **Project Settings** → **Edge Functions** → **Secrets**:

```bash
supabase secrets set FCM_SERVER_KEY="your-fcm-server-key"
supabase secrets set GOOGLE_CLOUD_API_KEY="your-google-cloud-api-key"
supabase secrets set RESEND_API_KEY="your-resend-api-key"
```

### Step 7: Enable Extensions

```sql
-- Run in SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;
```

### Step 8: Schedule Daily Digest

```sql
-- Run in SQL Editor
SELECT cron.schedule(
  'daily-digest',
  '0 7 * * *',  -- 7 AM daily
  $$
  SELECT
    net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/daily-digest',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    );
  $$
);
```

### Step 9: Configure Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Kakao**:
   - **Client ID**: Get from Kakao Developers Console
   - **Client Secret**: Get from Kakao Developers Console
   - **Redirect URL**: `https://your-project-ref.supabase.co/auth/v1/callback`
3. Update Kakao Developers Console:
   - Add redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`
   - Add site domain: `https://churchthrive.kr`

### Step 10: Get API Keys

1. Go to **Project Settings** → **API**
2. Copy the following:
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **anon public key**: For client-side use
   - **service_role key**: For server-side use (keep secure!)

---

## Part 2: Web App Deployment (Cloudflare Pages)

### Step 1: Prepare Environment Variables

Create `.env.production` in project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Kakao OAuth
NEXT_PUBLIC_KAKAO_APP_KEY=your-kakao-app-key

# FCM
NEXT_PUBLIC_FCM_VAPID_KEY=your-vapid-key
FCM_SERVER_KEY=your-fcm-server-key
```

### Step 2: Verify wrangler.toml

Check `wrangler.toml` configuration:

```toml
name = "churchthrive"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "./app/.vercel/output/static"

[build]
command = "npm run build:shared && npm run build:web"

[build.upload]
format = "service-worker"

[vars]
NODE_VERSION = "20"

[site]
bucket = "./app/.vercel/output/static"
```

### Step 3: Build Locally (Test)

```bash
cd "docs/Church_Thrive"

# Install dependencies
npm install

# Build shared package
npm run build:shared

# Build web app
npm run build:web

# Verify build output
ls -la app/.vercel/output/static
```

### Step 4: Connect to Cloudflare

```bash
# Login to Cloudflare
wrangler login

# Create Pages project
wrangler pages project create churchthrive
```

### Step 5: Deploy to Cloudflare Pages

#### Option A: Manual Deployment

```bash
# From project root
wrangler pages deploy app/.vercel/output/static \
  --project-name=churchthrive \
  --branch=main
```

#### Option B: GitHub Integration (Recommended)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages**
3. Click **Create application** → **Pages** → **Connect to Git**
4. Select your GitHub repository
5. Configure build settings:
   - **Build command**: `npm run build:shared && npm run build:web`
   - **Build output directory**: `app/.vercel/output/static`
   - **Root directory**: `/`
   - **Environment variables**: (see Step 6)

### Step 6: Set Environment Variables (Cloudflare)

In Cloudflare Pages settings:

**Production**:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_KAKAO_APP_KEY=your-kakao-app-key
NEXT_PUBLIC_FCM_VAPID_KEY=your-vapid-key
FCM_SERVER_KEY=your-fcm-server-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_VERSION=20
```

**Preview** (same values for testing):
```
(Same as production or use staging Supabase project)
```

### Step 7: Configure Custom Domain

1. In Cloudflare Pages, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter: `churchthrive.kr` and `www.churchthrive.kr`
4. Cloudflare will provide DNS records

### Step 8: Update DNS Settings

In your domain registrar (or Cloudflare DNS):

**Option A: Cloudflare Nameservers (Recommended)**
```
ns1.cloudflare.com
ns2.cloudflare.com
```

**Option B: CNAME Records**
```
Type: CNAME
Name: @
Target: churchthrive.pages.dev

Type: CNAME
Name: www
Target: churchthrive.pages.dev
```

### Step 9: Enable HTTPS

1. In Cloudflare Pages, go to **Settings** → **SSL/TLS**
2. Set to **Full (strict)**
3. Enable **Always Use HTTPS**
4. Enable **Automatic HTTPS Rewrites**

### Step 10: Verify Deployment

```bash
# Check deployment status
wrangler pages deployment list --project-name=churchthrive

# Test the site
curl https://churchthrive.kr
```

Visit:
- Production: `https://churchthrive.kr`
- Preview: `https://[commit-hash].churchthrive.pages.dev`

---

## Part 3: Mobile App Deployment (EAS)

### Step 1: Configure EAS

Check `mobile/eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true,
        "buildConfiguration": "Debug"
      },
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleDebug"
      },
      "env": {
        "APP_VARIANT": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false,
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "apk"
      },
      "env": {
        "APP_VARIANT": "preview"
      }
    },
    "production": {
      "ios": {
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "aab"
      },
      "env": {
        "APP_VARIANT": "production"
      }
    }
  }
}
```

### Step 2: Setup Expo Account

```bash
# Login to Expo
eas login

# Configure project
cd mobile
eas build:configure
```

### Step 3: Configure App Credentials

Update `mobile/app.json`:

```json
{
  "expo": {
    "name": "ChurchThrive",
    "slug": "churchthrive",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "kr.churchthrive.app",
      "buildNumber": "1"
    },
    "android": {
      "package": "kr.churchthrive.app",
      "versionCode": 1
    }
  }
}
```

### Step 4: Build for Android

#### Internal Testing Build

```bash
cd mobile

# Build APK for internal testing
eas build --platform android --profile preview
```

#### Production Build

```bash
# Build AAB for Google Play Store
eas build --platform android --profile production
```

**Build Output:**
- APK: Downloadable directly from EAS
- AAB: For upload to Google Play Console

### Step 5: Build for iOS

#### Prerequisites
- Apple Developer Account ($99/year)
- Provisioning profiles and certificates

```bash
cd mobile

# Build for internal testing
eas build --platform ios --profile preview

# Build for App Store
eas build --platform ios --profile production
```

**Note:** First build will guide you through credential setup:
- Choose automatic or manual credential management
- Provide Apple Developer credentials
- Select App Store Connect app

### Step 6: Submit to App Stores

#### Android (Google Play)

1. Go to [Google Play Console](https://play.google.com/console)
2. Create app: "ChurchThrive"
3. Upload AAB from EAS build
4. Fill in store listing:
   - Title: "ChurchThrive - 교회 관리 앱"
   - Short description: "교회 총괄 관리를 위한 올인원 솔루션"
   - Full description: (See marketing materials)
   - Screenshots: Provide 5-8 screenshots
   - Feature graphic: 1024x500px image
5. Set content rating
6. Submit for review

#### iOS (App Store)

```bash
# Submit to App Store
eas submit --platform ios --profile production
```

Or manually:
1. Download IPA from EAS
2. Upload to App Store Connect via Transporter
3. Complete app metadata in App Store Connect
4. Submit for review

### Step 7: Setup Push Notifications

#### Firebase Cloud Messaging (FCM)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Add Android app: `kr.churchthrive.app`
3. Download `google-services.json`
4. Place in `mobile/android/app/`
5. Add iOS app: `kr.churchthrive.app`
6. Download `GoogleService-Info.plist`
7. Place in `mobile/ios/`

#### Configure EAS Build

Update `eas.json` with secrets:

```bash
# Set FCM server key
eas secret:create --scope project --name FCM_SERVER_KEY --value "your-fcm-server-key"

# Set APNs key (iOS)
eas secret:create --scope project --name APNS_KEY --value "your-apns-key"
```

### Step 8: Over-the-Air (OTA) Updates

```bash
# Publish update without rebuilding
eas update --branch production --message "Fix: sermon note sync"

# Publish to preview
eas update --branch preview --message "Feature: new dashboard"
```

**Update Policy:**
- Critical fixes: Immediate OTA
- Feature updates: On next app launch
- Breaking changes: Require new build

---

## Part 4: CI/CD with GitHub Actions

### Workflow Files (Create if not exists)

#### `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build shared package
        run: npm run build:shared

      - name: Build web app
        run: npm run build:web
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_KAKAO_APP_KEY: ${{ secrets.NEXT_PUBLIC_KAKAO_APP_KEY }}
          NEXT_PUBLIC_FCM_VAPID_KEY: ${{ secrets.NEXT_PUBLIC_FCM_VAPID_KEY }}

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: churchthrive
          directory: app/.vercel/output/static
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

#### `.github/workflows/mobile-build.yml`

```yaml
name: Mobile Build

on:
  push:
    branches: [main]
    paths:
      - 'mobile/**'
      - 'packages/shared/**'

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: npm ci

      - name: Build Android Preview
        run: eas build --platform android --profile preview --non-interactive
        working-directory: mobile
```

### Step 1: Configure GitHub Secrets

Go to **Repository Settings** → **Secrets and variables** → **Actions**:

```
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
EXPO_TOKEN=your-expo-token
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_KAKAO_APP_KEY=your-kakao-app-key
NEXT_PUBLIC_FCM_VAPID_KEY=your-vapid-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FCM_SERVER_KEY=your-fcm-server-key
```

### Step 2: Enable Workflows

1. Commit workflow files to repository
2. Push to GitHub
3. Go to **Actions** tab to verify workflows run

### Step 3: Branch Protection

Configure branch protection for `main`:

1. Go to **Settings** → **Branches**
2. Add rule for `main`:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass (CI)
   - ✅ Require branches to be up to date
   - ✅ Include administrators

---

## Part 5: Monitoring & Analytics

### Cloudflare Analytics

1. Go to **Analytics & Logs** in Cloudflare
2. Monitor:
   - Page views
   - Unique visitors
   - Bandwidth usage
   - Error rate
   - Performance metrics

### Supabase Monitoring

1. Go to **Reports** in Supabase Dashboard
2. Monitor:
   - Database size
   - API requests
   - Active connections
   - Function invocations
   - Storage usage

### Sentry (Error Tracking)

```bash
# Install Sentry
npm install @sentry/nextjs @sentry/react-native

# Configure in next.config.js
module.exports = {
  sentry: {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
}
```

---

## Part 6: Production Checklist

### Before Launch

- [ ] All environment variables set correctly
- [ ] Database migrations applied
- [ ] RLS policies enabled and tested
- [ ] Storage buckets created with correct policies
- [ ] Edge Functions deployed and tested
- [ ] Authentication providers configured (Kakao)
- [ ] Custom domain configured and SSL enabled
- [ ] Mobile apps submitted to stores (or APK available)
- [ ] Push notifications tested
- [ ] Monitoring and alerts configured
- [ ] Backup strategy implemented
- [ ] Documentation updated

### Security

- [ ] Service role keys stored securely (never in code)
- [ ] RLS policies prevent cross-church data access
- [ ] API keys rotated regularly
- [ ] HTTPS enforced on all endpoints
- [ ] Rate limiting configured
- [ ] Input validation on all forms
- [ ] SQL injection prevention (via Supabase)

### Performance

- [ ] Database indexes created for common queries
- [ ] Image optimization enabled
- [ ] CDN caching configured (Cloudflare)
- [ ] Lazy loading implemented
- [ ] Bundle size optimized
- [ ] API response caching where appropriate

### Compliance

- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] GDPR compliance (data export/deletion)
- [ ] Korean Personal Information Protection Act compliance
- [ ] Cookie consent (if using analytics)

---

## Part 7: Rollback Procedures

### Web App Rollback

```bash
# List deployments
wrangler pages deployment list --project-name=churchthrive

# Rollback to previous deployment
wrangler pages deployment rollback [deployment-id]
```

Or via Cloudflare Dashboard:
1. Go to **Workers & Pages** → **churchthrive**
2. Go to **Deployments**
3. Find previous successful deployment
4. Click **Rollback to this deployment**

### Mobile App Rollback

```bash
# Revert OTA update
eas update --branch production --message "Rollback" --republish [previous-update-id]

# For full app rollback, submit previous version to stores
```

### Database Rollback

```bash
# Rollback single migration
supabase migration down

# Restore from backup
supabase db restore --from backup-timestamp
```

---

## Part 8: Cost Estimation

### Supabase (per month)

- **Free tier**: $0
  - 500MB database
  - 1GB storage
  - 2GB bandwidth
- **Pro tier**: $25
  - 8GB database
  - 100GB storage
  - 50GB bandwidth
- **Team tier**: $599
  - 100GB database
  - 200GB storage
  - 250GB bandwidth

### Cloudflare Pages

- **Free tier**: $0
  - Unlimited requests
  - Unlimited bandwidth
  - 500 builds/month
- **Pro tier**: $20
  - Preview deployments
  - Advanced analytics

### EAS Build & Submit

- **Free tier**: $0
  - Priority builds require paid plan
- **Production tier**: $29/user/month
  - Faster builds
  - Priority support

### Estimated Total (Small Church)

- **Supabase**: $0-25/month
- **Cloudflare**: $0-20/month
- **EAS**: $0-29/month
- **Domain**: $10-15/year
- **Total**: $0-74/month + domain

---

## Support & Troubleshooting

### Common Issues

**Build Fails on Cloudflare**
- Check Node.js version (should be 20)
- Verify all dependencies in package.json
- Check build logs for specific errors

**Mobile Build Fails on EAS**
- Verify eas.json configuration
- Check for missing credentials
- Review build logs in EAS dashboard

**Supabase Connection Fails**
- Verify SUPABASE_URL and ANON_KEY
- Check project is not paused
- Verify RLS policies allow access

**Push Notifications Not Working**
- Verify FCM_SERVER_KEY is set
- Check device token registration
- Review Firebase Console logs

### Getting Help

- Cloudflare Docs: https://developers.cloudflare.com/pages/
- Supabase Docs: https://supabase.com/docs
- Expo Docs: https://docs.expo.dev/
- GitHub Issues: [Repository URL]

---

## Conclusion

Following this guide, you should have:
- ✅ Web app deployed to Cloudflare Pages with custom domain
- ✅ Mobile apps built and ready for distribution
- ✅ Backend running on Supabase with all features
- ✅ CI/CD pipeline automated via GitHub Actions
- ✅ Monitoring and error tracking configured
- ✅ Production-ready environment

For ongoing maintenance, refer to the [Environment Setup Guide](./env-setup-guide.md) for local development workflows.
