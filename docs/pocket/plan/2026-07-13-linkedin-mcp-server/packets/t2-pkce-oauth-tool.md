---
### Task T2: PKCE OAuth Tool — oauth.ts + linkedin_oauth_login tool [depends: T1]
---

## OBJECTIVE
Implement PKCE OAuth 2.0 Authorization Code flow and expose it as the `linkedin_oauth_login` MCP tool. Requires T1 (config.ts + token-store.ts) for token persistence.

Files:
- Create: `src/auth/oauth.ts`
- Create: `src/tools/auth.ts`
- Modify: `src/index.ts` — register linkedin_oauth_login tool
- Test: `tests/auth/oauth.test.ts`

## REFERENCES LOADED
- `docs/pocket/spec/2026-07-13-linkedin-mcp-server/research-spec.md` — Story 4 (Auth Flow), Story 1 (Profile & Auth)
- `docs/pocket/arch/2026-07-13-linkedin-mcp-server/tech-design.md` — Section 1.2.3 Auth Module, ADR-004, PKCE flow diagram, Section 6.2 OAuth PKCE Security
- `src/index.ts` — Tool registration pattern, current env var check at startup
- `src/types.ts` — ToolEntry interface, ResponseFormat
- `src/tools/profile.ts` — Existing tool factory pattern for reference (createProfileTools)
- `src/services/linkedin-client.ts` — LinkedInErrorCode.TOKEN_EXPIRED for error handling

## WHY THIS APPROACH
**Feature task** — implements the core OAuth PKCE flow. Uses Node.js built-in `crypto` for PKCE challenge generation (SHA-256). The OAuth flow is:
1. Generate code_verifier (random 43-char string) and code_challenge (SHA-256 hash)
2. Build LinkedIn authorize URL with PKCE challenge + state parameter
3. Optionally open browser to that URL
4. User authorizes → LinkedIn redirects to localhost callback with auth code
5. Exchange auth code + verifier for access token via POST /access_token
6. Save token via token-store.ts

The tool handler (`tools/auth.ts`) follows the existing factory pattern from profile.ts/posts.ts.

**Complexity:** Medium. Cryptography (SHA-256), HTTP callback server, browser launch.

## SANDWICH CONTEXT
**Architecture constraints:**
- PKCE per RFC 7636 (S256 method)
- Code verifier: 43-128 chars, cryptographically random, unreserved URL-safe chars
- Code challenge: base64url(SHA-256(verifier))
- State parameter: random string to prevent CSRF
- Redirect URI: default `http://localhost:8080/callback` (configurable via env)
- LinkedIn token endpoint: `POST https://www.linkedin.com/oauth/v2/accessToken`
- LinkedIn auth endpoint: `GET https://www.linkedin.com/oauth/v2/authorization`
- Browser launch via `open` command (cross-platform)
- Config paths from T1 (token-store.ts) for token persistence

**Error handling:**
- Invalid Client ID → structured error with clear guidance
- User denies authorization → PENDING status
- Network failure during exchange → NETWORK_ERROR
- All errors wrapped in LinkedInClient-style structured errors

## DELIVERABLE
Acceptance criteria verified:
- **Story 4, Scenario "OAuth PKCE login flow"**: Full flow — generate PKCE → build URL → exchange code → save token
- **Story 4, Scenario "Token persistence"**: Saved token loadable on restart (T1 dependency)
- **Story 1, Scenario "Get user profile with valid token"**: Token usable with getUserInfo after OAuth

## QUALITY BAR
**Must-haves:**
- `oauth.ts` must export: `generatePKCE()`, `buildAuthUrl()`, `exchangeCode()`, `handleOAuthCallback()`
- `generatePKCE()` returns `{ codeVerifier, codeChallenge, state }`
- `buildAuthUrl()` returns LinkedIn authorize URL with all required params
- `exchangeCode()` POSTs to LinkedIn token endpoint and returns access token response
- PKCE uses S256 method (SHA-256, not plain)
- State parameter included in auth URL and verified on callback
- Token saved to config file via token-store.saveToken() after exchange
- Browser opens automatically (configurable via open_browser param)
- Tool schema follows existing strict Zod pattern

**Must-nots:**
- No hardcoded secrets — all credentials from env vars (LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET)
- No real token exchanges in CI tests — mock with nock
- OAuth module must not depend on LinkedInClient class

**Open question risks:**
- Browser launch may fail in headless environments (CI, Docker) — `open_browser: false` default for those cases
- Port 8080 may already be in use — document how to change via env var or config
- LinkedIn token endpoint may return different response shapes — test with real API during integration

## STOP CONDITIONS
**Done:** All test scenarios pass:
- `npm test -- tests/auth/oauth.test.ts` → ✅ PASS
- PKCE challenge generation produces valid base64url string
- Auth URL contains code_challenge, state, redirect_uri, client_id, scope, response_type
- Token exchange mock returns access_token, expires_in, scope
- Exchange stores token via token-store.saveToken()
- Error cases: invalid client_id, network failure, denied authorization

**Escalate:** crypto module unavailable (unlikely in Node 18+), LinkedIn breaks OAuth endpoint contract, port conflicts unresolvable
