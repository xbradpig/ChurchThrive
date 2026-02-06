# ChurchThrive - Deployment Quick Start

## For Developers: First-Time Setup

### 1. Clone and Install

```bash
git clone https://github.com/xbradpig/ChurchThrive.git
cd ChurchThrive/Church_Thrive
npm install
```

### 2. Set Up Environment

```bash
./scripts/setup-env.sh
```

Then edit `.env.local` with your actual values.

### 3. Test Locally

```bash
npm run dev:web
```

Visit: http://localhost:3000

### 4. Deploy

```bash
./scripts/deploy-web.sh
```

## For DevOps: CI/CD Setup

### 1. GitHub Secrets

Go to: `Settings > Secrets and variables > Actions > New repository secret`

Add these secrets:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_KAKAO_APP_KEY
NEXT_PUBLIC_FCM_VAPID_KEY
FCM_SERVER_KEY
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
EXPO_TOKEN
```

### 2. Cloudflare Pages Setup

1. Go to: https://dash.cloudflare.com
2. Navigate to: Workers & Pages > Create application > Pages
3. Connect your GitHub repository
4. Configure build:
   - **Build command**: `cd Church_Thrive && npm run build:shared && npm run build:web`
   - **Build output directory**: `docs/Church_Thrive/app/.next`
   - **Root directory**: `/`
   - **Environment variables**: Add all secrets from step 1

5. Add custom domain:
   - Go to: Custom domains
   - Add: `churchthrive.kr`
   - Configure DNS (see DNS_CONFIGURATION.md)

### 3. Test Deployment

Push to `main` branch:
```bash
git add .
git commit -m "Initial deployment setup"
git push origin main
```

Watch the deployment:
- GitHub Actions: https://github.com/xbradpig/ChurchThrive/actions
- Cloudflare Pages: https://dash.cloudflare.com

## Common Commands

```bash
# Local development
npm run dev:web              # Start web app
npm run dev:mobile           # Start mobile app

# Building
npm run build:shared         # Build shared package
npm run build:web            # Build web app

# Quality checks
npm run typecheck            # TypeScript check
npm run lint                 # ESLint check
npm test                     # Run tests

# Deployment
./scripts/deploy-web.sh      # Manual web deployment
./scripts/setup-env.sh       # Setup environment
```

## Deployment URLs

- **Production**: https://churchthrive.kr
- **Cloudflare Preview**: https://churchthrive.pages.dev
- **PR Previews**: https://[pr-number].churchthrive.pages.dev
- **Branch Previews**: https://[branch-name].churchthrive.pages.dev

## Troubleshooting

### Build fails
```bash
npm run typecheck           # Check for TypeScript errors
npm run lint                # Check for lint errors
npm run build:web           # Test build locally
```

### Environment variables not working
1. Verify variables in Cloudflare Pages dashboard
2. Ensure `NEXT_PUBLIC_` prefix for client-side vars
3. Redeploy after changing variables

### DNS not resolving
```bash
dig churchthrive.kr         # Check DNS records
```
Wait up to 48 hours for propagation.

## Need Help?

- Full documentation: `docs/dev-agent/07_publishing.md`
- DNS configuration: `DNS_CONFIGURATION.md`
- GitHub Issues: https://github.com/xbradpig/ChurchThrive/issues
