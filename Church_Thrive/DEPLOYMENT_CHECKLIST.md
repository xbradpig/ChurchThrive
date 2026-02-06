# ChurchThrive Deployment Checklist

Use this checklist to ensure all steps are completed for successful deployment.

## Pre-Deployment Setup

### 1. Local Environment Setup

- [ ] Repository cloned locally
- [ ] Node.js 20+ installed (`node --version`)
- [ ] Dependencies installed (`npm install`)
- [ ] Environment file created (`./scripts/setup-env.sh`)
- [ ] `.env.local` configured with actual values
- [ ] Local dev server works (`npm run dev:web`)
- [ ] Build succeeds locally (`npm run build:web`)

### 2. GitHub Configuration

- [ ] Repository exists on GitHub
- [ ] GitHub Secrets added (11 total):
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `NEXT_PUBLIC_KAKAO_APP_KEY`
  - [ ] `NEXT_PUBLIC_FCM_VAPID_KEY`
  - [ ] `FCM_SERVER_KEY`
  - [ ] `CLOUDFLARE_API_TOKEN`
  - [ ] `CLOUDFLARE_ACCOUNT_ID`
  - [ ] `EXPO_TOKEN`
- [ ] Main branch protected (Settings > Branches)
- [ ] Required status checks enabled

### 3. Cloudflare Setup

- [ ] Cloudflare account created
- [ ] Domain added to Cloudflare (`churchthrive.kr`)
- [ ] Pages project created
  - [ ] Project name: `churchthrive`
  - [ ] Repository connected
  - [ ] Build settings configured:
    - [ ] Build command: `cd Church_Thrive && npm run build:shared && npm run build:web`
    - [ ] Build output: `Church_Thrive/app/.next`
    - [ ] Root directory: `/`
    - [ ] Node version: `20`
- [ ] Environment variables added (Production):
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (encrypted)
  - [ ] `NEXT_PUBLIC_KAKAO_APP_KEY`
  - [ ] `NEXT_PUBLIC_FCM_VAPID_KEY`
  - [ ] `FCM_SERVER_KEY` (encrypted)
  - [ ] `CF_PAGES=1`
- [ ] Environment variables added (Preview) - optional
- [ ] Custom domain added: `churchthrive.kr`

### 4. DNS Configuration

- [ ] Nameservers pointed to Cloudflare (if applicable)
- [ ] CNAME record created:
  - [ ] Name: `@`
  - [ ] Target: `churchthrive.pages.dev`
  - [ ] Proxy: Enabled (orange cloud)
- [ ] WWW redirect configured (optional):
  - [ ] Name: `www`
  - [ ] Target: `churchthrive.kr`
  - [ ] Proxy: Enabled
- [ ] SSL/TLS settings:
  - [ ] Encryption mode: Full (strict)
  - [ ] Always Use HTTPS: On
  - [ ] Minimum TLS: 1.2
  - [ ] Universal SSL: Active

## First Deployment

### 5. Test CI Pipeline

- [ ] Push test commit to feature branch
- [ ] Create pull request
- [ ] CI workflow runs successfully
- [ ] All checks pass (typecheck, lint, build)
- [ ] Preview deployment created
- [ ] Preview URL accessible

### 6. Deploy to Production

- [ ] Merge PR to main (or push directly)
- [ ] Deploy workflow triggers
- [ ] Build completes successfully
- [ ] Deployment succeeds
- [ ] Production URL accessible: `https://churchthrive.pages.dev`

### 7. DNS Verification

- [ ] Wait for DNS propagation (up to 48 hours)
- [ ] Test DNS resolution: `dig churchthrive.kr`
- [ ] Custom domain accessible: `https://churchthrive.kr`
- [ ] SSL certificate active
- [ ] HTTPS redirect working
- [ ] WWW redirect working (if configured)

## Post-Deployment Verification

### 8. Functionality Testing

- [ ] Homepage loads
- [ ] Navigation works
- [ ] Images load correctly
- [ ] API calls work (Supabase)
- [ ] Authentication works (Kakao)
- [ ] Push notifications configured (FCM)
- [ ] Mobile responsiveness verified
- [ ] Browser console has no errors
- [ ] Network tab shows no 404s

### 9. Performance Testing

