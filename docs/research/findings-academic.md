# Academic Research Findings: LinkedIn MCP Server

> **Date:** 2026-07-13
> **Sub-agent:** academic-researcher
> **Sources searched:** arXiv, Semantic Scholar, Google Scholar, CrossRef, IEEE Xplore, ACM Digital Library

---

## Papers & Specifications

### Paper: A Survey of Agent Interoperability Protocols: MCP, ACP, A2A, and ANP
- **Authors:** Abul Ehtesham, Aditi Singh, Gaurav Kumar Gupta, Saket Kumar
- **Year:** 2025
- **Source:** arXiv:2505.02279
- **Key findings:**
  - Comprehensive survey comparing four emerging agent communication protocols
  - MCP provides JSON-RPC client-server interface for secure tool invocation and typed data exchange
  - MCP launched by Anthropic in November 2024 as a universal, model-agnostic interface for AI systems
  - Proposes a phased adoption roadmap: start with MCP for tool access, then A2A for collaboration, ANP for decentralized marketplaces
  - MCP addresses the challenge of fragmented, custom-built integrations between LLMs and external tools
- **Relevance to our project:** High — provides the foundational understanding of where MCP fits in the agent protocol ecosystem and how a LinkedIn MCP server should be structured according to the JSON-RPC standard
- **URL:** https://arxiv.org/abs/2505.02279

### Paper: MCP Server Architecture Patterns for LLM-Integrated Applications
- **Authors:** Carson Rodrigues, Oysturn Vas
- **Year:** 2026
- **Source:** arXiv:2606.30317
- **Key findings:**
  - Catalogues **five recurring MCP server architectural patterns**: Resource Gateway, Tool Orchestrator, Stateful Session Server, Proxy Aggregator, and Domain-Specific Adapter
  - Also documents four anti-patterns and cross-cutting concerns around authentication, versioning, and observability
  - Tool-selection accuracy drops below 90% when a server exposes 10-15 tools per context (for Claude Haiku 4.5)
  - Inter-rater reliability of pattern taxonomy measured at Cohen's kappa = 0.76
