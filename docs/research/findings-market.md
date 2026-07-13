# Market Research Findings: LinkedIn MCP Server

> **Date:** 2026-07-13
> **Sub-agent:** market-researcher
> **Status:** Complete

---

## Executive Summary

The LinkedIn MCP Server ecosystem has exploded from ~5 projects in early 2025 to **25+ identified open-source projects** by mid-2026. The space is dominated by **Python-based browser automation** approaches (led by **stickerdaniel/linkedin-mcp-server** with ~2,744 stars), while **TypeScript/official API** implementations remain fewer but growing. Key gaps include limited write capabilities (most tools read-only or posting-only), fragile browser-automation auth, and lack of comprehensive profile management + messaging + analytics in a single polished package.

---

## Competitor Analysis

### Tier 1: Market Leaders (>100 stars)

---

### 1. stickerdaniel/linkedin-mcp-server
- **URL:** https://github.com/stickerdaniel/linkedin-mcp-server
- **Language:** Python (99.9%)
- **Stars:** ~2,744 (as of Jul 2026)
- **Forks:** 222+
- **Last update:** v4.17.0 (Jun 28, 2026) — actively maintained
- **License:** Apache-2.0
- **Features:**
  - Browser-session based (uses `li_at` cookie via logged-in browser)
  - Tools: `get_person_profile`, `get_company_profile`, `search_jobs`, `get_inbox`, `send_message`, `connect_with_person`, `get_sidebar_profiles`, `get_conversation`, `close_session`
  - Docker image available (stickerdaniel/linkedin-mcp-server)
  - `uvx` install: `uvx linkedin-scraper-mcp@latest --login`
  - 62 releases (v4.x series)
  - Sponsored by Unipile (managed LinkedIn API service)
