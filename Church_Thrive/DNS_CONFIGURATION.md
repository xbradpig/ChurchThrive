# DNS Configuration for churchthrive.kr

This document explains how to configure DNS for the ChurchThrive web application on Cloudflare Pages.

## Prerequisites

- Domain registered: `churchthrive.kr`
- Cloudflare account with Pages project created
- Domain added to Cloudflare

## DNS Setup Steps

### Option 1: Using Cloudflare as DNS Provider (Recommended)

If you use Cloudflare as your DNS provider:

1. **Add Domain to Cloudflare Pages**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to: Workers & Pages > churchthrive > Custom domains
   - Click "Set up a custom domain"
   - Enter: `churchthrive.kr`
   - Click "Continue"

2. **Verify DNS Records**
   Cloudflare will automatically create the necessary DNS records:
   - Type: `CNAME`
   - Name: `@` (or `churchthrive.kr`)
   - Target: `churchthrive.pages.dev`
   - Proxy status: Proxied (orange cloud)

3. **Add WWW Subdomain (Optional)**
   - Type: `CNAME`
   - Name: `www`
   - Target: `churchthrive.kr`
   - Proxy status: Proxied

4. **Enable SSL/TLS**
   - Go to: SSL/TLS > Overview
   - Set encryption mode to: "Full (strict)"
   - SSL/TLS certificates will be automatically provisioned

### Option 2: Using External DNS Provider

If your domain is registered elsewhere:

1. **Point Nameservers to Cloudflare**
   - Go to your domain registrar (e.g., Gabia, Cafe24, etc.)
   - Change nameservers to Cloudflare's:
     ```
     ns1.cloudflare.com
     ns2.cloudflare.com
     ```
   - Wait 24-48 hours for propagation

2. **Then follow Option 1 steps above**

### Option 3: CNAME Only (Partial Setup)

If you cannot change nameservers:

1. **Add CNAME Record at Domain Registrar**
   - Type: `CNAME`
   - Host: `@` or `www`
   - Value: `churchthrive.pages.dev`
   - TTL: `3600` (1 hour)

2. **Note**: This method has limitations:
   - No automatic SSL certificate
   - No Cloudflare CDN benefits
   - No advanced features

## DNS Records Summary

### Required Records

| Type  | Name | Target                    | Proxy | Priority |
|-------|------|---------------------------|-------|----------|
| CNAME | @    | churchthrive.pages.dev    | Yes   | -        |
| CNAME | www  | churchthrive.kr           | Yes   | -        |

### Optional Records

| Type  | Name | Target                    | Purpose              |
|-------|------|---------------------------|----------------------|
| TXT   | @    | v=spf1 -all              | Email security       |
| TXT   | _dmarc | v=DMARC1; p=reject     | Email policy         |
| A     | api  | [Your API IP]            | Separate API server  |

## SSL/TLS Configuration

### Cloudflare SSL Settings

1. **Encryption Mode**: Full (strict)
   - Encrypts traffic between visitors and Cloudflare
   - Encrypts traffic between Cloudflare and origin

2. **Edge Certificates**: Automatic
   - Universal SSL certificate (free)
   - Valid for: `churchthrive.kr` and `*.churchthrive.kr`
   - Auto-renewal enabled

3. **Always Use HTTPS**: On
   - Redirects all HTTP requests to HTTPS

4. **Minimum TLS Version**: 1.2
   - Modern security standards

### Certificate Verification

After DNS setup, verify your certificate:

```bash
# Check SSL certificate
openssl s_client -connect churchthrive.kr:443 -servername churchthrive.kr

# Check DNS propagation
dig churchthrive.kr
nslookup churchthrive.kr
```

## Cloudflare Pages Settings

### Custom Domain Configuration

1. **Production Domain**: `churchthrive.kr`
2. **Preview Deployments**: `*.churchthrive.pages.dev`
3. **Branch Deployments**:
   - `main` → `churchthrive.kr`
   - Other branches → `[branch].churchthrive.pages.dev`

### Build Configuration

Set in Cloudflare Pages dashboard:

