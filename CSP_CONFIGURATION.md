# Content Security Policy (CSP) Configuration

## Overview
The dashboard implements a Content Security Policy to enhance security by controlling which resources can be loaded and executed.

## Configuration Location
CSP headers are configured in: `next.config.ts`

## Current CSP Directives

### 1. `default-src 'self'`
- **Purpose:** Sets the default policy for fetching resources
- **Effect:** Only allow resources from the same origin by default

### 2. `script-src 'self' 'unsafe-inline' 'unsafe-eval'`
- **Purpose:** Controls which scripts can execute
- **'self':** Allows scripts from the same origin
- **'unsafe-inline':** Allows inline scripts (needed for Next.js and React)
- **'unsafe-eval':** Allows eval() and similar dynamic code execution
  - **Note:** Required by Recharts library for chart rendering
  - **Security consideration:** This is a known requirement for many charting libraries

### 3. `style-src 'self' 'unsafe-inline'`
- **Purpose:** Controls which stylesheets can be applied
- **'self':** Allows stylesheets from the same origin
- **'unsafe-inline':** Allows inline styles (needed for Tailwind CSS and dynamic styles)

### 4. `img-src 'self' data: https: blob:`
- **Purpose:** Controls which images can be loaded
- **'self':** Same-origin images
- **data::** Data URLs (base64 images)
- **https::** Images from HTTPS sources
- **blob::** Blob URLs (for dynamically generated images)

### 5. `font-src 'self' data:`
- **Purpose:** Controls which fonts can be loaded
- **'self':** Fonts from the same origin
- **data::** Data URLs for embedded fonts

### 6. `connect-src 'self' ws: wss:`
- **Purpose:** Controls which URLs can be loaded using fetch, XMLHttpRequest, WebSocket, etc.
- **'self':** Same-origin connections
- **ws:** WebSocket connections (unsecured)
- **wss:** Secure WebSocket connections
  - **Note:** Required for Socket.IO real-time updates

### 7. `frame-ancestors 'none'`
- **Purpose:** Prevents the site from being embedded in iframes
- **Effect:** Protects against clickjacking attacks

### 8. `base-uri 'self'`
- **Purpose:** Restricts URLs that can be used in a document's <base> element
- **Effect:** Prevents malicious scripts from changing the base URL

### 9. `form-action 'self'`
- **Purpose:** Restricts URLs which can be used as the action of HTML form elements
- **Effect:** Prevents forms from submitting to external URLs

## Additional Security Headers

### X-Frame-Options: DENY
- Prevents the page from being displayed in an iframe
- Redundant with `frame-ancestors` but provides backward compatibility

### X-Content-Type-Options: nosniff
- Prevents browsers from MIME-sniffing responses
- Forces browsers to respect the Content-Type header

### Referrer-Policy: strict-origin-when-cross-origin
- Controls how much referrer information is sent with requests
- Sends full URL for same-origin, only origin for cross-origin HTTPS

### Permissions-Policy
- Disables camera, microphone, and geolocation APIs
- Format: `camera=(), microphone=(), geolocation=()`

## Testing CSP Compliance

### Browser Console
Check for CSP violations in browser developer console:
```
Content Security Policy: The page's settings blocked the loading of a resource...
```

### CSP Evaluator
Use online tools to evaluate CSP strength:
- [CSP Evaluator by Google](https://csp-evaluator.withgoogle.com/)
- [Security Headers](https://securityheaders.com/)

## Known CSP Exceptions

### 1. 'unsafe-eval' for Recharts
**Issue:** Recharts uses dynamic code evaluation for chart rendering  
**Solution:** Added 'unsafe-eval' to script-src  
**Alternative:** Would require replacing Recharts with a CSP-compliant chart library

### 2. 'unsafe-inline' for styles
**Issue:** Tailwind CSS and styled-components use inline styles  
**Solution:** Added 'unsafe-inline' to style-src  
**Alternative:** Use nonce-based CSP (more complex setup)

## Improving CSP Security

### For Production

1. **Remove 'unsafe-eval' if possible**
   - Replace Recharts with a CSP-compliant library
   - Or use a different rendering approach

2. **Implement nonce-based CSP**
   ```typescript
   // Example with nonce
   const nonce = generateNonce()
   script-src 'self' 'nonce-${nonce}'
   ```

3. **Remove 'unsafe-inline'**
   - Use hash-based CSP for inline scripts
   - Move all inline styles to external files

4. **Restrict img-src**
   - Instead of `https:`, list specific trusted domains
   ```
   img-src 'self' data: https://cdn.example.com
   ```

5. **Add report-uri**
   ```typescript
   "report-uri /api/csp-report",
   "report-to csp-endpoint"
   ```

## CSP Monitoring

### Set up CSP reporting:
```typescript
{
  key: 'Content-Security-Policy-Report-Only',
  value: 'default-src \'self\'; report-uri /api/csp-report'
}
```

### Create report endpoint:
```typescript
// src/app/api/csp-report/route.ts
export async function POST(request: Request) {
  const report = await request.json()
  console.log('CSP Violation:', report)
  // Log to monitoring service
  return new Response('OK', { status: 200 })
}
```

## Troubleshooting

### Issue: Charts not rendering
**Cause:** Recharts blocked by CSP  
**Solution:** Ensure 'unsafe-eval' is in script-src

### Issue: Styles not applying
**Cause:** Inline styles blocked  
**Solution:** Ensure 'unsafe-inline' is in style-src

### Issue: WebSocket connection failed
**Cause:** WebSocket protocol blocked  
**Solution:** Ensure 'ws:' and 'wss:' are in connect-src

### Issue: Images not loading
**Cause:** Image sources not allowed  
**Solution:** Add appropriate sources to img-src

### Issue: API calls failing
**Cause:** API endpoints blocked  
**Solution:** Add endpoints to connect-src

## Testing Checklist

- [x] Charts render correctly (Recharts)
- [x] Styles apply correctly (Tailwind CSS)
- [x] WebSocket connects (Socket.IO)
- [x] API calls work
- [x] Images load
- [x] Fonts load
- [x] No CSP violations in console
- [x] Export functionality works
- [x] India Map displays correctly

## Production Recommendations

1. **Use a CSP report-only mode** initially to identify violations
2. **Gradually tighten** the policy based on reports
3. **Remove 'unsafe-*' directives** where possible
4. **Implement nonce** or hash-based CSP for inline scripts
5. **Monitor CSP violations** in production
6. **Update CSP** as new features are added

## References

- [MDN CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP Best Practices](https://web.dev/csp/)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)

## Last Updated
October 3, 2025

## Contact
For CSP-related issues or questions, refer to the main project documentation.
