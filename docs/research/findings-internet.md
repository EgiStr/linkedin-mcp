# Internet Research Findings: LinkedIn MCP Server

> **Researcher:** internet-researcher sub-agent  
> **Date:** 2026-07-13  
> **Project:** Open Source LinkedIn MCP Server for AI Agents

---

## RQ-1: Competitor Analysis — Existing LinkedIn MCP Servers

### Competitor 1: stickerdaniel/linkedin-mcp-server (Market Leader)

- **URL:** https://github.com/stickerdaniel/linkedin-mcp-server
- **Language:** Python (Patchright/Playwright browser automation)
- **Stars:** ~2,800 (as of July 2026)
- **Forks:** 472
- **License:** Apache-2.0
- **Latest Release:** v4.17.0 (2026-06-28)
- **Last Updated:** 2026-07-08
- **Tools Available:** 16+ tools including:
  - `get_person_profile` — detailed profile with section selection (experience, education, interests, honors, languages, certifications, skills, projects, contact_info, posts)
  - `get_my_profile` — authenticated user's own profile
  - `get_company_profile` — company information extraction
  - `search_jobs` — keyword + location job search
  - `search_people` — people search by keyword/location
  - `get_job_details` — specific job posting details
  - `get_inbox` — list recent conversations
  - `get_conversation` — read specific conversation
  - `send_message` — send LinkedIn message
  - `get_sidebar_profiles` — extract profile URLs from sidebar recommendations
  - `connect_with_person` — send/accept connection requests
  - `close_session` — cleanup browser session
- **Auth method:** Session-based cookie import from real browser (Patchright). Supports `--login` for interactive login or `--import-from-browser` to reuse existing browser session. Supports Chrome, Chromium, Brave, Edge, Arc, Vivaldi, Yandex, Naver Whale.
- **Transport:** stdio (default) or Streamable HTTP (`--transport streamable-http`)
- **Installation:** uvx, Docker, MCP Bundle (.mcpb), local development
- **Strengths:** Most popular LinkedIn MCP server by far (2.8k stars). Most feature-complete (profiles, companies, jobs, messaging, connection requests). Active development with frequent releases. Docker support. Good documentation. CI/CD pipelines.
- **Weaknesses:** Scraping-based — relies on Patchright browser automation, which violates LinkedIn ToS and can break on UI changes. No posting capability (read-only). Session-based auth requires manual login or cookie import. Tool calls are serialized (one at a time) to protect the shared browser session. Python — not TypeScript.
- **Source:** https://github.com/stickerdaniel/linkedin-mcp-server, https://dev.co/ai/mcp/linkedin-mcp-server

### Competitor 2: felipfr/linkedin-mcpserver (Official API — TypeScript)

- **URL:** https://github.com/felipfr/linkedin-mcpserver
- **Language:** TypeScript (96.8%), JavaScript (3.2%)
- **Stars:** 75
- **Forks:** 26
- **License:** MIT
- **Latest Release:** v0.1.0 (2025-03-28)
- **Tools Available:**
  - Profile Search — advanced filters
  - Profile Retrieval — detailed profile info
  - Job Search — customized criteria
  - Messaging — send messages to connections
  - Network Stats — connection statistics and analytics
- **Auth method:** LinkedIn OAuth 2.0 (official API)
- **Transport:** stdio (MCP protocol)
- **Technical Highlights:** Dependency Injection (TSyringe), Structured Logging (Pino), Axios REST client with auto token management
- **Strengths:** Uses official LinkedIn API — compliant with ToS, stable. TypeScript with clean architecture. DI and structured logging. Has messaging capability via official API. Network stats tool.
- **Weaknesses:** Only 75 stars, 4 commits, early stage (v0.1.0). Requires LinkedIn Developer App with OAuth setup (complex). Limited tool set compared to stickerdaniel. No posting/creating content. Less active development.
- **Source:** https://github.com/felipfr/linkedin-mcpserver, https://playbooks.com/mcp/felipfr/linkedin-mcpserver

### Competitor 3: FilippTrigub/linkedin-mcp (Official API — Posting Focus)

- **URL:** https://github.com/FilippTrigub/linkedin-mcp
- **Language:** Python
- **Stars:** 8
- **Forks:** 6
- **License:** MIT
- **Latest Release:** v0.1.7 (PyPI, 2025-05-14)
- **Tools Available:**
  - `authenticate` — OAuth2 authentication with LinkedIn
  - `create_post` — create and share posts with optional media attachments
