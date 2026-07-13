---
### Task T5: Cross-Platform Fixes — config path, Node.js version check [depends: T1, T3]
---

## OBJECTIVE
Harden the auth config and uploader for cross-platform compatibility. Ensure config path resolution works correctly on Windows, macOS, and Linux. Add Node.js version check at startup.

Files:
- Modify: `src/auth/config.ts` — verify cross-platform path handling
- Modify: `src/media/uploader.ts` — ensure file path handling works on Windows
- Modify: `src/index.ts` — add Node.js version check at startup
- Modify: `src/services/linkedin-client.ts` — add setAccessToken() method for OAuth token injection
- Test: `tests/core-enhancements.test.ts` — add Node version check test, config path tests
- Test: `tests/auth/config.test.ts` — add cross-platform path tests

## REFERENCES LOADED
- `docs/pocket/arch/2026-07-13-linkedin-mcp-server/tech-design.md` — ADR-007 (Cross-Platform Path), ADR-004, Section 6 Security
- `src/auth/config.ts` (from T1) — Current path resolution
- `src/media/uploader.ts` (from T3) — Current file path handling
- `src/index.ts` — Current startup, no version check
- `src/services/linkedin-client.ts` — LinkedInClient constructor takes token, no setter
- `package.json` — engines: { "node": ">=18" }

## WHY THIS APPROACH
**Hardening task** — ensures the new code works on all target platforms. The config path ADR-007 chose `~/.config/` on all platforms, but this needs verification: `os.homedir()` returns `C:\Users\name` on Windows, and `.config` is a valid directory name on all platforms.

LinkedInClient needs a `setAccessToken()` method so it can update its token after OAuth exchange without re-creating the entire client.

Node.js version check is a fast-fail validation that saves users from confusing errors.

**Complexity:** Low. Mostly verification and minor fixes.

## SANDWICH CONTEXT
**Architecture constraints:**
- Node.js >=18 required — check at startup via process.versions.node
- Windows path handling: path.join uses backslashes, fs works with both
- LinkedInClient currently has no way to update token after construction — need setter for OAuth flow
- File paths in tests: use path.resolve to create platform-independent paths

## DELIVERABLE
- Node.js version <18 → clear error message at startup
- Config path works on Windows: `%USERPROFILE%\.config\linkedin-mcp\config.json`
- Config path works on Unix: `~/.config/linkedin-mcp/config.json`
- LinkedInClient.setAccessToken(newToken) updates instance and Axios headers
- Uploader file path handles Windows backslashes and spaces

## QUALITY BAR
**Must-haves:**
- `src/index.ts` exports `checkNodeVersion()` that validates >=18
- On version failure: log to stderr, exit with code 1
- `LinkedInClient.setAccessToken(token)` updates `this.accessToken` and `this.api.defaults.headers.Authorization`
- Config path tests use `os.homedir()` mock or platform-aware assertions
- Uploader tests include paths with spaces on all platforms

**Must-nots:**
- No hardcoded path separators — always use path.join
- No assumptions about drive letters (Windows)
- setAccessToken must not break existing token-dependent state

## STOP CONDITIONS
**Done:** All test scenarios pass:
- `npm test -- tests/core-enhancements.test.ts tests/auth/config.test.ts` → ✅ PASS
- Node version check passes on >=18, fails on <18
- setAccessToken updates Authorization header
- Config path resolves correctly on mocked platforms
- Uploader handles Windows-style paths

**Escalate:** setAccessToken introduces state inconsistency in LinkedInClient
