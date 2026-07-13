# Execution Plan: LinkedIn MCP Server v1.1.0

**Date:** 2026-07-13
**Plan ID:** docs/pocket/plan/2026-07-13-linkedin-mcp-server
**Spec:** docs/pocket/spec/2026-07-13-linkedin-mcp-server/research-spec.md
**Arch:** docs/pocket/arch/2026-07-13-linkedin-mcp-server/tech-design.md
**License:** MIT

---

## Overview

Add OAuth PKCE authentication flow, media upload pipeline, and npm publish readiness to the LinkedIn MCP Server. 7 tasks, 16 BDD scenarios across 5 stories.

## Preflight Summary

```
PREFLIGHT COMPLETE
Codebase scanned: src/index.ts, src/types.ts, src/services/linkedin-client.ts,
  src/tools/{profile,posts,network}.ts, tests/{linkedin-client,core-enhancements,
  error-formatting}.test.ts, docs/pocket/arch/tech-design.md, package.json,
  vitest.config.ts, README.md, .env.example
Test framework: Vitest v4 + nock v14 — globals: true, include: tests/**/*.test.ts
File conventions: Zod .strict() schemas, tool factory pattern (create*Tools()),
  LinkedInClient class with static error methods, ESM modules
Library docs fetched: N/A (all deps already in use — vitest, nock, axios, zod, MCP SDK)
Key findings:
  - Client createPost() already has optional media param — just need to wire tool layer
  - LinkedInClient has no setAccessToken() — needed for OAuth token injection
  - 64 tests passing currently
  - No auth module exists — all new code
  - Partner API tools are stubs (will remain stubs — out of scope)
Unknown areas: LinkedIn /rest/images API response shape (undocumented in public spec)
```

## Task List

```
TASK LIST — LinkedIn MCP Server v1.1.0
Total: 7 tasks | Dependency order is recommended — pocket-development enforces execution

T1: Auth Infrastructure — config.ts + token-store.ts                  [prereq]
T2: PKCE OAuth Tool — oauth.ts + linkedin_oauth_login tool            [depends: T1]
T3: Media Upload Infrastructure — uploader.ts                         [prereq]
T4: Media Upload Integration — modify linkedin_create_post            [depends: T3]
T5: Cross-Platform Fixes — config path, Node.js version check         [depends: T1, T3]
T6: npm Publish Setup — package.json metadata, README badges          [depends: T5]
T7: Final Review + Git Tag                                            [depends: T6]
```

## Dependency Graph

```
           ┌─────────┐     ┌─────────┐
           │   T1    │     │   T3    │
           │ [prereq]│     │ [prereq]│
           └────┬────┘     └────┬────┘
                │               │
                ▼               ▼
           ┌─────────┐     ┌─────────┐
           │   T2    │     │   T4    │
           └─────────┘     └─────────┘
                │               │
                └───────┬───────┘
                        ▼
                   ┌─────────┐
                   │   T5    │
                   └────┬────┘
                        ▼
                   ┌─────────┐
                   │   T6    │
                   └────┬────┘
                        ▼
                   ┌─────────┐
                   │   T7    │
                   └─────────┘
```

## Parallelizable Groups

1. **Phase A** (Foundation — run T1 + T3 concurrently):
   - `T1` — Auth infrastructure (config.ts, token-store.ts)
   - `T3` — Media upload infrastructure (uploader.ts)

2. **Phase B** (Features — run T2 + T4 concurrently after Phase A):
   - `T2` — PKCE OAuth tool [after T1]
   - `T4` — Media upload integration [after T3]

3. **Phase C** (Hardening — run T5 after both T1 + T3):
   - `T5` — Cross-platform fixes

4. **Phase D** (Release):
   - `T6` — npm publish setup [after T5]
   - `T7` — Final review + git tag [after T6]

## Files to Create

| File | Task | Description |
|------|------|-------------|
| `src/auth/config.ts` | T1 | Config file management (read/write/validate) |
| `src/auth/token-store.ts` | T1 | Token persistence (env var fallback chain) |
| `src/auth/oauth.ts` | T2 | PKCE OAuth 2.0 flow |
| `src/tools/auth.ts` | T2 | `linkedin_oauth_login` tool handler |
| `src/media/uploader.ts` | T3 | 3-step media upload pipeline |
| `src/tools/media.ts` | T3 | `linkedin_upload_media` tool handler |
| `tests/auth/config.test.ts` | T1 | Config unit tests |
| `tests/auth/token-store.test.ts` | T1 | Token store unit tests |
| `tests/auth/oauth.test.ts` | T2 | OAuth flow unit tests |
| `tests/media/uploader.test.ts` | T3 | Uploader unit tests |
| `tests/tools/posts.test.ts` | T4 | Posts tool integration tests |

## Files to Modify

| File | Task | Change |
|------|------|--------|
| `src/index.ts` | T2, T5 | Register linkedin_oauth_login tool, add Node.js version check |
| `src/tools/posts.ts` | T4 | Add `media_url` to CreatePostSchema, update handler |
| `src/services/linkedin-client.ts` | T5 | Add `setAccessToken()` method |
| `package.json` | T6 | Add publishConfig, files, keywords, repository, bugs, homepage |
| `README.md` | T6 | Add badges, OAuth section, updated tool table |
| `.env.example` | T6 | Add LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET |
| `tests/core-enhancements.test.ts` | T5 | Add version check + setAccessToken tests |

## Test Strategy

### New Test Files (5 files, ~50 test cases)

| Test File | Task | Type | Cases |
|-----------|------|------|-------|
| `tests/auth/config.test.ts` | T1 | Unit | 10 |
| `tests/auth/token-store.test.ts` | T1 | Unit | 10 |
| `tests/auth/oauth.test.ts` | T2 | Unit | 9 |
| `tests/media/uploader.test.ts` | T3 | Unit | 10 |
| `tests/tools/posts.test.ts` | T4 | Integration | 6 |

### Modified Test Files

| Test File | Task | Addition |
|-----------|------|----------|
| `tests/core-enhancements.test.ts` | T5 | +5 tests (node version, setAccessToken) |

### Verification Commands per Task

```
T1: npm test -- tests/auth/config.test.ts tests/auth/token-store.test.ts
T2: npm test -- tests/auth/oauth.test.ts
T3: npm test -- tests/media/uploader.test.ts
T4: npm test -- tests/tools/posts.test.ts
T5: npm test -- tests/core-enhancements.test.ts tests/auth/config.test.ts
T6: npm pack --dry-run
T7: npm run build && npm test && git tag v1.1.0
```

## Packet Reference

Full pocket packets in: `packets/t1-auth-infrastructure.md` through `packets/t7-final-review-tag.md`

## Spec Reviewer Verdict

✅ **APPROVED** — All 16/16 acceptance criteria mapped. No conflicts, no duplicates, no missing GWT. Dependency chain is acyclic. Out-of-scope boundaries enforced.

## Risks

1. **LinkedIn /rest/images API shape**: Undocumented in public spec — may need real API testing during T3. Flagged in packet QUALITY BAR.
2. **Browser launch in CI**: `open_browser: false` defaults mitigate this.
3. **Windows path handling**: `~/.config` is unconventional on Windows — T5 hardens and tests.

---

*End of Execution Plan*
