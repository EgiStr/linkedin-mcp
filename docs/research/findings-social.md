# Social Research Findings: LinkedIn MCP Server

> **Sub-agent:** Social-researcher  
> **Date:** 2026-07-13  
> **Status:** Complete  
> **Trigger queries:** 7 social/community searches executed

---

## Community Discussions

### Source: Reddit — r/mcp subreddit
- **Thread:** "I built a LinkedIn MCP server for Claude that scrapes..."  
- **Sentiment:** Neutral/enthusiastic (builder posts)
- **Key points:**
  - Multiple users building their own LinkedIn MCP servers using Python & Selenium
  - Primary use case: scraping and analyzing LinkedIn profiles, getting detailed company information
  - Servers designed to keep credentials on user's own device
  - Works with Claude Desktop and other MCP-compatible clients
  - Community actively discussing trade-offs between scraping approaches
- **Pain points mentioned:**
  - LinkedIn actively blocks automated access
  - Session management is fragile
  - Browser automation requires ongoing maintenance
- **Source:** https://www.reddit.com/r/mcp/comments/1jykmgj/i_built_a_linkedin_mcp_server_for_claude_that/ (2025-07-13)

### Source: Hacker News — "Literally just last night I have Claude Code..."
- **Thread:** https://news.ycombinator.com/item?id=48419523
- **Sentiment:** Mixed — technically aware, skeptical about LinkedIn's tolerance
- **Key points:**
  - Developer reports: "LinkedIn in particular is quite aggressively blocking any automated attempts to read or navigate through it"
  - One user used headless browser + Claude Code for months, then "LI wised up and started logging it out"
  - Workaround: use regular Chrome, log in manually, then tell LLM to take over
  - General sentiment: "If you're accessing sites which are not actively blocking bots, or — gasp — have an API, it's much better"
- **Pain points mentioned:**
  - LinkedIn aggressive bot detection
  - Session token rotation breaks automation
  - CAPTCHA and login challenges
- **Source:** https://news.ycombinator.com/item?id=48419523

### Source: Hacker News — "WebMCP Proposal" (major thread on MCP + walled gardens)
- **Thread:** https://news.ycombinator.com/item?id=47037501
- **Sentiment:** Heated debate, technically deep
- **Key points:**
  - Strong sentiment that LinkedIn/Facebook will never willingly give MCP access: "Why would Facebook or LinkedIn ever give you this?"
  - WebMCP proposal suggests browser-native tool API as alternative to MCP for consumer web apps
  - "Look at who's about to get angry about OpenClaw-style automation: LinkedIn, Facebook, anyone with a walled garden and a careful API strategy"
  - MCP vs WebMCP debate: "MCP actually fills a real gap there" but "the protocol needs an auth and permissions story"
  - Key insight: "The problem with agents browsing the web, is that most interesting things on the web are either information or actions"
- **Pain points mentioned:**
  - Walled gardens actively hostile to agent automation
  - MCP has no auth/permissions standard for web contexts
  - LinkedIn's business model conflicts with open API access
- **Source:** https://news.ycombinator.com/item?id=47037501

### Source: Hacker News — MCP Over-marketed discussion
- **Thread:** https://news.ycombinator.com/item?id=44367530
- **Sentiment:** Skeptical of MCP hype, acknowledges real utility
- **Key points:**
  - "If you believe the hype of X/LinkedIn you would think that MCP everywhere is going to be the solution"
  - Critical distinction: "MCP allows you to bring tools to agents you don't control. It's awesome, but it isn't the right match for every problem"
  - Developer reports difficulty getting LLMs to reliably invoke MCP tool functions
  - Different models behave differently — unpredictable tool invocation patterns
- **Source:** https://news.ycombinator.com/item?id=44367530

### Source: Hacker News — Hyperbrowser MCP Server
- **Thread:** https://news.ycombinator.com/item?id=43425767
- **Sentiment:** Positive reception
- **Key points:**
  - MCP server for browser automation: handles CAPTCHAs, proxies, stealth browsing
  - "We announced this on X and LinkedIn yesterday and the response has been really good"
  - Many use cases cited for browser-based LinkedIn automation
