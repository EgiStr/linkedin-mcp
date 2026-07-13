# News Research Findings: LinkedIn MCP Server

> **Researcher:** News sub-agent
> **Date:** 2026-07-13
> **Status:** Complete — 6 queries executed, 20+ sources analyzed

---

## Announcements & Changelogs

### Topic: LinkedIn Marketing API — Monthly Versioned Releases 2025–2026
- **Date:** June 2026 (latest version 202606)
- **Source:** Microsoft Learn / LinkedIn Developer Documentation
- **Key announcement:** LinkedIn transitioned from unversioned v2 APIs to a **monthly versioned API release cycle** starting January 2025. The latest version is **202606** (June 2026). Each monthly version has a 12-month sunset window. Key changes in 202606 include: Company Intelligence API now supports 365-day lookback, company size/industry/country fields, and cost-per-paid-qualified-lead metrics; Dynamic UTM API adds CREATIVE_NAME support; Conversation Ads and Message Ads get automatic "Not Interested" CTA.
- **Impact on our project:** Any LinkedIn MCP server must target the latest versioned API (202606+) and handle monthly version migrations. The unversioned v2 deprecation deadline (Talent API) is extended to **July 2028**, but Marketing APIs are on a strict monthly sunset cycle.
- **URL:** https://learn.microsoft.com/en-us/linkedin/marketing/integrations/recent-changes?view=li-lms-2026-06

### Topic: LinkedIn API — Breaking Changes & Version Sunsets (2025–2026)
- **Date:** Monthly (2025–2026)
- **Source:** Microsoft Learn / LinkedIn
- **Key announcement:** Each monthly version introduces breaking changes. Examples: May 2026 (202605) made `endsAt` required on Events API; Member Post Statistics API changed `metricType` from object to string; April 2025 (202504) migrated Talent APIs to `https://api.linkedin.com/rest/` base path. Versions are sunset exactly 12 months after release — e.g., 202506 was sunset June 15, 2026; 202507 will sunset July 15, 2026.
- **Impact on our project:** An MCP server must implement version pinning, automated migration testing, and graceful degradation when endpoints change. A version negotiation strategy is critical for production reliability.
- **URL:** https://learn.microsoft.com/en-us/linkedin/marketing/integrations/recent-changes?view=li-lms-2026-06

### Topic: LinkedIn Talent Solutions API — Versioned API Transition
- **Date:** Updated May 21, 2026
- **Source:** Microsoft Learn / LinkedIn Talent Solutions
- **Key announcement:** All unversioned (v2) API deprecation deadlines extended to **July 2028** to provide flexibility for partner integration teams. Talent APIs now have their own versioned release cycle under `https://api.linkedin.com/rest/`. Breaking changes in 202602: RSC candidates API restructuring, integration configurations renamed. New in 202603: `vanityIdentifier` field for job requisitions.
- **Impact on our project:** For a LinkedIn MCP server focused on recruiting/talent, the v2 deadline extension provides breathing room, but migrating to versioned APIs is still recommended. The Talent API versioning page now includes a supported versions table with release/sunset dates.
- **URL:** https://learn.microsoft.com/en-us/linkedin/talent/release-notes?view=li-lts-2026-03

### Topic: LinkedIn Developer Program — Access Tiers & New Requirements
- **Date:** Updated April–June 2026
- **Source:** Microsoft Learn / LinkedIn
- **Key announcement:** LinkedIn Marketing APIs have **two access tiers**: Development (read: unlimited, edit: up to 5 ad accounts, create: 1 test account) and Standard (unlimited everything). Upgrade requires application review. **New Integration Requirements Pages** launched for Community Management program with a **Technical Sign Off** process requiring demo. Restricted APIs (Matched Audiences, Audience Insights, Company Intelligence) require additional qualification and can take up to 60 days for review. Developer support migrated from Zendesk to a new **Developer Support Request Form** (June 2026). New **Reapply** feature lets developers resubmit expired/declined API requests directly in the Developer Portal.
- **Impact on our project:** Building an open-source LinkedIn MCP server faces significant API access barriers. The **Community Management API** (which covers posting, messaging, feed) requires a Technical Sign Off demo and business development contact. Open-source projects without a LinkedIn business relationship may need to rely on browser-based automation (Voyager API) as an alternative — which carries its own risks.
- **URL:** https://learn.microsoft.com/en-us/linkedin/marketing/integrations/marketing-tiers?view=li-lms-2026-06

