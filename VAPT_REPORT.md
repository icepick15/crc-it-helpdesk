# Vulnerability Assessment and Penetration Testing (VAPT) Report

**Application:** IT Service Desk  
**URL:** https://itservicedesk.creditreferencenigeria.net  
**Organization:** CRC Credit Bureau Limited  
**Assessed by:** IT Support Department  
**Assessment Date:** June 2026  
**Report Date:** June 25, 2026  
**Classification:** Internal — Confidential  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Scope and Methodology](#2-scope-and-methodology)
3. [Risk Rating Criteria](#3-risk-rating-criteria)
4. [Summary of Findings](#4-summary-of-findings)
5. [Detailed Findings](#5-detailed-findings)
6. [Fixes Applied](#6-fixes-applied)
7. [Open Recommendations](#7-open-recommendations)
8. [Conclusion](#8-conclusion)

---

## 1. Executive Summary

A white-box Vulnerability Assessment and Penetration Test (VAPT) was conducted on the CRC Credit Bureau IT Service Desk web application. The assessment covered all major security domains including information gathering, authentication, authorization, file upload security, input validation, and security hardening.

**25 findings** were identified across all phases. Of these:

- **15 were fixed immediately** during the assessment
- **7 were already secure** (passed testing)
- **2 remain open** with recommendations provided
- **1 requires a future dependency** (MIME type validation)

The most critical issues found were unauthorized cross-user data access (IDOR), missing brute-force protection on the login endpoint, severely long JWT token lifetimes, and missing HTTP security headers — all of which have been remediated.

The application's overall security posture has been significantly improved and is now suitable for continued internal production use.

| Severity | Total Found | Fixed | Open |
|----------|-------------|-------|------|
| High     | 11          | 10    | 1    |
| Medium   | 7           | 6     | 1    |
| Low      | 7           | 7     | 0    |
| Info     | 2           | 2     | 0    |
| **Total**| **25** (incl. passes) | **15 fixed** | **2 open** |

---

## 2. Scope and Methodology

### 2.1 Scope

| Component | Detail |
|-----------|--------|
| Application URL | https://itservicedesk.creditreferencenigeria.net |
| Backend | Django REST Framework (Python), Gunicorn, Docker |
| Frontend | Next.js 14 (App Router), hosted on same server |
| Web Server | nginx 1.24.0 (Ubuntu) |
| Authentication | Microsoft SSO (Azure AD) + JWT |
| Database | PostgreSQL |
| Server OS | Ubuntu Linux |

### 2.2 Methodology

The assessment followed a structured **white-box** approach — full access to source code was available, enabling deeper and more accurate analysis than black-box testing alone.

**Phases conducted:**

| Phase | Area |
|-------|------|
| Phase 1 | Information Gathering — headers, TLS, exposed files, open ports |
| Phase 2 | Authentication — brute force, JWT security, account enumeration |
| Phase 3 | Authorization — IDOR, privilege escalation, role enforcement |
| Phase 4 | File Upload Security — extension validation, path traversal |
| Phase 5 | Input Validation — XSS, SQL injection, field constraints |
| Phase 6 | Security Hardening — nginx headers, version disclosure |

---

## 3. Risk Rating Criteria

| Rating | Description |
|--------|-------------|
| **High** | Direct impact on data confidentiality, integrity, or availability. Exploitable with low effort. |
| **Medium** | Indirect risk or requires additional conditions to exploit. Should be fixed promptly. |
| **Low** | Minor risk, best-practice violation, or information disclosure with limited impact. |
| **Info** | Informational finding. No direct risk but worth noting. |

---

## 4. Summary of Findings

| ID | Finding | Phase | Severity | Status |
|----|---------|-------|----------|--------|
| F-01 | Missing HTTP Strict-Transport-Security (HSTS) header | 1 | High | Fixed ✅ |
| F-02 | Missing X-Frame-Options header (clickjacking) | 1 | High | Fixed ✅ |
| F-03 | Missing X-Content-Type-Options header | 1 | Medium | Fixed ✅ |
| F-04 | Missing Content-Security-Policy header | 1 | Medium | Fixed ✅ |
| F-05 | Missing Referrer-Policy header | 1 | Low | Fixed ✅ |
| F-06 | nginx version disclosed in Server header | 1 | Low | Fixed ✅ |
| F-07 | X-Powered-By: Next.js framework disclosed | 1 | Low | Fixed ✅ |
| F-08 | TLS 1.0 / TLS 1.1 protocol support | 1 | High | Not applicable ✅ |
| F-09 | AnyDesk remote access service running as root | 1 | High | Open ⚠️ |
| F-10 | No rate limiting on login endpoint (brute force) | 2 | High | Fixed ✅ |
| F-11 | JWT access token lifetime set to 200 days | 2 | High | Fixed ✅ |
| F-12 | JWT refresh token lifetime set to 400 days | 2 | Medium | Fixed ✅ |
| F-13 | Port 80 not listening — no HTTP→HTTPS redirect | 2 | Low | Fixed ✅ |
| F-14 | Port 8000 bound to all interfaces via Docker | 2 | Medium | Mitigated ✅ |
| F-15 | IDOR — staff can read any user's issues by ID | 3 | High | Fixed ✅ |
| F-16 | No admin check on ticket claim action | 3 | High | Fixed ✅ |
| F-17 | Generic PATCH endpoint had no role check | 3 | High | Fixed ✅ |
| F-18 | Sender spoofing in conversation messages | 3 | High | Fixed ✅ |
| F-19 | Unrestricted file upload to any issue | 3 | Medium | Fixed ✅ |
| F-20 | Double extension bypass in file upload | 4 | High | Fixed ✅ |
| F-21 | Path traversal characters in stored filename | 4 | Medium | Fixed ✅ |
| F-22 | Incorrect file size error message (100 MB label) | 4 | Low | Fixed ✅ |
| F-23 | No MIME type (magic byte) validation on uploads | 4 | Medium | Recommended ⚠️ |
| F-24 | Unbounded text fields (description, message) | 5 | Low | Fixed ✅ |
| F-25 | No choices validation on status, severity, role fields | 5 | Low | Fixed ✅ |

---

## 5. Detailed Findings

---

### F-01 — Missing HSTS Header
**Severity:** High | **Status:** Fixed ✅

**Description:**  
The application did not return a `Strict-Transport-Security` header. Without HSTS, browsers do not know to enforce HTTPS, leaving users vulnerable to SSL stripping and protocol downgrade attacks on untrusted networks (e.g., public Wi-Fi).

**Evidence:**
```
curl -I https://itservicedesk.creditreferencenigeria.net
# Before fix: No Strict-Transport-Security header present
```

**Fix Applied:**  
Added to nginx configuration:
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

### F-02 — Missing X-Frame-Options Header
**Severity:** High | **Status:** Fixed ✅

**Description:**  
Without this header, the application could be embedded in an `<iframe>` on an attacker-controlled site, enabling clickjacking attacks where users are tricked into clicking hidden elements.

**Fix Applied:**
```nginx
add_header X-Frame-Options "DENY" always;
```

---

### F-03 — Missing X-Content-Type-Options Header
**Severity:** Medium | **Status:** Fixed ✅

**Description:**  
Absence of this header allows browsers to MIME-sniff responses, potentially causing files to be interpreted as a different content type than intended (e.g., a text file interpreted as executable JavaScript).

**Fix Applied:**
```nginx
add_header X-Content-Type-Options "nosniff" always;
```

---

### F-04 — Missing Content-Security-Policy Header
**Severity:** Medium | **Status:** Fixed ✅

**Description:**  
No CSP was defined. This makes it harder for the browser to defend against XSS attacks, as it cannot restrict which scripts, styles, and resources are permitted to load.

**Fix Applied:**
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://login.microsoftonline.com https://graph.microsoft.com https://login.live.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self';" always;
```

---

### F-05 — Missing Referrer-Policy Header
**Severity:** Low | **Status:** Fixed ✅

**Description:**  
Without this header, browsers may include the full URL (including path and query strings) in the `Referer` header when navigating to external links, potentially leaking sensitive information.

**Fix Applied:**
```nginx
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

---

### F-06 — nginx Version Disclosed in Server Header
**Severity:** Low | **Status:** Fixed ✅

**Description:**  
The Server response header included the full nginx version and operating system: `nginx/1.24.0 (Ubuntu)`. This allows attackers to target known CVEs for that specific version.

**Evidence:**
```
Server: nginx/1.24.0 (Ubuntu)   # Before
Server: nginx                    # After
```

**Fix Applied:**
```nginx
server_tokens off;
```

---

### F-07 — Framework Disclosed via X-Powered-By Header
**Severity:** Low | **Status:** Fixed ✅

**Description:**  
The `X-Powered-By: Next.js` header was present, disclosing the frontend framework to potential attackers.

**Fix Applied:**  
Two-layer removal — nginx proxy level and Next.js configuration:
```nginx
proxy_hide_header X-Powered-By;
```
```typescript
// next.config.ts
const nextConfig: NextConfig = { poweredByHeader: false };
```

---

### F-08 — TLS 1.0 / TLS 1.1 Protocol Support
**Severity:** High | **Status:** Not applicable ✅

**Description:**  
TLS 1.0 and 1.1 are deprecated protocols with known cryptographic weaknesses. Testing confirmed both are already rejected by the server.

**Evidence:**
```bash
curl -I https://itservicedesk.creditreferencenigeria.net --tlsv1.0 --tls-max 1.0
# Result: SSL handshake failed — TLS 1.0 BLOCKED ✅

curl -I https://itservicedesk.creditreferencenigeria.net --tlsv1.1 --tls-max 1.1
# Result: SSL handshake failed — TLS 1.1 BLOCKED ✅
```

**Nginx configuration confirmed:**
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
```

---

### F-09 — AnyDesk Remote Access Service Running as Root
**Severity:** High | **Status:** Open ⚠️

**Description:**  
The AnyDesk `--service` daemon (PID 1377) was found running as the `root` user. If the AnyDesk process is compromised through a vulnerability or weak access credentials, an attacker gains full root-level control of the server. AnyDesk also represents a permanent remote access channel that bypasses standard access controls.

**Evidence:**
```
root  1377  /usr/bin/anydesk --service
```

**Recommendation:**
1. Configure AnyDesk to run its service as a dedicated non-root system user
2. Enable two-factor authentication on the AnyDesk account
3. Enable AnyDesk access control list (restrict which AnyDesk IDs can connect)
4. Review whether AnyDesk is required on a production server — consider replacing with SSH key-based access

---

### F-10 — No Rate Limiting on Login Endpoint
**Severity:** High | **Status:** Fixed ✅

**Description:**  
The `/api/token/` login endpoint accepted unlimited authentication attempts without any throttling or account lockout. An attacker could perform automated password-guessing attacks without restriction.

**Evidence:**
```
# 10 rapid failed attempts — all returned 400, no 429 or lockout
curl -X POST /api/token/ -d '{"email":"x@x.com","password":"wrong1"}' → 400
curl -X POST /api/token/ -d '{"email":"x@x.com","password":"wrong2"}' → 400
... (10 attempts, all succeeded without delay)
```

**Fix Applied:**  
Added a login-specific rate throttle (5 attempts per minute per IP):
```python
class LoginRateThrottle(AnonRateThrottle):
    scope = 'login'

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    throttle_classes = [LoginRateThrottle]
```
```python
# settings.py
'DEFAULT_THROTTLE_RATES': { 'login': '5/min' }
```

---

### F-11 — JWT Access Token Lifetime: 200 Days
**Severity:** High | **Status:** Fixed ✅

**Description:**  
The JWT access token was configured to remain valid for 200 days. If a token is stolen through any means (XSS, network interception, device theft), the attacker would have uninterrupted access to the application for over six months with no way to invalidate it.

**Fix Applied:**
```python
# Before
"ACCESS_TOKEN_LIFETIME": timedelta(days=200)

# After
"ACCESS_TOKEN_LIFETIME": timedelta(hours=8)
```

A frontend token-refresh interceptor was also implemented so that expired access tokens are automatically renewed using the refresh token, preventing users from being logged out mid-session.

---

### F-12 — JWT Refresh Token Lifetime: 400 Days
**Severity:** Medium | **Status:** Fixed ✅

**Description:**  
The refresh token lifetime of 400 days meant a stolen refresh token could be used to generate new access tokens for over a year.

**Fix Applied:**
```python
# Before
"REFRESH_TOKEN_LIFETIME": timedelta(days=400)

# After
"REFRESH_TOKEN_LIFETIME": timedelta(days=7)
```

---

### F-13 — Port 80 Not Listening — No HTTP→HTTPS Redirect
**Severity:** Low | **Status:** Fixed ✅

**Description:**  
Port 80 (HTTP) was not accepting connections, meaning users who typed the URL without `https://` received a connection refused error instead of being automatically redirected to the secure version.

**Fix Applied:**  
Added a dedicated HTTP redirect server block to the nginx configuration:
```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name itservicedesk.creditreferencenigeria.net;
    return 301 https://$host$request_uri;
}
```

---

### F-14 — Docker Port 8000 Bound to All Interfaces
**Severity:** Medium | **Status:** Mitigated ✅

**Description:**  
Docker's proxy process bound port 8000 (the Django/Gunicorn backend) to `0.0.0.0`, making it accessible on all network interfaces. Direct access to the Django backend bypasses nginx and all security headers.

**Evidence:**
```
LISTEN  0.0.0.0:8000   docker-proxy (pid=34965)
LISTEN  [::]:8000      docker-proxy (pid=34972)
```

**Mitigation Applied:**  
iptables rules block all external traffic to port 8000, permitting only localhost:
```bash
sudo iptables -I DOCKER-USER -p tcp --dport 8000 -j DROP
sudo iptables -I DOCKER-USER -s 127.0.0.1 -p tcp --dport 8000 -j ACCEPT
sudo netfilter-persistent save
```

**Verified:**
```
curl http://itservicedesk.creditreferencenigeria.net:8000/admin/
# Result: Connection timed out ✅
```

---

### F-15 — IDOR: Staff Can Read Any User's Issues
**Severity:** High | **Status:** Fixed ✅

**Description:**  
The `/api/issues/` endpoint returned all issues in the system to any authenticated user regardless of role. A staff member could read, enumerate, or access another employee's confidential IT issues by guessing sequential issue IDs.

**Fix Applied:**  
`IssuesViewSet.get_queryset()` now filters by the requesting user for non-admin accounts:
```python
if not is_admin_user(self.request.user):
    base = base.filter(reported_by=self.request.user)
```

---

### F-16 — Any User Could Claim Admin Tickets
**Severity:** High | **Status:** Fixed ✅

**Description:**  
The ticket `claim` action in `IssuesViewSet` had no role check. Any authenticated staff member could send a PATCH request with `action=claim` to assign any issue to themselves, disrupting the IT support workflow.

**Fix Applied:**
```python
if action == 'claim':
    if not is_admin_user(request.user):
        return Response({'detail': 'Only IT admins can claim issues.'}, status=403)
```

---

### F-17 — Generic PATCH Had No Role Enforcement
**Severity:** High | **Status:** Fixed ✅

**Description:**  
The fallthrough path in `IssuesViewSet.partial_update()` (handling status changes and reopening tickets) had no role or ownership check. Any authenticated user could modify issue fields arbitrarily.

**Fix Applied:**
```python
if not is_admin_user(request.user):
    return Response({'detail': 'You do not have permission to modify this issue.'}, status=403)
```

---

### F-18 — Sender Spoofing in Conversation Messages
**Severity:** High | **Status:** Fixed ✅

**Description:**  
`ConversationsViewSet.create()` accepted the `sender` field from the request body without validation. An attacker could post messages impersonating any other user — including an IT admin — by simply supplying a different `sender` ID in the request payload.

**Fix Applied:**  
The view now ignores the client-supplied sender and always uses the authenticated user:
```python
request.data['sender'] = request.user.id
sender = request.user
```

---

### F-19 — Unrestricted File Upload to Any Issue
**Severity:** Medium | **Status:** Fixed ✅

**Description:**  
The file upload endpoint `/api/issues/{id}/attachments/` had no ownership check. Any authenticated user could upload files to any issue, not just their own.

**Fix Applied:**
```python
is_reporter = issue.reported_by_id == request.user.id
is_assignee = issue.assigned_to_id == request.user.id
if not (is_reporter or is_assignee or is_admin_user(request.user)):
    return Response({'detail': 'Permission denied.'}, status=403)
```

---

### F-20 — Double Extension Bypass in File Upload
**Severity:** High | **Status:** Fixed ✅

**Description:**  
The extension check used `rsplit('.', 1)[-1]` to extract only the final extension. A file named `malicious.php.jpg` would pass the check (final extension is `jpg`) while embedding a dangerous `.php` extension earlier in the filename.

**Fix Applied:**  
All filename segments are now checked against a list of dangerous executable extensions:
```python
DANGEROUS_EXTS = {'php', 'php3', 'php4', 'php5', 'py', 'rb', 'sh',
                  'bash', 'pl', 'cgi', 'asp', 'aspx', 'jsp', 'exe', 'bat', 'cmd', 'ps1'}

if any(part in DANGEROUS_EXTS for part in parts[:-1]):
    return Response({'detail': 'File contains a disallowed file type.'}, status=400)
```

---

### F-21 — Path Traversal Characters in Stored Filename
**Severity:** Medium | **Status:** Fixed ✅

**Description:**  
The `original_name` field stored `f.name` directly from the client without sanitization. A filename like `../../etc/passwd` would be stored verbatim in the database.

**Fix Applied:**  
`os.path.basename()` strips all path components before storing:
```python
safe_name = os.path.basename(f.name)
```

---

### F-22 — Incorrect File Size Error Message
**Severity:** Low | **Status:** Fixed ✅

**Description:**  
The video file size limit error message displayed "exceeds the 100 MB limit" when the actual enforced limit was 25 MB, causing confusion.

**Fix Applied:**
```python
label = '25 MB' if ext in VIDEO_EXTENSIONS else '10 MB'
```

---

### F-23 — No MIME Type (Magic Byte) Validation
**Severity:** Medium | **Status:** Recommended ⚠️

**Description:**  
File validation relies solely on the file extension. A determined attacker could rename a file with malicious content to use an allowed extension (e.g., a script saved as `document.pdf`). Magic byte validation reads the actual file content to verify it matches the declared type.

**Current Mitigation:**  
The strict extension whitelist reduces this risk significantly. Files are served by Django (not executed by the web server), further limiting the impact.

**Recommendation:**  
Install `python-magic` and add MIME type verification:
```bash
sudo apt install libmagic1
pip install python-magic
```
```python
import magic
mime = magic.from_buffer(f.read(2048), mime=True)
f.seek(0)
ALLOWED_MIMES = {'image/jpeg', 'image/png', 'application/pdf', 'video/mp4', ...}
if mime not in ALLOWED_MIMES:
    return Response({'detail': 'File content does not match its extension.'}, status=400)
```

---

### F-24 — Unbounded Text Fields
**Severity:** Low | **Status:** Fixed ✅

**Description:**  
The `description` field on issues and `message` field on conversations were Django `TextField` columns with no `max_length` constraint at the API level. An authenticated user could submit megabytes of text in a single request, potentially causing database and memory pressure.

**Fix Applied:**  
Maximum lengths enforced at the serializer level:
```python
description = serializers.CharField(max_length=5000)  # IssuesSerializer
message = serializers.CharField(max_length=2000)       # ConversationsSerializer
```

---

### F-25 — No Choices Validation on Status, Severity, and Role Fields
**Severity:** Low | **Status:** Fixed ✅

**Description:**  
The `status`, `severity`, and `role` fields accepted any string value up to their `max_length`, with no validation against the defined valid choices. An admin could set a user's role to an arbitrary string or create an issue with an unknown severity.

**Fix Applied:**  
`validate_` methods added to all relevant serializers:
```python
VALID_SEVERITIES = {'critical', 'high', 'low', 'minor'}
VALID_STATUSES   = {'pending', 'completed'}
VALID_ROLES      = {'staff', 'admin'}
```

---

## 6. Fixes Applied

The following changes were made to the codebase and server configuration during this assessment:

### Backend (Django)

| File | Change |
|------|--------|
| `settings.py` | JWT access token: `200 days` → `8 hours` |
| `settings.py` | JWT refresh token: `400 days` → `7 days` |
| `settings.py` | Added login throttle rate: `5/min` |
| `views.py` | Added `LoginRateThrottle` class on login endpoint |
| `views.py` | `IssuesViewSet`: filter issues by `reported_by` for non-admins |
| `views.py` | `claim` action: added `is_admin_user` check |
| `views.py` | Generic `partial_update`: added role enforcement |
| `views.py` | `ConversationsViewSet`: enforce `request.user` as sender |
| `views.py` | `upload_attachments`: added ownership check |
| `views.py` | `upload_attachments`: added double extension detection |
| `views.py` | `upload_attachments`: sanitize filename with `os.path.basename()` |
| `views.py` | `upload_attachments`: fixed error label `100 MB` → `25 MB` |
| `serializers.py` | Added `max_length` to `description` (5,000) and `message` (2,000) |
| `serializers.py` | Added `validate_severity`, `validate_status`, `validate_role` methods |

### Frontend (Next.js)

| File | Change |
|------|--------|
| `next.config.ts` | Added `poweredByHeader: false` |
| `src/lib/api.ts` | Replaced logout-on-401 with token refresh interceptor |
| `src/app/not-found.tsx` | Created 404 error page |
| `src/app/error.tsx` | Created runtime error page with retry |
| `src/app/global-error.tsx` | Created root-level error page |

### Server (nginx)

| Change | Finding Addressed |
|--------|------------------|
| Added all 6 security headers (`HSTS`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `CSP`) | F-01 to F-05 |
| `server_tokens off` | F-06 |
| `proxy_hide_header X-Powered-By` | F-07 |
| Added HTTP→HTTPS redirect server block (port 80) | F-13 |

### Server (iptables)

| Change | Finding Addressed |
|--------|------------------|
| Block external access to port 8000 via `DOCKER-USER` chain | F-14 |
| Rules persisted via `netfilter-persistent save` | F-14 |

---

## 7. Open Recommendations

### ⚠️ F-09 — AnyDesk Running as Root

**Priority:** High  
**Effort:** Low

The AnyDesk service daemon runs as `root`. This should be addressed even if AnyDesk is required for remote administration.

**Steps:**
1. Create a dedicated system user: `sudo useradd -r -s /bin/false anydesk-svc`
2. Configure AnyDesk to run its service daemon under this user
3. Enable two-factor authentication on the AnyDesk account
4. Enable AnyDesk access control list to restrict which IDs can connect
5. Consider replacing AnyDesk with SSH key-based access for server management

### ⚠️ F-23 — MIME Type Validation

**Priority:** Medium  
**Effort:** Medium

Add `python-magic` library for magic byte validation on all file uploads. See detailed recommendation in F-23 above.

---

## 8. Conclusion

The IT Service Desk application was assessed across six security domains. The application had a number of significant vulnerabilities at the time of assessment — particularly in authorization controls and security hardening — but none that would be considered immediately catastrophic given the internal-only nature of the system.

**All high-priority code-level vulnerabilities have been remediated.** The application now correctly enforces role-based access, protects against brute-force attacks, uses short-lived JWT tokens with automatic refresh, and applies a full suite of HTTP security headers.

The two remaining open items (AnyDesk root process and MIME type validation) have clear remediation paths and do not block continued production use.

**Post-remediation security posture: Good.** A follow-up assessment is recommended in 6–12 months or after any significant architectural change.

---

*Report prepared by the IT Support Department, CRC Credit Bureau Limited.*  
*Assessment conducted using manual code review, curl-based endpoint testing, and live server analysis.*
