# ChurchThrive Deployment Scripts

This directory contains utility scripts for deploying and managing the ChurchThrive application.

## Available Scripts

### `setup-env.sh`

Sets up your local environment by creating `.env.local` from `.env.example`.

**Usage:**
```bash
./scripts/setup-env.sh
```

**What it does:**
- Creates `.env.local` from `.env.example`
- Prompts before overwriting existing files
- Displays setup instructions for:
  - Local development
  - GitHub Secrets
  - Cloudflare Pages environment variables

**First-time setup:**
```bash
./scripts/setup-env.sh
# Edit .env.local with your actual values
```

### `deploy-web.sh`

Manually deploys the web application to Cloudflare Pages.

**Usage:**
```bash
./scripts/deploy-web.sh
```

**What it does:**
1. Validates `.env.local` exists
2. Installs dependencies
3. Builds shared package
4. Runs type checking
5. Runs linting
6. Builds Next.js app
7. Deploys to Cloudflare Pages

**Requirements:**
- `.env.local` configured (run `setup-env.sh` first)
- Wrangler CLI (auto-installs if missing)
- Cloudflare API credentials

**When to use:**
- Testing deployments locally
- Emergency deployments
- Deploying from a development branch
- Verifying build process

## Prerequisites

### 1. Environment Variables

Create `.env.local` with:
```env
NEXT_PUBLIC_SUPABASE_URL=your-value
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-value
SUPABASE_SERVICE_ROLE_KEY=your-value
NEXT_PUBLIC_KAKAO_APP_KEY=your-value
NEXT_PUBLIC_FCM_VAPID_KEY=your-value
FCM_SERVER_KEY=your-value
```

### 2. Wrangler CLI

Install globally (if not using auto-install):
```bash
npm install -g wrangler
```

Login to Cloudflare:
```bash
wrangler login
```

### 3. Node.js

Required version: 20.x or higher
```bash
node --version  # Should be >= 20.0.0
```

## Troubleshooting

### Permission denied

Make scripts executable:
```bash
chmod +x scripts/*.sh
```

### Environment variables not found

Run setup script first:
```bash
./scripts/setup-env.sh
```

Then edit `.env.local` with actual values.

### Wrangler authentication error

Login to Cloudflare:
```bash
wrangler login
```

Or set API token:
```bash
export CLOUDFLARE_API_TOKEN="your-token"
```

### Build fails

Check for errors:
```bash
npm run typecheck
npm run lint
npm run build:web
```

## CI/CD vs Manual Deployment

### Automatic (CI/CD) - Recommended
- Triggered on push to `main`
- Runs full test suite
- Consistent environment
- Audit trail in GitHub Actions
- No local setup required

### Manual (Scripts) - Use for
- Testing before pushing
- Emergency hotfixes
- Deploying from feature branches
- Debugging build issues
- Learning the deployment process

## Script Development

### Adding New Scripts

1. Create script in this directory
2. Make it executable: `chmod +x script-name.sh`
3. Follow existing patterns:
   - Use color output for clarity
   - Validate prerequisites
   - Provide helpful error messages
   - Document in this README

### Color Codes

Scripts use ANSI color codes:
```bash
RED='\033[0;31m'      # Errors
GREEN='\033[0;32m'    # Success
YELLOW='\033[1;33m'   # Warnings/Steps
BLUE='\033[0;34m'     # Info
NC='\033[0m'          # No Color (reset)
```

## Related Documentation

- **Full deployment guide**: `/docs/dev-agent/07_publishing.md`
- **Quick start**: `/DEPLOYMENT_QUICK_START.md`
- **DNS configuration**: `/DNS_CONFIGURATION.md`
- **GitHub workflows**: `/.github/workflows/`

## Support

For issues or questions:
- GitHub Issues: https://github.com/xbradpig/ChurchThrive/issues
- Documentation: `/docs/dev-agent/`
