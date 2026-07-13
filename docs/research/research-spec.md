# Research Specification: Open Source LinkedIn MCP Server untuk AI Agents

**Date:** 2026-07-13
**Status:** Draft
**Project Root:** `D:\programming\webdev\eggisatria\linkedin-mcp-server`
**Current Protoype:** TypeScript + @modelcontextprotocol/sdk v1.6.1, 6 tools (profile, posts, feed, connections)

---

## Problem Statement

LinkedIn tidak memiliki official MCP server untuk AI agents. Beberapa open-source implementations exist tapi fragmented: ada yang posting-only, ada browser-based (risk of account ban), ada yang abandoned. We need a **production-grade, feature-complete, open-source LinkedIn MCP server** with proper auth handling, comprehensive API coverage, and MCP best practices.

**Current prototype** has:
- ✅ TypeScript + MCP SDK v1.6.1
- ✅ Profile tools (OpenID + /v2/me)
- ✅ Create post (/rest/posts)
- ✅ List posts (/v2/shares + /rest/posts fallback)
- ✅ Feed / activities
- ✅ Connections (partner API stub)
- ❌ No OAuth flow (token-only)
- ❌ No media/image upload
- ❌ No delete/edit post
- ❌ No messaging
- ❌ No search
- ❌ No tests
- ❌ No CI/CD
- ❌ Minimal documentation
- ❌ Silent error swallowing (empty returns on catch)
- ❌ Hardcoded LinkedIn-Version header

---

## Research Questions (BDD GWT)

### RQ1: Competitor Analysis
**GIVEN** I am building a LinkedIn MCP server
**WHEN** I analyze existing open-source competitors
**THEN** I need to know their strengths, weaknesses, architecture decisions, and gaps

| Aspect | Detail |
|---|---|
| **In-scope** | felipfr/linkedin-mcpserver, stickerdaniel/linkedin-mcp-server, FilippTrigub/linkedin-mcp, harishafeez1/linkedin-mcp-server-paperclip, fredericbarthelet/mcp-server-linkedin (GitHub stars, language, features, auth, docs) |
| **Out-of-scope** | Paid/commercial MCP servers, non-LinkedIn social MCPs |
| **Success metric** | ≥5 competitors analyzed with feature matrix |
| **Failure condition** | <3 competitors found, or unable to verify capabilities |

### RQ2: LinkedIn API Capabilities (2026)
**GIVEN** I am implementing LinkedIn API integration
**WHEN** I research available endpoints, auth methods, and limitations
**THEN** I need a comprehensive map of API capabilities

| Aspect | Detail |
|---|---|
| **In-scope** | REST API v2, OpenID Connect, /rest/posts, /v2/ugcPosts, /v2/shares, /rest/images, messaging API, rate limits, pricing tiers, scope requirements, media upload flow |
| **Out-of-scope** | LinkedIn Ads API, Recruiter API, Sales Navigator API, Marketing API |
| **Success metric** | Complete endpoint map with auth scope mapping |
| **Failure condition** | Missing critical posting/media flow |

### RQ3: MCP Server Best Practices
**GIVEN** I am developing an MCP server
**WHEN** I research MCP patterns, conventions, and standards
**THEN** I need clear guidance on architecture, error handling, and testing

| Aspect | Detail |
|---|---|
| **In-scope** | Tool naming, error formatting, markdown+JSON response patterns, pagination, OAuth flow, MCP Inspector testing, Streamable HTTP vs Stdio, resource templates, prompts |
| **Out-of-scope** | Non-MCP AI tooling protocols |
| **Success metric** | Comprehensive best practices guide applicable to LinkedIn MCP |
| **Failure condition** | Missing critical MCP patterns (pagination, auth, error handling) |

### RQ4: Feature Gap Analysis & Differentiation
**GIVEN** I know what competitors offer and what's possible with LinkedIn API
**WHEN** I analyze gaps in existing tools
**THEN** I need a feature roadmap with prioritized differentiators

| Aspect | Detail |
|---|---|
| **In-scope** | Feature comparison matrix, differentiation opportunities, prioritization based on AI agent needs, MVP→v1→v2 roadmap |
| **Out-of-scope** | Non-technical business model analysis |
| **Success metric** | ≥5 differentiation features identified |
| **Failure condition** | No clear differentiation from competitors |

### RQ5: Project Structure & Architecture
**GIVEN** I have research data on competitors, API, and MCP best practices
**WHEN** I design the project architecture
**THEN** I need evidence-based decisions on stack, structure, testing, and deployment

| Aspect | Detail |
|---|---|
| **In-scope** | Monorepo vs single package, TypeScript vs Python, Stdio vs Streamable HTTP, testing strategy (unit, integration, E2E), CI/CD (GitHub Actions), documentation (README, API docs, examples), publishing (npm, GitHub), licensing (MIT/Apache 2.0/AGPL), release strategy (semver, changelog, npm publish) |
| **Out-of-scope** | Specific cloud deployment configurations |
| **Success metric** | Architecture decisions with ≥2 sources each |
| **Failure condition** | Decisions made without competitive/technical evidence |

### RQ6: Community & Adoption Strategy
**GIVEN** There are already 5 open-source LinkedIn MCP competitors
**WHEN** I design the project's community and adoption approach
**THEN** I need a differentiation narrative and contributor onboarding plan

| Aspect | Detail |
|---|---|
| **In-scope** | Licensing (MIT/Apache 2.0/AGPL), contributor onboarding (CONTRIBUTING.md, issue/PR templates, dev setup), governance model, community channels (Discord/GitHub Discussions), release strategy (semver, changelog, npm publish), differentiation narrative vs competitors, growth metrics (stars, contributors) |
| **Out-of-scope** | Paid support, enterprise licensing, trademark |
| **Success metric** | Clear differentiation narrative + contributor onboarding plan |
| **Failure condition** | No actionable community strategy proposed |

---

## Engineering Lens

| Lens | Research Need | Source Targets | Success Evidence |
|---|---|---|---|
| **First principles** | How does LinkedIn API auth work (OAuth 2.0, PKCE, Device Auth Flow)? What mechanisms enable posting/media/search/messaging? | LinkedIn developer docs, existing implementations, RFC 7636 (PKCE), RFC 8628 (Device Auth) | Auth flow diagram, API mechanism map, OAuth decision matrix |
| **State of the art** | What's the current best MCP server architecture? What are the latest LinkedIn API changes? MCP Auth specification status? | GitHub trending MCPs, LinkedIn changelog, MCP specification draft/auth.md | Report on current best practices including MCP auth spec |
| **Field practice** | How do existing LinkedIn MCPs handle auth, errors, pagination, rate limiting in practice? Silent error patterns? | Codebase analysis of 5 competitors | Code-level comparison + antipattern catalog |
| **Implementation architecture** | Optimal component structure, data flow, error propagation, token storage (OS keychain, encrypted file) | MCP SDK patterns, competitor codebases, keytar/wincredential docs | Architecture diagram + token storage decision |
| **Data strategy** | What user data can we access? Scope minimization per tool? Caching strategy for tokens/profile? | LinkedIn API docs, OAuth best practices, principle of least privilege | Data access matrix with per-tool scope map |
| **Evaluation protocol** | How to test MCP tools? Integration testing with real vs mock API? MCP Inspector patterns? | MCP Inspector, test patterns, vitest/mocha docs | Test strategy doc |
| **Failure modes** | Token expiration (60-day), rate limiting (100-500/day), API deprecation, account restriction, silent catch bugs | Competitor issues, LinkedIn API docs, prototype analysis | Error handling matrix + retry/backoff strategy |
| **Tradeoffs** | Stdio vs HTTP transport, TS vs Python, monorepo vs single, MIT vs Apache vs AGPL | MCP ecosystem analysis, OSI licensing guide | Decision matrix (tech + licensing) |
| **Alternatives** | Browser-based automation vs official API, third-party proxies (Phyllo, Unipile) vs direct, LinkedIn Partner vs free tier | Competitor architectures, third-party API providers | Comparison table |
| **Unknowns** | LinkedIn API changes in 2025-2026, MCP protocol evolution, LinkedIn Partner program requirements | Must verify during research | Risk register |

---

## Scope & Boundaries

### In Scope
- Comprehensive competitor analysis of ≥5 LinkedIn MCP servers
- LinkedIn API v2 / REST endpoint mapping (2026)
- OAuth 2.0 flow design for MCP
- Post creation, editing, deletion, listing
- Profile reading (own + others, subject to API limits)
- Feed reading
- Messaging capabilities (if API allows)
- People search (if API allows via partner or alternative)
- Media/image upload flow
- MCP best practices (tools, errors, pagination, auth)
- Testing strategy (unit + integration with MCP Inspector)
- CI/CD pipeline design
- Documentation plan (README, API docs, examples, CONTRIBUTING)
- npm/GitHub publishing approach

### Out of Scope
- Browser-based scraping/automation (account safety risk)
- Sales Navigator / Recruiter system integration
- Paid API tiers analysis (focus on what's freely available)
- Building the actual server (that's the implementation phase)
- Commercial SaaS wrapper

---

## Success Metrics

| Metric | Target |
|---|---|
| Competitors analyzed | ≥5 with verified feature matrix |
| LinkedIn endpoints mapped | ≥10 with auth scope + rate limits |
| MCP patterns documented | ≥5 patterns (tools, errors, pagination, auth, resources) |
| Differentiation features | ≥5 clear differentiators |
| Source diversity | ≥15 unique sources across academic, GitHub, docs |
| Confidence score | ≥0.80 |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| LinkedIn API changes mid-development | Medium | High | Version APIs, use feature detection, probe at startup |
| Account ban via API misuse | Low | High | Document safe usage patterns, token-bucket rate limiting, no scraping |
| Token expiry (60-day LinkedIn limit) | High | High | Device Auth Flow for long-lived access, token refresh docs, clear error messages |
| Silent error handling (empty returns on catch) | High | Medium | Fix prototype before release — propagate errors, no silent empty returns |
| Hardcoded LinkedIn-Version header breaks | Medium | High | Make version configurable, probe at startup, support multiple API versions |
| Competitor analysis incomplete | Low | Medium | Use multiple search methods (GitHub, npm, web, Reddit) |
| MCP protocol evolves | Medium | Medium | Pin SDK version, follow changelog, monitor MCP auth spec |
| Limited API access (partner gating) | High | Medium | Runtime capability probe, gate tools behind scope checks, document workarounds |
| Auth complexity for end users | Medium | Medium | Design PKCE + Device Auth flows, npm init helper, clear docs |
| No PKCE for desktop/CLI flow | High | High | Research and implement PKCE (RFC 7636) as standard OAuth flow |
| Token stored insecurely (env/plaintext) | Medium | High | Research OS keychain integration, encrypted config file |
| No unattended/autonomous agent support | Medium | Medium | Design Device Authorization Flow (RFC 8628) for headless operation |

---

## Output Document Plan

- [x] research-spec.md (this document)
- [ ] research-plan.md (next phase)
- [ ] 6 × findings.md (researching phase)
- [ ] research-report.md (synthesis)
- [ ] references.json (synthesis)
- [ ] validation-report.md (validation)
- [ ] quality-report.md (reflection)

---

## Advisor Counsel

### API Architect (Risk-Averse)
- ✅ **Strong:** Tool annotations (`readOnlyHint`, `destructiveHint`), Zod `.strict()`, structured error formatting via `LinkedInClient.formatError()` — first-class MCP patterns
- ⚠️ **Weak:** Auth treated as solved (env var token); no Device Authorization Flow (RFC 8628) for headless MCP; hardcoded `LinkedIn-Version: "202401"` will break silently
- ❓ **Missing:** Per-endpoint rate limit matrix with Retry-After header parsing; runtime capability probe before tool registration
- **Verdict:** REVISE — connections and feed tools will silently fail for 95% of users

### Open Source Strategist (Risk-Seeking)
- ✅ **Strong:** Feature gap analysis (RQ4) and existing prototype traction enable fast shipping
- ⚠️ **Weak:** Zero community strategy — no licensing decision, no CONTRIBUTING.md plan, no governance, no release strategy
- ❓ **Missing:** Contributor onboarding funnel, growth metrics, differentiation narrative vs 5 competitors
- **Verdict:** PROCEED — but add RQ6 for community strategy

### Security Engineer / Auth Specialist (Risk-Averse)
- ✅ **Strong:** Scoping out browser automation, risk register mentions auth issues
- ⚠️ **Weak:** No PKCE (RFC 7636) for desktop/CLI, no token storage strategy (keychain), no MCP Auth spec reference, no scope minimization per tool, silent error swallowing in client.ts
- ❓ **Missing:** Unattended vs interactive agent distinction drives entire auth architecture
- **Verdict:** REVISE — PKCE + MCP auth spec + token storage are prerequisites

### Synthesis
1. ✅ **Agreement:** Spec is well-structured but underestimates auth complexity
2. ✅ **Agreement:** Silent error handling (empty catch returns) must be fixed
3. ✅ **Agreement:** Rate limit analysis per endpoint needed
4. ⚠️ **Contradiction:** API Architect says REVISE, OS Strategist says PROCEED — resolved by adding RQ6 and enhanced RQ2/3 without blocking
5. **Net:** Spec updated with RQ6, enhanced RQ2/RQ3, PKCE/auth requirements. Proceed to planning.

---

## Handoff

Proceed to: **cariak-planning** → **cariak-researching** (6 parallel sub-agents) → **cariak-synthesizing** → **cariak-validating** → **cariak-reflecting** → **cariak-closing**