### Topic: LinkedIn OAuth — New Authentication Options (Dec 2025)
- **Date:** December 2, 2025
- **Source:** Microsoft Learn / LinkedIn
- **Key announcement:** LinkedIn now supports **Sign in with Google** and **Sign in with Apple** as OAuth authentication options alongside the existing username/password method. Available on Desktop and Android web browsers. Standard OAuth implementations should work without changes. Developers can disable these options via support request.
- **Impact on our project:** An MCP server using LinkedIn OAuth will automatically benefit from these additional sign-in options. No code changes needed for existing OAuth 2.0 integrations.
- **URL:** https://learn.microsoft.com/en-us/linkedin/marketing/integrations/recent-changes?view=li-lms-2026-06

### Topic: MCP Specification — 2026-07-28 Release Candidate (Biggest Revision Since Launch)
- **Date:** May 21, 2026 (RC locked); Final spec: July 28, 2026
- **Source:** Model Context Protocol Blog
- **Key announcement:** The **2026-07-28** release is the largest MCP revision since launch. **Headline changes:**
  - **Stateless core**: The `initialize`/`initialized` handshake is removed. Protocol version, client info, and capabilities now travel in `_meta` on every request. The `Mcp-Session-Id` header is removed. Any MCP request can land on any server instance — enables plain round-robin load balancing without sticky sessions.
  - **New `server/discover` method**: Clients fetch server capabilities at runtime instead of at connection time.
  - **Streamable HTTP transport** now requires `Mcp-Method` and `Mcp-Name` headers for routable load balancing.
  - **Cache headers**: List/resource read results carry `ttlMs` and `cacheScope` (modeled on HTTP `Cache-Control`).
  - **Multi Round-Trip Requests (MRTR)**: Tools can return `InputRequiredResult` to ask the user something mid-call.
  - **Extensions framework**: Extensions identified by reverse-DNS IDs, negotiated via capabilities map, version independently. Two official extensions: **MCP Apps** (server-rendered UIs in sandboxed iframes) and **Tasks** (long-running work with polling).
  - **JSON Schema 2020-12**: Tool `inputSchema` and `outputSchema` now support composition, conditionals, `$ref`.
  - **Authorization hardening**: OAuth 2.0/OpenID Connect alignment, `iss` validation per RFC 9207, `application_type` declaration, credential binding.
  - **Deprecation policy**: Features now have Active → Deprecated → Removed lifecycle with minimum 12-month deprecation window.
  - **Deprecated**: Roots, Sampling, Logging features; HTTP+SSE transport.
  - **Breaking changes**: This release contains breaking changes. SDKs will handle version fallback.