- **Auth method:** OAuth2 (requires LinkedIn Developer App)
- **Strengths:** Only MCP server focused purely on posting. Supports text + media (images/videos) attachments. Controls post visibility (public/connections). Secure token storage. Official API — ToS compliant.
- **Weaknesses:** Only 8 stars, very limited scope (2 tools). No profile reading, job search, messaging. 31 commits, appears minimally maintained. Python-based. Requires pipx installation.
- **Source:** https://github.com/FilippTrigub/linkedin-mcp, https://pypi.org/project/linkedin-mcp/

### Competitor 4: fredericbarthelet/linkedin-mcp-server (Community Management API)

- **URL:** https://github.com/fredericbarthelet/linkedin-mcp-server
- **Language:** TypeScript
- **Stars:** 38
- **Forks:** 6
- **Tools Available:**
  - `user-info` — get current logged-in user info (name, headline, profile picture)
  - `create-post` — create a new post on LinkedIn
- **Auth method:** LinkedIn Community Management API with MCP Draft Third-Party Authorization Flow (OAuth delegation)
- **Transport:** HTTP+SSE (remote hosting capable)
- **Requirements:** Node 22, pnpm 10, LinkedIn client with Community Management API product
- **Strengths:** First MCP server to implement the MCP Draft Third-Party Authorization Flow. Supports remote hosting via HTTP+SSE transport. Can post on behalf of users or organizations. ToS compliant (official API).
- **Weaknesses:** Only 9 commits, early/draft status. Authorization flow is "draft" status — only works with MCP Inspector. Only 2 tools. Limited community traction (38 stars).
- **Source:** https://github.com/fredericbarthelet/linkedin-mcp-server, https://chat.mcp.so/server/linkedin-mcp-server/fredericbarthelet

### Competitor 5: Dishant27/linkedin-mcp-server (Official API — TypeScript)

- **URL:** https://github.com/Dishant27/linkedin-mcp-server
- **Language:** TypeScript
- **Stars:** 49
- **Forks:** 14
- **License:** MIT
- **Commits:** 42
- **Tools Available:**
  - `search-people` — search profiles with keywords, company, industry, location filters
  - Profile retrieval, messaging capabilities
- **Auth method:** Official LinkedIn API via OAuth 2.0
- **Strengths:** Official API — ToS compliant. Has test directory. Growing community (49 stars). Good structure with examples.
- **Weaknesses:** Still modest adoption. Requires LinkedIn Developer App setup. Limited feature set compared to stickerdaniel.
- **Source:** https://github.com/Dishant27/linkedin-mcp-server

### Competitor 6: adhikasp/mcp-linkedin (Unofficial API — Feed & Jobs)

- **URL:** https://github.com/adhikasp/mcp-linkedin
- **Language:** Python
- **Stars:** 207
- **Forks:** 53
- **License:** Unlicense
- **Tools Available:**
  - `get_feed_posts` — retrieve LinkedIn feed posts
  - `search_jobs` — search jobs by keyword, location, limit
  - Resume analysis against job matches
- **Auth method:** LinkedIn email/password (unofficial API via `linkedin-api` library)
- **Strengths:** Feed browsing capability — unique among competitors. Job search with resume analysis. Popular (207 stars). Docker support.
- **Weaknesses:** Uses unofficial LinkedIn API — violates ToS, may break. Inactive since December 2024 (no updates in 7+ months). Email/password auth is insecure. Limited to 3 tools. No profile scraping, messaging, or posting.
- **Source:** https://github.com/adhikasp/mcp-linkedin

### Competitor 7: harishafeez1/linkedin-mcp-server-paperclip (Browser-based)

- **URL:** https://github.com/harishafeez1/linkedin-mcp-server-paperclip
- **Language:** JavaScript
- **Stars:** 0 (new)
- **Released:** April 4, 2026
- **Features:** Profile lookup, connection invites, inbox management, direct messaging with persistent authenticated session handling
- **Source:** https://www.pulsemcp.com/servers/linkedin-mcp-server-paperclip

### Competitor 8: alinaqi/mcp-linkedin-server (Browser Automation — FastMCP)

- **URL:** https://github.com/alinaqi/mcp-linkedin-server
- **Language:** Python
- **Stars:** 53
- **Forks:** 18
- **Tools Available:**
  - `login_linkedin_secure` — secure login with env credentials
  - `browse_linkedin_feed` — browse and extract feed posts
  - `search_linkedin_profiles` — search profiles
  - `view_linkedin_profile` — view profile data
  - `interact_with_linkedin_post` — like, comment, read posts
