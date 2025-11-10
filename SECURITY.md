# Security Policy

## ⚠️ Important Security Notice

This application is designed for **development, prototyping, and personal use only**. It contains known security limitations that make it unsuitable for production deployment without significant modifications.

## Known Security Limitations

### 🔴 CRITICAL: API Key Exposure

**Issue:** The Gemini API key is embedded in the client-side JavaScript bundle.

**Impact:**
- Anyone can extract your API key from the browser's developer tools
- Malicious users can abuse your API key, leading to unexpected charges
- No rate limiting or access control is enforced client-side

**Mitigations Currently In Place:**
- Clear warnings in `.env.example` and `vite.config.ts`
- Runtime validation that API key is configured
- Console warnings if API key is missing or invalid

**Recommended Solution for Production:**
```
DO NOT deploy this application as-is to production.

For production use, implement a backend proxy server:
1. Move the Gemini API key to a secure backend server
2. Create API endpoints on your backend (e.g., /api/generate-svg)
3. Implement authentication and rate limiting on the backend
4. Have the frontend call your backend, not Gemini directly
```

Example backend proxy architecture:
```
[User Browser] → [Your Backend API] → [Gemini API]
                      ↓
                 - Authentication
                 - Rate Limiting
                 - API Key Protection
                 - Usage Tracking
```

## Security Features Implemented

### ✅ SVG Sanitization

All SVG content (both AI-generated and user-imported) is sanitized to prevent XSS attacks:
- Removes `<script>` tags
- Removes event handlers (onclick, onload, etc.)
- Removes `javascript:` protocol
- Removes potentially dangerous data URLs

**Location:** `components/ui/services/aiService.ts:sanitizeSVG()`

### ✅ Input Validation

User prompts are validated to prevent prompt injection attacks:
- Maximum length limit (2000 characters)
- Detection of prompt injection patterns
- Sanitization of suspicious input patterns

**Location:** `components/ui/services/aiService.ts:validatePrompt()`

### ✅ Environment Variable Protection

- `.env` files are excluded from version control via `.gitignore`
- `.env.example` template provided with security warnings
- Runtime validation ensures API key is present before enabling AI features

### ✅ TypeScript Strict Mode

Enabled strict type checking to catch potential bugs early:
- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`
- `noUncheckedIndexedAccess: true`

## Security Best Practices for Users

### 1. Protect Your API Key

```bash
# ✅ DO: Use a .env file (never commit it)
cp .env.example .env
# Add your API key to .env

# ❌ DON'T: Hardcode API keys in source files
# ❌ DON'T: Commit .env files to git
# ❌ DON'T: Share your API key publicly
```

### 2. Monitor API Usage

- Regularly check your [Google AI Studio usage dashboard](https://aistudio.google.com/)
- Set up billing alerts in Google Cloud Console
- Rotate your API key if you suspect it's been compromised

### 3. Limit API Key Permissions

- Use API keys with minimal necessary permissions
- Consider setting quota limits in Google Cloud Console
- Use separate API keys for development and production

### 4. Be Cautious with Imported SVG Files

While we sanitize SVG content, be cautious when importing SVG files from untrusted sources:
- Only import SVG files from sources you trust
- Review the sanitization function if you have specific security requirements
- Consider additional validation for your use case

## Reporting Security Vulnerabilities

If you discover a security vulnerability in this project, please:

1. **DO NOT** open a public GitHub issue
2. Contact the maintainer directly
3. Provide detailed information about the vulnerability
4. Allow reasonable time for the issue to be addressed before public disclosure

## Security Checklist for Deployment

Before deploying this application:

- [ ] Implemented a backend proxy server for API calls
- [ ] Removed all API keys from client-side code
- [ ] Implemented authentication and authorization
- [ ] Set up rate limiting
- [ ] Configured CORS policies appropriately
- [ ] Enabled HTTPS/TLS
- [ ] Set up Content Security Policy (CSP) headers
- [ ] Implemented logging and monitoring
- [ ] Conducted security testing (OWASP Top 10)
- [ ] Reviewed and updated all dependencies

## Dependencies Security

### Regular Updates

Keep dependencies up to date to patch known vulnerabilities:

```bash
# Check for outdated packages
npm outdated

# Update packages
npm update

# Audit for known vulnerabilities
npm audit

# Fix vulnerabilities automatically (when possible)
npm audit fix
```

### Current Security-Sensitive Dependencies

- `@google/genai`: Official Google Gemini SDK
- `paper`: Vector graphics library
- `react`, `react-dom`: UI framework
- `vite`: Build tool

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Google AI Studio API Key Security](https://ai.google.dev/gemini-api/docs/api-key)
- [React Security Best Practices](https://react.dev/learn/security)
- [Vite Security](https://vitejs.dev/guide/env-and-mode.html#env-files)

## License and Liability

This software is provided "as is" without warranty of any kind. The developers are not responsible for any damages or losses resulting from the use of this software. Users are responsible for securing their own API keys and deployments.

---

**Last Updated:** 2025-11-10
**Security Review:** v1.0
