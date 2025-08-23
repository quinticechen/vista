
# Deployment Guide

This guide covers deploying the Vista application to various platforms with proper URL parameter routing support.

## URL Parameter Routing Requirements

Vista uses dynamic URL parameters like `/:urlParam` to create personalized pages. This requires special server configuration for Single Page Applications (SPAs).

### Supported URL Patterns

- `/` - Home page
- `/vista` - Global content vista
- `/about` - About page
- `/auth` - Authentication page
- `/admin/*` - Admin panel (protected)
- `/:urlParam` - User profile page (e.g., `/quintice`, `/company-brand`)
- `/:urlParam/vista` - User's content vista
- `/:urlParam/vista/:contentId` - User's content detail (only route for content details)

## Vercel Deployment

### Configuration File

The `vercel.json` file handles URL parameter routing:

```json
{
  "rewrites": [
    {
      "source": "/((?!api|_next|_static|favicon.ico|robots.txt|assets).*)",
      "destination": "/index.html"
    }
  ]
}
```

### Deployment Steps

1. Connect your GitHub repository to Vercel
2. Ensure `vercel.json` is in your project root
3. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - Any other required environment variables
4. Deploy

### Testing URL Parameters

After deployment, test these URLs:
- `https://yourdomain.com/` ✅ Should work
- `https://yourdomain.com/quintice` ✅ Should work
- `https://yourdomain.com/quintice/vista` ✅ Should work
- `https://yourdomain.com/admin` ✅ Should work

## Netlify Deployment

Create `_redirects` file in `public/` directory:

```
# Handle client-side routing
/*    /index.html   200
```

## Other Platforms

### Apache (.htaccess)

```apache
RewriteEngine On
RewriteBase /

# Handle client-side routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### Nginx

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## Troubleshooting

### Common Issues

1. **URL Parameter routes return 404**
   - Ensure server redirects all non-file requests to `/index.html`
   - Check that `vercel.json` or equivalent configuration exists

2. **Reserved routes conflict with URL parameters**
   - URL parameters like `admin`, `vista`, `about`, `auth` are reserved
   - Use different URL parameter names

3. **Static assets not loading**
   - Ensure static file serving is configured correctly
   - Check that rewrites don't interfere with asset loading

### Validation

Run these tests to verify deployment:

```bash
# Test reserved routes
curl https://yourdomain.com/admin
curl https://yourdomain.com/vista
curl https://yourdomain.com/about

# Test URL parameter routes
curl https://yourdomain.com/quintice
curl https://yourdomain.com/company-brand/vista

# Test static assets
curl https://yourdomain.com/favicon.ico
curl https://yourdomain.com/robots.txt
```

All should return appropriate content without 404 errors.

## Security Considerations

The `vercel.json` includes security headers:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

These protect against common web vulnerabilities while maintaining URL parameter functionality.