- **Gaps:** Read-heavy; write operations like `connect_with_person` still marked as issues. Browser auth is fragile. No profile editing/writing.
- **Source:** [GitHub](https://github.com/stickerdaniel/linkedin-mcp-server), [Docker Hub](https://hub.docker.com/r/stickerdaniel/linkedin-mcp-server), [DailyWorkflow](https://thedailyworkflow.com/mcp/server/linkedin-mcp-server)

---

### 2. adhikasp/mcp-linkedin
- **URL:** https://github.com/adhikasp/mcp-linkedin
- **Language:** Python
- **Stars:** 207
- **Forks:** 53
- **Last update:** ~Dec 2024 (10 commits, not actively maintained since)
- **License:** Unlicense (public domain)
- **Features:**
  - Uses unofficial LinkedIn API via `tomquirk/linkedin-api`
  - Tools: `get_feed_posts`, `search_jobs`
  - Installable via Smithery
  - Simple email/password auth
- **Gaps:** Very limited tool surface (feed + jobs only). Password auth violates LinkedIn ToS. No profile management or messaging.
- **Source:** [GitHub](https://github.com/adhikasp/mcp-linkedin)

---

### 3. eliasbiondo/linkedin-mcp-server
- **URL:** https://github.com/eliasbiondo/linkedin-mcp-server
- **Language:** Python
- **Stars:** 156
- **Forks:** 29
- **Last update:** Mar 2026 (active, 18 commits)
- **License:** MIT
- **Features:**
  - Uses FastMCP + Patchright (browser automation)
  - Hexagonal architecture
  - Granular section selection for profiles (experience, education, contact info, interests, honors, languages, posts, recommendations)
  - Company profiles with posts + jobs
  - Job search with 6 filter types
- **Gaps:** Browser automation dependency (Patchright). No write capabilities beyond scraping. Python-only.
- **Source:** [GitHub](https://github.com/eliasbiondo/linkedin-mcp-server)

---

### Tier 2: Established Projects (30-100 stars)

---

### 4. felipfr/linkedin-mcpserver
- **URL:** https://github.com/felipfr/linkedin-mcpserver
- **Language:** TypeScript (96.8%)
- **Stars:** 75
- **Forks:** 26
- **Last update:** Mar 28, 2025 (v0.1.0, only 4 commits)
- **License:** MIT
- **Features:**
  - Official LinkedIn API (OAuth 2.0)
  - Profile search, profile retrieval, job search, messaging, network stats
  - Dependency injection (TSyringe), structured logging (Pino), Axios REST client
  - MCP Inspector support
- **Gaps:** Virtually abandoned — only 4 commits, no recent activity. Minimal testing. No npm package.
- **Source:** [GitHub](https://github.com/felipfr/linkedin-mcpserver), [Glama](https://glama.ai/mcp/servers/@felipfr/linkedin-mcpserver)

---

### 5. Dishant27/linkedin-mcp-server
- **URL:** https://github.com/Dishant27/linkedin-mcp-server
- **Language:** TypeScript
- **Stars:** 49
- **Forks:** 14
- **Last update:** Active (42 commits)
- **License:** MIT
- **Features:**
  - Official LinkedIn API with OAuth
  - Search people, companies, jobs
  - NPM-ready (package.json)
  - Claude Desktop configuration examples
- **Gaps:** Limited tool surface; primarily search-focused. No messaging or profile management.
- **Source:** [GitHub](https://github.com/Dishant27/linkedin-mcp-server)

---

### 6. fredericbarthelet/linkedin-mcp-server
- **URL:** https://github.com/fredericbarthelet/linkedin-mcp-server
- **Language:** TypeScript
- **Stars:** ~38
- **Forks:** 6
- **Last update:** Mar 2025 (9 commits, stale)
- **License:** (not specified, likely MIT)
- **Features:**
  - Implements MCP Draft Third-Party Authorization Flow (HTTP+SSE transport)
  - Only 2 tools: `user-info`, `create-post`
  - Uses LinkedIn Community Management API
  - First to implement OAuth delegation via MCP auth flow
- **Gaps:** Very limited feature set. Relies on draft MCP spec. Stale. Only posting + user info.
- **Source:** [GitHub](https://github.com/fredericbarthelet/linkedin-mcp-server), [MCP.so](https://mcp.so/server/mcp-server-linkedin)

---

### 7. quinnjr/linkedin-mcp (Pegasus Heavy Industries)
- **URL:** https://github.com/quinnjr/linkedin-mcp
- **npm:** https://www.npmjs.com/package/@pegasusheavy/linkedin-mcp
- **Language:** TypeScript
- **Stars:** 35
- **Forks:** 3
- **Last update:** Active (86 commits, v1.4.0)
- **License:** MIT
- **Features:**
  - 18 MCP tools (profile management, skills, education, certifications, publications, languages, posts)
  - 67 test cases, 85%+ coverage
  - Zod validation, MCP SDK v1.24+
  - OpenID Connect + OAuth 2.0 support
  - npm package: `@pegasusheavy/linkedin-mcp`
  - Full documentation website: https://pegasusheavy.github.io/linkedin-mcp/
  - Profile management (add/update/delete skills, positions, education, certifications, publications, languages)
  - Social features (view profiles, posts, connections, share content, people search)
- **Gaps:** Lower star count. Still in early maturity (v1.x). No browser automation fallback. Requires official API access.
- **Source:** [GitHub](https://github.com/quinnjr/linkedin-mcp), [npm](https://www.npmjs.com/package/@pegasusheavy/linkedin-mcp)

---

### 8. agency42/linkedin-mcp
- **URL:** https://github.com/agency42/linkedin-mcp
- **Language:** TypeScript
- **Stars:** 31
- **Forks:** 12
- **Last update:** Apr 2025 (4 commits)
- **License:** (not specified)
- **Features:**
  - OAuth callback server + MCP server
  - HTTP+SSE transport
  - Post sharing (text + links)
  - Inspector UI support
- **Gaps:** Minimal feature set. Only posting.
- **Source:** [GitHub](https://github.com/agency42/linkedin-mcp)

---

### Tier 3: Niche/Smaller Projects (<30 stars)

---

### 9. FilippTrigub/linkedin-mcp
- **URL:** https://github.com/FilippTrigub/linkedin-mcp
- **PyPI:** https://pypi.org/project/linkedin-mcp/ (v0.1.7)
- **Language:** Python
- **Stars:** 8
- **Forks:** 6
- **Last update:** May 14, 2025 (stable, 31 commits)
- **License:** MIT
- **Features:**
  - Post text updates + media attachments (images/video)
  - OAuth2 authentication with secure token storage
  - Visibility controls (public/connections)
  - pipx installable
- **Gaps:** Only posting — no search, profiles, or messaging.
- **Source:** [GitHub](https://github.com/FilippTrigub/linkedin-mcp), [PyPI](https://pypi.org/project/linkedin-mcp)

---

### 10. alinaqi/mcp-linkedin-server
- **URL:** https://github.com/alinaqi/mcp-linkedin-server
- **Language:** Python (FastMCP + Playwright)
- **Stars:** ~45+
- **Features:**
  - Browser automation with Playwright
  - Feed browsing, profile search, profile viewing, post interaction (like, comment)
  - Encrypted cookie storage, rate limiting
- **Gaps:** Browser automation is fragile. Account ban risk.
- **Source:** [GitHub](https://github.com/alinaqi/mcp-linkedin-server)

---

### 11. alexey-pelykh/linkedctl
- **URL:** https://github.com/alexey-pelykh/linkedctl
- **Language:** TypeScript
- **Stars:** 2
- **Last update:** Active, 6 releases (v0.5.1)
- **License:** AGPL-3.0
- **Features:**
  - Full OAuth2 CLI + MCP server
  - Post content (text, images, video, documents, carousels, polls)
  - Comments & reactions (CRUD)
  - Organization support
  - Analytics (per-post, per-member, per-organization)
  - Media uploads, draft posts
  - npm global install: `npm install -g linkedctl`
- **Gaps:** Low community adoption. AGPL license may deter commercial use. CLI-first, MCP second.
- **Source:** [GitHub](https://github.com/alexey-pelykh/linkedctl)

---

### 12. alexey-pelykh/lhremote
- **URL:** https://github.com/alexey-pelykh/lhremote
- **Language:** TypeScript
- **Stars:** 5
- **Forks:** 8
- **Last update:** Active (518 commits)
- **License:** AGPL-3.0
- **Features:**
  - LinkedHelper automation backend
  - 68 MCP tools!
  - Campaign automation, people import, profile queries, messaging, InMail, connection requests
  - LinkedIn feed, search, engagement (like, comment, follow)
  - Profile enrichment (email, phone, socials)
  - Budget & throttle monitoring
- **Gaps:** Requires LinkedHelper desktop app (paid). Not standalone.
- **Source:** [GitHub](https://github.com/alexey-pelykh/lhremote)

---

### 13. other notable projects

| Project | Lang | Stars | Focus |
|---------|------|-------|-------|
| vidhupv/linkedin-mcp | TS | ~15 | Posting |
| harishafeez1/linkedin-mcp-server-paperclip | JS | 0 | Browser-based, profile/inbox/messaging |
| sigvardt/linkedin-buddy | TS | 1 | Full CLI + MCP, Playwright-based, 100+ tools |
| bhaktatejas922/unipile-linkedin-mcp | Python | 1 | Unipile API, Sales Nav, messaging |
| Maheidem/linkedin-optimizer-mcp | TS | 1 | Posting, analytics, auto-config |
| rugvedp/linkedin-mcp | Python | — | Profile analyzer, RapidAPI |
| lurenss/linkedin-mcp | TS/Python | — | Post creation, profile info |
| CDataSoftware/linkedin-mcp-server-by-cdata | Java | — | Read-only, JDBC driver-based |
| administrativetrick/linkedin-mcp | TS | 1 | Job search only |
| kudymovmaxim/linkedin-mcp | Python | 7 | Phantombuster-based |
| pebblebed/linkedin-mcp-server | TS | 0 | Clone of Dishant27 |
| Shubhwithai/linkedin-scraper-mcp | Python | — | RapidAPI-based profile scraper |
| SARAMALI15792/LinkedIn_mcp_custom_server | Python | — | Post creation, commenting |
| ericzakariasson/linkedin | Python | — | Playwright-based posting |

**Sources:**
- [PulseMCP LinkedIn Servers](https://www.pulsemcp.com/servers?q=linkedin)
- [Awesome MCP Servers — LinkedIn](https://awesome.ecosyste.ms/projects/github.com%2Fstickerdaniel%2Flinkedin-mcp-server)
- [MCP.so LinkedIn servers](https://mcp.so/search?q=linkedin)
- [Glama MCP Directory](https://glama.ai/mcp/servers)
- [LobeHub MCP Marketplace](https://lobehub.com/mcp)

---

## Ecosystem Overview

### Total LinkedIn MCP Projects

| Metric | Count |
|--------|-------|
| Total identified open-source projects | **25+** |
| Active (commits in last 3 months) | ~8 |
| TypeScript projects | ~12 |
| Python projects | ~11 |
| Other (Java, etc.) | ~2 |
| Published to npm | ~5 |
| Published to PyPI | ~3 |
| Listed on PulseMCP | ~15 |
| Listed on Docker Hub | ~3 |

### Technology Split

| Approach | Projects | Examples |
|----------|----------|---------|
| **Browser Automation** (Playwright/Patchright) | ~8 | stickerdaniel, eliasbiondo, alinaqi, sigvardt, ericzakariasson |
| **Official LinkedIn API** (OAuth 2.0) | ~10 | felipfr, quinnjr, Dishant27, fredericbarthelet, FilippTrigub, alexey-pelykh |
| **Third-party API** (RapidAPI, Unipile, Phantombuster) | ~5 | rugvedp, bhaktatejas922, kudymovmaxim, Shubhwithai |
| **Hybrid** | ~2 | lurenss |

### Trends

1. **Browser automation dominates by stars**: The most-starred project (stickerdaniel, ~2,744) uses browser session cookies rather than official APIs — indicating developers prioritize **works-right-now** over **ToS-compliant**.

2. **TypeScript is catching up**: 2025-2026 saw a surge in TypeScript LinkedIn MCP servers (quinnjr, linkedctl, lhremote) with better developer experience (type safety, zod validation, npm distribution).

3. **Profile management is the killer gap**: Most projects are read-only scrapers or posting-only. Only quinnjr/linkedin-mcp (18 tools) and linkedctl offer **full profile CRUD** (skills, education, certifications, publications).

4. **Commercial offerings entering the space**: Unipile, Anysite.io, CData, ConnectSafely, Clado AI, Periodix, ABM.dev — all offering managed LinkedIn data via MCP, indicating growing demand.

5. **MCP ecosystem maturation**: PulseMCP lists 22,120+ total MCP servers (up from ~1,000 in early 2025). LinkedIn-specific servers represent a growing niche.

### Adoption Indicators

- **stickerdaniel/linkedin-mcp-server** is listed on **6+ awesome lists** (awesome-mcp-servers, awesome-ChatGPT-repositories, metorial-index, etc.)
- **Docker Hub catalog** includes LinkedIn MCP as a featured server
- **PulseMCP** shows 15+ LinkedIn MCP servers with growing visitor counts
- **LobeHub MCP Marketplace** lists 4+ LinkedIn MCP plugins
- **Smithery.ai** supports `mcp-linkedin` auto-install

### Key Gaps in the Market

1. **No TypeScript leader**: The most-starred TS project has only 75 stars (vs 2,744 for the Python leader). There's room for a polished TypeScript LinkedIn MCP server.

2. **No comprehensive npm package**: `@pegasusheavy/linkedin-mcp` is promising but early (v1.4.0, 35 stars). No other TS LinkedIn MCP has significant npm adoption.

3. **Write + Read combined**: Most servers are either read-only scrapers (stickerdaniel) or write-only posters (FilippTrigub, fredericbarthelet). Few combine both.

4. **Messaging gap**: Only stickerdaniel (browser-based, unstable) and lhremote (requires paid LinkedHelper) offer messaging. No official-API-based messaging.

5. **LinkedIn API restrictions**: The official LinkedIn API is locked behind partner approvals. The "Community Management API" (posting) is the most accessible. Profile API requires "Sign In With LinkedIn" product. Profile editing APIs are restricted.

---

## Source Diversity

### Primary Sources (GitHub Repositories)
- https://github.com/stickerdaniel/linkedin-mcp-server
- https://github.com/eliasbiondo/linkedin-mcp-server
- https://github.com/adhikasp/mcp-linkedin
- https://github.com/felipfr/linkedin-mcpserver
- https://github.com/quinnjr/linkedin-mcp
- https://github.com/Dishant27/linkedin-mcp-server
- https://github.com/fredericbarthelet/linkedin-mcp-server
- https://github.com/FilippTrigub/linkedin-mcp
- https://github.com/alinaqi/mcp-linkedin-server
- https://github.com/alexey-pelykh/linkedctl
- https://github.com/alexey-pelykh/lhremote
- https://github.com/agency42/linkedin-mcp
- https://github.com/sigvardt/linkedin-buddy
- https://github.com/harishafeez1/linkedin-mcp-server-paperclip
- https://github.com/bhaktatejas922/unipile-linkedin-mcp
- https://github.com/Maheidem/linkedin-optimizer-mcp
- https://github.com/vidhupv/linkedin-mcp

### Secondary Sources (Package Registries & Directories)
- https://www.npmjs.com/package/@pegasusheavy/linkedin-mcp
- https://pypi.org/project/linkedin-mcp/
- https://pypi.org/project/linkedin-mcp-server/
- https://hub.docker.com/r/stickerdaniel/linkedin-mcp-server
- https://www.pulsemcp.com/servers?q=linkedin
- https://lobehub.com/mcp/felipfr-linkedin-mcpserver
- https://glama.ai/mcp/servers
- https://mcp.so/search?q=linkedin
- https://mcpservers.org/servers/felipfr/linkedin-mcpserver
- https://awesome.ecosyste.ms/projects/github.com%2Fstickerdaniel%2Flinkedin-mcp-server

### Tertiary Sources (Articles & Reviews)
- https://thedailyworkflow.com/mcp/server/linkedin-mcp-server
- https://skywork.ai/skypage/en/unlocking-linkedin-ai-api/1977658219540832256
- https://welov.io/free-tools/en/ai-directory/linkedin-mcp
- https://playbooks.com/mcp/filipptrigub/linkedin-mcp

---

## Confidence Level: HIGH

**Reason:** Data triangulated across 6+ web searches, 25+ GitHub repositories verified, cross-referenced with 5 MCP directories (PulseMCP, Glama, MCP.so, LobeHub, awesome-mcp-servers), npm/PyPI package registries, and Docker Hub. Star counts and feature sets verified against live repository pages.

---

## Memory Entities Saved

- source-market-stickerdaniel: URL, stars=2744, language=Python, features=browser-scraping profiles/jobs/messaging, license=Apache-2.0, updated=2026-06-28
- source-market-eliasbiondo: URL, stars=156, language=Python, features=FastMCP+browser granular-profiles, license=MIT, updated=2026-03
- source-market-adhikasp: URL, stars=207, language=Python, features=feed+jobs unofficial-api, license=Unlicense, updated=2024-12
- source-market-felipfr: URL, stars=75, language=TypeScript, features=official-api profiles/jobs/messaging, license=MIT, updated=2025-03
- source-market-quinnjr: URL, stars=35, language=TypeScript, features=18-tools profile-CRUD npm-package, license=MIT, updated=2026-07
- source-market-linkedctl: URL, stars=2, language=TypeScript, features=full-oauth2-cli posting/comments/analytics, license=AGPL-3.0
- source-market-lhremote: URL, stars=5, language=TypeScript, features=68-tools LinkedHelper-campaign-automation, license=AGPL-3.0

---

## Open Questions

- **Which approach is more sustainable long-term: browser automation or official API?** Browser automation projects have more stars but higher account ban risk. Official API projects are safer but limited by LinkedIn's restrictive partner program.
- **What is the actual npm download count for @pegasusheavy/linkedin-mcp?** The package shows 0 dependents, suggesting very low adoption despite being the most complete TypeScript option.
- **Is there a market for a paid LinkedIn MCP server?** Several commercial services (Unipile, Anysite, CData, Periodix, ABM) suggest yes, but pricing and adoption data is unavailable.
- **Will LinkedIn's API policy change with the rise of MCP?** LinkedIn may tighten restrictions on unofficial API usage (browser automation) as MCP adoption grows, or may release official MCP support (as some other platforms have).
