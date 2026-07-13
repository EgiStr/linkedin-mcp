---
### Task T1: Auth Infrastructure — config.ts + token-store.ts [prereq]
---

## OBJECTIVE
Create config file management and token persistence layer. This is the foundation for all auth-dependent features (T2, T5).

Files:
- Create: `src/auth/config.ts`
- Create: `src/auth/token-store.ts`
- Test: `tests/auth/config.test.ts`
- Test: `tests/auth/token-store.test.ts`

## REFERENCES LOADED
- `docs/pocket/spec/2026-07-13-linkedin-mcp-server/research-spec.md` — Story 4 (Auth Flow), all 3 scenarios
- `docs/pocket/arch/2026-07-13-linkedin-mcp-server/tech-design.md` — ADR-004 (Config + Env Var Fallback), ADR-007 (Cross-Platform Path), Auth Module section, Token resolution chain
- `src/services/linkedin-client.ts` — Existing token patterns, isTokenExpired()
- `src/types.ts` — ResponseFormat enum, ToolEntry interface
- `package.json` — Dependencies (no additional needed — os, path, fs are Node built-ins)
- `vitest.config.ts` — Test include pattern `tests/**/*.test.ts`

## WHY THIS APPROACH
**Scaffolding task** — foundational layer with zero external dependencies. Config uses Node built-ins only (fs, path, os). Token-store wraps config with three-tier fallback (env var → config file → none). This is deliberately decoupled from LinkedInClient — the client receives a resolved token string, not a config dependency.

**Complexity:** Low. Pure I/O logic with clear test boundaries.

## SANDWICH CONTEXT
**Architecture constraints:**
- Config path: `path.join(os.homedir(), '.config', 'linkedin-mcp', 'config.json')` per ADR-007
- Config format: JSON with `{ accessToken, expiresAt?, scopes? }`
- File permissions: 0o600 on Unix, no special handling on Windows
- Token resolution order: LINKEDIN_ACCESS_TOKEN env var → config file
- Only read operations in token-store are sync — startup must be instant
- No encryption in v1 (keys are not stored, only tokens)

**Error handling:**
- Missing config file → not an error, return null
- Corrupt JSON → return null, do not crash
- All public methods are synchronous (except future OAuth token exchange)

## DELIVERABLE
Acceptance criteria verified:
- **Story 4, Scenario "Token persistence"**: Given saved token in config file → loads from config on startup
- **Story 4, Scenario "Env var override"**: Given LINKEDIN_ACCESS_TOKEN set → uses env var instead of config file
- **Story 4, Scenario "OAuth PKCE login flow"**: Token saved to `~/.config/linkedin-mcp/config.json`

## QUALITY BAR
**Must-haves:**
- `config.ts` must export: `getConfigPath()`, `readConfig()`, `writeConfig()`, `clearConfig()`
- `token-store.ts` must export: `getAccessToken()`, `saveToken()`, `loadToken()`, `clearToken()`
- `getAccessToken()` must check env var `LINKEDIN_ACCESS_TOKEN` first, then fall back to config file
- All paths cross-platform via `path.join` + `os.homedir()`
- Token store must parse `expiresAt` and indicate expired tokens without crashing
- Config directory must be created automatically on first write
- Write operations must have error handling (permission denied, disk full)
- Environment variable fallback must work even without a config file

**Must-nots:**
- No env var write-back — env var is read-only override, never persisted to config
- No encryption or key derivation — v1 keeps tokens as plaintext in user home directory
- No LinkedIn API calls in this module — pure file I/O

**Open question risks:**
- Cross-platform config path on Windows: `~/.config` is unconventional but functional — test on Windows
- Config corruption during write: Node.js `writeFileSync` is atomic for small files (<1MB)

## STOP CONDITIONS
**Done:** All test scenarios pass:
- `npm test -- tests/auth/config.test.ts tests/auth/token-store.test.ts` → ✅ PASS
- `getAccessToken()` with env var → returns env var value
- `getAccessToken()` without env var, with config file → returns config value
- `getAccessToken()` without env var, without config → returns null
- `saveToken()` writes valid JSON to correct path
- `readConfig()` returns parsed JSON or null
- Corrupt config file → returns null, no crash

**Escalate:** Test framework issue (Vitest not finding test files), Node.js version <18 detected
