# ChurchThrive Deployment Documentation

Welcome to the ChurchThrive deployment documentation. This guide will help you deploy and manage the ChurchThrive web application.

## Quick Navigation

### For First-Time Setup
Start here if this is your first time deploying ChurchThrive:

1. **[Deployment Quick Start](./DEPLOYMENT_QUICK_START.md)** - Get up and running in 15 minutes
2. **[Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)** - Step-by-step deployment guide
3. **[Setup Environment Script](./scripts/setup-env.sh)** - Automated environment setup

### For Configuration
Detailed configuration guides:

1. **[DNS Configuration](./DNS_CONFIGURATION.md)** - Complete DNS and domain setup
2. **[Cloudflare Pages Config](./wrangler.toml)** - Cloudflare Pages settings
3. **[Docker Configuration](./Dockerfile)** - Container deployment option

### For Deployment
Different deployment methods:

1. **[Deploy Web Script](./scripts/deploy-web.sh)** - Manual deployment
2. **[CI/CD Workflows](../../.github/workflows/)** - Automated deployment
3. **[Scripts Documentation](./scripts/README.md)** - Deployment scripts guide

### For Reference
Comprehensive documentation:

1. **[Full Publishing Documentation](../dev-agent/07_publishing.md)** - Complete stage 7 documentation
2. **[Publishing Summary](./PUBLISHING_SUMMARY.md)** - Overview of all created files

---

## Documentation Structure

```
ChurchThrive/
├── .github/workflows/          # CI/CD automation
│   ├── ci.yml                 # Continuous Integration
│   ├── deploy.yml             # Web deployment
│   └── mobile-build.yml       # Mobile builds
│
├── Church_Thrive/
│   ├── README_DEPLOYMENT.md           # This file
│   ├── DEPLOYMENT_QUICK_START.md     # Quick reference
│   ├── DEPLOYMENT_CHECKLIST.md       # Step-by-step checklist
│   ├── DNS_CONFIGURATION.md          # DNS setup guide
│   ├── PUBLISHING_SUMMARY.md         # Files created summary
│   │
│   ├── scripts/
│   │   ├── README.md                 # Scripts documentation
│   │   ├── setup-env.sh              # Environment setup
│   │   └── deploy-web.sh             # Manual deployment
│   │
│   ├── wrangler.toml                 # Cloudflare config
│   ├── Dockerfile                    # Container deployment
│   └── .dockerignore                 # Docker exclusions
│   │
│   └── dev-agent/
│       └── 07_publishing.md               # Full documentation (18KB)
```

---

## Getting Started

### 1. Quick Start (15 minutes)

For developers who want to deploy quickly:

```bash
# 1. Clone and install
git clone https://github.com/xbradpig/ChurchThrive.git
cd ChurchThrive/Church_Thrive
npm install

# 2. Setup environment
./scripts/setup-env.sh
# Edit .env.local with actual values

# 3. Test locally
npm run dev:web

# 4. Deploy
./scripts/deploy-web.sh
```

See: **[DEPLOYMENT_QUICK_START.md](./DEPLOYMENT_QUICK_START.md)**

### 2. Complete Setup (1-2 hours)

For production deployment with full configuration:

Follow the complete checklist:
**[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)**

This includes:
- GitHub Secrets configuration
- Cloudflare Pages setup
- DNS configuration
- SSL/TLS setup
- Monitoring setup

### 3. Understanding the System

For DevOps and technical leads:

Read the full documentation:
**[07_publishing.md](../dev-agent/07_publishing.md)**

This covers:
- Architecture decisions
- CI/CD pipeline details
- Security considerations
- Performance optimization
- Troubleshooting guide

---

## Deployment Methods

### Method 1: Automated CI/CD (Recommended)

**Trigger**: Push to `main` branch

**What happens**:
1. CI workflow runs tests and builds
2. Deploy workflow deploys to Cloudflare Pages
3. Site goes live at churchthrive.kr

**Setup required**:
- GitHub Secrets configured
- Cloudflare Pages project created
- Custom domain added

**Advantages**:
- Fully automated
- Consistent builds
- Audit trail
- No local setup needed

**See**: `/.github/workflows/deploy.yml`

### Method 2: Manual Deployment

**Trigger**: Run `./scripts/deploy-web.sh`

**What happens**:
1. Script validates environment
2. Installs dependencies
3. Runs quality checks
4. Builds application
5. Deploys via Wrangler CLI

