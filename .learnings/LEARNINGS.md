# Learnings

## [LRN-20260713-001] auth-infrastructure-layer

**Logged**: 2026-07-13T21:09:00Z
**Priority**: medium
**Status**: resolved
**Area**: backend

### Summary
Auth infrastructure layer (T1) implemented for linkedin-mcp-server — ConfigManager + TokenStore with cross-platform path resolution and JWT expiry inspection.

### Details
- ConfigManager: cross-platform config path (Windows %APPDATA%, Unix ~/.config), file read/write with mkdir recursive, permission error handling
- TokenStore: wraps ConfigManager with LINKEDIN_ACCESS_TOKEN env var priority fallback
- JWT decode: Buffer-based base64url parsing, extracts only `exp` claim — no external deps
- 42 tests passing across both modules
- TypeScript compiles cleanly (pre-existing errors in media/uploader.ts are unrelated)

### Metadata
- Area: backend
- Source: pocketto task
- Related Files: src/auth/config.ts, src/auth/token-store.ts, tests/auth/config.test.ts
- Tags: auth, linkedin, config, jwt

## [LRN-20260713-002] media-upload-post-integration

**Logged**: 2026-07-13T21:18:00Z
**Priority**: medium
**Status**: resolved
**Area**: backend

### Summary
Media upload integration (T4) implemented — create_post tool now supports media_url and media_path params, integrating the existing MediaUploader 3-step flow.

### Details
- Added `media_url` (URL-validated), `media_path` (local file), and `alt_text` params to CreatePostSchema
- superRefine ensures mutual exclusivity of media_url/media_path
- Handler: if media param provided, instantiates MediaUploader, uploads via 3-step flow, passes image URN to LinkedInClient.createPost
- LinkedInClient.createPost refactored from `media?: { url, altText }` to `imageUrn?: string; altText?: string` for clarity
- Error handling: MediaUploadError caught first with structured error codes (MEDIA_FORMAT_ERROR, MEDIA_SIZE_ERROR), falls through to generic LinkedInClient.formatError
- JSON output includes `has_media: true`; markdown output shows `✅ Image attached` line
- 11 new tests: URL upload, file upload, no-alt-text default, format error, size error (URL + file), backward compat text-only, visibility compat, markdown output
- 134/134 tests passing

### Metadata
- Area: backend
- Source: coding-agent direct
- Related Files: src/tools/posts.ts, src/services/linkedin-client.ts, tests/tools/posts-media.test.ts
- Tags: linkedin, media, upload, posts, integration

## [LRN-20260713-003] pkce-oauth-login-tool

**Logged**: 2026-07-13T21:21:00Z
**Priority**: high
**Status**: resolved
**Area**: backend

### Summary
T2 PKCE OAuth Login Tool implemented — full OAuth 2.0 PKCE (S256) flow with browser launch, localhost callback server, token exchange, and config file persistence.

### Details
- OAuthClient class (src/auth/oauth.ts):
  - generatePKCE() → codeVerifier (64 unreserved chars) + codeChallenge (SHA-256 base64url) + state (hex)
  - buildAuthUrl() → LinkedIn authorize URL with response_type=code, PKCE params, scope
  - exchangeCode() → POST /accessToken, validates response shape, returns TokenResult
  - startAuthFlow() → discover port, PKCE, browser open, callback wait, state verify, exchange, save
  - waitForCallback() → temp HTTP server on localhost, one-shot /callback handler
  - findAvailablePort() → tries port range, returns first available
  - openBrowser() → cross-platform via start/open/xdg-open
- Tool (src/tools/auth.ts):
  - linkedin_oauth_login MCP tool with Zod schema: port, open_browser, timeout
  - User-friendly error messages per OAuthErrorCode (USER_CANCEL, TIMEOUT, PORT_UNAVAILABLE, etc.)
  - Follows existing factory pattern (createOAuthLoginTool → ToolEntry)
