# Changelog

## 1.0.0 (2026-07-13)

### Features
- 9 LinkedIn API tools: profiles, posts, feed, connections
- Image upload support for LinkedIn posts (3-step /rest/images flow)
- PKCE OAuth login flow (interactive browser-based auth)
- Token persistence via config file with env var override
- Dual response format (markdown + JSON) on all tools
- Structured error codes for AI agent programmatic handling

### Infrastructure
- MIT License, CODE_OF_CONDUCT, CONTRIBUTING.md
- CI/CD pipeline (GitHub Actions)
- 176+ passing tests (Vitest + nock)
- Cross-platform path resolution (Windows + Unix)
- Node.js >=18 runtime check

### Fixes
- Pagination `has_more` logic fixed for upstreamTotal edge case
- Token revocation detection separated from expiry
- Cross-platform clean script (rm -rf → fs.rmSync)