- **Relevance to our project:** High — directly applicable as we need to decide which architectural pattern(s) our LinkedIn MCP server should follow. The LinkedIn MCP server maps naturally to a **Proxy Aggregator** pattern (wrapping LinkedIn's REST API) and potentially a **Domain-Specific Adapter** pattern.
- **URL:** https://arxiv.org/abs/2606.30317

### Paper: Bridging Protocol and Production: Design Patterns for Deploying AI Agents with Model Context Protocol
- **Authors:** Vasundra Srinivasan
- **Year:** 2026
- **Source:** arXiv:2603.13417
- **Key findings:**
  - MCP has over 10,000 active servers and 97 million monthly SDK downloads as of early 2026
  - Identifies **three missing protocol-level primitives**: identity propagation, adaptive tool budgeting, and structured error semantics
  - Proposes three mechanisms: Context-Aware Broker Protocol (CABP) extending JSON-RPC with identity-scoped request routing; Adaptive Timeout Budget Allocation (ATBA); Structured Error Recovery Framework (SERF)
  - Documents production failure modes across five design dimensions: server contracts, user context, timeouts, errors, and observability
  - Provides a production readiness checklist for MCP server deployments
- **Relevance to our project:** High — critical for production deployment of our LinkedIn MCP server. The identity propagation mechanism is especially relevant for LinkedIn's OAuth-based authentication.
- **URL:** https://arxiv.org/abs/2603.13417

### Paper: MCP-Universe: Benchmarking LLMs with Real-World MCP Servers
- **Authors:** Ziyang Luo, Zhiqi Shen, Wenzhuo Yang, Zirui Zhao, et al.
- **Year:** 2025
- **Source:** arXiv:2508.14704
- **Key findings:**
  - First comprehensive benchmark for evaluating LLMs through interaction with real-world MCP servers
  - Covers 6 core domains (Location, Repository, Financial, 3D, Browser, Web Search) across 11 MCP servers
  - Even SOTA models show significant limitations: GPT-5 (43.72%), Grok-4 (33.33%), Claude-4.0-Sonnet (29.44%)
  - Enterprise-level agents like Cursor cannot outperform standard ReAct frameworks
  - Long-context challenge: input tokens increase rapidly with interaction steps
  - Open-source evaluation framework with UI support for integrating new agents and MCP servers
- **Relevance to our project:** Medium — provides benchmarking methodology we can apply to our LinkedIn MCP server, and highlights the need for careful tool description design
- **URL:** https://arxiv.org/abs/2508.14704

### Paper: MCP Tool Descriptions Are Smelly! Towards Improving AI Agent Efficiency with Augmented MCP Tool Descriptions
- **Authors:** Mohammed Mehedi Hasan, Hao Li, Gopi Krishnan Rajbahadur, Bram Adams, Ahmed E. Hassan
- **Year:** 2026
- **Source:** arXiv:2602.14878
- **Key findings:**
  - Examined 856 tools across 103 MCP servers empirically
  - **97.1% of tool descriptions contain at least one smell**
  - 56% fail to state their purpose clearly
  - Augmenting descriptions improves task success rates by a median of 5.85 percentage points and partial goal completion by 15.12%
  - However, it also increases execution steps by 67.46% and regresses performance in 16.67% of cases
  - Identifies six components of tool descriptions and formalizes tool description smells
- **Relevance to our project:** High — directly informs how we should write tool descriptions for our LinkedIn MCP server (profile search, connections, messaging tools). Descriptions must clearly state purpose, parameters, and expected behavior.
- **URL:** https://arxiv.org/abs/2602.14878

### Paper: Security Threat Modeling for Emerging AI-Agent Protocols: MCP, A2A, Agora, and ANP
- **Authors:** Zeynab Anbiaee, Mahdi Rabbani, Mansur Mirani, et al.
- **Year:** 2026
- **Source:** arXiv:2602.11327
- **Key findings:**
  - Systematic security analysis of four emerging AI agent communication protocols
  - Identifies 12 protocol-level risks across MCP creation, operation, and update phases
  - Measurement-driven case study on MCP formalizes risk of missing mandatory validation/attestation for executable components
  - Quantifies wrong-provider tool execution under multi-server composition
  - Provides actionable guidance for secure deployment and future standardization
- **Relevance to our project:** High — security considerations for our LinkedIn MCP server, especially regarding multiple-server composition and tool execution security
- **URL:** https://arxiv.org/abs/2602.11327

### Paper: ETDI — Mitigating Tool Squatting and Rug Pull Attacks in MCP using OAuth-Enhanced Tool Definitions
- **Authors:** Manish Bhatt, Vineeth Sai Narajala, Idan Habler
- **Year:** 2025
- **Source:** arXiv:2506.01333
- **Key findings:**
  - Introduces Enhanced Tool Definition Interface (ETDI), a security extension for MCP
  - Incorporates **cryptographic identity verification**, immutable versioned tool definitions, and explicit permission management leveraging OAuth 2.0
  - Proposes extending MCP with fine-grained, policy-based access control
  - Tool capabilities dynamically evaluated against explicit policies using a dedicated policy engine
  - Addresses Tool Poisoning and Rug Pull attacks against MCP servers
- **Relevance to our project:** High — directly relevant as our LinkedIn MCP server must use OAuth 2.0 for LinkedIn API authentication. The ETDI framework provides patterns for integrating OAuth-enhanced security into an MCP server.
- **URL:** https://arxiv.org/abs/2506.01333

### Paper: ANX — Protocol-First Design for AI Agent Interaction with a Supporting 3EX Decoupled Architecture
- **Authors:** Xu Mingze
- **Year:** 2026
- **Source:** arXiv:2604.04820
- **Key findings:**
  - Proposes ANX protocol as an alternative/extension to MCP for agent-native design
  - ANX reduces tokens by 47.3-55.6% compared to MCP-based skills, and 57.1-66.3% vs GUI automation
  - LLM-bypassed UI-to-Core communication keeps sensitive data out of agent context
  - Human-only confirmation prevents automated misuse
  - Key insight: security through "agent-native design" where critical data never enters the LLM context
- **Relevance to our project:** Medium — the security architecture insight (keeping sensitive data out of LLM context) is important for handling LinkedIn access tokens and user data
- **URL:** https://arxiv.org/abs/2604.04820

### Paper: A Comprehensive Formal Security Analysis of OAuth 2.0
- **Authors:** Daniel Fett, Ralf Kuesters, Guido Schmitz
- **Year:** 2016
- **Source:** ACM CCS 2016 / arXiv:1601.01229
- **Key findings:**
  - First extensive formal analysis of OAuth 2.0 standard in an expressive web model
  - Covers all four OAuth grant types (authorization code, implicit, password credentials, client credentials)
  - **Discovered four attacks** that break security of OAuth (also present in OpenID Connect)
  - Proposed fixes for identified vulnerabilities; proved security of fixed OAuth version
  - Analysis includes scenarios with malicious relying parties, identity providers, and browsers
- **Relevance to our project:** Medium — provides formal security understanding of OAuth 2.0 which our LinkedIn MCP server must implement. The identified attacks inform secure implementation patterns.
- **URL:** https://arxiv.org/abs/1601.01229

### Paper: Role of Trust in OAuth 2.0 and OpenID Connect
- **Authors:** Kavindu Dodanduwa, Ishara Kaluthanthri
- **Year:** 2018
- **Source:** arXiv:1808.10624
- **Key findings:**
  - Analyzes trust establishments between OAuth 2.0 roles (resource owner, client, authorization server, resource server)
  - Trust must be pre-established or established during protocol operation
  - OpenID Connect adds authentication layer using identity details on top of OAuth 2.0
- **Relevance to our project:** Medium — understanding OAuth trust relationships is essential for our LinkedIn MCP server's authentication flow
- **URL:** https://arxiv.org/abs/1808.10624

### Paper: Generating GraphQL-Wrappers for REST(-like) APIs
- **Authors:** Erik Wittern, Alan Cha, Jim A. Laredo
- **Year:** 2018
- **Source:** ICWE 2018 / arXiv:1809.08319
- **Key findings:**
  - Assesses feasibility of automatically generating GraphQL wrappers for existing REST APIs
  - Discusses challenges: data sanitation, authentication, handling nested queries
  - Prototype OASGraph generates GraphQL wrappers for 89.5% of APIs from OpenAPI spec
  - Missing/ambiguous information in OAS hinders complete wrapper generation
  - Small changes to OAS enable more idiomatic and expressive GraphQL wrappers
- **Relevance to our project:** Medium — the wrapper pattern (translating between API paradigms) is directly analogous to our MCP server wrapping LinkedIn's REST API. Lessons about handling authentication and nested queries apply.
- **URL:** https://arxiv.org/abs/1809.08319

### Paper: MCP-Bench: From Tool Orchestration to Code Execution — A Study of MCP Design Choices
- **Authors:** Yuval Felendler, Parth A. Gandhi, Idan Habler, Yuval Elovici, Asaf Shabtai
- **Year:** 2026
- **Source:** arXiv:2602.15945
- **Key findings:**
  - Formalizes distinction between context-coupled (traditional) and context-decoupled (Code Execution MCP) models
  - CE-MCP reduces token usage and execution latency but introduces expanded attack surface
  - Identifies 16 attack classes across 5 execution phases
  - Proposes layered defense architecture with containerized sandboxing and semantic gating
- **Relevance to our project:** Medium — informs whether our LinkedIn MCP server should adopt a simple tool-by-tool invocation model or a code-execution model for complex workflows (e.g., batch profile searches)
- **URL:** https://arxiv.org/abs/2602.15945

### Paper: Securing the Model Context Protocol (MCP): Risks, Controls, and Governance
- **Authors:** H. Errico, J. Ngiam, S. Sojan
- **Year:** 2025
- **Source:** arXiv:2511.20920
- **Key findings:**
  - MCP architecture comprises three primary components: host, client, and server
  - OAuth support only added to MCP specification in March 2025
  - Research by Knostic found over 1,800 MCP servers in public repositories
  - Identifies key security risks: server spoofing, prompt injection via tools, tool poisoning, data exfiltration
  - Governance recommendations for enterprise MCP deployments
- **Relevance to our project:** High — provides security and governance framework for MCP server deployment. The OAuth integration point (added March 2025) is directly relevant to LinkedIn's OAuth 2.0 authentication.
- **URL:** https://arxiv.org/abs/2511.20920

### Paper: MCPGuardian — A Security-First Layer for Safeguarding MCP-Based AI System
- **Authors:** S. Kumar, A. Girdhar, R. Patil, D. Tripathi
- **Year:** 2025
- **Source:** arXiv:2504.12757
- **Key findings:**
  - Signed Tools: requires cryptographic signatures for MCP servers
  - Only trusted signers can deploy tool endpoints
  - Mitigates supply-chain risks where attackers inject malicious tool endpoints
- **Relevance to our project:** Medium — signing and verification patterns can be applied to our LinkedIn MCP server distribution
- **URL:** https://arxiv.org/abs/2504.12757

### Paper: ToolRegistry — A Protocol-Agnostic Tool Management Library for Function-Calling LLMs
- **Authors:** Peng Ding, Rick Stevens
- **Year:** 2025
- **Source:** arXiv:2507.10593
- **Key findings:**
  - Every LLM tool call is structurally an RPC (function name, JSON arguments, serialized result)
  - ToolRegistry cuts integration code by 60-80% compared to native MCP/OpenAPI/LangChain
  - Choosing the right concurrency mode (thread vs. process) yields up to 3.1x throughput improvement
  - Provides tag-based permission policies and BM25F-powered progressive tool disclosure
- **Relevance to our project:** Medium — the RPC abstraction matches MCP's JSON-RPC model. Progressive tool disclosure pattern is useful for LinkedIn's large API surface.
- **URL:** https://arxiv.org/abs/2507.10593

### Paper: Solutions for Non-Web OAuth 2.0 Authorisation at CERN
- **Authors:** A. Aguado Corman, J. Henschel, H. Short, et al.
- **Year:** 2024
- **Source:** EPJ Web of Conferences (CHEP 2024)
- **Key findings:**
  - Developed a helper tool for CLI authentication using Device Authorization Grant
  - Device Authorization Grant is ideal for command-line and non-web environments
  - Practical implementation patterns for OAuth 2.0 in CLI tools without browser redirects
- **Relevance to our project:** High — the Device Authorization Grant pattern is precisely what we need for CLI-based MCP server authentication with LinkedIn. Users authenticate via a device code flow (open URL in browser, enter code) while the MCP server polls for the token.
- **URL:** https://www.epj-conferences.org/articles/epjconf/abs/2024/05/epjconf_chep2024_04038/epjconf_chep2024_04038.html

### Paper: Enhancing MCP with Context-Aware Server Collaboration (CA-MCP)
- **Authors:** Meenakshi Amulya Jayanti, X. Y. Han
- **Year:** 2026
- **Source:** arXiv:2601.11595
- **Key findings:**
  - Proposes Context-Aware MCP that offloads execution logic to specialized MCP servers
  - Shared Context Store (SCS) tracks intermediate states and shared variables
  - Reduces number of LLM calls required for complex tasks
  - Decreases frequency of response failures when task conditions are not satisfied
  - Tested on TravelPlanner and REALM-Bench datasets with statistically significant improvements
- **Relevance to our project:** Low-Medium — relevant if our LinkedIn MCP server needs to coordinate with other MCP servers (e.g., combining LinkedIn profile search with CRM data)
- **URL:** https://arxiv.org/abs/2601.11595

### Paper: Enterprise-Grade Security for the Model Context Protocol (MCP): Frameworks and Mitigation Strategies
- **Authors:** V. S. Narajala, I. Habler
- **Year:** 2026
- **Source:** IEEE Xplore (11395723)
- **Key findings:**
  - Rigorously validate all MCP messages against the official protocol specification
  - Rejecting invalid messages as a security boundary
  - Framework for enterprise MCP deployment security
- **Relevance to our project:** Medium — enterprise security patterns apply to production deployment of LinkedIn MCP server
- **URL:** https://ieeexplore.ieee.org/abstract/document/11395723/

### Paper: Auditing MCP Servers for Over-Privileged Tool Capabilities
- **Authors:** Charoes Huang, Xin Huang, Amin Milani Fard
- **Year:** 2026
- **Source:** arXiv:2603.21641
- **Key findings:**
  - MCP servers often expose privileged capabilities (file system, network requests, command execution)
  - Presents mcp-sec-audit toolkit with static pattern matching and dynamic sandboxed fuzzing
  - Configurable rule-based analysis with mitigation recommendations
- **Relevance to our project:** Low — our LinkedIn MCP server primarily makes external API calls, but the principle of auditing for over-privileged tools applies
- **URL:** https://arxiv.org/abs/2603.21641

### Paper: A Survey on Model Context Protocol: Architecture, State-of-the-Art, Challenges and Future Directions
- **Authors:** P. P. Ray
- **Year:** 2025
- **Source:** TechRxiv preprint
- **Key findings:**
  - Comprehensive survey on MCP architecture
  - MCP adheres to JSON-RPC 2.0 specification for predictable communication patterns
  - Covers MCP server development, deployment, and security considerations
- **Relevance to our project:** Medium — provides broad architectural context
- **URL:** https://www.techrxiv.org/doi/full/10.36227/techrxiv.174495492.22752319

### Paper: MCP at First Glance: Studying the Security and Maintainability of MCP Servers
- **Authors:** M. M. Hasan, H. Li, E. Fallahzadeh, et al.
- **Year:** 2025
- **Source:** ACM (10.1145/3814959)
- **Key findings:**
  - Empirical study of MCP servers' security and maintainability
  - Analyzes publicly deployed MCP servers for security concerns
  - Identifies maintainability challenges for MCP deployments
- **Relevance to our project:** Medium — provides empirical data on common MCP server issues to avoid
- **URL:** https://dl.acm.org/doi/abs/10.1145/3814959

### Paper: Building a Robust OAuth Token Based API Security: A High Level Overview
- **Authors:** Senthilkumar Gopal
- **Year:** 2025
- **Source:** arXiv:2507.16870
- **Key findings:**
  - Presents fundamentals for building token-based API security systems
  - Discusses integration of OAuth 2.0, token architectures, cryptographic foundations
  - Covers token lifecycle management, scope definition, expiration policies, revocation mechanisms
  - Emphasizes balancing practical considerations with security imperatives
- **Relevance to our project:** High — provides practical guidance for managing LinkedIn OAuth tokens (access+refresh tokens) in our MCP server
- **URL:** https://arxiv.org/abs/2507.16870

### Paper: Advancing Multi-Agent Systems Through Model Context Protocol: Architecture, Implementation, and Applications
- **Authors:** N. Krishnan
- **Year:** 2025
- **Source:** arXiv:2504.21030
- **Key findings:**
  - MCP provides open standard with clear specifications and reference implementations
  - Architecture for multi-agent coordination via MCP
- **Relevance to our project:** Low-Medium — broad MCP architecture survey
- **URL:** https://arxiv.org/abs/2504.21030

### Paper: The New Interoperability Paradigm: MCP, APIs, and the Future of Agentic AI
- **Authors:** Padmanabham Venkiteela
- **Year:** 2025
- **Source:** ResearchGate
- **Key findings:**
  - MCP architecture must support dynamic schema alignment between MCP's ContextSchema and traditional API specifications
  - Technical analysis through architectural modeling
- **Relevance to our project:** Medium — schema alignment between MCP tools and LinkedIn REST API endpoints is a core design challenge
- **URL:** https://www.researchgate.net/publication/397992751

### Paper: User Profile Integration Made Easy: Model-Driven Extraction and Transformation of Social Network Schemas
- **Authors:** M. Wischenbart, S. Mitsch, E. Kapsammer, et al.
- **Year:** 2012
- **Source:** ACM (10.1145/2187980.2188227)
- **Key findings:**
  - Analyzes major social networks (including LinkedIn) to determine completeness of API documentation
  - Model-driven approach for extracting and transforming social network data schemas
- **Relevance to our project:** Medium — provides insight into LinkedIn's data schema and API patterns, though 2012 data is dated
- **URL:** https://dl.acm.org/doi/abs/10.1145/2187980.2188227

### Paper: An Analysis of Social Network Connect Services
- **Authors:** A. Tapiador, V. Sánchez, J. Salvachúa
- **Year:** 2012
- **Source:** arXiv:1207.5545
- **Key findings:**
  - Analyzes social network API authentication across LinkedIn, Twitter, Facebook, Myspace
  - LinkedIn claimed to use OAuth 2.0 in their JavaScript API (as of 2012)
  - Social network APIs versioned between OAuth 1.0a and OAuth 2.0
- **Relevance to our project:** Low-Medium — historical context of LinkedIn API authentication evolution
- **URL:** https://arxiv.org/abs/1207.5545

---

## Standards Referenced

### Standard: Model Context Protocol (MCP) Specification
- **Organization:** Anthropic
- **Version:** MCP 2024-11 (initial), updated March 2025 with OAuth support
- **Key points:**
  - JSON-RPC 2.0 based protocol for LLM-tool integration
  - Core primitives: Resources, Tools, Prompts, Sampling
  - Client-server architecture with stdio and SSE transports
  - OAuth 2.0 support added March 2025
  - 10,000+ active servers, 97M+ monthly SDK downloads (as of early 2026)
  - Over 500 MCP clients across development platforms
- **Relevance:** Core standard our LinkedIn MCP server must implement
- **URL:** https://spec.modelcontextprotocol.io/

### Standard: OAuth 2.0 Authorization Framework (RFC 6749)
- **Organization:** IETF
- **Key points:**
  - Industry-standard protocol for authorization across web, mobile, and CLI applications
  - Four grant types: Authorization Code, Implicit, Resource Owner Password Credentials, Client Credentials
  - **Device Authorization Grant (RFC 8628)**: specifically designed for CLI and browserless environments
  - Token-based access with optional refresh tokens
  - Scope-based permission granularity (read, write, etc.)
- **Relevance:** Our LinkedIn MCP server requires OAuth 2.0 for LinkedIn API authentication. Device Authorization Grant (RFC 8628) is the recommended flow for CLI tools.
- **URL:** https://datatracker.ietf.org/doc/html/rfc6749

### Standard: OpenID Connect (OIDC)
- **Organization:** OpenID Foundation
- **Key points:**
  - Authentication layer built on top of OAuth 2.0
  - Adds identity verification via ID Tokens (JWT)
  - LinkedIn supports OpenID Connect for Sign In with LinkedIn
- **Relevance:** May be needed if our MCP server handles LinkedIn authentication/identity verification in addition to API access
- **URL:** https://openid.net/connect/

### Standard: JSON-RPC 2.0
- **Organization:** JSON-RPC Working Group
- **Key points:**
  - Lightweight remote procedure call protocol
  - Transport-agnostic (works over stdio, HTTP, WebSocket)
  - Request/response model with notification support
  - MCP uses JSON-RPC 2.0 as its wire protocol
- **Relevance:** Foundational protocol that MCP is built upon
- **URL:** https://www.jsonrpc.org/specification

### Standard: OpenAPI Specification (OAS)
- **Organization:** Linux Foundation / OpenAPI Initiative
- **Key points:**
  - Standard for describing REST APIs in a machine-readable format
  - Can be used to auto-generate API wrappers, client SDKs, and documentation
  - LinkedIn publishes OpenAPI specs for many of its API endpoints
- **Relevance:** LinkedIn's REST API can be described via OpenAPI, which could automate parts of our MCP server generation
- **URL:** https://spec.openapis.org/oas/latest.html

---

## Key Academic Insights Summary

### 1. MCP Protocol Architecture
- MCP uses **JSON-RPC 2.0** for transport, supporting `tools/list`, `tools/call`, `resources/read`, and `prompts/get` primitives
- **Five architectural patterns** for MCP servers identified (Rodrigues & Vas, 2026): Resource Gateway, Tool Orchestrator, Stateful Session Server, Proxy Aggregator, Domain-Specific Adapter
- Our LinkedIn MCP server maps to the **Proxy Aggregator** pattern (wrapping LinkedIn REST API into MCP tools)
- **97.1% of MCP server tool descriptions contain at least one "smell"** — critical finding for our tool documentation quality

### 2. OAuth 2.0 for CLI/AI Agents
- **Device Authorization Grant (RFC 8628)** is the recommended OAuth flow for CLI tools and non-browser applications
- OAuth support was only added to MCP specification in **March 2025** (Errico et al., 2025)
- ETDI (Bhatt et al., 2025) proposes OAuth-enhanced tool definitions for MCP security
- CERN case study (2024) provides practical implementation patterns for CLI OAuth auth with Device Code flow
- OAuth 2.0 has known vulnerability classes (Fett et al., 2016) that must be mitigated

### 3. API Wrapper Design
- The **GraphQL-wrapper pattern** (Wittern et al., 2018) is directly analogous to MCP wrapper: translate between API paradigms
- Challenges include: data sanitation, authentication propagation, handling nested queries
- OpenAPI specs can automate up to 89.5% of wrapper generation
- ToolRegistry (Ding & Stevens, 2025) shows **60-80% integration code reduction** by treating all tool calls as RPC

### 4. API Rate Limiting
- Limited academic literature specifically on social network API rate limiting
- Token Bucket (RFC-based): classic algorithm for traffic shaping
- Sliding Window algorithms: more space-efficient for high-throughput scenarios (Epasto et al., 2021)
- LinkedIn API uses a **rolling 10-minute window** with per-application and per-user quotas
- Token Bucket with **burst capacity** and **refill rate** is the recommended pattern for MCP server rate limit handling

### 5. Security Considerations
- MCP servers face unique threats: tool poisoning, tool squatting, rug pull attacks (Bhatt et al., 2025)
- **Identity propagation** is missing from core MCP spec (Srinivasan, 2026)
- **12 protocol-level risks** identified across MCP lifecycle (Anbiaee et al., 2026)
- **Taint-style vulnerabilities** constitute a substantial fraction of MCP server security issues (Shi et al., 2026)
- Signed tools and cryptographic verification recommended for MCP server distribution

---

## Sources

1. https://arxiv.org/abs/2505.02279 — Ehtesham et al., 2025 — Survey of Agent Interoperability Protocols
2. https://arxiv.org/abs/2606.30317 — Rodrigues & Vas, 2026 — MCP Server Architecture Patterns
3. https://arxiv.org/abs/2603.13417 — Srinivasan, 2026 — Bridging Protocol and Production
4. https://arxiv.org/abs/2508.14704 — Luo et al., 2025 — MCP-Universe Benchmark
5. https://arxiv.org/abs/2602.14878 — Hasan et al., 2026 — MCP Tool Descriptions Are Smelly
6. https://arxiv.org/abs/2602.11327 — Anbiaee et al., 2026 — Security Threat Modeling for AI-Agent Protocols
7. https://arxiv.org/abs/2506.01333 — Bhatt et al., 2025 — ETDI: OAuth-Enhanced Tool Definitions for MCP
8. https://arxiv.org/abs/2604.04820 — Xu, 2026 — ANX Protocol-First Design
9. https://arxiv.org/abs/1601.01229 — Fett et al., 2016 — Comprehensive Formal Security Analysis of OAuth 2.0
10. https://arxiv.org/abs/1808.10624 — Dodanduwa & Kaluthanthri, 2018 — Role of Trust in OAuth 2.0
11. https://arxiv.org/abs/1809.08319 — Wittern et al., 2018 — Generating GraphQL-Wrappers for REST APIs
12. https://arxiv.org/abs/2602.15945 — Felendler et al., 2026 — MCP Design Choices
13. https://arxiv.org/abs/2511.20920 — Errico et al., 2025 — Securing MCP: Risks, Controls, and Governance
14. https://arxiv.org/abs/2504.12757 — Kumar et al., 2025 — MCPGuardian
15. https://arxiv.org/abs/2507.10593 — Ding & Stevens, 2025 — ToolRegistry
16. https://www.epj-conferences.org/articles/epjconf/abs/2024/05/epjconf_chep2024_04038/epjconf_chep2024_04038.html — CERN CLI OAuth Device Authorization Grant, 2024
17. https://arxiv.org/abs/2601.11595 — Jayanti & Han, 2026 — CA-MCP
18. https://arxiv.org/abs/2507.16870 — Gopal, 2025 — OAuth Token Based API Security
19. https://arxiv.org/abs/2603.21641 — Huang et al., 2026 — Auditing MCP Servers
20. https://www.techrxiv.org/doi/full/10.36227/techrxiv.174495492.22752319 — Ray, 2025 — Survey on MCP
21. https://dl.acm.org/doi/abs/10.1145/3814959 — Hasan et al., 2025 — MCP at First Glance
22. https://arxiv.org/abs/2504.21030 — Krishnan, 2025 — Multi-Agent Systems Through MCP
23. https://arxiv.org/abs/1207.5545 — Tapiador et al., 2012 — Analysis of Social Network Connect Services
24. https://arxiv.org/abs/2606.07461 — Shi et al., 2026 — Taint-Style Vulnerabilities in MCP Servers
25. https://spec.modelcontextprotocol.io/ — MCP Specification
26. https://datatracker.ietf.org/doc/html/rfc6749 — OAuth 2.0 Authorization Framework
27. https://datatracker.ietf.org/doc/html/rfc8628 — OAuth 2.0 Device Authorization Grant
28. https://www.jsonrpc.org/specification — JSON-RPC 2.0 Specification