- **Source:** https://news.ycombinator.com/item?id=43425767

### Source: LinkedIn — Joseph Quinn / Pegasus Heavy Industries
- **Post:** "LinkedIn MCP Server v1.3.0 Released"
- **Sentiment:** Very positive (product announcement)
- **Key points:**
  - Official open-source release: `@pegasusheavy/linkedin-mcp`
  - 18 LinkedIn tools for profile management
  - OAuth 2.0 with OpenID Connect support
  - Post creation, skills, education, certifications
  - Full TypeScript with 67 test cases
  - Works with Claude Desktop, Cursor IDE
- **Community response:** 34 GitHub stars, 2 forks, community engagement
- **Source:** https://www.linkedin.com/posts/quinnjosephr_opensource-typescript-ai-activity-7412930189854396416-fAcY

### Source: LinkedIn — Akshay Pachaar's MCP roundup
- **Post:** "5 MCP servers that will give superpowers to your AI Agents!"
- **Sentiment:** Positive
- **Key points:**
  - Firecrawl, MindsDB, GitHub, Linkup mentioned — LinkedIn not in top 5
  - MCP ecosystem growing rapidly
  - Community curating lists of useful MCPs
- **Source:** https://www.linkedin.com/posts/akshay-pachaar_5-mcp-servers-that-will-give-superpowers-activity-7320803275518144512-RGks

### Source: LinkedIn — Cassy Aite / Postbeam.ai
- **Post:** "Post Directly from AI Tools to LinkedIn with Postbeam.ai MCP"
- **Sentiment:** Positive
- **Key points:**
  - MCP server enabling posting from ChatGPT, Grok, Gemini, Claude, Perplexity
  - Use case: cross-platform content publishing
- **Source:** https://www.linkedin.com/posts/cassyaite_you-can-now-post-to-linkedin-directly-from-activity-7470240928000061440-lX79

### Source: LinkedIn — Phil Shotton API support complaint
- **Post:** LinkedIn API Support Fails to Address Edge Cases
- **Sentiment:** Negative/frustrated
- **Key points:**
  - 12-year developer reporting edge case issues with LinkedIn API
  - Support unable to handle complex ownership/auth scenarios
- **Source:** https://www.linkedin.com/posts/phil-shotton-635a791a9_i-dont-post-often-on-linkedin-but-im-making-activity-7418961702194520065-TQRF

### Source: Stack Overflow — OAuth 2.0 token exchange failure
- **Thread:** LinkedIn OAuth 2.0 token exchange returns invalid_client (401)
- **Sentiment:** Frustrated
- **Key points:**
  - Developer debugging: "Diagnostic logging confirmed request matches LinkedIn spec exactly"
  - PKCE code_verifier included correctly, still fails
  - "Need LinkedIn engineer to inspect server-side logs" — no path to resolution
- **Source:** https://stackoverflow.com/questions/79948579/linkedin-oauth-2-0-token-exchange-returns-invalid-client-401-on-newly-created

### Source: DEV Community — "Posting to LinkedIn From Node.js: 7 API Quirks That Burned Me"
- **Article:** https://dev.to/nicolasai/posting-to-linkedin-from-nodejs-7-api-quirks-that-burned-me-5885
- **Sentiment:** Frustrated but informative
- **Key points:**
  - Author URN must be `urn:li:person:abc123`, not user ID (silent failure)
  - Image upload is THREE separate API calls, not one
  - `LinkedIn-Version` header required (date string, not semver) — skip it → 400 with no explanation
  - Empty body returns 422, not 400 — misleading error
  - Rate limits are SILENT — no `X-RateLimit-Remaining` header
  - Token expiry at 60 days, refresh is opt-in and many apps not approved
  - Scope changes don't apply retroactively — must re-auth users
  - Consent screen caches aggressively — using `prompt: "consent"` required during dev