- [ ] Run Lighthouse audit
  - [ ] Performance: 90+
  - [ ] Accessibility: 95+
  - [ ] Best Practices: 95+
  - [ ] SEO: 100
- [ ] Test load time: < 2 seconds
- [ ] Test from different locations
- [ ] Test on mobile devices
- [ ] Test on different browsers

### 10. Security Verification

- [ ] HTTPS enforced
- [ ] SSL certificate valid
- [ ] Security headers present
- [ ] No sensitive data in client code
- [ ] Environment variables secure
- [ ] CORS configured correctly
- [ ] CSP headers set (if applicable)

### 11. Monitoring Setup

- [ ] Cloudflare Analytics enabled
- [ ] Review analytics data
- [ ] Set up uptime monitoring (optional)
- [ ] Configure error tracking (Sentry, optional)
- [ ] Set up Google Analytics (optional)
- [ ] Create alerts for downtime

## Mobile Deployment (Optional)

### 12. Expo/EAS Setup

- [ ] Expo account created
- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] EAS configured: `eas build:configure`
- [ ] `EXPO_TOKEN` added to GitHub Secrets
- [ ] Test build triggered
- [ ] Build completes successfully
- [ ] Test app on device

## Documentation

### 13. Team Documentation

- [ ] Share deployment URLs with team
- [ ] Document custom configurations
- [ ] Update project README
- [ ] Share access credentials (securely)
- [ ] Train team on deployment process
- [ ] Document troubleshooting steps

## Maintenance Setup

### 14. Regular Maintenance

- [ ] Set calendar reminder for monthly reviews
- [ ] Document rollback procedure
- [ ] Create backup plan
- [ ] Set up staging environment (optional)
- [ ] Document incident response plan

## Troubleshooting

### Common Issues

**Build fails in CI**:
- [ ] Check GitHub Actions logs
- [ ] Verify all secrets are set
- [ ] Test build locally
- [ ] Check for TypeScript/lint errors

**Deployment fails**:
- [ ] Verify Cloudflare API token
- [ ] Check Cloudflare dashboard for errors
- [ ] Review deployment logs
- [ ] Try manual deployment script

**DNS not resolving**:
- [ ] Check DNS records in Cloudflare
- [ ] Wait for propagation (24-48 hours)
- [ ] Clear local DNS cache
- [ ] Test with: `dig churchthrive.kr`

**SSL errors**:
- [ ] Verify SSL mode is "Full (strict)"
- [ ] Wait for certificate provisioning
- [ ] Check Cloudflare SSL/TLS dashboard

**Environment variables not working**:
- [ ] Check variable names (case-sensitive)
- [ ] Ensure `NEXT_PUBLIC_` prefix for client-side
- [ ] Redeploy after changes
- [ ] Verify in Cloudflare dashboard

## Sign-Off

### Deployment Team

- [ ] Developer sign-off: _________________ Date: _______
- [ ] DevOps sign-off: _________________ Date: _______
- [ ] QA sign-off: _________________ Date: _______
- [ ] Project Manager sign-off: _________________ Date: _______

### Deployment Details

- **Deployment Date**: _______________________
- **Deployed By**: _______________________
- **Version/Commit**: _______________________
- **Production URL**: https://churchthrive.kr
- **Preview URL**: https://churchthrive.pages.dev
- **Notes**: _______________________

---

## Quick Reference

### Important URLs

- **Production**: https://churchthrive.kr
- **Preview**: https://churchthrive.pages.dev
- **GitHub Repo**: https://github.com/xbradpig/ChurchThrive
- **GitHub Actions**: https://github.com/xbradpig/ChurchThrive/actions
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Expo Dashboard**: https://expo.dev

### Important Commands

```bash
# Local development
npm run dev:web

# Build locally
npm run build:web

# Deploy manually
./scripts/deploy-web.sh

# Setup environment
./scripts/setup-env.sh

# Test DNS
dig churchthrive.kr

# Check SSL
curl -vI https://churchthrive.kr
```

### Support

- **Documentation**: `/docs/dev-agent/07_publishing.md`
- **Quick Start**: `/DEPLOYMENT_QUICK_START.md`
- **DNS Guide**: `/DNS_CONFIGURATION.md`
- **GitHub Issues**: https://github.com/xbradpig/ChurchThrive/issues

---

**Last Updated**: 2024-02-05
**Checklist Version**: 1.0