- **Auth method:** Browser automation with Encrypted cookie storage
- **Strengths:** Encrypted cookie storage. Rate limiting protection. Session persistence.
- **Weaknesses:** Browser automation — violates ToS. Only 53 stars. Limited feature set. Python-based.
- **Source:** https://github.com/alinaqi/mcp-linkedin-server

### Competitor 9: automcp-app/linkd-mcp-server (API-based — Paid)

- **URL:** https://skywork.ai/skypage/en/unlocking-linkedin-ai-mcp-server/1978717176664281088
- **Language:** TypeScript
- **Features:** Uses Linkd.ai API (paid). Profile search, company search, enrich LinkedIn, retrieve contacts, scrape profiles with posts, deep research.
- **Strengths:** Stable API-based approach. No scraping. Rich feature set.
- **Weaknesses:** Paid API (credits-based). Not open source? Requires Linkd.ai API key.
- **Source:** https://skywork.ai/skypage/en/unlocking-linkedin-ai-mcp-server/1978717176664281088

### Full Competitor Comparison Matrix

| Server | Stars | Lang | Auth Method | ToS Compliant | Tools | Profile | Jobs | Messaging | Posting | Feed |
|--------|-------|------|-------------|---------------|-------|---------|------|-----------|---------|------|
| stickerdaniel/linkedin-mcp-server | ~2,800 | Python | Browser session | ❌ | 16+ | ✅ | ✅ | ✅ | ❌ | ❌ |
| felipfr/linkedin-mcpserver | 75 | TS | OAuth 2.0 | ✅ | 5 | ✅ | ✅ | ✅ | ❌ | ❌ |
| FilippTrigub/linkedin-mcp | 8 | Python | OAuth 2.0 | ✅ | 2 | ❌ | ❌ | ❌ | ✅ | ❌ |
| fredericbarthelet/linkedin-mcp-server | 38 | TS | OAuth 2.0 (MCP Auth) | ✅ | 2 | ❌ | ❌ | ❌ | ✅ | ❌ |
| Dishant27/linkedin-mcp-server | 49 | TS | OAuth 2.0 | ✅ | 3+ | ✅ | ❌ | ✅ | ❌ | ❌ |
| adhikasp/mcp-linkedin | 207 | Python | Email/Password | ❌ | 3 | ❌ | ✅ | ❌ | ❌ | ✅ |
| alinaqi/mcp-linkedin-server | 53 | Python | Browser automation | ❌ | 5 | ✅ | ❌ | ❌ | ✅ | ✅ |
| automcp-app/linkd-mcp-server | ? | TS | API Key (Linkd.ai) | ✅ | 8+ | ✅ | ❌ | ❌ | ❌ | ✅ |

---

## RQ-2: LinkedIn API Capabilities

### Endpoint: Community Management API (Current Standard)

- **URL:** https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview
- **Method:** REST (versioned)
- **Auth scope:** Requires LinkedIn Developer App + Community Management API product (partner-gated)
- **Rate limit (Development Tier):** Per App: 500 requests/day, Per Member: 100 requests/day (recently increased from 100/10)
- **Rate limit (Standard Tier):** Not publicly published
- **Tiers:** Development Tier (limited volume) → Standard Tier (full access, requires screencast demo)
- **Versioning:** Uses `LinkedIn-Version` header (e.g., `202401`, `202505`)
- **Deprecation Warning:** Marketing Version 202506 has been sunset
- **Key capabilities:**
  - Page Management (create/update/delete org info)
  - Create and manage posts, comments, reactions
  - Organization access APIs
  - Page Analytics (followers, views, shares, video analytics)
  - Member Analytics
  - Profile Management
  - Employee Advocacy
- **Limitations:** `r_member_social` is a closed permission — not accepting new requests. Requires Marketing Developer Platform approval.
- **Source:** https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview

### Endpoint: Posts API (Replaces ugcPosts)

- **URL:** https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api
- **Method:** POST /rest/posts
- **Auth scope:** w_member_social (personal), w_organization_social (org pages)
- **Notes:** Replaces deprecated `/v2/ugcPosts` and `/v2/shares` endpoints. Uses `urn:li:person:{id}` for personal posts, `urn:li:organization:{id}` for org posts.
- **Source:** https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?tabs=curl