- **Source:** https://dev.to/nicolasai/posting-to-linkedin-from-nodejs-7-api-quirks-that-burned-me-5885 (2026-05-08)

### Source: Coder Legion — "Autopilot - the API Nightmare"
- **Article:** https://coderlegion.com/11564/autopilot-the-api-nightmare-how-i-defeated-linkedin-bureaucracy-to-automate-my-company
- **Sentiment:** Frustrated/amused — "bureaucracy"
- **Key points:**
  - To post as a company page, needs `w_organization_social` scope
  - Had to: verify company page → request "Marketing Developer Platform" product → fill questionnaire
  - Describes it as "an administrative scavenger hunt"
  - Token expires in 60 days — "If I do nothing, in two months this whole system will break"
- **Source:** https://coderlegion.com/11564/autopilot-the-api-nightmare-how-i-defeated-linkedin-bureaucracy-to-automate-my-company (2026-02-13)

### Source: GitHub — stickerdaniel/linkedin-mcp-server (most popular, 2,645★)
- **Repo:** https://github.com/stickerdaniel/linkedin-mcp-server
- **Sentiment:** Very active community
- **Stats:** 2,645 stars, 466 forks, 20 contributors, 81 open issues
- **Key findings:**
  - Most-starred LinkedIn MCP on GitHub
  - Uses browser automation (Patchright) for scraping
  - Open issues show specific pain points: `connect_with_person` [#407][#432][#454], `send_message` [#433][#441][#483] — write operations are problematic
  - Breaking change Feb 2026: LinkedIn anti-scraping changes forced migration from Playwright to Patchright with persistent browser profiles
  - Old `session.json` files and `LINKEDIN_COOKIE` env vars no longer supported
  - Sponsored by Unipile (hosted LinkedIn API alternative)
  - 19 tools: profile, company, jobs, people search, messaging
  - License: Apache 2.0
- **Source:** https://github.com/stickerdaniel/linkedin-mcp-server

### Source: GitHub — devag7/linkedin-mcp (newest approach, 7★)
- **Repo:** https://github.com/devag7/linkedin-mcp
- **Sentiment:** Technically innovative
- **Stats:** 7 stars, 2 forks, 9 releases (latest v2.0.3)
- **Key findings:**
  - Unique approach: in-page Voyager API calls (not DOM scraping)
  - 22 tools with structured JSON output
  - Built-in safety layer: daily caps, human pacing, circuit breaker
  - 166 tests
  - Writes are direct Voyager POST — returns structured status, not blind "sent: true"
  - Explicit comparison table showing edge over DOM-scraping MCPs
  - Account safety: connections 20/day, messages 50/day, writes 150/24h
- **Source:** https://github.com/devag7/linkedin-mcp

### Source: GitHub — Linked-API/linkedapi-mcp (57★)
- **Repo:** https://github.com/Linked-API/linkedapi-mcp
- **Sentiment:** Commercial open-source
- **Key findings:**
  - 57 stars, 6 forks, MIT License
  - Cloud browser approach for LinkedIn automation
  - Use cases: market research, competitor analysis, lead generation
  - Connected to paid service: linkedapi.io
- **Source:** https://github.com/Linked-API/linkedapi-mcp

### Source: GitHub — eliasbiondo/linkedin-mcp-server (153★)
- **Repo:** https://github.com/eliasbiondo/linkedin-mcp-server
- **Sentiment:** Positive, single-contributor
- **Key findings:**
  - 153 stars, 29 forks
  - Python-based
  - Search people, companies, jobs, scrape profiles
  - Created March 2026, last updated March 2026 (low maintenance velocity)
- **Source:** https://github.com/eliasbiondo/linkedin-mcp-server

### Source: GitHub — gacabartosz/linkedin-mcp-server (2★)
- **Repo:** https://github.com/gacabartosz/linkedin-mcp-server
- **Sentiment:** Niche
- **Key findings:**
  - "The most complete LinkedIn MCP server — 24 tools"
  - Claims "only LinkedIn MCP with write operations" (disputed by others)
  - Includes AI image generation (Gemini Imagen 4)
  - Content templates, brand voice, algorithm guidelines
  - Uses official OAuth 2.0 flow (no scraping)
  - 1 contributor, low activity
- **Source:** https://github.com/gacabartosz/linkedin-mcp-server

### Source: GitHub — wlyonscat/server-mcp-linkedin (0★)
- **Repo:** https://github.com/wlyonscat/server-mcp-linkedin
- **Key findings:**
  - Focus on job search, resume generation, cover letters
  - AI-powered profile analysis
  - Python-based, FastMCP
- **Source:** https://github.com/wlyonscat/server-mcp-linkedin

### Source: GitHub — quinnjr/linkedin-mcp / Pegasus Heavy Industries (34★)
- **Repo:** https://github.com/pegasusheavy/linkedin-mcp
- **Key findings:**
  - 34 stars, 2 forks
  - npm: `@pegasusheavy/linkedin-mcp`
  - OAuth 2.0 with OpenID Connect
  - Full TypeScript, 67 test cases
  - 18 LinkedIn tools
- **Source:** https://github.com/pegasusheavy/linkedin-mcp

### Source: Taplio Blog — "LinkedIn MCP on GitHub: the Open-Source Servers Compared (2026)"
- **Article:** https://taplio.com/blog/linkedin-mcp-github (2026-06-18)
- **Sentiment:** Informative/comparative (biased toward hosted solution)
- **Key findings:**
  - Three connection methods: browser scraping (high risk), unofficial API (medium-high), official API (low risk)
  - stickerdaniel's repo is "most capable and maintained" for data extraction
  - "Scraping and unofficial APIs both violate LinkedIn's terms"
  - Open-source repos "break when LinkedIn ships a change — you become the on-call engineer"
  - Most repos "read, they do not ship" — not built for content creation workflow
  - Recommends hosted solutions for content/personal branding
- **Source:** https://taplio.com/blog/linkedin-mcp-github

---

## Market / Commercial Landscape

### Source: Crispy.sh — LinkedIn MCP Server (commercial)
- **URL:** https://crispy.sh/linkedin-mcp-server
- **Pricing:** $49/seat/month ($39/seat annual)
- **Features:**
  - Full MCP endpoint for search, messaging, content, analytics, campaigns
  - Works with Claude, Cursor, GPT, n8n
  - Ranked #1 LinkedIn automation tool for AI agents in 2026
- **Source:** https://crispy.sh/blog/best-linkedin-automation-tools-2026

### Source: ConnectSafely.ai — LinkedIn MCP Server
- **URL:** https://connectsafely.ai/integrations/mcp-server
- **Features:**
  - 8+ tools: get profile, analyze company pages, manage engagement campaigns
  - Inbound lead workflows, content scheduling
  - Works with Claude Desktop, Cursor, n8n, Zed
- **Source:** https://connectsafely.ai/integrations/mcp-server

### Source: Composio — LinkedIn MCP
- **URL:** https://composio.dev/toolkits/linkedin
- **Approach:** Managed platform with 22 LinkedIn tools
- **Features:** OAuth2, works with Claude Code, Cursor, OpenClaw, Hermes, Langchain
- **Enterprise:** SSO, governance, org-wide controls
- **Target:** Office work, sales, marketing, HR, recruiting, content & media
- **Source:** https://composio.dev/toolkits/linkedin

### Source: Aidelly — AI Social Media Automation
- **URL:** https://www.aidelly.ai/guides/best-ai-social-media-automation-tools-2026
- **Key finding:** "Aidelly is the only tool on this list that ships an MCP server, a REST API, and a Claude Skill"
- Buffer, Hootsuite, SocialBee, FeedHive have REST APIs but NO MCP server as of 2026
- **Source:** https://www.aidelly.ai/guides/best-ai-social-media-automation-tools-2026

### Source: Supergrow — MCP for LinkedIn
- **URL:** https://www.supergrow.ai/blog/ai-tools-for-linkedin
- **Features:** "Supergrow MCP — connect your AI client, call our tools. Draft LinkedIn posts, pull analytics"
- "LinkedIn-safe by design — uses official LinkedIn APIs and compliant methods only"
- **Source:** https://www.supergrow.ai/blog/ai-tools-for-linkedin

---

## LinkedIn API Developer Experience (Pain Point Deep-Dive)

### Source: SocialCrawl — "LinkedIn API in 2026: A Developer's Reality Check"
- **URL:** https://www.socialcrawl.dev/blog/linkedin-data-api-2026 (2026-06-21)
- **Critical findings:**
  - Self-serve scopes: only 3 — `profile` (name/headline), `email`, `w_member_social` (posting)
  - "These three scopes are the only ones any developer can enable without special approval"
  - Marketing Solutions (MDP): approval 2–8 weeks
  - SNAP partner program: requires Sales Navigator subscription
  - "Bulk profile lookup for arbitrary members" — never available
  - "The API is restricted by design, not by technical limitation"
  - No published rate limits — only visible in Developer Portal Analytics after first call
  - Email alerts at 75% quota with 1–2 hour lag
  - `999` status code is LinkedIn-specific bot detection (HARD STOP, not retry)
  - "Selenium scraper stopped working overnight" — LinkedIn pushes frontend changes multiple times per week
- **Source:** https://www.socialcrawl.dev/blog/linkedin-data-api-2026

### Source: Clura — "LinkedIn API: What Exists, What's Restricted, and What Developers Use Instead"
- **URL:** https://clura.ai/blog/linkedin-api (2026-06-22)
- **Critical findings:**
  - "LinkedIn's API approval rate for data extraction use cases is effectively zero"
  - "LinkedIn has not granted new data extraction API access to third parties since 2018"
  - Voyager API (internal, reverse-engineered): "LinkedIn detects non-app usage within 3–7 days and permanently bans the account"
  - "The GitHub repo issue trackers document this cycle clearly — hundreds of 'account restricted after 2 days' reports"
  - Developer Program: 3 tiers — Default (instant, useless), Partner (4–8 weeks, selective), Enterprise (invite-only)
  - Use cases rejected: data extraction, scraping, profile aggregation, job search automation
- **Source:** https://clura.ai/blog/linkedin-api

### Source: Dravo — "How to Use the LinkedIn API (2026)"
- **URL:** https://dravo.dev/blog/how-to-use-the-linkedin-api (2026-06-18)
- **Key quote:** "LinkedIn: Here's an API endpoint. Founder: how do I use it? LinkedIn: Here's the documentation. Founder: look what I built! LinkedIn: No, that's a terms violation, we'll ban you."
  - This quote was viral in developer communities
- **Source:** https://dravo.dev/blog/how-to-use-the-linkedin-api

---

## MCP Market Landscape

### Source: Top MCPs Directory
- **URL:** https://top-mcps.com/
- **Key findings:**
  - "Hand-verified for 2026" directory
  - 30 categories
  - Most popular MCPs: Filesystem, GitHub, Context7, Brave Search, Memory
  - LinkedIn MCP not in "builder favorites" or "trending" — niche compared to core dev tool MCPs
  - Suggests developers add 5 core MCPs first, then database + team MCPs
- **Source:** https://top-mcps.com/

### Source: MCP Trove (Best MCP servers by task)
- **URL:** https://mcptrove.com/best-mcp-servers
- **Key findings:**
  - "For a coding agent, add four and stop: filesystem, GitHub, Context7, Playwright"
  - LinkedIn MCP is not in any "best by task" category
  - MCP ecosystem at 520+ curated servers as of mid-2026
  - Social media MCPs are a distinct niche, not core
- **Source:** https://mcptrove.com/best-mcp-servers

### Source: Developers Digest — MCP Server Directory
- **URL:** https://www.developersdigest.tech/blog/mcp-servers-directory-2026
- **Key findings:**
  - 184+ MCP servers cataloged as of April 2026
  - Categories: Databases, Version Control, Communication, Project Management, Cloud, Monitoring, Search, Browser, Documentation, AI/ML, Developer Tools, Productivity
  - No "Social Media" category — LinkedIn would be a new vertical
  - "Three well-chosen servers outperform 15 loosely-related ones"
- **Source:** https://www.developersdigest.tech/blog/mcp-servers-directory-2026

---

## User Needs Analysis

### Most Requested Features

| Feature | Frequency | Evidence |
|---------|-----------|----------|
| **Profile reading (own + others)** | Very High | Every MCP server implements `get_profile` / `get_person_profile` |
| **Job search** | Very High | stickerdaniel, devag7, wlyonscat all implement `search_jobs` |
| **People search** | Very High | Almost every repo has `search_people` |
| **Post creation** | High | `create_post` in 5+ repos (gacabartosz 24 tools, pegasusheavy, devag7) |
| **Messaging** | High | `send_message`, `get_inbox`, `get_conversation` in most repos |
| **Company research** | High | `get_company`, `get_company_posts`, `get_company_employees` |
| **Feed reading** | Medium | `get_feed` in stickerdaniel, devag7 |
| **Content scheduling** | Medium | gacabartosz has full scheduling, Supergrow MCP, Crispy |
| **Analytics** | Medium | Crispy, Taplio, but absent from most open-source repos |
| **Connection management** | Medium | `connect_with_person` in stickerdaniel, devag7 (gated) |
| **Reactions & comments** | Medium | devag7, gacabartosz implement `react_to_post`, `comment_on_post` |
| **Resume generation** | Low | Only wlyonscat implements this |
| **Multi-account support** | Low | Only mentioned in context of ban-safety (use throwaway) |
| **OAuth 2.0 / Official API** | Low | Only pegasusheavy, gacabartosz, souravdasbiswas use official OAuth |

### Common Complaints

1. **LinkedIn API is deliberately crippled** — self-serve gives only 3 scopes, everything else requires weeks of approval
2. **Account bans for scraping** — Voyager API usage detected within 3–7 days, permanent bans
3. **No published rate limits** — developers discover limits only after hitting 429 errors
4. **Silent failures** — no `X-RateLimit-Remaining`, empty body returns 422 not 400
5. **60-day token expiry** — refresh flow is gated, many apps not approved
6. **Browser automation fragility** — LinkedIn changes selectors/UI weekly, scraping breaks constantly
7. **OAuth quirks** — `invalid_client` for no reason (Stack Overflow), `w_organization_social` hidden
8. **Cloudflare bot management** — even with valid cookies, `fetch`/`curl` rejected with endless redirect
9. **Support black hole** — LinkedIn developer support cannot handle edge cases (Phil Shotton's post)
10. **Commercial cost** — approved API access requires partnership, costs negotiated privately, effectively enterprise-only

### What Users Want From a LinkedIn MCP

1. **Read access that doesn't get them banned** — reliable profile/company/job data extraction
2. **Safe write operations** — posting, messaging, connecting with structured feedback (not blind clicks)
3. **OAuth 2.0 simplicity** — official API integration without the bureaucracy
4. **Content scheduling** — draft, schedule, publish workflow
5. **Built-in safety** — rate limiting, warmup, circuit breakers to protect accounts
6. **Structured data** — JSON output not scraped DOM text (locale-independent, resilient to UI changes)
7. **Self-hostable** — keep credentials local, no third-party data leakage
8. **Active maintenance** — repos that stay updated when LinkedIn changes things
9. **Write feedback** — `ok`/`duplicate`/`already_connected`/`restricted`/`quota_exhausted` statuses
10. **Cross-client compatibility** — Claude Desktop, Cursor, VS Code, n8n, ChatGPT

---

## Ecosystem Analysis

### GitHub Open-Source Landscape (as of July 2026)

| Repository | Stars | Language | Approach | Tools | Write Ops | Safety Layer | Last Updated |
|-----------|-------|----------|----------|-------|-----------|-------------|-------------|
| stickerdaniel/linkedin-mcp-server | 2,645★ | Python | Browser scraping (Patchright) | 19 | Partial (broken) | No | July 2026 |
| eliasbiondo/linkedin-mcp-server | 153★ | Python | Scraping | ~10 | No | No | March 2026 |
| Linked-API/linkedapi-mcp | 57★ | TypeScript | Cloud browser | ~15 | Yes (managed) | Cloud-based | June 2026 |
| quinnjr/linkedin-mcp (Pegasus Heavy) | 34★ | TypeScript | Official OAuth 2.0 | 18 | Yes | OAuth scopes | Active |
| devag7/linkedin-mcp | 7★ | TypeScript | Voyager in-page API | 22 | Yes (gated) | ✅ Full layer | June 2026 |
| gacabartosz/linkedin-mcp-server | 2★ | JavaScript | Official OAuth 2.0 | 24 | Yes | No | May 2026 |
| souravdasbiswas/linkedin-mcp-server | New | TypeScript | Official OAuth 2.0 | 15 | Yes | Adaptive rate limit | Active |
| wlyonscat/server-mcp-linkedin | 0★ | Python | Scraping | ~12 | No | No | April 2026 |

### Key Observations

1. **Market gap exists:** No single open-source LinkedIn MCP dominates. The most-starred (2,645★) uses scraping and has broken write operations. Official OAuth-based ones are newer with low adoption.

2. **Three architectural approaches compete:**
   - **Browser scraping** (stickerdaniel, eliasbiondo) — most capable reads, highest ban risk, fragile
   - **Voyager in-page API** (devag7, Linked-API) — novel approach, better resilience, still ToS-violating
   - **Official OAuth 2.0** (pegasusheavy, gacabartosz, souravdasbiswas) — safest, but limited to self-serve scopes

3. **Safety is a differentiator:** Only devag7/linkedin-mcp implements a comprehensive safety layer (daily caps, warmup, circuit breaker). This is explicitly called out as an edge over competitors.

4. **Community frustration with LinkedIn is high:** Multiple HN threads, blog posts, and GitHub issues document LinkedIn's aggressive anti-automation stance. The "3–7 days to ban" pattern for Voyager explorers is well-documented.

5. **Commercial alternatives are filling the gap:** Crispy ($49/mo), Taplio, Composio, ConnectSafely, Supergrow are all building hosted LinkedIn MCPs because the open-source options have significant risk/maintenance problems.

6. **Write operations are the hard problem:** Most repos have broken or unreliable write tools. The ones that work use either Voyager POST (ToS-violating) or official OAuth with limited scopes.

7. **MCP ecosystem is still young:** LinkedIn MCPs are niche within the broader MCP ecosystem (520+ servers cataloged). Social media MCPs are not yet a standard category.

---

## Sources

1. https://www.reddit.com/r/mcp/comments/1jykmgj/i_built_a_linkedin_mcp_server_for_claude_that/ — Reddit MCP community discussion
2. https://news.ycombinator.com/item?id=48419523 — HN: LinkedIn blocking automated access
3. https://news.ycombinator.com/item?id=47037501 — HN: WebMCP Proposal (walled gardens debate)
4. https://news.ycombinator.com/item?id=44367530 — HN: MCP over-marketed discussion
5. https://news.ycombinator.com/item?id=43425767 — HN: Hyperbrowser MCP (LinkedIn automation)
6. https://www.linkedin.com/posts/quinnjosephr_opensource-typescript-ai-activity-7412930189854396416-fAcY — Pegasus Heavy Industries announcement
7. https://www.linkedin.com/posts/akshay-pachaar_5-mcp-servers-that-will-give-superpowers-activity-7320803275518144512-RGks — Akshay Pachaar MCP roundup
8. https://www.linkedin.com/posts/cassyaite_you-can-now-post-to-linkedin-directly-from-activity-7470240928000061440-lX79 — Postbeam.ai MCP announcement
9. https://www.linkedin.com/posts/phil-shotton-635a791a9_i-dont-post-often-on-linkedin-but-im-making-activity-7418961702194520065-TQRF — LinkedIn API support complaint
10. https://stackoverflow.com/questions/79948579/linkedin-oauth-2-0-token-exchange-returns-invalid-client-401-on-newly-created — SO: OAuth token exchange failure
11. https://dev.to/nicolasai/posting-to-linkedin-from-nodejs-7-api-quirks-that-burned-me-5885 — DEV: 7 API quirks
12. https://coderlegion.com/11564/autopilot-the-api-nightmare-how-i-defeated-linkedin-bureaucracy-to-automate-my-company — Coder Legion: API bureaucracy
13. https://github.com/stickerdaniel/linkedin-mcp-server — Most-starred LinkedIn MCP (2,645★)
14. https://github.com/devag7/linkedin-mcp — Voyager in-page API approach (7★)
15. https://github.com/Linked-API/linkedapi-mcp — Cloud browser MCP (57★)
16. https://github.com/pegasusheavy/linkedin-mcp — Official OAuth 2.0 MCP (34★)
17. https://github.com/eliasbiondo/linkedin-mcp-server — Python scraper MCP (153★)
18. https://github.com/gacabartosz/linkedin-mcp-server — 24 tools, OAuth + AI images (2★)
19. https://github.com/souravdasbiswas/linkedin-mcp-server — Official API MCP (new)
20. https://github.com/wlyonscat/server-mcp-linkedin — Job-focused MCP (0★)
21. https://github.com/sanu495/linkedin-mcp-server — Docker-based MCP
22. https://github.com/Alshokairy/linkedin-mcp-server — Fork of stickerdaniel (0★)
23. https://taplio.com/blog/linkedin-mcp-github — Open-source LinkedIn MCP comparison (2026)
24. https://crispy.sh/linkedin-mcp-server — Commercial LinkedIn MCP ($49/mo)
25. https://connectsafely.ai/integrations/mcp-server — Commercial LinkedIn MCP
26. https://composio.dev/toolkits/linkedin — Managed LinkedIn MCP platform
27. https://www.socialcrawl.dev/blog/linkedin-data-api-2026 — LinkedIn API reality check (2026)
28. https://clura.ai/blog/linkedin-api — LinkedIn API restrictions deep-dive (2026)
29. https://dravo.dev/blog/how-to-use-the-linkedin-api — LinkedIn API guide (2026)
30. https://connectsafely.ai/articles/linkedin-api-complete-guide-2026 — LinkedIn API guide (2026)
31. https://www.aidelly.ai/guides/best-ai-social-media-automation-tools-2026 — MCP adoption in social tools
32. https://www.supergrow.ai/blog/ai-tools-for-linkedin — Supergrow MCP for LinkedIn
33. https://top-mcps.com/ — Top MCPs directory (2026)
34. https://mcptrove.com/best-mcp-servers — MCP Trove best servers (2026)
35. https://www.developersdigest.tech/blog/mcp-servers-directory-2026 — MCP server directory (2026)
36. https://linkupapi.com/blog-articles/ai-agent-for-linkedin — AI agent for LinkedIn guide
37. https://marketplace.relevanceai.com/use-cases/linkedin-agents — AI LinkedIn agents marketplace
38. https://magicpost.in/blog/ai-agent-for-linkedin — AI LinkedIn agent comparison
39. https://crispy.sh/blog/best-linkedin-automation-tools-2026 — LinkedIn automation tools ranking
40. https://nerq.ai/profile/stickerdaniel-linkedin-mcp-server — Trust Score analysis
