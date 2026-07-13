# Research Plan: Open Source LinkedIn MCP Server untuk AI Agents

**Spec:** `docs/cariak/spec/2026-07-13-linkedin-mcp-server/research-spec.md`
**Date:** 2026-07-13
**Status:** Approved
**Total Sub-agents:** 6 (all dispatched in parallel)
**Total Queries:** 24

---

## Output Documents

- [x] research-report.md (primary)
- [x] references.json (citation database)
- [ ] research-report.docx (generated post-pipeline)

---

## Sub-agent Assignments

### RQ-1: Competitor Analysis (5 existing LinkedIn MCP servers)
**RQ-2: LinkedIn API Capabilities (2026)**
**RQ-3: MCP Server Best Practices**
**RQ-4: Feature Gap Analysis & Differentiation**
**RQ-5: Project Structure & Architecture**
**RQ-6: Community & Adoption Strategy**

---

#### Agent 1: internet-researcher — Web, Blogs, Engineering Posts

| # | Query | Targets RQ | Priority |
|---|---|---|---|
| 1 | `felipfr linkedin-mcpserver TypeScript MCP server features` | RQ-1 | High |
| 2 | `stickerdaniel linkedin-mcp-server Python browser automation` | RQ-1 | High |
| 3 | `FilippTrigub linkedin-mcp Python posting tools` | RQ-1 | High |
| 4 | `fredericbarthelet mcp-server-linkedin features` | RQ-1 | High |
| 5 | `linkedin API v2 rest posts ugcPosts REST vs OpenID Connect 2025 2026` | RQ-2 | High |
| 6 | `LinkedIn API rate limits 2026 pricing free tier developer program` | RQ-2 | High |
| 7 | `LinkedIn media upload REST API image post flow` | RQ-2 | High |
| 8 | `MCP server best practices tool naming error handling pagination 2026` | RQ-3 | High |
| 9 | `MCP Stdio vs Streamable HTTP transport comparison` | RQ-3 | Medium |
| 10 | `MCP OAuth authentication specification PKCE device authorization flow` | RQ-3 | High |
| 11 | `MCP server TypeScript monorepo project structure best practices` | RQ-5 | Medium |
| 12 | `LinkedIn messaging API MCP integration` | RQ-4 | Medium |

---

#### Agent 2: social-researcher — Reddit, HN, X/Twitter, Community

| # | Query | Targets RQ | Priority |
|---|---|---|---|
| 1 | `LinkedIn MCP server reddit r/ClaudeAI r/cursor` | RQ-1 | High |
| 2 | `"linkedin mcp" site:news.ycombinator.com` | RQ-1 | High |
| 3 | `MCP server LinkedIn API discussion Reddit` | RQ-4 | High |
| 4 | `AI agent LinkedIn automation posting tool MCP` | RQ-4 | Medium |
| 5 | `LinkedIn API developer experience complaints limitations 2026` | RQ-2 | Medium |
| 6 | `MCP server recommendations best MCP tools 2026` | RQ-3 | Medium |

---

#### Agent 3: academic-researcher — arXiv, Semantic Scholar, Papers

| # | Query | Targets RQ | Priority |
|---|---|---|---|
| 1 | `Model Context Protocol MCP AI agent tool specification` | RQ-3 | High |
| 2 | `OAuth 2.0 best practices AI agent CLI tool security` | RQ-3 | Medium |
| 3 | `social network API integration patterns REST GraphQL` | RQ-2 | Low |
| 4 | `LinkedIn API developer ecosystem research` | RQ-2 | Low |

---

#### Agent 4: news-researcher — Latest News, Announcements, Changelogs

| # | Query | Targets RQ | Priority |
|---|---|---|---|
| 1 | `LinkedIn API changelog 2025 2026 breaking changes` | RQ-2 | High |
| 2 | `MCP protocol specification updates 2026 streamable HTTP` | RQ-3 | High |
| 3 | `Anthropic MCP tools ecosystem news 2026` | RQ-3 | Medium |
| 4 | `LinkedIn developer program changes partner API access 2026` | RQ-2 | Medium |

---

#### Agent 5: market-researcher — GitHub, npm, Competitive Landscape

| # | Query | Targets RQ | Priority |
|---|---|---|---|
| 1 | `GitHub topic:linkedin-mcp-server stars features analysis` | RQ-1 | High |
| 2 | `npm linkedin-mcp download stats TypeScript vs Python` | RQ-5 | High |
| 3 | `MCP server directory LinkedIn social media integrations` | RQ-4 | High |
| 4 | `open source LinkedIn API wrapper TypeScript npm trends` | RQ-5 | Medium |
| 5 | `Gartner LinkedIn API market social media automation tools` | RQ-6 | Low |

---

#### Agent 6: domain-expert — LinkedIn API Deep, MCP Deep Patterns

| # | Query | Targets RQ | Priority |
|---|---|---|---|
| 1 | `LinkedIn /rest/posts vs /v2/shares vs /v2/ugcPosts migration guide` | RQ-2 | High |
| 2 | `LinkedIn OAuth 2.0 PKCE device authorization flow implementation` | RQ-2 | High |
| 3 | `LinkedIn OpenID Connect userinfo profile fields scopes 2026` | RQ-2 | High |
| 4 | `MCP server rate limiting token bucket implementation patterns` | RQ-3 | High |
| 5 | `LinkedIn partner program connections API people search requirements` | RQ-2 | Medium |
| 6 | `MCP server testing with MCP Inspector vitest integration guide` | RQ-3 | Medium |
| 7 | `MCP resource templates prompts capabilities beyond tools` | RQ-3 | Medium |

---

## Implementation Evidence Plan

| Evidence Type | Target | Sources |
|---|---|---|
| Repository comparison | 5 LinkedIn MCP competitors | GitHub, npm |
| API endpoint map | LinkedIn REST API | developer.linkedin.com, industry blogs |
| Auth flow design | PKCE + Device Auth + MCP Auth | RFCs, MCP spec, LinkedIn docs |
| Rate limit matrix | Per-endpoint LinkedIn limits | LinkedIn docs, community reports |
| Architecture decisions | TS vs Python, Stdio vs HTTP | MCP ecosystem, competitor code |
| Testing patterns | MCP Inspector, vitest | MCP SDK, community guides |
| Licensing guide | MIT vs Apache 2.0 vs AGPL | OSI, GitHub community health |

---

## Execution Order

All 6 sub-agents dispatched **in parallel**. Each writes a `findings-<agent>.md` file.

1. internet-researcher → `findings-internet.md`
2. social-researcher → `findings-social.md`
3. academic-researcher → `findings-academic.md`
4. news-researcher → `findings-news.md`
5. market-researcher → `findings-market.md`
6. domain-expert → `findings-domain.md`

After all 6 complete → **cariak-synthesizing** to merge findings.

---

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| Agent returns insufficient data | Use multiple queries per agent, fallback to web search |
| LinkedIn API docs ambiguous | Include real-world usage examples from competitor code |
| Competitor code incomplete | Verify features by running/reading actual source |
| Timeout on slow sources | 2-minute timeout per query, retry once |

---

## Handoff

Proceed to: **cariak-researching** → dispatch 6 parallel sub-agents → collect findings → **cariak-synthesizing**