### Endpoint: Images API (Replaces Assets API for Images)

- **URL:** https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/images-api
- **Method:** POST /rest/images?action=initializeUpload
- **Auth scope:** w_member_social or w_organization_social
- **Upload Flow:** Register upload → Binary PUT to upload URL → Reference asset URN in post
- **Supported formats:** JPEG, PNG
- **Recipe:** `urn:li:digitalmediaRecipe:feedshare-image`
- **Source:** https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/vector-asset-api

### Endpoint: Videos API (Replaces Assets API for Videos)

- **URL:** https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/videos-api
- **Method:** POST /rest/videos?action=initializeUpload
- **Notes:** Requires chunked upload for videos over 4MB. Separate "finalize" step after all chunks.
- **Source:** https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/vector-asset-api

### Endpoint: Assets API (Deprecated — Legacy)

- **URL:** https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/vector-asset-api
- **Status:** Deprecated — replaced by Images API and Videos API
- **Source:** Microsoft Learn (LinkedIn documentation)

### LinkedIn API Pricing & Rate Limits 2026

- **Free tier:** Sign-in (OAuth) + basic profile data only. No access to company insights, ads, recruiter data.
- **Marketing Developer Platform (MDP):** Partner-gated, no public pricing. Estimated $699+/month.
- **Sales Navigator API:** Closed to new applicants. Customer seats start at $119.99/mo.
- **Recruiter System Connect:** ~$900/month per seat.
- **Enterprise agreements:** $50,000–$300,000+ per year.
- **Rate limits:** Not publicly documented per endpoint. 429 responses indicate rate exceeded. App-specific limits visible in Developer Portal Analytics tab.
- **Rate limit alerts:** Email alerts at 75% of app-level quota.
- **Media Upload Flow (from community guide):**
  1. Register upload: `POST /rest/images?action=initializeUpload` with owner URN
  2. Binary PUT the image data to the returned upload URL (Content-Type: image/jpeg)
  3. Create post referencing asset URN
  4. Handle OAuth2 token refresh (tokens expire every 60 days)
- **Source:** https://learn.microsoft.com/en-us/linkedin/shared/api-guide/concepts/rate-limits, https://www.blotato.com/blog/linkedin-api-pricing, https://www.getphyllo.com/post/how-much-does-the-linkedin-api-cost-iv

### Common LinkedIn API Errors

- **400 Bad Request:** Missing `LinkedIn-Version` header, invalid content ownership
- **429 Too Many Requests:** Rate limit exceeded (100 calls/day per user for post creation)
- **INVALID_CONTENT_OWNERSHIP:** Asset URN doesn't match post author ownership
- **No edit endpoint:** Posts cannot be edited via API — must delete and recreate
- **Source:** https://connectsafely.ai/articles/linkedin-post-api-integration-guide-2026

---

## RQ-3: MCP Best Practices

### Tool Naming Conventions

- **Preferred:** camelCase (e.g., `getPersonProfile`) — works best with GPT-4o tokenization
- **Acceptable:** kebab-case (`get-person-profile`), snake_case (`get_person_profile`)
- **Avoid:** Spaces (`get person profile`), dot notation (`get.person.profile`), brackets
- **Aliases:** Include alternative names in tool descriptions so LLMs can match intent
- **Source:** https://github.com/lirantal/awesome-mcp-best-practices

### Tool Description Standards

- **Good:** Provide use-case examples in `<use_case>` tags
- **Good:** Add `<important_notes>` for prerequisites, side effects, or dependencies
- **Avoid:** Short descriptions like "Call this function to execute an SQL query"
- **Follow:** Schema should contain metadata (auth requirements, pagination, rate limits)
- **Source:** https://github.com/lirantal/awesome-mcp-best-practices, https://www.merge.dev/blog/mcp-tool-description

### Error Handling Architecture

Three-tier error model:
1. **Transport-Level Errors** — network timeouts, broken pipes, auth failures
2. **Protocol-Level Errors (JSON-RPC)** — malformed JSON, method not found (-32601), invalid params (-32602), internal error (-32603)
3. **Application-Level Errors** — business logic failures, external API errors (use `isError: true` flag in response)