- **Impact on our project:** A LinkedIn MCP server built on the 2026-07-28 spec can be **stateless**, horizontally scalable behind any HTTP load balancer, with OAuth 2.1 auth, and full JSON Schema 2020-12 tool definitions. Should target this spec for future-proofing. Beta SDKs are available now (Python v2, TypeScript v2, Go, C#).
- **URL:** https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/

### Topic: Beta SDKs for MCP 2026-07-28 Spec Release Candidate
- **Date:** June 29, 2026
- **Source:** Model Context Protocol Blog
- **Key announcement:** **Python v2** (`mcp` package): `FastMCP` becomes `MCPServer`, decorator API carries over. **TypeScript v2**: Split packages (`@modelcontextprotocol/server`, `@modelcontextprotocol/client`), ESM-only, Node.js 20+/Bun/Deno, Standard Schema support (Zod v4, Valibot, ArkType). **Go**: `v1.7.0-pre.1` on same module path. **C#**: `2.0.0-preview.1`. All betas implement stateless core, MRTR, routable headers, auth hardening. Backward-compatible: servers speak both `2026-07-28` and `2025-11-25` from the same endpoint.
- **Impact on our project:** The TypeScript SDK split into focused packages (`server`, `client`, adapters for Express/Hono/Fastify) is directly relevant. For a LinkedIn MCP server, using `@modelcontextprotocol/server` with the `createMcpHandler` entry point and ode.Pre-commit]v3 / node adapter for deployment.
- **URL:** https://blog.modelcontextprotocol.io/posts/sdk-betas-2026-07-28/

### Topic: OpenAI — Full MCP Support in ChatGPT (Developer Mode)
- **Date:** September 2025 (Developer Mode); March 2025 (initial adoption)
- **Source:** OpenAI Developer Community / OpenAI Docs
- **Key announcement:** OpenAI adopted MCP in March 2025. Full MCP client support in ChatGPT **Developer Mode** (September 2025) allows connecting custom MCP servers for read+write actions. MCP tools available in the **Responses API**. OpenAI maintains **Connectors** (MCP wrappers) for Google Workspace, Dropbox, Gmail, Calendar, Microsoft Teams, Outlook, SharePoint. ChatGPT supports **MCP Apps standard** for embedded UI in iframes. Authorization supports OAuth with Client ID Metadata Documents (CIMD).
- **Impact on our project:** A LinkedIn MCP server would work across both Anthropic Claude and OpenAI ChatGPT ecosystems — significantly expanding the addressable user base. OpenAI's explicit approval flow (`require_approval`) provides a safety layer for write operations.
- **URLs:**
  - https://community.openai.com/t/mcp-server-tools-now-in-chatgpt-developer-mode/1357233
  - https://developers.openai.com/api/docs/mcp
  - https://www.ainews.com/p/openai-adopts-anthropic-s-mcp-standard-to-connect-ai-models-to-data

### Topic: MCP Server Cards & `.well-known/mcp.json` Standard (SEP-1649)
- **Date:** Q4 2026 (planned)
- **Source:** AgentMarketCap / MCP Roadmap
- **Key announcement:** The AAIF Registry (planned Q4 2026) will use `.well-known/mcp.json` (SEP-1649) — a standardized endpoint MCP servers expose to advertise capabilities, transport configuration, and available tools without requiring a connection. This will enable a curated, verified server directory with security audits and usage statistics.
- **Impact on our project:** Once available, a LinkedIn MCP server should implement `.well-known/mcp.json` for discovery via the AAIF Registry. This is the long-term distribution channel for production MCP servers.
- **URL:** https://agentmarketcap.ai/blog/2026/04/23/mcp-17-month-anniversary-10k-servers-97m-downloads-category-standard

---

## Industry Reports

### Report: MCP at 17 Months — 97M Downloads, 10,000+ Servers
- **Publisher:** AgentMarketCap
- **Date:** April 23, 2026
- **Key insights:**
  - 97M monthly SDK downloads (up from 2M at Nov 2024 launch — 4,750% increase in 16 months)
  - 10,000+ public MCP servers across registries
  - All major AI providers ship native MCP client support (Anthropic, OpenAI, Google, Microsoft)
  - 67% of enterprise AI teams using or actively evaluating MCP as primary agent-tool integration layer
  - Linux Foundation AAIF with founding members AWS, Anthropic, Block, Bloomberg, Cloudflare, Google, Microsoft, OpenAI
  - Three phases: (1) Will anyone build servers? (2) Will providers standardize? (3) Can it survive enterprise production? — currently in Phase 3
  - MCP adoption velocity exceeded React (3 years), gRPC (7 years), GraphQL Federation (4 years)