- index.ts changes:
  - Imports TokenStore + ConfigManager, tries config file before env var
  - No longer crashes without token — oauth_login tool is always available
  - Registers linkedin_oauth_login always; API tools only if client exists
- 31 tests: PKCE generation, URL construction, token exchange (nock), port discovery, callback server (integration), tool wiring
- 165/165 tests passing, tsc --noEmit 0 errors

### Metadata
- Area: backend
- Source: coding-agent direct
- Related Files: src/auth/oauth.ts, src/tools/auth.ts, src/index.ts, tests/auth/oauth.test.ts
- Tags: linkedin, oauth, pkce, auth, token

---

## [LRN-20260713-004] t5-cross-platform-fixes

**Logged**: 2026-07-13T21:28:00Z
**Priority**: high
**Status**: resolved
**Area**: backend

### Summary
Cross-platform fixes and hardening (T5) for linkedin-mcp-server — Node.js version check, Windows-safe clean script, fixed pagination offset logic, and TOKEN_REVOKED error detection.

### Details
- **Node.js version check** (src/index.ts): early startup gate checks `process.versions.node >= 18`, exits with clear message on failure
- **Cross-platform clean script** (package.json): replaced `rm -rf dist` with `node -e "require('fs').rmSync('dist',{recursive:true,force:true})"` — works on Windows without rimraf dep
- **Fixed pagination** (linkedin-client.ts `hasMoreElements`):
  - Added `currentOffset` parameter to account for current position
  - Fixed: `upstreamTotal > currentOffset + elements.length` instead of `upstreamTotal > 0`
  - Updated all 4 call sites (getUserPosts ×2, getFeed, getConnections) to pass `params.start || 0`
- **TOKEN_REVOKED detection** (linkedin-client.ts):
  - Added `TOKEN_REVOKED = "TOKEN_REVOKED"` to `LinkedInErrorCode` enum
  - classifyError: checks for "revoked" or "consent" in 401 response message before falling through to TOKEN_EXPIRED/TOKEN_INVALID
- **Tests** (core-enhancements.test.ts): 10 new tests — 5 offset-aware pagination, 1 enum check, 2 TOKEN_REVOKED classification, 1 Node version logic, 1 cross-platform script pattern

### Metadata
- Area: backend
- Source: coding-agent direct
- Related Files: src/index.ts, package.json, src/services/linkedin-client.ts, tests/core-enhancements.test.ts
- Tags: linkedin, cross-platform, pagination, error-codes, hardening

## [LRN-20260713-005] t6-npm-publish-setup

**Logged**: 2026-07-13T21:31:00Z
**Priority**: medium
**Status**: resolved
**Area**: infrastructure

### Summary
NPM publish readiness (T6) configured for linkedin-mcp-server — package.json metadata, README badges/Quick Start/Architecture/Auth Setup/Media Upload/Contributing, CHANGELOG, issue templates.

### Details
- **package.json**: Added `@eggisatriadev/linkedin-mcp` name, description, author, license (MIT), repository, bugs, keywords, `files` (dist/, README.md, LICENSE), `publishConfig.access: public`, `prepublishOnly: npm run build`
- **README.md**: Added 4 badges (npm version, license, CI, node >=18), Quick Start with npx install, Claude Desktop/OpenCode npx config, OAuth PKCE Login section, Media Upload section, full 10-tool table, Architecture section with directory tree, Contributing section, cross-reference to tech-design.md
- **CHANGELOG.md**: Created with v1.0.0 entry covering features, infrastructure, fixes
- **Issue templates**: Created `.github/ISSUE_TEMPLATE/bug_report.md` and `feature_request.md`
- **Verified**: `npm pack --dry-run` shows correct 47 files (dist/, README.md, LICENSE, package.json), `npm run build` passes, all 176 tests pass

### Metadata
- Area: infrastructure
- Source: coding-agent direct
- Related Files: package.json, README.md, CHANGELOG.md, .github/ISSUE_TEMPLATE/bug_report.md, .github/ISSUE_TEMPLATE/feature_request.md
- Tags: linkedin, npm, publish, packaging, documentation