**MCP-specific error codes:**
| Code | Name | Client Action |
|------|------|--------------|
| -32700 | Parse Error | Fix request format |
| -32600 | Invalid Request | Check request structure |
| -32601 | Method Not Found | Use valid method names |
| -32602 | Invalid Params | Correct parameters |
| -32603 | Internal Error | Report bug, don't retry |
| -32800 | Request Cancelled | No action needed |
| -32801 | Content Too Large | Reduce request size |
| -32802 | Resource Unavailable | Retry with backoff |

**Key pattern:** Use `isError: true` in tool responses (not JSON-RPC errors) for business logic failures that LLMs can recover from.

**Source:** https://agentcat.com/guides/error-handling-custom-mcp-servers, https://chatforest.com/guides/mcp-error-handling-explained/

### Pagination Patterns

**Built-in (protocol-level):** Cursor-based pagination for `resources/list`, `tools/list`, `prompts/list`. Server returns `nextCursor` string. Client sends it back for next page. No `nextCursor` = end.

**Tool-level (result pagination):** Not standardized in MCP spec. Implement via:
- Return cursor in tool response
- Accept cursor as input parameter
- Compact response design
- ResourceLink pattern for very large datasets

**Source:** https://chatforest.com/guides/mcp-pagination-patterns/

---

## RQ-4: Feature Gaps — What Existing LinkedIn MCP Servers Are Missing

### Critical Gaps

1. **No server combines official API compliance + comprehensive feature set.** stickerdaniel is most complete but violates ToS. Official API servers lack profiles, jobs, messaging, and posting together.

2. **No server handles the full LinkedIn media upload pipeline** (image register → binary PUT → post with asset reference) as a cohesive MCP workflow.

3. **No server supports all major content types:** text posts, image posts, video posts, article shares, document posts, and multi-image carousels.

4. **No server offers connection management** (send/accept/reject connection requests) through official API — only stickerdaniel has this via scraping.

5. **No server provides feed reading** through ToS-compliant means.

6. **No TypeScript server with comprehensive coverage exists** — felipfr (75 stars) and Dishant27 (49 stars) are small.

### Feature Opportunities

| Feature | stickerdaniel | felipfr | FilippTrigub | Gap |
|---------|:---:|:---:|:---:|------|
| Profile Reading | ✅ | ✅ | ❌ | — |
| Job Search | ✅ | ✅ | ❌ | — |
| Messaging | ✅ | ✅ | ❌ | — |
| Post Creation | ❌ | ❌ | ✅ | No combined read+write |
| Media Upload | ❌ | ❌ | ✅ (basic) | No full pipeline |
| Feed Reading | ❌ | ❌ | ❌ | **Major gap** |
| Connection Mgmt | ✅ (scraping) | ❌ | ❌ | Not via official API |
| Company Info | ✅ | ❌ | ❌ | — |
| Network Stats | ❌ | ✅ | ❌ | — |
| Article Sharing | ❌ | ❌ | ❌ | **Major gap** |
| Resume Analysis | ❌ | ❌ | ❌ | adhikasp has it |
| Multi-Image Posts | ❌ | ❌ | ❌ | **Major gap** |
| Polls | ❌ | ❌ | ❌ | Not exposed via any API |
| Scheduled Posts | ❌ | ❌ | ❌ | **Major gap** |
| Comment Management | ❌ | ❌ | ❌ | **Major gap** |

**Source:** Synthesized from all competitor analysis above.

---

## RQ-5: Architecture

### MCP Transport Comparison

| Transport | Use Case | Auth | Complexity | Performance |
|-----------|----------|------|------------|-------------|
| **stdio** | Local subprocess (desktop, IDE) | No MCP-level auth needed (OS access control) | Minimal | Fast (~5ms avg) |
| **Streamable HTTP** | Remote, production, multi-client | OAuth 2.1 with PKCE required for public | Moderate | 290-300 req/s (shared session), 30-36 req/s (unique session) |
| **HTTP+SSE (Legacy)** | Legacy/deprecated | OAuth | Moderate | Deprecated — removal from major clients by June 2026 |

**Key finding:** Stdio is the default for local MCP servers. Streamable HTTP is the recommended choice for remote deployments with a single HTTP endpoint (`/mcp`) and OAuth 2.1 support. SSE is deprecated.

**Performance Insight:** 10x difference between shared and unique session handling in Streamable HTTP. Session reuse is fundamental for production scale.

**Migration path:** SSE → Streamable HTTP. At least one enterprise client (Atlassian Rovo) had a hard removal deadline of June 30, 2026.

