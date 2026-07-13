# Domain Expert Research Findings: LinkedIn MCP Server

> **Agent:** Domain-expert-researcher (LinkedIn API internals + MCP deep patterns)
> **Date:** 2026-07-13
> **Project:** Open Source LinkedIn MCP Server for AI Agents

---

## LinkedIn API Deep Dive

### Endpoint: Posts API (replaces Shares and UGCPosts)

- **Method:** POST / GET / DELETE
- **URL:** `https://api.linkedin.com/rest/posts` (new versioned base) — legacy `https://api.linkedin.com/v2/ugcPosts` and `https://api.linkedin.com/v2/shares` are **deprecated**
- **Headers Required:**
  - `LinkedIn-Version: YYYYMM` (e.g., `202601`) — **mandatory**; missing or sunsetted version returns 400 Bad Request
  - `X-Restli-Protocol-Version: 2.0.0`
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>`
- **Auth scope:** `w_member_social` (personal profiles) or `w_organization_social` (company pages)
- **Deprecation status:**
  - `/shares` (Share API) → **deprecated**, replaced by Posts API
  - `/ugcPosts` (UGCPosts API) → **deprecated**, replaced by Posts API
  - Marketing Version 202506 (June 2025) has been **sunset**
  - Versions are typically supported for ~1 year after release
- **Migration path (legacy → new):**
  - Share API → Posts API: `content.title` → `content.article.title`, `content.landingPageUrl` → `content.article.source`, `content.commentary` → `commentary`, `owner` → `author`, `resharedShare` → `reshareContext.parent`
  - UGCPosts API → Posts API: `specificContent` → `content`, `visibility` → restructured, `targetAudience` → `distribution.targetEntities`, `commentary` using Attributes → flattened string
  - **Payload flattening:** From deeply nested `specificContent.com.linkedin.ugc.ShareContent` to flat `commentary`, `content.article`, `content.media` structure
  - **Base URL shift:** `https://api.linkedin.com/v2/` → `https://api.linkedin.com/rest/`
  - Requests to old base path return `410 Gone` or `404 Not Found`