**Use for**:
- Testing before pushing
- Emergency hotfixes
- Feature branch testing
- Learning the process

**See**: [scripts/deploy-web.sh](./scripts/deploy-web.sh)

### Method 3: Docker Container

**Build image**:
```bash
docker build -t churchthrive-web .
```

**Run container**:
```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=... \
  churchthrive-web
```

**Use for**:
- Self-hosting
- On-premise deployment
- Development consistency

**See**: [Dockerfile](./Dockerfile)

### Method 4: Preview Deployments

**Trigger**: Open pull request

**What happens**:
- Automatic preview deployment
- Unique URL for testing
- Isolated environment

**URL format**: `https://[pr-number].churchthrive.pages.dev`

**Use for**:
- Feature review
- Client demos
- QA testing

---

## Common Tasks

### Setting Up Environment

```bash
./scripts/setup-env.sh
```

This creates `.env.local` from `.env.example` with helpful instructions.

### Deploying to Production

```bash
# Automatic (push to main)
git push origin main

# Manual
./scripts/deploy-web.sh
```

### Checking Deployment Status

- GitHub Actions: https://github.com/xbradpig/ChurchThrive/actions
- Cloudflare Pages: https://dash.cloudflare.com

### Rolling Back

```bash
# In Cloudflare Pages dashboard:
# 1. Go to deployments
# 2. Find previous successful deployment
# 3. Click "Rollback to this deployment"
```

### Viewing Logs

**CI/CD logs**:
- GitHub Actions > Workflow run > Job logs

**Cloudflare logs**:
- Workers & Pages > churchthrive > Logs

**Local logs**:
```bash
npm run build:web 2>&1 | tee build.log
```

---

## Environment Variables

### Required Variables

Create `.env.local` with these values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Kakao OAuth
NEXT_PUBLIC_KAKAO_APP_KEY=your-kakao-app-key

