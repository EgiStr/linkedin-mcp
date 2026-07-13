# Research Spec: LinkedIn MCP Server

**Date:** 2026-07-13
**Status:** Draft
**Project:** linkedin-mcp-server (Open Source)
**License:** MIT

---

## Problem Statement

Tidak ada open-source LinkedIn MCP server yang menggabungkan:
1. TypeScript + official LinkedIn API (ToS-compliant)
2. Comprehensive tools (15+)
3. Proper OAuth PKCE auth flow
4. Community-ready packaging (npm, CI, docs, tests)

Existing solusi: browser automation (ToS violation), abandoned projects, atau fitur terbatas.

## Scope

### IN-SCOPE
- Core LinkedIn API MCP tools (profiles, posts, feed)
- Media/image upload support for posts
- PKCE OAuth 2.0 Authorization Code flow
- Structured error handling
- Post pagination with has_more
- Dual response format (markdown + JSON)
- Unit + integration testing (Vitest + nock)
- CI/CD pipeline (GitHub Actions)
- npm publish-ready packaging
- Token expiry detection

### OUT-OF-SCOPE
- Browser automation / scraping
- Partner API features (messaging, people search, connections)
- Multi-user server deployment
- Dashboard UI
- Streamable HTTP (v2)
- Organization/page management

## User Stories (BDD)

### Story 1: Profile & Auth
```
Scenario: Get user profile with valid token
  Given a valid LinkedIn OAuth token with openid+profile scope
  When user calls linkedin_get_user_info
  Then returns JSON/markdown with sub, name, email, picture, locale

Scenario: Get full LinkedIn profile
  Given a valid LinkedIn OAuth token
  When user calls linkedin_get_my_profile
  Then returns full profile with headline, vanityName, profileUrl

Scenario: Expired token returns structured error
  Given an expired LinkedIn OAuth token
  When user calls any tool
  Then returns structured error with code TOKEN_EXPIRED
  And error message guides user to re-authenticate
```

### Story 2: Posts & Content
```
Scenario: Create text post
  Given a valid LinkedIn OAuth token with w_member_social scope
  When user calls linkedin_create_post with text="Hello World" visibility=PUBLIC
  Then post is published to LinkedIn
  And returns postId, urn, url

Scenario: Create post with image
  Given a valid LinkedIn OAuth token with w_member_social scope
  And a valid image URL or local path
  When user calls linkedin_create_post with text + media_url
  Then image is uploaded via /rest/images flow
  And post is published with image attached

Scenario: Delete post
  Given a valid LinkedIn OAuth token
  And an existing post URN
  When user calls linkedin_delete_post with post_id
  Then post is permanently deleted
  And returns deletion confirmation

Scenario: List posts with pagination
  Given a valid LinkedIn OAuth token
  When user calls linkedin_list_posts with count=10
  Then returns array of posts
  And has_more=true if more posts exist
  And next_offset provided for pagination

Scenario: Empty list returns no posts message
  Given a new LinkedIn account with no posts
  When user calls linkedin_list_posts
  Then returns friendly message "No posts found"
```

### Story 3: Error Handling
```
Scenario: Missing scope returns SCOPE_MISSING error
  Given a token without w_member_social scope
  When user calls linkedin_create_post
  Then returns structured error with code SCOPE_MISSING
  And error message explains which scope is needed

Scenario: Rate limited returns RATE_LIMITED error
  Given LinkedIn API rate limit is exceeded (429)
  When user calls any tool
  Then returns structured error with code RATE_LIMITED
  And suggests waiting before retrying

Scenario: Network failure returns NETWORK_ERROR
  Given no internet connection
  When user calls any tool
  Then returns structured error with code NETWORK_ERROR
```

### Story 4: Auth Flow
```
Scenario: OAuth PKCE login flow
  Given LinkedIn Client ID and Client Secret configured
  When user calls linkedin_oauth_login
  Then opens browser to LinkedIn authorize URL with PKCE challenge
  And user authorizes the app
  And token is saved to ~/.config/linkedin-mcp/config.json
  And returns success message

Scenario: Token persistence
  Given a previously saved token in config file
  When MCP server starts
  Then loads token from ~/.config/linkedin-mcp/config.json
  And returns authentication status

Scenario: Env var override
  Given LINKEDIN_ACCESS_TOKEN env var is set
  When MCP server starts
  Then uses env var token instead of config file
```

### Story 5: Media Upload
```
Scenario: Image upload flow
  Given a valid token with w_member_social scope
  And an image file (JPEG/PNG, <10MB)
  When uploading image
  Then POST /rest/images?action=initializeUpload returns uploadUrl
  And PUT binary to uploadUrl succeeds
  And returned image URN can be used in create_post

Scenario: Invalid media format
  Given an invalid media file (e.g. .exe, .txt)
  When uploading media
  Then returns error about unsupported media type
```

## Technical Constraints

1. **LinkedIn API Version:** 202603 (configurable)
2. **MCP SDK:** v1.6.1+, registerTool() API
3. **Transport:** Stdio (local), Streamable HTTP (future)
4. **Auth:** OAuth 2.0 Authorization Code + PKCE (RFC 7636)
5. **License:** MIT
6. **Node.js:** >=18
7. **Testing:** Vitest + nock (no real API calls in CI)

## Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Language | TypeScript | MCP SDK maturity, type safety, AI-friendly |
| SDK API | registerTool() | Modern API, auto schema handling |
| Validation | Zod .strict() | Runtime type safety, JSON Schema gen |
| HTTP Client | Axios | Interceptors, timeout, error handling |
| Testing | Vitest + nock | Fast, TypeScript-native, API mocking |
| Output Format | Markdown + JSON | Human + AI agent readable |
| Error Format | Structured codes | AI agents can programmatically handle |

## Success Metrics

1. `npm install @eggisatriadev/linkedin-mcp` works in <30s
2. Auth setup in <5 min (including LinkedIn app creation)
3. All tools return both markdown and JSON
4. 80%+ test coverage
5. CI green on every PR
6. Zero hardcoded credentials in source

## Open Questions

- [ ] Should we support LinkedIn Organization/page posting?
- [ ] Should we add rate-limit aware retry logic?
- [ ] Streamable HTTP transport for v1 or v2?