- **Impact on our project:** MCP has won the protocol standardization battle. The ecosystem is mature enough that building a LinkedIn MCP server is a sound investment. The question is no longer "should we use MCP?" but "which version and with what infrastructure?"
- **URL:** https://agentmarketcap.ai/blog/2026/04/23/mcp-17-month-anniversary-10k-servers-97m-downloads-category-standard

### Report: MCP Ecosystem Statistics 2026 — SDK Downloads, Server Counts, Governance
- **Publisher:** AgentsCamp
- **Date:** July 1, 2026
- **Key insights:**
  - Combined core SDK downloads: **~427M/month** (npm `@modelcontextprotocol/sdk`: 156M, PyPI `mcp`: 271M)
  - Registry counts: Smithery 6,652 | PulseMCP 20,120 | mcp.so ~23,000 servers
  - modelcontextprotocol/servers GitHub: ~87,900 stars
  - AAIF membership grew from 41 (Dec 2025) to **~190 members** (May 2026)
  - Gold members: Cisco, Datadog, Docker, IBM, JetBrains, Oracle, Salesforce, SAP, Shopify, Snowflake
  - Silver members: Hugging Face, Uber, Zapier, Pydantic, Elastic
  - Sibling protocol under AAIF: A2A (agent-to-agent, donated by Google)
- **Impact on our project:** The ecosystem has critical mass. Any new MCP server benefits from enormous existing tooling, SDK maturity, and community support. The 4x SDK growth in 6 months indicates accelerating adoption.
- **URL:** https://agentscamp.com/guides/mcp/mcp-ecosystem-statistics

### Report: MCP Server Ecosystem Tracker — 56 Servers Cataloged (Issue #1)
- **Publisher:** Digital Applied
- **Date:** May 24, 2026
- **Key insights:**
  - 56 production-ready/vendor-backed MCP servers cataloged across 10 categories
  - **OAuth 2.1 is winning**: ~21/56 servers use OAuth 2.1 as primary auth
  - **Transport shift**: 28 stdio-only, 22 hosted-endpoint, 6 both. All 2026 vendor servers use hosted endpoints
  - MCP tunnels research preview announced May 19, 2026 (outbound-only encrypted connections)
  - Self-hosted sandboxes public beta (Cloudflare, Daytona, Modal, Vercel)
  - AWS Agent Toolkit reached GA with 60+ official servers — largest first-party catalog
  - Observability category grew from 6 to 9 vendor servers (IBM Instana, Honeycomb, New Relic)
  - **Notable gaps**: No fully GA vendor-maintained **security MCP server** exists
  - Anthropic reference repo: 7 active, 14 archived — vendor-maintained servers are the durable pattern
- **Impact on our project:** Production MCP servers in 2026 should use **hosted endpoint + OAuth 2.1** as the default deployment pattern. Stdio-only is transitional. For a LinkedIn MCP server, OAuth 2.1 alignment with LinkedIn's OAuth 2.0 flow is essential. The report's heuristic: "If launched by a vendor after Jan 2026, assume hosted + OAuth 2.1."
- **URL:** https://www.digitalapplied.com/blog/mcp-server-ecosystem-tracker-50-servers-cataloged-2026

### Report: The MCP Server Ecosystem (May 2026) — Anthropic Reference + Vendor + Community
- **Publisher:** RunLocalAI
- **Date:** May 6, 2026
- **Key insights:**
  - **Remote MCP went mainstream**: Atlassian, HubSpot, Linear, Slack, Sentry, Neon, Vercel shipped first-party remote MCP endpoints (Mar–May 2026). Production remote-MCP services grew from ~16 to 25+ in 8 weeks.
  - **GitHub MCP is now first-party**: `github/github-mcp-server` replaced Anthropic reference — broader API coverage, OAuth-ready transport.
  - **Playwright MCP crossed 32k stars**: Microsoft's accessibility-tree-driven browser server.
  - Key hosts: Claude Desktop, Claude Code (SWE-bench Verified 87.6%), Cursor, OpenHands (72k stars), Goose (AAIF-governed, 18k stars), Cline (50k stars, ~4M installs), Continue (25k stars).
  - **Postgres MCP CVE** reported: statement-stacking escape in read-only wrapper. Fix: current versions + least-privilege DB role.
