# indoco-pilot: Security Guidelines

## 1. Introduction
This document provides a set of actionable security guidelines tailored to the **indoco-pilot** web application. It embeds security by design, from authentication to infrastructure hardening, ensuring robust protection of user data and system integrity.

## 2. Core Security Principles
- **Security by Design:** Integrate security at every development stage, from design through deployment.  
- **Least Privilege:** Grant only the minimal permissions required to users, services, and components.  
- **Defense in Depth:** Layer multiple controls—authentication, input validation, encryption—to prevent single points of failure.  
- **Fail Securely:** On errors or exceptions, avoid exposing sensitive information and ensure the application remains in a safe state.  
- **Secure Defaults & Simplicity:** Ship with the most restrictive, secure settings and keep controls straightforward to implement and maintain.

## 3. Authentication & Access Control
1. **Strong Password Policies**  
   - Enforce minimum length (≥ 12 characters), complexity (mixed case, digits, symbols), and disallow common passwords.  
   - Use bcrypt or Argon2 with unique per-user salts.  
2. **Secure Session Management**  
   - Store session tokens in HttpOnly, Secure, SameSite=strict cookies.  
   - Implement idle and absolute timeouts (e.g., 15 min idle, 24 h absolute).  
   - Invalidate sessions on logout or password change to prevent fixation.  
3. **API-Route Protection**  
   - All routes under `/app/dashboard` must verify an authenticated session or JWT with valid signature and expiration (`exp`).  
   - Use role-based checks server-side if you introduce admin or elevated permissions.  
4. **Multi-Factor Authentication (MFA)**  
   - Offer TOTP or SMS-based MFA for high-sensitivity accounts.  
5. **Rate Limiting & Brute-Force Protection**  
   - Apply IP and username-based throttling on `/api/auth/login` and `/api/auth/signup`.  
   - Return generic error messages (`“Invalid credentials”`) to avoid user enumeration.

## 4. Input Handling & Processing
1. **Server-Side Validation**  
   - Never trust client inputs—even if you use form validation in React.  
   - Use a schema validation library (e.g., Zod, Joi) on every API route (`/api/auth/*`).  
2. **Prevent Injection**  
   - Use parameterized queries or an ORM (Prisma, TypeORM).  
   - Sanitize inputs before using them in shell commands, file paths, or HTML templates.  
3. **XSS & Template Injection**  
   - Encode all user-supplied data in React components.  
   - If accepting rich text, sanitize with DOMPurify or similar.  
4. **File Uploads** (if added in future)  
   - Validate file type, size, and content on the server.  
   - Store outside the public folder and generate safe, random filenames.

## 5. Data Protection & Privacy
1. **Encryption in Transit & At Rest**  
   - Enforce HTTPS (TLS 1.2+) across all domains.  
   - Enable HSTS in `next.config.js` or via server headers.  
   - Encrypt sensitive fields in the database if handling PII.  
2. **Secret Management**  
   - Keep API keys, DB credentials, and salts out of code; use environment variables and a secrets manager (Vault, AWS Secrets Manager).  
   - Rotate secrets periodically.  
3. **Error & Logging Hygiene**  
   - Do not log stack traces or raw user inputs in production logs.  
   - Mask PII in audit logs.  
4. **Compliance**  
   - If storing EU user data, ensure GDPR controls such as data subject rights and deletion workflows are in place.

## 6. API & Service Security
1. **HTTPS Enforcement**  
   - Redirect all HTTP traffic to HTTPS at the CDN or reverse proxy (e.g., NGINX).  
2. **CORS Configuration**  
   - Restrict `Access-Control-Allow-Origin` to known front-end domains.  
   - Limit allowed methods to those actually used by your API.  
3. **Rate Limiting & DDOS Protection**  
   - Employ middleware (e.g., `express-rate-limit` or Next.js middleware) to throttle abusive traffic.  
4. **API Versioning**  
   - Prefix routes with `/v1/` to allow secure, backward-compatible changes.

## 7. Web Application Security Hygiene
1. **Security Headers**  
   - Content-Security-Policy (CSP): restrict scripts/styles to self and approved CDNs.  
   - X-Content-Type-Options: `nosniff`  
   - X-Frame-Options: `DENY` or `SAMEORIGIN`  
   - Referrer-Policy: `strict-origin-when-cross-origin`  
2. **CSRF Protection**  
   - Use anti-CSRF tokens in state-changing requests (Next.js `@vercel/next-csrf` or custom middleware).  
3. **Cookie Security**  
   - Mark cookies as `Secure`, `HttpOnly`, `SameSite=Strict`.

## 8. Infrastructure & Configuration Management
1. **Server Hardening**  
   - Disable unused services and ports.  
   - Apply OS security patches and updates automatically.  
2. **Build & Deployment**  
   - Disable debug and verbose logging in production.  
   - Use immutable artifacts (Docker images, build hashes).  
3. **Environment Isolation**  
   - Separate dev, staging, and prod environments with distinct credentials and network policies.

## 9. Dependency Management & CI/CD Security
1. **Secure Dependencies**  
   - Maintain `package-lock.json` or `yarn.lock` for deterministic builds.  
   - Audit dependencies regularly (e.g., `npm audit`, Snyk, GitHub Dependabot).  
2. **CI/CD Controls**  
   - Enforce branch protection rules and code reviews.  
   - Scan for secrets in commits (prevent accidental exposure).  
   - Run automated linters, type checks, and unit/integration tests before merge.

## 10. Monitoring, Testing & Incident Response
- **Automated Testing:** Include unit tests for React components and integration tests for API endpoints.  
- **Security Testing:** Perform periodic penetration tests and vulnerability scans.  
- **Logging & Alerts:** Centralize logs, monitor authentication events, and set alerts for anomalies (e.g., repeated failed logins).  
- **Incident Playbook:** Document steps to contain breaches, revoke credentials, and notify users/regulators if needed.

---
Adhering to these guidelines will help ensure that **indoco-pilot** remains secure, reliable, and compliant as it evolves. Regularly review and update practices in line with emerging threats and best practices.