# Firebase Cloud Messaging
NEXT_PUBLIC_FCM_VAPID_KEY=your-vapid-key
FCM_SERVER_KEY=your-fcm-server-key
```

### Where to Set Them

**Local Development**:
- File: `.env.local`
- Use: `./scripts/setup-env.sh`

**GitHub Actions**:
- Location: Repository Settings > Secrets
- 11 secrets required

**Cloudflare Pages**:
- Location: Workers & Pages > Settings > Environment variables
- Same as GitHub Secrets

**See**: [DEPLOYMENT_QUICK_START.md](./DEPLOYMENT_QUICK_START.md#setting-up-environment-variables)

---

## Deployment URLs

| Environment | URL | Purpose |
|-------------|-----|---------|
| Production | https://churchthrive.kr | Live production site |
| Preview | https://churchthrive.pages.dev | Cloudflare preview |
| PR Previews | https://[pr-number].churchthrive.pages.dev | Pull request testing |
| Branch | https://[branch].churchthrive.pages.dev | Feature branch testing |

---

## Troubleshooting

### Quick Fixes

**Build fails**:
```bash
npm run typecheck    # Check types
npm run lint         # Check linting
npm run build:web    # Test build
```

**Deploy fails**:
1. Check GitHub Secrets
2. Verify Cloudflare API token
3. Review logs
4. Try manual deployment

**DNS not working**:
```bash
dig churchthrive.kr
```
Wait up to 48 hours for propagation.

**Environment variables not working**:
1. Check spelling (case-sensitive)
2. Use `NEXT_PUBLIC_` prefix for client
3. Redeploy after changes

### Detailed Troubleshooting

See full troubleshooting guide:
- **[07_publishing.md - Troubleshooting](../dev-agent/07_publishing.md#troubleshooting-guide)**
- **[DNS_CONFIGURATION.md - Troubleshooting](./DNS_CONFIGURATION.md#troubleshooting)**

---

## Support

### Documentation

- **Quick Start**: [DEPLOYMENT_QUICK_START.md](./DEPLOYMENT_QUICK_START.md)
- **Checklist**: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **Full Guide**: [07_publishing.md](../dev-agent/07_publishing.md)
- **DNS Setup**: [DNS_CONFIGURATION.md](./DNS_CONFIGURATION.md)
- **Scripts**: [scripts/README.md](./scripts/README.md)

### Dashboards

- **GitHub Actions**: https://github.com/xbradpig/ChurchThrive/actions
- **Cloudflare Pages**: https://dash.cloudflare.com
- **Supabase**: https://app.supabase.com
- **Expo**: https://expo.dev

### External Resources

- **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages
- **Next.js on Cloudflare**: https://developers.cloudflare.com/pages/framework-guides/nextjs
- **GitHub Actions**: https://docs.github.com/en/actions
- **Wrangler CLI**: https://developers.cloudflare.com/workers/wrangler

### Getting Help

- **GitHub Issues**: https://github.com/xbradpig/ChurchThrive/issues
- **GitHub Discussions**: https://github.com/xbradpig/ChurchThrive/discussions
- **Cloudflare Community**: https://community.cloudflare.com

---

## Maintenance

### Regular Tasks

**Weekly**:
- Review deployment logs
- Check for failed builds
- Monitor performance metrics

**Monthly**:
- Review Lighthouse scores
- Check SSL certificate expiration (auto-renews)
- Update dependencies
- Review analytics

**Quarterly**:
- Security audit
- Performance optimization
- Cost review
- Documentation updates

### Backup and Recovery

**Backup locations**:
- GitHub repository (code)
- Cloudflare Pages (deployments)
- Supabase (database)

**Recovery process**:
1. Identify last good deployment
2. Rollback in Cloudflare dashboard
3. Or redeploy from Git commit

---

## Security

### Best Practices

- Never commit `.env.local` (in .gitignore)
- Use GitHub Secrets for CI/CD
- Rotate API keys regularly
- Enable 2FA on all accounts
- Review access logs monthly

### Security Checklist

- [ ] SSL/TLS enabled (HTTPS)
- [ ] Environment variables secure
- [ ] Secrets not in code
- [ ] CORS configured
- [ ] Security headers set
- [ ] Rate limiting enabled
- [ ] Monitoring active

**See**: [07_publishing.md - Security](../dev-agent/07_publishing.md#security-considerations)

---

## Performance

### Target Metrics

**Lighthouse Scores**:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 100

**Load Times**:
- First Contentful Paint: < 1s
- Time to Interactive: < 2s
- Total Page Load: < 2s

**Cloudflare Benefits**:
- 275+ global CDN locations
- Sub-100ms response in Korea
- Unlimited bandwidth
- Automatic DDoS protection

### Monitoring

- Cloudflare Analytics (built-in)
- Google Analytics (optional)
- Lighthouse CI (automated)
- Uptime monitoring (optional)

---

## Additional Resources

### Created Files (13 total)

1. **.github/workflows/ci.yml** - CI pipeline
2. **.github/workflows/deploy.yml** - Deployment pipeline
3. **.github/workflows/mobile-build.yml** - Mobile builds
4. **scripts/deploy-web.sh** - Manual deployment
5. **scripts/setup-env.sh** - Environment setup
6. **scripts/README.md** - Scripts docs
7. **wrangler.toml** - Cloudflare config
8. **Dockerfile** - Container deployment
9. **.dockerignore** - Docker exclusions
10. **DNS_CONFIGURATION.md** - DNS guide
11. **DEPLOYMENT_QUICK_START.md** - Quick reference
12. **DEPLOYMENT_CHECKLIST.md** - Setup checklist
13. **PUBLISHING_SUMMARY.md** - Files summary

### Updated Files (1 total)

1. **app/next.config.js** - Cloudflare compatibility

---

## FAQ

**Q: How long does deployment take?**
A: 5-10 minutes for full CI/CD pipeline

**Q: Can I deploy from a feature branch?**
A: Yes, use manual deployment script or preview deployments

**Q: What if deployment fails?**
A: Check logs, verify secrets, try manual deployment, or rollback

**Q: How do I add a new environment variable?**
A: Add to Cloudflare Pages settings, then redeploy

**Q: Can I use a different hosting provider?**
A: Yes, use Docker or standard Node.js hosting

**Q: How do I enable staging environment?**
A: Use preview environment in Cloudflare Pages settings

**Q: What's the cost?**
A: Cloudflare Pages free tier: 500 builds/month, unlimited requests

**Q: How do I monitor performance?**
A: Use Cloudflare Analytics, Google Analytics, or Lighthouse

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-02-05 | Initial publishing setup complete |

---

## Contact

For questions or issues:
- **GitHub Issues**: https://github.com/xbradpig/ChurchThrive/issues
- **Documentation**: `/docs/dev-agent/07_publishing.md`

---

**Last Updated**: 2024-02-05
**Stage**: Publishing (7/7) - Complete
**Status**: ✅ Ready for deployment