- **Impact on our project:** The remote MCP trend validates the hosted endpoint approach. Claude Code (87.6% SWE-bench) is the leading coding agent host. A LinkedIn MCP server should target **Claude Code + Cursor + ChatGPT** as primary hosts.
- **URL:** https://www.runlocalai.co/maps/mcp-ecosystem-2026

### Report: MCP vs Function Calling — Full Comparison (2026)
- **Publisher:** Multiple (Prefect, QVeris, Developers Digest, Kunal Ganglani)
- **Date:** April–May 2026
- **Key insights:**
  - **MCP is infrastructure-level protocol; Function Calling is model-level primitive** — they are complementary, not competing
  - **2026 consensus**: Use both together — Function Calling for model execution decisions, MCP for tool standardization
  - MCP reduces N×M integrations to N+M (N agents + M tools)
  - Function Calling wins: simple apps (<5 tools), single-model, rapid prototyping, latency-critical
  - MCP wins: multi-client access, multi-model portability, team-shared tools, production governance (auth, audit, rate limiting), tool ecosystems
  - OpenAI's Function Calling is **not deprecated** (still actively maintained with strict mode for schema enforcement)
  - MCP tool definitions are model-agnostic; Function Calling is provider-specific (OpenAI vs Anthropic vs Google formats are incompatible)
  - **Migration path**: Existing FC tools can be incrementally graduated to MCP servers without cutover events
- **Impact on our project:** A LinkedIn MCP server fits the "shared tool used by multiple agents" pattern — exactly where MCP shines. The hybrid pattern (Function Calling for intent, MCP for execution) is the recommended architecture for 2026.
- **URLs:**
  - https://www.prefect.io/resources/mcp-vs-function-calling
  - https://qveris.ai/guides/mcp-vs-function-calling/
  - https://www.kunalganglani.com/blog/mcp-vs-function-calling

### Report: Existing LinkedIn MCP Server Landscape
- **Publisher:** GitHub Community
- **Date:** March–June 2026
- **Key insights:** At least **4 open-source LinkedIn MCP servers** exist as of July 2026:
  1. **devag7/linkedin-mcp** (TypeScript, MIT, 3 stars) — Most comprehensive: 22 tools, stealth browser (Patchright/Playwright), Voyager API integration, safety layer (caps, pacing, circuit breaker), reads + gated writes. Uses browser automation to bypass Cloudflare.
  2. **abhineet34/linkedin-mcp-server** (TypeScript, MIT, 2 stars) — Focused on post creation, image upload, company page management. Uses official LinkedIn REST API v202604 with OAuth 2.0.
  3. **wlyonscat/server-mcp-linkedin** (Python, MIT, 0 stars) — Job search, profile viewing, resume/cover letter generation. Uses LinkedIn API + AI generation.
  4. **eliasbiondo/linkedin-mcp-server** (no details available) — People/company/job search.
  - **Key challenge**: LinkedIn's official APIs (REST/Marketing) require partner-level approval for write operations (posting, messaging). Browser automation via Voyager API works but violates LinkedIn's User Agreement (account ban risk).
  - **Key insight from devag7**: "Automating LinkedIn violates its User Agreement and can get your account restricted or banned — no tool can prevent that."