**Source:** https://www.rapidevelopers.com/mcp-tutorial/mcp-transport-stdio-vs-sse-vs-http, https://stacklok.com/blog/mcp-server-performance-transport-protocol-matters, https://rollbrains.com/mcp/mcp-transports-compared/

### MCP OAuth Authentication (Specification 2025-03-26+)

**Key requirements:**
- **OAuth 2.1** is the standard for remote MCP servers (HTTP transport)
- **PKCE mandatory** — all clients using authorization code flow must implement it (spec update Nov 2025)
- **MCP server = OAuth 2.1 Resource Server** — token issuance delegated to external IdPs
- **Dynamic Client Registration** (RFC 7591) — AI agents self-register at runtime
- **Authorization server metadata** — servers must share RFC 8414 metadata
- **Token passthrough banned** — MCP servers must not replay tokens against other APIs
- **Short-lived tokens + refresh token rotation** — non-negotiable for production
- **Protected Resource Metadata** — RFC 9728 for discovery

**OAuth flow steps (6-step):**
1. Protected Resource Metadata discovery
2. Authorization server metadata discovery
3. Dynamic Client Registration
4. PKCE authorization request (code_challenge = SHA256(code_verifier))
5. Code exchange for bearer token
6. Token rotation on refresh

**Local servers (stdio):** No MCP-level auth needed — OS is access control. API credentials via environment variables.

**Source:** https://www.authgear.com/post/mcp-authentication, https://www.gingerlabs.ai/blog/mcp-oauth-pkce, https://chatforest.com/guides/mcp-authentication-oauth/

### MCP Testing Patterns

**4-Layer Test Strategy:**

1. **In-memory unit tests** (Pattern 1) — Run on every save. Sub-second feedback. Catch logic bugs.
   - Python: FastMCP in-memory client
   - TypeScript: `InMemoryTransport.createLinkedPair()` with Vitest

2. **Schema validation tests** (Pattern 2) — Run in CI. Catch contract drift. Snapshot tool schemas.

3. **Parameterized edge case tests** (Pattern 3) — Empty strings, extreme values, wrong types.

4. **MCP Inspector** (Pattern 4) — Interactive exploration during development.
   ```
   npx @modelcontextprotocol/inspector python your_server.py
   npx @modelcontextprotocol/inspector node build/index.js
   ```
   Opens web UI at `localhost:5173`. Browse tools, call tools, inspect resources, test prompts.

**Recommended framework for TypeScript:** Vitest (native ESM support required by MCP TypeScript SDK).
**Python:** pytest + pytest-asyncio.

**Source:** https://dev.to/klement_gunndu/your-mcp-server-has-no-tests-here-are-4-patterns-to-fix-that-2k59, https://codex.danielvaughan.com/2026/05/26/mcp-server-testing-quality-assurance-unit-integration-inspector/

### Recommended Project Architecture

Based on competitor analysis and MCP best practices, a new LinkedIn MCP server should consider:

1. **Language:** TypeScript (ecosystem preference, only 2 TS competitors with low stars)
2. **API method:** Official LinkedIn API (Community Management + Posts API) for ToS compliance
3. **Auth:** OAuth 2.0 with PKCE (MCP specification compliant)
4. **Transport:** stdio for local development, Streamable HTTP for remote deployment
5. **Architecture patterns:**
   - Dependency Injection (like felipfr's TSyringe)
   - Structured logging (Pino/pino)
   - Axios/fetch-based REST client with auto token refresh
   - Media upload pipeline abstraction
   - Cursor-based pagination for all list endpoints
6. **Testing:** Vitest + InMemoryTransport + MCP Inspector
7. **Feature set (minimum viable):**
   - Profile reading (own + others)
   - Job search
   - Post creation (text, image, video, article)
   - Messaging (send + read inbox)
   - Company info
   - Media upload pipeline

---

## Sources

- [1] https://github.com/stickerdaniel/linkedin-mcp-server — stickerdaniel's LinkedIn MCP Server (2.8k stars)
- [2] https://github.com/felipfr/linkedin-mcpserver — felipfr's LinkedIn MCP Server (75 stars)
- [3] https://github.com/FilippTrigub/linkedin-mcp — FilippTrigub's LinkedIn MCP (8 stars)
- [4] https://github.com/fredericbarthelet/linkedin-mcp-server — fredericbarthelet's LinkedIn MCP Server (38 stars)
- [5] https://github.com/Dishant27/linkedin-mcp-server — Dishant27's LinkedIn MCP Server (49 stars)
- [6] https://github.com/adhikasp/mcp-linkedin — adhikasp's MCP LinkedIn (207 stars)
- [7] https://github.com/alinaqi/mcp-linkedin-server — alinaqi's MCP LinkedIn Server (53 stars)
- [8] https://github.com/harishafeez1/linkedin-mcp-server-paperclip — harishafeez1's Paperclip MCP (0 stars)
- [9] https://dev.co/ai/mcp/linkedin-mcp-server — DEV.co overview of stickerdaniel's server
- [10] https://chatforest.com/reviews/social-networking-community-mcp-servers — ChatForest social media MCP review
- [11] https://chatforest.com/guides/best-social-media-mcp-servers — Best Social Media MCP Servers 2026
- [12] https://skywork.ai/skypage/en/unlocking-linkedin-ai-mcp-server/1978324613716418560 — FilippTrigub deep dive
- [13] https://skywork.ai/skypage/en/hritik-raj-linkedin-mcp-server-ai-engineer/1978341070173761536 — LinkedIn MCP comparison
- [14] https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview — LinkedIn Community Management API docs
- [15] https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api — Posts API docs
- [16] https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/vector-asset-api — Assets API (Images + Videos)
- [17] https://learn.microsoft.com/en-us/linkedin/shared/api-guide/concepts/rate-limits — LinkedIn API Rate Limiting
- [18] https://www.blotato.com/blog/linkedin-api-pricing — LinkedIn API Pricing Guide 2026
- [19] https://www.getphyllo.com/post/how-much-does-the-linkedin-api-cost-iv — LinkedIn API Cost Analysis
- [20] https://connectsafely.ai/articles/linkedin-post-api-integration-guide-2026 — LinkedIn Post API Guide
- [21] https://www.technetexperts.com/linkedin-api-image-url-post/ — LinkedIn Image/URL Post Workaround
- [22] https://stackoverflow.com/questions/54893869/linkedin-v2-api-how-can-upload-an-image-using-ugcposts-api — StackOverflow: Image Upload Flow
- [23] https://help.blotato.com/blog/automate-linkedin-posts-images-videos — Blotato: LinkedIn Media Upload Pain Points
- [24] https://github.com/lirantal/awesome-mcp-best-practices — Awesome MCP Best Practices
- [25] https://agentcat.com/guides/error-handling-custom-mcp-servers — MCP Error Handling Best Practices
- [26] https://chatforest.com/guides/mcp-error-handling-explained/ — MCP Error Handling Explained
- [27] https://chatforest.com/guides/mcp-pagination-patterns/ — MCP Pagination Patterns
- [28] https://www.merge.dev/blog/mcp-tool-description — MCP Tool Description Best Practices
- [29] https://www.rapidevelopers.com/mcp-tutorial/mcp-transport-stdio-vs-sse-vs-http — MCP Transport Comparison
- [30] https://rollbrains.com/mcp/mcp-transports-compared/ — MCP Transports Compared (stdio vs SSE vs HTTP)
- [31] https://stacklok.com/blog/mcp-server-performance-transport-protocol-matters — MCP Performance Benchmarks
- [32] https://www.truefoundry.com/blog/mcp-stdio-vs-streamable-http-enterprise — Stdio vs Streamable HTTP for Enterprise
- [33] https://www.authgear.com/post/mcp-authentication — MCP Authentication: OAuth 2.1
- [34] https://www.gingerlabs.ai/blog/mcp-oauth-pkce — MCP OAuth 2.1 with PKCE Implementation
- [35] https://chatforest.com/guides/mcp-authentication-oauth/ — MCP Authentication & OAuth 2.1 Guide
- [36] https://docs.gostoa.dev/blog/oauth-pkce-mcp-gateway — OAuth 2.1 + PKCE for MCP Gateways
- [37] https://dev.to/klement_gunndu/your-mcp-server-has-no-tests-here-are-4-patterns-to-fix-that-2k59 — 4 MCP Testing Patterns
- [38] https://codex.danielvaughan.com/2026/05/26/mcp-server-testing-quality-assurance-unit-integration-inspector/ — MCP Server Testing Guide
- [39] https://mcpize.com/blog/build-mcp-server — Build MCP Server Complete Guide
- [40] https://hub.docker.com/r/stickerdaniel/linkedin-mcp-server — Docker Hub for stickerdaniel's server