- **Rate limit:** 100,000 calls/day/application; 100 calls/day/member for posting operations; 500 requests/day/member for OIDC; exceeding returns 429 Too Many Requests
- **Source:** [Microsoft Learn: Content API Migration Guide](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/contentapi-migration-guide?view=li-lms-2026-06), [Ayrshare Migration Guide](https://www.ayrshare.com/solutions/linkedin-api-v1-to-v2-versioned-migration-the-developers-survival-guide)

### Endpoint: OAuth 2.0 Authorization URLs

- **Authorization URL:** `https://www.linkedin.com/oauth/v2/authorization`
- **Token URL:** `https://www.linkedin.com/oauth/v2/accessToken`
- **OIDC Discovery URL:** `https://www.linkedin.com/oauth/.well-known/openid-configuration`
- **JWKS URI:** `https://www.linkedin.com/oauth/openid/jwks`
- **Userinfo endpoint:** `GET https://api.linkedin.com/v2/userinfo`
- **Auth scope (OIDC):** `openid` + `profile` + `email` (replaces legacy `r_liteprofile` and `r_emailaddress`)
- **Flow:** Authorization Code Flow (3-legged OAuth 2.0)
- **PKCE:** Not explicitly required by LinkedIn but recommended per OAuth 2.1 best practices
- **Response type:** `code`
- **Source:** [Microsoft Learn: Sign In with LinkedIn OIDC](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2)

### Endpoint: OpenID Connect Userinfo

- **Method:** GET
- **URL:** `https://api.linkedin.com/v2/userinfo`
- **Auth scope:** `openid profile email`
- **Request shape:** `Authorization: Bearer <access_token>`
- **Response shape:**
  ```json
  {
    "sub": "782bbtaQ",
    "name": "John Doe",
    "given_name": "John",
    "family_name": "Doe",
    "picture": "https://media.licdn-ei.com/...",
    "locale": "en-US",
    "email": "doe@email.com",
    "email_verified": true
  }
  ```
- **Available fields:** `sub`, `name`, `given_name`, `family_name`, `picture`, `locale`, `email`, `email_verified`
- **Note:** `email` and `email_verified` are optional fields
- **Discovery document claims:** `iss`, `aud`, `iat`, `exp`, `sub`, `name`, `given_name`, `family_name`, `picture`, `email`, `email_verified`, `locale`
- **ID Token:** JWT signed with RS256, validated via JWKS endpoint
- **Source:** [Microsoft Learn: Sign In with LinkedIn OIDC](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2)

### Endpoint: Image Upload (Assets API → Images API)

- **Method:** POST
- **URL (legacy):** `https://api.linkedin.com/rest/assets?action=registerUpload`
- **URL (new):** `https://api.linkedin.com/rest/images?action=initializeUpload`
- **Auth scope:** `w_member_social`, `w_organization_social`, `rw_ads`
- **Request shape (Images API):**
  ```json
  {
    "initializeUploadRequest": {
      "owner": "urn:li:organization:2414183",
      "mediaLibraryMetadata": {
        "associatedAccount": "urn:li:sponsoredAccount:123456789",
        "assetName": "My media library asset"
      }
    }
  }
  ```
- **Response shape:**
  ```json
  {
    "value": {
      "uploadUrlExpiresAt": 1650567510704,
      "uploadUrl": "https://www.linkedin.com/dms-uploads/...",
      "image": "urn:li:image:C4E10AQFoyyAjHPMQuQ"
    }
  }
  ```
- **Migration notes (Assets API → Images API):**
  - No longer requires upfront recipe names (e.g., `feedshare-image`)
  - Returns specific URN (`urn:li:image:...`) rather than generic `digitalmediaAsset`
  - No `mediaArtifact` field in response
  - Action renamed: `registerUpload` → `initializeUpload`
- **Upload step:** Binary upload to `uploadUrl` with `Authorization: Bearer <token>` header
- **Supported formats:** JPG, GIF, PNG; max 36,152,320 pixels; GIF up to 250 frames
- **Deprecation status:** Assets API deprecated, replaced by Images API and Videos API
- **Source:** [Microsoft Learn: Images API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/images-api?view=li-lms-2025-10), [Microsoft Learn: Events API (registerUpload example)](https://learn.microsoft.com/en-us/linkedin/marketing/event-management/events?view=li-lms-2025-03)

### Endpoint: Video Upload (Assets API → Videos API)

- **Method:** POST
- **URL:** `https://api.linkedin.com/rest/videos?action=initializeUpload`
- **Workflow changes:** No longer requires "verify access to create a video ad" step
- **Max duration:** 15 minutes
- **Source:** [Microsoft Learn: Content API Migration Guide](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/contentapi-migration-guide?view=li-lms-2026-06)

### Endpoint: Profile API (Lite Profile)

- **Method:** GET
- **URL:** `https://api.linkedin.com/v2/me`
- **Auth scope:** `profile` (OIDC) — legacy `r_liteprofile` deprecated
- **Response:** Basic profile fields: id, firstName, lastName, headline, vanityName, profilePicture
- **Other member's profile:** `GET https://api.linkedin.com/v2/people/(id:{person ID})`
- **Bulk lookup:** `GET https://api.linkedin.com/v2/people?ids=List((id:{id1}),(id:{id2}))`
- **Rate limit:** See OIDC section (member: 500/day, app: 100,000/day)
- **Source:** [Microsoft Learn: Profile API](https://learn.microsoft.com/en-us/linkedin/shared/integrations/people/profile-api)

---

## Auth Flow Analysis

### Flow: Authorization Code Flow (3-legged OAuth)

- **Protocol:** OAuth 2.0 (with LinkedIn's own implementation, not full OAuth 2.1 yet)
- **Use case:** User authentication + API access delegation for MCP server
- **PKCE required:** Not explicitly required by LinkedIn, but recommended. LinkedIn supports standard auth code flow with client_secret.
- **Token lifetime:**
  - **Access token:** 60 days (5,184,000 seconds)
  - **Refresh token:** 365 days (for approved MDP partners)
  - `expires_in` field returns seconds remaining (e.g., 86400 for a fresh token — actual duration may vary)
- **Refresh mechanism:**
  - `POST https://www.linkedin.com/oauth/v2/accessToken`
  - Body: `grant_type=refresh_token&refresh_token=<token>&client_id=<id>&client_secret=<secret>`
  - Content-Type: `application/x-www-form-urlencoded`
  - Refresh token TTL remains constant from initial issuance (365 days) — using it doesn't extend the refresh token's life
  - After refresh token expires, user must re-authorize via full OAuth flow
  - LinkedIn reserves the right to revoke tokens at any time
- **Implementation notes:**
  - Refresh tokens are only available for **approved Marketing Developer Platform (MDP) partners**
  - For non-partner apps, users must re-authenticate every 60 days (browser-based re-auth)
  - Tokens are ~500 chars; plan for 1000+ chars storage
  - Atomic token rotation needed in multi-instance MCP servers to prevent race conditions
  - Track `expires_in` and proactively refresh before expiry
- **Scopes:**
  - `openid` — required for OIDC
  - `profile` — name, headline, photo
  - `email` — primary email address
  - `w_member_social` — post on member's behalf
  - `w_organization_social` — post on organization's behalf
- **Source:** [Microsoft Learn: Refresh Tokens](https://learn.microsoft.com/en-us/linkedin/shared/authentication/programmatic-refresh-tokens), [Stack Overflow: Refresh Token Discussion](https://stackoverflow.com/questions/58935404/im-not-getting-refresh-token-in-linkedin-oauth-2-0-while-im-authenticating-ca)

### Flow: OpenID Connect (OIDC) Sign-In

- **Protocol:** OpenID Connect on top of OAuth 2.0
- **Use case:** "Sign In with LinkedIn" — authenticate user identity
- **Scopes required:** `openid profile email`
- **Discovery document:** `https://www.linkedin.com/oauth/.well-known/openid-configuration`
- **ID Token:** JWT signed with RS256
- **Token claims:** `iss` (https://www.linkedin.com), `sub`, `aud` (client_id), `iat`, `exp`
- **Userinfo endpoint:** `GET https://api.linkedin.com/v2/userinfo`
- **Rate limit:** Member: 500 requests/day, Application: 100,000 requests/day
- **Implementation notes:**
  - Legacy scopes `r_liteprofile` and `r_emailaddress` are **deprecated**
  - `email` and `email_verified` fields are optional in response
  - No `r_connections` or people search available — those require partner-only APIs
- **Source:** [Microsoft Learn: Sign In with LinkedIn OIDC](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2)

### Access Permissions by Tier

| Product/Program | Permission | Scope | Availability |
|---|---|---|---|
| Sign In with LinkedIn (OIDC) | `profile`, `email` | Member Auth (read) | Self-service |
| Share on LinkedIn | `w_member_social` | Member Auth (write) | Self-service |
| Marketing Developer Platform | `rw_ads`, `r_ads_leads`, etc. | Marketing | Partner application |
| Sales Navigator (SNAP) | `r_sales_nav_*` | Sales | Partner program (currently paused) |
| Talent Solutions | RSC-specific | Talent | Partner application |
| Compliance | `r_compliance`, `w_compliance` | Compliance | Closed — not available |

- **Source:** [Microsoft Learn: Getting Access to LinkedIn APIs](https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access)

### People Search / Connections API Access

- **Status:** **Not available** for general developers
- **Required:** LinkedIn Partner program (Sales Navigator / Talent Solutions)
- **SNAP (Sales Navigator Application Platform):** Currently not accepting new partners as of Aug 2025
- **For an open-source MCP server:** Only self-serve scopes are viable: `openid profile email w_member_social w_organization_social`
- **Source:** [Getting Access to LinkedIn APIs](https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access), [SociaVault Blog](https://sociavault.com/blog/linkedin-api-free-2026)

---

## MCP Deep Patterns

### Pattern: MCP Authorization (OAuth 2.1 + RFC 9728)

- **Description:** The MCP spec (June 2025 revision) mandates OAuth 2.1 with Protected Resource Metadata (RFC 9728) for HTTP-based transports. MCP servers act as OAuth Resource Servers; authorization is handled by an external Authorization Server.
- **Standards compliance (MUST/SHOULD):**
  - **MUST:** OAuth 2.1 (with mandatory PKCE), Protected Resource Metadata (RFC 9728), Resource Indicators (RFC 8707)
  - **SHOULD:** Dynamic Client Registration (RFC 7591)
  - **MUST (clients):** Authorization Server Metadata (RFC 8414)
- **Discovery flow:**
  1. Client makes MCP request without token → server returns `HTTP 401` with `WWW-Authenticate` header pointing to resource metadata
  2. Client GETs `/.well-known/oauth-protected-resource` (RFC 9728) → gets `authorization_servers` field
  3. Client queries AS at `/.well-known/oauth-authorization-server` (RFC 8414) → discovers `authorization_endpoint`, `token_endpoint`
  4. Client initiates OAuth 2.1 Authorization Code flow with PKCE (S256)
  5. Client includes `resource` parameter (RFC 8707) — MCP server's canonical URI
  6. Client presents access token to MCP server for subsequent requests
- **Implementation approach:**
  - Serve `GET /.well-known/oauth-protected-resource` returning JSON with `authorization_servers`, `scopes_supported`, `resource`, `jwks_uri`, `bearer_methods_supported`
  - Validate access tokens on every request (JWT signature, `aud`, `iss`, `exp`)
  - Support both Authorization Code grant (user-facing) and Client Credentials grant (machine-to-machine)
  - For stdio transport, use environment-based credentials instead
- **Source:** [MCP Spec: Authorization](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization), [Descope: MCP Auth Spec](https://www.descope.com/blog/post/mcp-auth-spec), [Kane's MCP Auth Deep Dive](https://kane.mx/posts/2025/mcp-authorization-oauth-rfc-deep-dive)

### Pattern: MCP Resource Templates and Prompts

- **Description:** MCP defines three core primitives: Tools (actions), Resources (read-only context), Prompts (reusable templates)
- **Resources:**
  - Identified by URI scheme (e.g., `linkedin://profile/me`, `linkedin://posts/{id}`)
  - Support resource templates with URI parameters: `linkedin://profile/{userId}`
  - Read-only — the host/client loads them, not the LLM
  - Support text and binary content with MIME types
  - Can carry annotations (audience, priority, lastModified)
  - Discovered via `resources/list`, read via `resources/read`
  - Support subscription/notification for changes
- **Prompts:**
  - Predefined templates with dynamic arguments
  - User-controlled (user selects them, not LLM)
  - Can embed resource context within messages
  - Support multi-turn workflows
  - Discovered via `prompts/list`, retrieved via `prompts/get`
  - Structure: `{ name, description?, arguments?: [{ name, description?, required? }] }`
- **Tools:**
  - Executable functions that the LLM can call
  - Only primitive that can change state
  - Accept typed inputs via JSON Schema
  - Discovered via `tools/list`, invoked via `tools/call`
- **Implementation approach for LinkedIn MCP Server:**
  - **Resources:** `linkedin://profile/me` (profile data), `linkedin://profile/{id}` (other profiles), `linkedin://company/{id}` (company info), `linkedin://posts/{id}` (post details)
  - **Tools:** `create_post` (text/image/video posts), `search_profiles` (if available), `get_feed`, `send_message`, `manage_comments`
  - **Prompts:** "Post an update", "Analyze my feed", "Draft a professional message"
- **Source:** [MCP Docs: Prompts](https://github.com/modelcontextprotocol/docs/blob/main/docs/concepts/prompts.mdx), [Ginger Labs: MCP Primitives](https://www.gingerlabs.ai/blog/mcp-tools-resources-prompts), [Mikaeels: MCP Core Concepts](https://www.mikaeels.com/blog/mcp-core-concepts-explained)

### Pattern: MCP Rate Limiting (Token Bucket + Sliding Window)

- **Description:** Production MCP servers require rate limiting to prevent agent loops from consuming all resources. The 2026 pattern is a hybrid approach.
- **Implementation approach:**
  - **Per-tool token bucket:** Allow burst capacity (e.g., 20 tokens) with refill rate (e.g., 100/60 per sec). Good for natural agent usage patterns (flurry then idle).
  - **Global sliding window:** Strict "no more than N calls in last M seconds". Uses Redis sorted sets for distributed coordination.
  - **Hybrid (recommended):** Token bucket per tool for burst flexibility + sliding window globally for hard ceiling
- **Error formats:**
  - **HTTP transport:** `HTTP 429` + `Retry-After` header + JSON body with `code`, `message`, `scope`, `retry_after_seconds`, `limit`
  - **stdio transport:** JSON-RPC error `code: -32029` with `data.scope`, `data.retry_after_seconds`
- **Agent-side backoff:** Full-jitter exponential backoff — `sleep = random(0, min(cap, base * 2^attempt))` — avoids thundering herd
- **Circuit breaker:** Pair with rate limiting — open after 5 consecutive 5xx, half-open after 30s
- **Multi-instance:** Redis-based token bucket with atomic `SET NX PX` + `INCRBY` or Lua scripts
- **Source:** [KanseiLink: MCP Rate Limiting Guide 2026](https://kansei-link.com/en/insights/mcp-rate-limiting-implementation-guide-2026), [Fast.io: MCP Rate Limiting](https://fast.io/resources/mcp-server-rate-limiting), [Grizzly Peak: Rate Limiting for MCP Servers](https://www.grizzlypeaksoftware.com/library/rate-limiting-and-throttling-for-mcp-servers-evckaygp)

### Pattern: TypeScript MCP Server Project Structure

- **Description:** Standardized project layout for production-grade MCP servers using TypeScript, Vitest, and the official `@modelcontextprotocol/sdk`
- **Project structure:**
  ```
  src/
  ├── index.ts                    # Entry point — MCP server initialization
  ├── config/                     # Configuration parsing (env vars, files)
  ├── tools/                      # Tool implementations
  │   ├── toolRegistry.ts         # Tool registration system
  │   └── */Tool.ts               # Individual tool implementations
  ├── resources/                  # MCP resource handlers
  │   ├── resourceRegistry.ts
  │   └── */Resource.ts
  ├── prompts/                    # Prompt template definitions
  ├── auth/                       # OAuth 2.1 handlers, token validation
  ├── utils/                      # HTTP pipeline, logging, rate limiting
  │   ├── httpPipeline.ts         # HTTP policy pipeline (retry, user-agent)
  │   ├── rateLimiter.ts          # Token bucket + sliding window
  │   └── tracing.ts              # OpenTelemetry instrumentation
  └── types/                      # TypeScript type definitions
  test/                           # Mirrors src/ structure
  ├── tools/
  ├── resources/
  └── auth/
  ```
- **Key patterns:**
  - **Dependency injection** for HTTP clients — never patch `global.fetch`
  - **Base class** for API tools (e.g., `LinkedInApiBasedTool` extending common HTTP logic)
  - **Separate handlers** for tools, resources, and prompts
  - **Environment-based config** for API keys, tokens, version headers
- **Testing with Vitest:**
  - Mock external APIs — no real network calls in tests
  - Use dependency injection to inject mock fetch functions
  - Test tool validation, Auth flow, rate limiting, error responses
  - Coverage thresholds typically 80%+
- **Source:** [Mapbox MCP Server: AGENTS.md](https://github.com/mapbox/mcp-server/blob/main/AGENTS.md), [MCP Server Template](https://github.com/stevennevins/mcp-server-template), [LobeHub MCP 2025 Patterns](https://lobehub.com/fr/skills/frankxai-agentic-creator-os-mcp-2025-patterns)

### Pattern: MCP OAuth Server Implementation

- **Description:** Reference implementation of an OAuth 2.1 Authorization Server for MCP
- **Key features:**
  - Grant types: `authorization_code`, `refresh_token`, `client_credentials`, `device_code` (RFC 8628)
  - Dynamic Client Registration (RFC 7591)
  - Token Revocation (RFC 7009)
  - Authorization Server Metadata (RFC 8414)
  - Protected Resource Metadata (RFC 9728)
  - PKCE with S256 required
- **Implementation approach:**
  - In-memory model for development (`MemoryOAuthServerModel`)
  - Custom `OAuthServerModel` for production (database-backed)
  - Middleware: `requireBearerAuth`, `mcpAuthRouter`
  - Endpoints: `GET /.well-known/oauth-protected-resource`, `GET /.well-known/oauth-authorization-server`
- **Source:** [GitHub: mcp-oauth-server](https://github.com/wille/mcp-oauth-server)

---

## LinkedIn API Versioning Strategy

| Aspect | Detail |
|---|---|
| **Base URL** | `https://api.linkedin.com/rest/` |
| **Version header** | `LinkedIn-Version: YYYYMM` |
| **Version lifecycle** | Each monthly version supported ~1 year |
| **Current sunset** | 202506 (June 2025) sunset; migrate to latest |
| **Breaking changes** | Introduced at monthly boundaries |
| **Migration resource** | [LinkedIn Migrations page](https://learn.microsoft.com/en-us/linkedin/marketing/integrations/migrations) |
| **Rest.li protocol** | `X-Restli-Protocol-Version: 2.0.0` always required |

**Key insight for MCP server:** The LinkedIn-Version header must be configurable and auto-updated. The MCP server should track LinkedIn's release calendar and gracefully handle `400 Bad Request` when versions are sunset, alerting the operator to update.

---

## Critical Known Limitations for an Open-Source MCP Server

1. **No people search API** — LinkedIn does not expose people search to non-partner developers
2. **No connections list** — `r_connections` was deprecated; no replacement available
3. **No company data** (employee count, description, follower counts) — requires MDP partnership
4. **No post engagement metrics** — likes, comments, shares counts require partner access
5. **Rate limits are restrictive** — 100k/day app-level, 100/day per member for posting
6. **Refresh tokens are partner-only** — non-partner apps must re-auth every 60 days
7. **Image upload is multi-step** — registerUpload → upload binary → use URN in post

**Available for self-serve access (no partnership needed):**
- ✅ Sign In with LinkedIn (OIDC) — `openid profile email`
- ✅ Create posts (text, image, video, article) — `w_member_social` / `w_organization_social`
- ✅ Read own profile — `profile` scope
- ✅ Image upload via Images API
- ✅ Comment on posts (with `w_member_social`)

---

## Sources

1. [Microsoft Learn: Content API Migration Guide](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/contentapi-migration-guide?view=li-lms-2026-06) — Official migration guide from Share/UGCPosts to Posts API
2. [Ayrshare: LinkedIn API v1 to v2 Migration Guide](https://www.ayrshare.com/solutions/linkedin-api-v1-to-v2-versioned-migration-the-developers-survival-guide) — Practical migration technical breakdown
3. [Microsoft Learn: Refresh Tokens with OAuth 2.0](https://learn.microsoft.com/en-us/linkedin/shared/authentication/programmatic-refresh-tokens) — 60-day access token, 365-day refresh token policy
4. [Microsoft Learn: Sign In with LinkedIn using OIDC](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2) — OIDC scopes, endpoints, userinfo schema
5. [Microsoft Learn: Getting Access to LinkedIn APIs](https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access) — Permission tiers and partner program requirements
6. [Microsoft Learn: Images API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/images-api?view=li-lms-2025-10) — Image upload with initializeUpload
7. [Microsoft Learn: Events API (registerUpload sample)](https://learn.microsoft.com/en-us/linkedin/marketing/event-management/events?view=li-lms-2025-03) — registerUpload request/response example
8. [Zernio: LinkedIn Posting API Guide 2026](https://zernio.com/blog/linkedin-posting-api) — Token lifetimes, rate limits, practical usage
9. [Stack Overflow: Refresh Token not received](https://stackoverflow.com/questions/58935404/im-not-getting-refresh-token-in-linkedin-oauth-2-0-while-im-authenticating-ca) — Refresh tokens only for MDP partners
10. [SociaVault: Is the LinkedIn API Free?](https://sociavault.com/blog/linkedin-api-free-2026) — 2026 LinkedIn API access reality
11. [MCP Spec: Authorization (June 2025)](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization) — Official MCP authorization spec with RFC 9728
12. [Descope: Diving Into the MCP Authorization Spec](https://www.descope.com/blog/post/mcp-auth-spec) — OAuth 2.1 + PKCE + RFC 9728 deep analysis
13. [Kane's MCP Auth Deep Dive](https://kane.mx/posts/2025/mcp-authorization-oauth-rfc-deep-dive) — Technical deconstruction of MCP OAuth flow (RFC 8414, RFC 9728, RFC 8707)
14. [MCP Docs: Prompts concept](https://github.com/modelcontextprotocol/docs/blob/main/docs/concepts/prompts.mdx) — Official prompt template documentation
15. [Ginger Labs: MCP Tools vs Resources vs Prompts](https://www.gingerlabs.ai/blog/mcp-tools-resources-prompts) — Primitives comparison and decision framework
16. [Mikaeels: MCP Core Concepts](https://www.mikaeels.com/blog/mcp-core-concepts-explained) — Resources, Tools, and Prompts primer
17. [KanseiLink: MCP Rate Limiting Guide 2026](https://kansei-link.com/en/insights/mcp-rate-limiting-implementation-guide-2026) — Token bucket, sliding window, full-jitter backoff
18. [Fast.io: MCP Server Rate Limiting](https://fast.io/resources/mcp-server-rate-limiting) — Rate limiting algorithms for MCP
19. [Grizzly Peak: Rate Limiting for MCP Servers](https://www.grizzlypeaksoftware.com/library/rate-limiting-and-throttling-for-mcp-servers-evckaygp) — Production rate limiting patterns
20. [Mapbox MCP Server: AGENTS.md](https://github.com/mapbox/mcp-server/blob/main/AGENTS.md) — TypeScript MCP project structure and DI patterns
21. [MCP Server Template (stevennevins)](https://github.com/stevennevins/mcp-server-template) — TypeScript MCP server template with Vitest
22. [mcp-oauth-server (wille)](https://github.com/wille/mcp-oauth-server) — Reference OAuth 2.1 server for MCP
23. [DEV: Sign In with LinkedIn OIDC in Next.js](https://dev.to/nicolasai/sign-in-with-linkedin-using-openid-connect-in-nextjs-16-1p48) — OIDC scopes `openid profile email` in 2026
24. [Postman: LinkedIn Register Upload](https://www.postman.com/linkedin-developer-apis/workspace/linkedin-marketing-solutions-versioned-apis/request/17563548-b719b257-12f7-4569-a6a9-fa7a43de86a3) — Postman collection for image upload
25. [LobeHub: MCP 2025 Patterns](https://lobehub.com/fr/skills/frankxai-agentic-creator-os-mcp-2025-patterns) — MCP architecture and testing patterns