- **Impact on our project:** The existing solutions are early-stage (0–3 stars). None are production-grade. There's a clear gap for a well-built, properly licensed LinkedIn MCP server. The **fundamental architectural tension** is between: (a) official LinkedIn REST API (requires partner approval, heavy restrictions) vs (b) Voyager API via browser automation (works but violates ToS, account risk). Any project must address this tension transparently.
- **URLs:**
  - https://github.com/devag7/linkedin-mcp
  - https://github.com/abhineet34/linkedin-mcp-server
  - https://github.com/wlyonscat/server-mcp-linkedin
  - https://github.com/eliasbiondo/linkedin-mcp-server

---

## Ecosystem Context & Market Position

### MCP Ecosystem — Key Growth Metrics (Timeline)

| Metric | Nov 2024 | Dec 2025 | Apr 2026 | Jul 2026 |
|---|---|---|---|---|
| MCP Servers | ~50 | ~2,500 | ~10,000 | ~20,000+ |
| SDK Downloads (monthly) | ~2M | ~97M | ~97M+ | ~427M |
| AAIF Members | — | 41 (launch) | ~100+ | ~190 |
| Major MCP Clients | Claude Desktop only | Claude + ChatGPT | All major AI providers | All + enterprise |

### MCP 2026-07-28 Breaking Changes (Must-Know for Server Developers)

| Change | SEP | Impact |
|---|---|---|
| No `initialize` handshake | SEP-2575 | Protocol version in `_meta` per request |
| No `Mcp-Session-Id` | SEP-2567 | Stateless — use explicit state handles |
| New `server/discover` method | — | Fetch capabilities at runtime |
| `Mcp-Method` + `Mcp-Name` headers | SEP-2243 | Required for Streamable HTTP |
| Cache TTL (`ttlMs`, `cacheScope`) | SEP-2549 | `tools/list` now cacheable |
| MRTR pattern | SEP-2322 | `InputRequiredResult` for mid-call questions |
| JSON Schema 2020-12 | SEP-2106 | Full composition, `$ref`, conditionals |
| Extensions framework | SEP-2133 | Reverse-DNS IDs, independent versioning |
| Auth: `iss` validation | SEP-2468 | RFC 9207, mix-up attack mitigation |
| Deprecated: roots, sampling, logging | SEP-2577 | 12-month deprecation window |
| Standard error codes | SEP-2164 | `-32602` for missing resources |

---

## Sources

### LinkedIn API Documentation
- [1] LinkedIn Marketing API Recent Changes (202606): https://learn.microsoft.com/en-us/linkedin/marketing/integrations/recent-changes?view=li-lms-2026-06
- [2] LinkedIn Marketing API Versioning: https://learn.microsoft.com/en-us/linkedin/marketing/versioning?view=li-lms-2026-06
- [3] LinkedIn Marketing API Migrations: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/migrations?view=li-lms-2026-06
- [4] LinkedIn Marketing API Access Tiers: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/marketing-tiers?view=li-lms-2026-06
- [5] LinkedIn Increasing API Access: https://learn.microsoft.com/en-us/linkedin/marketing/increasing-access?view=li-lms-2026-06
- [6] LinkedIn Talent Solutions Release Notes: https://learn.microsoft.com/en-us/linkedin/talent/release-notes?view=li-lts-2026-03
- [7] LinkedIn Talent API Versioning: https://learn.microsoft.com/en-us/linkedin/talent/versioning?view=li-lts-2026-03
- [8] LinkedIn Community Management Integration Requirements: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/integration-requirements-community-management?view=li-lms-2026-04

### MCP Specification & Official Sources
- [9] MCP 2026-07-28 Release Candidate: https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/
- [10] Beta SDKs for 2026-07-28 MCP Spec: https://blog.modelcontextprotocol.io/posts/sdk-betas-2026-07-28/
- [11] MCP Specification Changelog (2026-07-28): https://modelcontextprotocol.io/specification/draft/changelog
- [12] MCP Specification Draft: https://modelcontextprotocol.io/specification/draft
- [13] MCP Roadmap (updated 2026-03-05): https://modelcontextprotocol.io/development/roadmap
- [14] SEP-2567: Sessionless MCP via Explicit State Handles: https://modelcontextprotocol.org/seps/2567-sessionless-mcp