- **Build command**: `npm run build:shared && npm run build:web`
- **Build output directory**: `app/.next`
- **Root directory**: `Church_Thrive`
- **Node version**: `20`

### Environment Variables

Set these in: Workers & Pages > churchthrive > Settings > Environment variables

**Production Environment:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (encrypted)
- `NEXT_PUBLIC_KAKAO_APP_KEY`
- `NEXT_PUBLIC_FCM_VAPID_KEY`
- `FCM_SERVER_KEY` (encrypted)
- `CF_PAGES=1` (for build optimization)

**Preview Environment:**
(Same as production, or use separate preview credentials)

## Page Rules (Optional)

### Cache Everything

Create a page rule to cache all content:

- URL: `churchthrive.kr/*`
- Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 4 hours

### Redirect Rules

Redirect www to non-www (or vice versa):

- URL: `www.churchthrive.kr/*`
- Forwarding URL: 301 Permanent Redirect
- Destination: `https://churchthrive.kr/$1`

## Performance Optimization

### Cloudflare Features to Enable

1. **Auto Minify**: HTML, CSS, JavaScript
2. **Brotli**: Enabled
3. **HTTP/2**: Enabled
4. **HTTP/3 (QUIC)**: Enabled
5. **0-RTT Connection Resumption**: Enabled
6. **WebSockets**: Enabled (for real-time features)

### Argo Smart Routing (Paid)

For better performance in Korea:
- Reduces latency by up to 30%
- Optimizes routes to origin

## Monitoring and Analytics

### Cloudflare Analytics

Access analytics at: Analytics & Logs > Web Analytics

Metrics available:
- Page views
- Unique visitors
- Bandwidth usage
- Cache hit ratio
- SSL/TLS version distribution

### Custom Analytics (Optional)

Integrate with:
- Google Analytics 4
- Cloudflare Web Analytics (privacy-focused)
- Custom logging

## Troubleshooting

### Common Issues

1. **DNS not propagating**
   - Wait 24-48 hours
   - Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)

2. **SSL certificate error**
   - Ensure SSL mode is "Full (strict)"
   - Check if origin certificate is valid
   - Wait for certificate provisioning (up to 24 hours)

3. **404 errors**
   - Verify build output directory is correct
   - Check if deployment completed successfully
   - Review deployment logs

4. **Environment variables not working**
   - Ensure variables are set in Cloudflare Pages settings
   - Redeploy after changing variables
   - Check variable names match exactly (case-sensitive)

### DNS Verification Commands

```bash
# Check DNS records
dig churchthrive.kr @1.1.1.1
dig www.churchthrive.kr @1.1.1.1

# Check nameservers
dig NS churchthrive.kr

# Check with different DNS servers
nslookup churchthrive.kr 8.8.8.8
nslookup churchthrive.kr 1.1.1.1

# Check SSL certificate
curl -vI https://churchthrive.kr
```

### Contact Support

If issues persist:
- Cloudflare Support: https://support.cloudflare.com
- Domain Registrar Support
- GitHub Issues: https://github.com/YOUR_USERNAME/ChurchThrive/issues

## Security Best Practices

1. **Enable DNSSEC**: Protects against DNS spoofing
2. **Use CAA Records**: Restrict certificate authorities
   ```
   Type: CAA
   Name: @
   Value: 0 issue "letsencrypt.org"
   ```
3. **Enable WAF**: Web Application Firewall (paid feature)
4. **Rate Limiting**: Protect against DDoS
5. **Bot Management**: Block malicious bots

## Maintenance

### Regular Tasks

- Monitor SSL certificate expiration (auto-renews)
- Review analytics monthly
- Update DNS records as needed
- Test deployment process quarterly

### Backup DNS Configuration

Keep a record of all DNS settings:
```
# Primary domain
churchthrive.kr → CNAME → churchthrive.pages.dev

# WWW subdomain
www.churchthrive.kr → CNAME → churchthrive.kr

# Email (if configured)
@ → MX → mail.example.com (priority 10)
```

---

**Last Updated**: 2024-02-05
**Domain**: churchthrive.kr
**Hosting**: Cloudflare Pages
**SSL Provider**: Cloudflare Universal SSL