### MCP Ecosystem Reports
- [15] MCP at 17 Months (AgentMarketCap, Apr 2026): https://agentmarketcap.ai/blog/2026/04/23/mcp-17-month-anniversary-10k-servers-97m-downloads-category-standard
- [16] MCP Ecosystem Statistics 2026 (AgentsCamp, Jul 2026): https://agentscamp.com/guides/mcp/mcp-ecosystem-statistics
- [17] MCP Server Ecosystem Tracker (Digital Applied, May 2026): https://www.digitalapplied.com/blog/mcp-server-ecosystem-tracker-50-servers-cataloged-2026
- [18] MCP Server Ecosystem Map (RunLocalAI, May 2026): https://www.runlocalai.co/maps/mcp-ecosystem-2026
- [19] MCP Ecosystem Hits 13,000+ Servers (gentic.news, Jun 2026): https://gentic.news/article/mcp-ecosystem-hits-13000-servers
- [20] MCP in 2026: Numbers Behind the Explosion (DEV, Jul 2026): https://dev.to/grahamduescn/mcp-in-2026-the-numbers-behind-the-ecosystem-explosion-5fek

### MCP vs Function Calling Comparisons
- [21] MCP vs Function Calling (Prefect, Apr 2026): https://www.prefect.io/resources/mcp-vs-function-calling
- [22] MCP vs Function Calling Key Differences (QVeris, May 2026): https://qveris.ai/guides/mcp-vs-function-calling/
- [23] MCP vs OpenAI Function Calling 2026 (Kunal Ganglani, May 2026): https://www.kunalganglani.com/blog/mcp-vs-function-calling
- [24] MCP vs Function Calling (Developers Digest, Apr 2026): https://www.developersdigest.tech/blog/mcp-vs-function-calling
- [25] MCP vs OpenAI Function Calling 2026 (CallSphere, Apr 2026): https://callsphere.ai/blog/td30-fw-mcp-vs-openai-function-calling-2026-which-to-pick

### OpenAI MCP Support
- [26] OpenAI Adopts MCP Standard (AI News, Mar 2025): https://www.ainews.com/p/openai-adopts-anthropic-s-mcp-standard-to-connect-ai-models-to-data
- [27] MCP Server Tools in ChatGPT Developer Mode (OpenAI Community, Sep 2025): https://community.openai.com/t/mcp-server-tools-now-in-chatgpt-developer-mode/1357233
- [28] Building MCP Servers for ChatGPT (OpenAI Docs): https://developers.openai.com/api/docs/mcp
- [29] MCP Apps Compatibility in ChatGPT (OpenAI Developers): https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt
- [30] MCP and Connectors (OpenAI API Docs): https://developers.openai.com/api/docs/guides/tools-connectors-mcp

### Existing LinkedIn MCP Servers
- [31] devag7/linkedin-mcp: https://github.com/devag7/linkedin-mcp
- [32] abhineet34/linkedin-mcp-server: https://github.com/abhineet34/linkedin-mcp-server
- [33] wlyonscat/server-mcp-linkedin: https://github.com/wlyonscat/server-mcp-linkedin
- [34] eliasbiondo/linkedin-mcp-server: https://github.com/eliasbiondo/linkedin-mcp-server

### Other
- [35] The Future of MCP Keynote (David Soria Parra, Apr 2026): https://www.youtube.com/watch?v=v3Fr2JR47KA
- [36] Google Gemini Enterprise Agent Platform Remote MCP (Google Cloud, Jun 2026): https://cloud.google.com/blog/products/ai-machine-learning/gemini-enterprise-agent-platform-remote-mcp-server
- [37] MCP Apps Compatibility in ChatGPT (OpenAI Developers): https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt
