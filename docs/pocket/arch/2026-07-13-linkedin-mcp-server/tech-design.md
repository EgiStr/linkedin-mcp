# Technical Design Document: LinkedIn MCP Server

**Date:** 2026-07-13
**Status:** Approved
**Version:** 1.0.0
**License:** MIT
**Project:** linkedin-mcp-server

---

## Table of Contents

1. [Component Architecture](#1-component-architecture)
2. [Module Structure](#2-module-structure)
3. [API Contracts](#3-api-contracts)
4. [Data Flow](#4-data-flow)
5. [ADRs — Architecture Decision Records](#5-adrs--architecture-decision-records)
6. [Security Considerations](#6-security-considerations)
7. [Testing Strategy](#7-testing-strategy)
8. [Future Roadmap](#8-future-roadmap)

---

## 1. Component Architecture

### 1.1 Bounded Contexts

The system is divided into four bounded contexts, each with clear responsibilities and minimal cross-context coupling:

```
┌──────────────────────────────────────────────────────────────────┐
│                    LINKEDIN MCP SERVER                           │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │                  │  │                  │  │                │ │
│  │   MCP Tool Layer │─▶│ LinkedIn Service │─▶│   Auth Module  │ │
│  │                  │  │     Layer        │  │                │ │
│  │  • Tool registry │  │                  │  │  • PKCE OAuth  │ │
│  │  • Zod validate  │  │  • API client    │  │  • Config mgmt │ │
│  │  • Format resp   │  │  • Rate limiting │  │  • Token store │ │
│  │  • Error map     │  │  • Retry logic   │  │                │ │
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬────────┘ │
│           │                     │                     │          │
│           │                     ▼                     │          │
│           │          ┌──────────────────┐             │          │
│           │          │    Media Upload  │             │          │
│           └──────────│     Pipeline     │─────────────┘          │
│                      │                  │                        │
│                      │  • Init upload   │                        │
│                      │  • Binary upload │                        │
│                      │  • URN attach    │                        │
│                      └──────────────────┘                        │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Context Responsibilities

#### 1.2.1 MCP Tool Layer

**Responsibility:** Interface between MCP clients (AI agents) and internal services.

**Components:**
- **Tool Registry** (`src/index.ts`): Registers all tools with `McpServer.registerTool()`. Provides tool name, title, description, input schema, and annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`).
- **Input Validation**: Each tool has a Zod schema defined with `.strict()` — rejects unknown parameters at runtime.
- **Response Formatting**: Every tool supports dual output — `markdown` (human-readable) and `json` (machine-readable). The `response_format` parameter is universal across all tools.
- **Error Mapping**: Catches errors from the service layer, classifies them via `LinkedInClient.getStructuredError()`, and formats the response with `isError: true` and structured content.

**Key design decisions:**
- Tool factories (`createProfileTools`, `createPostsTools`, `createNetworkTools`) return `ToolEntry` objects encapsulating both schema and handler — avoids class coupling.
- Each tool handler has a consistent try/catch → format pattern. No silent error swallowing.
- All tools share the `response_format` parameter. Extracted as a `ResponseFormat` enum in `types.ts`.
- Tool annotations are set per-tool to enable MCP clients to display UI cues (e.g., confirmation dialogs for destructive actions).

**File ownership:**
| Tool | File | Handler Factory |
|---|---|---|
| `linkedin_get_user_info` | `src/tools/profile.ts` | `createProfileTools().getUserInfo` |
| `linkedin_get_my_profile` | `src/tools/profile.ts` | `createProfileTools().getMyProfile` |
| `linkedin_create_post` | `src/tools/posts.ts` | `createPostsTools().createPost` |
| `linkedin_list_posts` | `src/tools/posts.ts` | `createPostsTools().listPosts` |
| `linkedin_delete_post` | `src/tools/posts.ts` | `createPostsTools().deletePost` |
| `linkedin_get_feed` | `src/tools/network.ts` | `createNetworkTools().getFeed` |
| `linkedin_get_connections` | `src/tools/network.ts` | `createNetworkTools().getConnections` |
| `linkedin_send_message` | `src/tools/network.ts` | `createNetworkTools().sendMessage` |
| `linkedin_search_people` | `src/tools/network.ts` | `createNetworkTools().searchPeople` |
| `linkedin_oauth_login` | `src/tools/auth.ts` *(planned)* | `createAuthTools().oauthLogin` |
| `linkedin_upload_media` | `src/tools/media.ts` *(planned)* | `createMediaTools().uploadMedia` |

#### 1.2.2 LinkedIn Service Layer

**Responsibility:** Encapsulates all LinkedIn API communication, error classification, and client lifecycle.

**Components:**

```
┌─────────────────────────────────────────────────────────────┐
│                    LinkedInClient                            │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  Axios Instance                       │   │
│  │  • baseURL: https://api.linkedin.com                  │   │
│  │  • timeout: 30000ms                                   │   │
│  │  • headers: Authorization, Content-Type               │   │
│  │  • LinkedIn-Version: configurable per request          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │  Auth   │ │ Profile  │ │  Posts   │ │  Network      │  │
│  │ Methods │ │ Methods  │ │ Methods  │ │  Methods      │  │
│  ├─────────┤ ├──────────┤ ├──────────┤ ├───────────────┤  │
│  │getUser  │ │getMyPro  │ │createPost│ │getFeed        │  │
│  │ Info()  │ │ file()   │ │          │ │               │  │
│  │getMember│ │getFull   │ │getUser   │ │getConnections  │  │
│  │ Id()    │ │Profile() │ │Posts()   │ │               │  │
│  │         │ │          │ │delete    │ │searchPeople   │  │
│  │         │ │          │ │Post()    │ │               │  │
│  │         │ │          │ │          │ │sendMessage    │  │
│  └─────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Error Classification                     │   │
│  │                                                       │   │
│  │  classifyError(status, data) → StructuredError        │   │
│  │  getStructuredError(error) → StructuredError          │   │
│  │  formatError(error) → string (legacy)                 │   │
│  │  isRetryable(code) → boolean                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Methods implemented (12+):**

| # | Method | Endpoint | Scope | Auth Req |
|---|---|---|---|---|
| 1 | `getUserInfo()` | `GET /v2/userinfo` | `openid` | Token |
| 2 | `getMemberId()` | via `getUserInfo().sub` | `openid` | Token |
| 3 | `getMyProfile()` | `GET /v2/me` | `r_liteprofile` | Token |
| 4 | `getFullProfile()` | Combines 1+3 | — | Token |
| 5 | `createPost()` | `POST /rest/posts` | `w_member_social` | Token |
| 6 | `getUserPosts()` | `GET /v2/shares` + fallback | `r_member_social` | Token |
| 7 | `deletePost()` | `DELETE /rest/posts/{id}` | `w_member_social` | Token |
| 8 | `getFeed()` | `GET /v2/activities` | `r_member_social` | Token |
| 9 | `getConnections()` | `GET /v2/connections/{id}` | Partner | Token |
| 10 | `searchPeople()` | *(not available)* | Partner | Token |
| 11 | `sendMessage()` | *(not available)* | Partner | Token |
| 12 | `getOrganizations()` | `GET /v2/organizationalEntityAcls` | `r_organization_social` | Token |
| 13 | `getTokenLifetime()` | *(local JWT decode)* | — | Token |
| 14 | `isTokenExpired()` | *(local JWT decode)* | — | Token |

**Design decisions:**
- **Thin client pattern**: `LinkedInClient` is a plain class, not a singleton. The tool layer instantiates it once in `index.ts`.
- **Auth state**: Token is stored in-memory. Token persistence is the auth module's responsibility, not the client's.
- **Retry**: Currently no automatic retry. The `retryable` field on `StructuredError` enables the caller (or future middleware) to decide.
- **Pagination heuristic**: LinkedIn's `paging.total` is often absent or inaccurate. The `hasMoreElements()` helper uses a heuristic: if the count of returned elements ≥ the requested count, assume more exist.

#### 1.2.3 Auth Module

**Responsibility:** Complete OAuth 2.0 Authorization Code + PKCE flow, configuration management, token persistence, and auth lifecycle.

**Components:**

```
┌─────────────────────────────────────────────────────┐
│                   Auth Module                        │
│                                                      │
│  ┌──────────────────┐  ┌─────────────────────────┐  │
│  │   Config Module   │  │      OAuth Module       │  │
│  │   (config.ts)     │  │      (oauth.ts)         │  │
│  │                   │  │                         │  │
│  │  • readConfig()   │  │  • generatePKCE()       │  │
│  │  • writeConfig()  │  │  • buildAuthUrl()       │  │
│  │  • getConfigPath()│  │  • exchangeCode()       │  │
│  │  • configPath()   │  │  • refreshToken()       │  │
│  └────────┬──────────┘  └───────────┬─────────────┘  │
│           │                          │                │
│           ▼                          ▼                │
│  ┌─────────────────────────────────────────────┐      │
│  │              Token Store                     │      │
│  │            (token-store.ts)                  │      │
│  │                                               │      │
│  │  • loadToken() → from config file             │      │
│  │  • saveToken() → to config file               │      │
│  │  • getAccessToken() → env var → config file   │      │
│  │  • clearToken() → remove from config          │      │
│  └─────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────┘
```

**Auth resolution order (fallback chain):**

```
┌───────────────────────────────────────────────────────────┐
│                  getAccessToken()                          │
│                                                           │
│  1. Check LINKEDIN_ACCESS_TOKEN env var                   │
│     → If set, use it (highest priority)                   │
│                                                           │
│  2. Check config file (~/.config/linkedin-mcp/config.json)│
│     → If exists and not expired, use it                   │
│                                                           │
│  3. Check LINKEDIN_CLIENT_ID + LINKEDIN_CLIENT_SECRET     │
│     → If set, trigger OAuth PKCE flow                     │
│                                                           │
│  4. None available → Error: "No authentication found"     │
└───────────────────────────────────────────────────────────┘
```

**PKCE OAuth Flow:**

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│   User   │     │  MCP Server  │     │ Auth Module  │     │  LinkedIn OAuth  │
│ (Agent)  │     │ (index.ts)   │     │ (oauth.ts)   │     │     Server       │
└────┬─────┘     └──────┬───────┘     └──────┬───────┘     └────────┬─────────┘
     │                  │                     │                      │
     │ linkedin_oauth    │                     │                      │
     │ _login            │                     │                      │
     │─────────────────>│                     │                      │
     │                  │ generatePKCE()       │                      │
     │                  │─────────────────────>│                      │
     │                  │  code_verifier       │                      │
     │                  │  code_challenge      │                      │
     │                  │<─────────────────────│                      │
     │                  │                     │                      │
     │                  │ buildAuthUrl()      │                      │
     │                  │─────────────────────>│                      │
     │                  │  authorize_url       │                      │
     │                  │<─────────────────────│                      │
     │                  │                     │                      │
     │  Open browser    │                     │                      │
     │  to authorize_   │                     │                      │
     │  url             │                     │                      │
     │<═════════════════│                     │                      │
     │                  │                     │                      │
     │  User approves   │                     │                      │
     │─────────────────────────────────────────────────────────────>│
     │                  │                     │                      │
     │                  │  302 → localhost    │                      │
     │                  │  callback?code=X    │                      │
     │                  │<───────────────────────────────────────────│
     │                  │                     │                      │
     │                  │ exchangeCode(code,  │                      │
     │                  │   verifier)         │                      │
     │                  │─────────────────────>│                      │
     │                  │                     │ POST /access_token   │
     │                  │                     │─────────────────────>│
     │                  │                     │                      │
     │                  │                     │ access_token         │
     │                  │                     │ refresh_token        │
     │                  │                     │ expires_in           │
     │                  │                     │<─────────────────────│
     │                  │                     │                      │
     │                  │ saveToken(token)    │                      │
     │                  │ token-store.ts      │                      │
     │                  │                     │                      │
     │  Auth success    │                     │                      │
     │<─────────────────│                     │                      │
```

#### 1.2.4 Media Upload Pipeline

**Responsibility:** Three-step media upload process as required by the LinkedIn REST API.

**Flow:**

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│   Step 1     │     │   Step 2     │     │   Step 3     │     │  Step 4     │
│  Initialize  │     │ Binary Upload│     │  Get URN     │     │ Attach to   │
│              │     │              │     │              │     │ Post        │
│ POST /rest/   │     │ PUT uploadUrl│     │ GET /rest/   │     │ POST /rest/ │
│ images?      │     │              │     │ images/{id}  │     │ posts       │
│ action=      │────>│ Binary data  │────>│              │────>│             │
│ initialize   │     │ Content-Type:│     │ Returns      │     │ media.id =  │
│ Upload       │     │ image/...    │     │ image URN    │     │ image URN   │
│              │     │              │     │              │     │             │
│ Returns:     │     │ Returns:     │     │ Returns:     │     │ Returns:    │
│ • uploadUrl  │     │ • 201 Created│     │ • image URN  │     │ • post ID   │
│ • image URN  │     │              │     │              │     │ • post URN  │
└──────────────┘     └──────────────┘     └──────────────┘     └─────────────┘
```

**Implementation details:**
- **Step 1 (Init):** `POST /rest/images?action=initializeUpload` with `{ "initializeUploadRequest": { "owner": "urn:li:person:{memberId}" } }`. Returns `uploadUrl` and `image`.
- **Step 2 (Binary):** Raw `PUT` to the `uploadUrl` with `Content-Type: image/jpeg` or `image/png`. Body is binary.
- **Step 3 (Confirm):** `GET /rest/images/{imageId}` to confirm and retrieve the final image URN (`urn:li:image:{id}`).
- **Step 4 (Attach):** Pass image URN as `media.id` in `createPost()`.

**File size limits:**
- Max image size: 10MB (LinkedIn limit)
- Supported formats: JPEG, PNG, GIF (static only)
- Max dimensions: 2048×2048px (recommended)

---

## 2. Module Structure

### 2.1 Directory Layout

```
linkedin-mcp-server/
│
├── src/
│   ├── index.ts                    # Entry point: server init, tool registration, health check
│   ├── types.ts                    # Shared types/enums (ResponseFormat, ToolEntry)
│   │
│   ├── services/
│   │   └── linkedin-client.ts      # LinkedIn API client: 14+ methods, error classification,
│   │                                 retry detection, token inspection, pagination helpers
│   │
│   ├── tools/
│   │   ├── profile.ts              # Profile tools: getMyProfile, getUserInfo
│   │   ├── posts.ts                # Post tools: createPost, listPosts, deletePost
│   │   ├── network.ts              # Network tools: getFeed, getConnections, sendMessage, searchPeople
│   │   ├── auth.ts                 # Auth tools: oauthLogin, oauthCallback, authStatus
│   │   └── media.ts                # Media tools: uploadMedia
│   │
│   ├── auth/
│   │   ├── oauth.ts                # PKCE OAuth 2.0 flow: code challenge, auth URL, token exchange
│   │   ├── config.ts               # Config file management: read/write/validate config
│   │   └── token-store.ts          # Token persistence: load/save/clear tokens, env var fallback
│   │
│   └── media/
│       └── uploader.ts             # 3-step media upload: init, binary upload, URN attachment
│
├── tests/
│   ├── unit/
│   │   ├── linkedin-client.test.ts # Client mock tests (nock)
│   │   ├── profile.test.ts         # Profile tool tests
│   │   ├── posts.test.ts           # Post tool tests
│   │   ├── network.test.ts         # Network tool tests
│   │   ├── oauth.test.ts           # OAuth flow tests
│   │   └── uploader.test.ts        # Media upload tests
│   ├── integration/
│   │   └── e2e.test.ts            # End-to-end flow test (optional, manual)
│   └── helpers/
│       └── fixtures.ts            # Test fixtures: mock responses, tokens
│
├── docs/
│   └── pocket/
│       ├── arch/
│       │   └── 2026-07-13-linkedin-mcp-server/
│       │       └── tech-design.md          # This document
│       └── spec/
│           └── 2026-07-13-linkedin-mcp-server/
│               └── research-spec.md        # Research specification
│
├── scripts/
│   ├── init-config.ts              # One-time setup: create config, run OAuth
│   └── setup.ts                    # Development setup helper
│
├── .env.example                    # Environment variable template
├── .gitignore
├── .github/
│   └── workflows/
│       └── ci.yml                  # CI pipeline: test, build, lint
├── package.json
├── tsconfig.json
├── LICENSE
├── CONTRIBUTING.md
└── README.md
```

### 2.2 Module Dependency Graph

```
                        ┌─────────────┐
                        │  index.ts   │
                        └──────┬──────┘
                               │
              ┌────────────────┼─────────────────┐
              │                │                  │
              ▼                ▼                  ▼
       ┌───────────┐   ┌────────────┐    ┌──────────────┐
       │ tools/    │   │ auth/      │    │ media/       │
       │ *.ts      │──▶│ oauth.ts   │───▶│ uploader.ts  │
       └─────┬─────┘   │ config.ts  │    └──────┬───────┘
             │         │token-store │           │
             │         └──────┬─────┘           │
             │                │                  │
             └────────────────┼──────────────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │  services/     │
                     │linkedin-client │
                     │     .ts        │
                     └────────┬───────┘
                              │
                              ▼
                     ┌────────────────┐
                     │  LinkedIn API  │
                     │  (external)    │
                     └────────────────┘
```

### 2.3 Interface Boundaries

```
// ─── src/types.ts ───

enum ResponseFormat { MARKDOWN = "markdown", JSON = "json" }

interface ToolEntry<T = unknown> {
  schema: z.ZodTypeAny;
  handler: (params: T) => Promise<{
    content: Array<{ type: "text"; text: string }>;
    isError?: boolean;
  }>;
}
```

The `ToolEntry` interface is the contract between tool factories and the registry in `index.ts`. Each factory returns an object whose keys are `ToolEntry` values.

The `LinkedInClient` is the contract between tools and the service layer. It is injected via constructor parameter — no global state, no singletons.

The auth module exports an `AuthConfig` interface that other modules read but do not write:

```
interface AuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  tokenPath: string;
}
```

---

## 3. API Contracts

### 3.1 Tool: `linkedin_get_user_info`

**Zod Schema:**
```typescript
const GetUserInfoSchema = z.object({
  response_format: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN)
    .describe("Output format: 'markdown' or 'json'"),
}).strict();
```

**Response — LinkedInUserInfo:**
```typescript
interface LinkedInUserInfo {
  sub: string;                // Unique member ID for the app
  name?: string;              // Full display name
  given_name?: string;        // First name
  family_name?: string;       // Last name
  email?: string;             // Email address (requires email scope)
  email_verified?: boolean;   // Whether email is verified
  picture?: string;           // Profile picture URL
  locale?: string;            // Locale (e.g., "en_US")
}
```

**Error codes:** `TOKEN_INVALID`, `TOKEN_EXPIRED`, `NETWORK_ERROR`, `TIMEOUT`

### 3.2 Tool: `linkedin_get_my_profile`

**Zod Schema:**
```typescript
const GetMyProfileSchema = z.object({
  response_format: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN)
    .describe("Output format: 'markdown' or 'json'"),
}).strict();
```

**Response — LinkedInProfile:**
```typescript
interface LinkedInProfile {
  id: string;                         // LinkedIn member ID
  localizedFirstName?: string;        // First name
  localizedLastName?: string;         // Last name
  profilePicture?: {                  // Profile picture object
    displayImage?: string;
    "displayImage~"?: {
      elements?: Array<{
        identifiers?: Array<{ identifier: string }>;
      }>;
    };
  };
  vanityName?: string;                // Custom URL identifier
  headline?: string;                  // Professional headline
}
```

**Tool output (normalized):** The tool handler merges profile + userInfo into a flat output:
```typescript
{
  id: string,            // LinkedIn member ID
  firstName: string,     // First name
  lastName: string,      // Last name
  fullName: string,      // Full display name
  headline: string|null, // Professional headline
  vanityName: string|null, // Custom URL
  profileUrl: string|null, // Full LinkedIn URL
  email: string|null,    // Email address
  pictureUrl: string|null, // Profile picture
  locale: string|null,   // Locale
}
```

**Requires scope:** `openid` + `profile` (or `r_liteprofile` on older apps)

### 3.3 Tool: `linkedin_create_post`

**Zod Schema:**
```typescript
const CreatePostSchema = z.object({
  text: z.string().min(1).max(3000)
    .describe("The text content of the LinkedIn post"),
  visibility: z.enum(["PUBLIC", "CONNECTIONS", "LOGGED_IN"]).default("PUBLIC")
    .describe("Post visibility setting"),
  media_url: z.string().url().optional()
    .describe("Optional image URL to attach to the post"),
  response_format: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN),
}).strict();
```

**Response — PostResult:**
```typescript
interface PostResult {
  postId: string;              // Post ID (extracted from URN)
  urn: string;                 // Full LinkedIn URN (e.g., "urn:li:share:abc123")
  text: string;                // First 100 chars of post text (preview)
  visibility: "PUBLIC" | "CONNECTIONS" | "LOGGED_IN";
  status: "PUBLISHED";         // Always "PUBLISHED"
  url: string;                 // Direct link: https://www.linkedin.com/feed/update/{urn}
}
```

**Error codes:** `TOKEN_INVALID`, `TOKEN_EXPIRED`, `SCOPE_MISSING`, `RATE_LIMITED`, `NETWORK_ERROR`

### 3.4 Tool: `linkedin_list_posts`

**Zod Schema:**
```typescript
const ListPostsSchema = z.object({
  member_id: z.string().optional()
    .describe("LinkedIn member ID to fetch posts for (defaults to authenticated user)"),
  start: z.number().int().min(0).default(0)
    .describe("Start index for pagination"),
  count: z.number().int().min(1).max(50).default(10)
    .describe("Number of posts to return"),
  response_format: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN),
}).strict();
```

**Response — PaginatedPosts:**
```typescript
interface PaginatedPosts {
  total: number;              // Total posts (may be unreliable per LinkedIn API)
  count: number;              // Posts in this response
  start: number;              // Current offset
  has_more: boolean;          // Whether more pages exist
  next_offset?: number;       // Offset for next page (if has_more)
  posts: Array<{
    id: string;               // Post ID
    text: string;             // Post commentary/text
    author: string;           // Author URN
    created: string|null;     // Human-readable date
    created_timestamp: number|null; // Unix timestamp ms
    visibility: string|null;  // Visibility setting
    url: string;              // Direct link to post
  }>;
}
```

**Pagination strategy:**
- LinkedIn's `paging.total` is often absent or inaccurate.
- The `hasMoreElements()` heuristic: if returned elements ≥ requested count, assume more exist.
- `next_offset` = current `start` + returned count (if `has_more`).

### 3.5 Tool: `linkedin_delete_post`

**Zod Schema:**
```typescript
const DeletePostSchema = z.object({
  post_id: z.string().min(1)
    .describe("Post ID or URN to delete (e.g., 'post-123' or 'urn:li:share:post-123')"),
  response_format: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN),
}).strict();
```

**Response — DeleteResult:**
```typescript
interface DeleteResult {
  postId: string;              // The ID that was deleted
  status: "DELETED";           // Always "DELETED"
  note: string;                // "This action cannot be undone."
}
```

### 3.6 Tool: `linkedin_get_feed`

**Zod Schema:**
```typescript
const GetFeedSchema = z.object({
  start: z.number().int().min(0).default(0),
  count: z.number().int().min(1).max(50).default(10),
  response_format: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN),
}).strict();
```

**Response — FeedResult:**
```typescript
interface FeedResult {
  total: number;               // Total items
  count: number;               // Items in this response
  start: number;               // Current offset
  has_more: boolean;           // Whether more pages exist
  items: Array<{
    id: string;                // Activity URN
    actor: string|null;        // Actor URN
    time: string|null;         // Human-readable timestamp
    timestamp: number|null;    // Unix timestamp ms
    content: string|null;      // Content preview (first 500 chars)
  }>;
}
```

**Note:** LinkedIn's public API has limited feed access. Falls back to user posts if `/v2/activities` is unavailable.

### 3.7 Tool: `linkedin_get_connections`

**Zod Schema:**
```typescript
const GetConnectionsSchema = z.object({
  start: z.number().int().min(0).default(0),
  count: z.number().int().min(1).max(50).default(10),
  response_format: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN),
}).strict();
```

**Behavior:** Returns `PARTNER_API_REQUIRED` error for standard OAuth apps. LinkedIn's Connections API requires Partner Program access.

### 3.8 Tool: `linkedin_send_message`

**Zod Schema:**
```typescript
const SendMessageSchema = z.object({
  recipient_id: z.string().min(1).describe("LinkedIn member ID of recipient"),
  text: z.string().min(1).max(2000).describe("Message text content"),
  response_format: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN),
}).strict();
```

**Behavior:** Currently a partner API stub. Returns `DIRECT_MESSAGING_NOT_AVAILABLE` error.

### 3.9 Tool: `linkedin_search_people`

**Zod Schema:**
```typescript
const SearchPeopleSchema = z.object({
  keywords: z.string().min(1).describe("Search keywords (name, title, company)"),
  start: z.number().int().min(0).default(0),
  count: z.number().int().min(1).max(50).default(10),
  response_format: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN),
}).strict();
```

**Behavior:** Partner API stub. Returns `PEOPLE_SEARCH_NOT_AVAILABLE` error.

### 3.10 Tool: `linkedin_oauth_login` (Planned)

**Zod Schema:**
```typescript
const OAuthLoginSchema = z.object({
  open_browser: z.boolean().default(true)
    .describe("Automatically open browser for authorization"),
  response_format: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN),
}).strict();
```

**Response — AuthResult:**
```typescript
interface AuthResult {
  status: "AUTHORIZED" | "PENDING" | "FAILED";
  message: string;              // Human-readable status
  expires_at?: string;          // Token expiration date
  scopes?: string[];            // Granted scopes
  profile_name?: string;        // Name of authenticated user
}
```

### 3.11 Tool: `linkedin_upload_media` (Planned)

**Zod Schema:**
```typescript
const UploadMediaSchema = z.object({
  file_path: z.string()
    .describe("Absolute path to image file (JPEG, PNG, GIF)"),
  alt_text: z.string().max(100).optional()
    .describe("Accessible description of the image"),
  response_format: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN),
}).strict();
```

**Response — MediaResult:**
```typescript
interface MediaResult {
  imageUrn: string;            // URN for use in createPost
  imageId: string;             // Image ID
  width: number;               // Image width
  height: number;              // Image height
  fileSize: number;            // File size in bytes
}
```

---

## 4. Data Flow

### 4.1 Auth Flow: Token Resolution Chain

```
                    ┌──────────────────────────┐
                    │    Server Startup         │
                    │    (src/index.ts)         │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │  getAccessToken() fallback│
                    │  chain in token-store.ts  │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
    ┌─────────────────┐  ┌───────────────┐  ┌──────────────┐
    │ LINKEDIN_ACCESS │  │ ~/.config/    │  │ OAuth PKCE   │
    │ _TOKEN env var  │  │ linkedin-mcp/ │  │ flow (if     │
    │                 │  │ config.json   │  │ Client ID    │
    │ Priority: HIGH  │  │               │  │ configured)  │
    │                 │  │ Priority: MID │  │              │
    │ Used for:       │  │               │  │ Priority: LOW│
    │ CI/CD, server   │  │ Used for:     │  │              │
    │ deployments     │  │ persistent    │  │ Used for:    │
    └────────┬────────┘  │ local dev     │  │ first-time   │
             │           └────────┬──────┘  │ setup        │
             │                    │          └──────┬───────┘
             └────────────────────┼──────────────────┘
                                  │
                                  ▼
                     ┌───────────────────────┐
                     │    LinkedInClient      │
                     │  { accessToken }       │
                     └───────────────────────┘
```

### 4.2 Tool Call Flow: Request → Response

```
┌──────────┐     ┌──────────────┐     ┌───────────┐     ┌──────────────┐     ┌─────────────┐
│ MCP      │     │  Tool Handler│     │   Zod     │     │ LinkedIn     │     │  LinkedIn   │
│ Client   │     │  (tools/*)  │     │  Validate │     │ Client       │     │  API        │
└────┬─────┘     └──────┬───────┘     └─────┬─────┘     └──────┬───────┘     └──────┬──────┘
     │                  │                    │                  │                     │
     │  Tool call       │                    │                  │                     │
     │─────────────────>│                    │                  │                     │
     │                  │  Parse & validate  │                  │                     │
     │                  │───────────────────>│                  │                     │
     │                  │                    │                  │                     │
     │                  │  Validated params  │                  │                     │
     │                  │<───────────────────│                  │                     │
     │                  │                    │                  │                     │
     │                  │  Call client       │                  │                     │
     │                  │  method            │                  │                     │
     │                  │──────────────────────────────────────>│                     │
     │                  │                    │                  │                     │
     │                  │                    │                  │  HTTP request        │
     │                  │                    │                  │─────────────────────>│
     │                  │                    │                  │                     │
     │                  │                    │                  │  HTTP response       │
     │                  │                    │                  │<─────────────────────│
     │                  │                    │                  │                     │
     │                  │  Raw API result    │                  │                     │
     │                  │<──────────────────────────────────────│                     │
     │                  │                    │                  │                     │
     │                  │  Format response   │                  │                     │
     │                  │  (markdown/JSON)   │                  │                     │
     │                  │                    │                  │                     │
     │  Formatted       │                    │                  │                     │
     │  content[]       │                    │                  │                     │
     │<─────────────────│                    │                  │                     │
```

### 4.3 Error Flow: Failure → Structured Error → MCP Response

```
┌──────────┐     ┌──────────────┐     ┌───────────┐     ┌──────────────┐     ┌─────────────┐
│ MCP      │     │  Tool Handler│     │LinkedIn   │     │classifyError │     │  LinkedIn   │
│ Client   │     │              │     │Client     │     │  ()          │     │  API        │
└────┬─────┘     └──────┬───────┘     └─────┬─────┘     └──────┬───────┘     └──────┬──────┘
     │                  │                    │                  │                     │
     │                  │                    │  HTTP 429        │                     │
     │                  │                    │<──────────────────────────────────────│
     │                  │                    │                  │                     │
     │                  │                    │ classifyError(   │                     │
     │                  │                    │   429, data)     │                     │
     │                  │                    │─────────────────>│                     │
     │                  │                    │                  │                     │
     │                  │                    │ StructuredError  │                     │
     │                  │                    │ {                │                     │
     │                  │                    │   code: RATE_    │                     │
     │                  │                    │   LIMITED,       │                     │
     │                  │                    │   retryable:true │                     │
     │                  │                    │ }                │                     │
     │                  │                    │<─────────────────│                     │
     │                  │                    │                  │                     │
     │                  │  Error caught      │                  │                     │
     │                  │<───────────────────│                  │                     │
     │                  │                    │                  │                     │
     │                  │  Format error      │                  │                     │
     │                  │  response:         │                  │                     │
     │                  │  { isError: true,  │                  │                     │
     │                  │    content: [{      │                  │                     │
     │                  │      type: "text",  │                  │                     │
     │                  │      text: JSON.    │                  │                     │
     │                  │      stringify(     │                  │                     │
     │                  │        { code: ..., │                  │                     │
     │                  │          message:.. │                  │                     │
     │                  │      })            │                  │                     │
     │                  │    }]              │                  │                     │
     │                  │  }                 │                  │                     │
     │  isError=true    │                    │                  │                     │
     │<─────────────────│                    │                  │                     │
```

**Error classification matrix:**

| HTTP Status | LinkedInErrorCode | retryable | User Message |
|---|---|---|---|
| 401 (expired) | `TOKEN_EXPIRED` | false | "Token has expired. Generate a new one." |
| 401 (other) | `TOKEN_INVALID` | false | "Authentication failed. Token invalid." |
| 403 | `SCOPE_MISSING` | false | "Missing required scope for this operation." |
| 404 | `NOT_FOUND` | false | "Resource not found. Check ID/URN." |
| 429 | `RATE_LIMITED` | true | "Rate limit exceeded. Wait before retrying." |
| 5xx | `SERVER_ERROR` | true | "LinkedIn server error. Try again later." |
| ECONNABORTED | `TIMEOUT` | true | "Request timed out. Try again." |
| ENOTFOUND | `NETWORK_ERROR` | true | "Network error. Check internet connection." |
| Partner API | `PARTNER_API_REQUIRED` | false | "Partner-level access required." |
| Other | `UNKNOWN` | false | Generic error message. |

### 4.4 Media Upload Flow: File → Published Post with Image

```
┌──────────┐     ┌───────────┐     ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  User    │     │ Media     │     │ LinkedIn    │     │  Post Tool   │     │  LinkedIn   │
│          │     │ Uploader  │     │ API (Images)│     │              │     │  API (Posts)│
└────┬─────┘     └─────┬─────┘     └──────┬──────┘     └──────┬───────┘     └──────┬──────┘
     │                 │                   │                    │                     │
     │ uploadMedia     │                   │                    │                     │
     │ (file path)     │                   │                    │                     │
     │────────────────>│                   │                    │                     │
     │                 │                   │                    │                     │
     │                 │  Step 1: Init     │                    │                     │
     │                 │──────────────────>│                    │                     │
     │                 │  POST /rest/      │                    │                     │
     │                 │  images?action=   │                    │                     │
     │                 │  initializeUpload │                    │                     │
     │                 │                   │                    │                     │
     │                 │  { uploadUrl,     │                    │                     │
     │                 │    imageUrn }     │                    │                     │
     │                 │<──────────────────│                    │                     │
     │                 │                   │                    │                     │
     │                 │  Step 2: Binary   │                    │                     │
     │                 │  Upload           │                    │                     │
     │                 │──────────────────>│                    │                     │
     │                 │  PUT {uploadUrl}  │                    │                     │
     │                 │  Content-Type:    │                    │                     │
     │                 │  image/jpeg       │                    │                     │
     │                 │                   │                    │                     │
     │                 │  201 Created      │                    │                     │
     │                 │<──────────────────│                    │                     │
     │                 │                   │                    │                     │
     │                 │  Step 3: Get URN  │                    │                     │
     │                 │──────────────────>│                    │                     │
     │                 │  GET /rest/       │                    │                     │
     │                 │  images/{id}      │                    │                     │
     │                 │                   │                    │                     │
     │                 │  { image URN }    │                    │                     │
     │                 │<──────────────────│                    │                     │
     │                 │                   │                    │                     │
     │                 │  Return imageURN  │                    │                     │
     │                 │<──────────────────│                    │                     │
     │                 │                   │                    │                     │
     │  Media uploaded │                   │                    │                     │
     │  + imageURN     │                   │                    │                     │
     │<────────────────│                   │                    │                     │
     │                 │                   │                    │                     │
     │  createPost(    │                   │                    │                     │
     │   text, media   │                   │                    │                     │
     │   _url)         │                   │                    │                     │
     │──────────────────────────────────────────────────────────>│                     │
     │                 │                   │                    │                     │
     │                 │                   │                    │  POST /rest/posts   │
     │                 │                   │                    │  with media.id =    │
     │                 │                   │                    │  imageURN           │
     │                 │                   │                    │─────────────────────>│
     │                 │                   │                    │                     │
     │                 │                   │                    │  { id, urn }        │
     │                 │                   │                    │<─────────────────────│
     │                 │                   │                    │                     │
     │  Post published │                   │                    │                     │
     │<────────────────│                   │                    │                     │
```

---

## 5. ADRs — Architecture Decision Records

### ADR-001: TypeScript over Python

**Status:** Accepted
**Context:** Choice of programming language for the MCP server.

**Options considered:**
1. **TypeScript** — Native MCP SDK support, type safety, wide AI tool ecosystem
2. **Python** — Popular for ML/AI, but MCP SDK is less mature (fastmcp is newer)

**Decision:** TypeScript with Node.js ≥18.

**Rationale:**
- `@modelcontextprotocol/sdk` v1.6+ is TypeScript-native with full type definitions
- TypeScript's `strict` mode catches null/undefined bugs at compile time
- Zod integration generates JSON Schema from the same types used for validation
- The AI agent ecosystem (Claude Desktop, Cursor, Copilot) treats TypeScript as first-class
- `tsx` runner enables zero-config development without build step
- ESM (`"type": "module"`) aligns with modern Node.js patterns

**Consequences:**
- Python developers need to read TypeScript (documented)
- Async/await pattern maps cleanly to MCP's async tool handlers
- `LinkedInClient` is a plain class, not a singleton — avoids DI framework overhead

**References:**
- MCP SDK: https://github.com/modelcontextprotocol/typescript-sdk
- MCP specification: https://spec.modelcontextprotocol.io

---

### ADR-002: Stdio Transport for v1

**Status:** Accepted
**Context:** MCP supports multiple transports — Stdio (stdin/stdout) and Streamable HTTP.

**Options considered:**
1. **Stdio** — Simple, secure (no network port), works with all MCP clients out of the box
2. **Streamable HTTP** — Enables remote access, SSE for streaming, but adds auth complexity

**Decision:** Stdio for v1. Streamable HTTP is tracked for v2.

**Rationale:**
- Every MCP client (Claude Desktop, Cursor, VS Code, GitHub Copilot) supports Stdio by default
- No network port management, no firewall issues, no HTTPS certs needed
- OAuth flow can still open a browser via `open` command — standard pattern for Stdio MCPs
- Stdio forces security best practice: the AI agent runs locally with user credentials

**Consequences:**
- `StdioServerTransport` import in `src/index.ts` (2 lines of code)
- Health check messages go to stderr (never stdout — MCP protocol rule)
- v2 can add Streamable HTTP without breaking existing Stdio clients (additive change)
- Multi-user deployment (e.g., SaaS wrapper) requires v2 — explicitly out of scope

**References:**
- MCP Transport spec: https://spec.modelcontextprotocol.io/docs/specification/basic/transports/
- Streamable HTTP RFC: https://github.com/modelcontextprotocol/specification/discussions/119

---

### ADR-003: Zod `.strict()` Over Loose Validation

**Status:** Accepted
**Context:** Input validation strategy for MCP tool parameters.

**Options considered:**
1. **Zod `.strict()`** — Rejects unknown parameters at runtime
2. **Zod `.passthrough()`** — Allows unknown parameters (passes through)
3. **Manual validation** — Hand-rolled type guards

**Decision:** Use `z.object({ ... }).strict()` for all tool schemas.

**Rationale:**
- `.strict()` on the outer object prevents MCP clients from sending typo'd parameters
- Catches AI agent hallucinations early (e.g., `response_format: "markdown"` vs `response_format: "md"`)
- Future-proof: if a new MCP client sends extra parameters, they're rejected instead of silently ignored
- The `nativeEnum(ResponseFormat).default(...)` pattern gives both type safety *and* sensible defaults
- Override: tool factories wrap `.strict()` objects, not individual fields — keeps the constraint visible

**Consequences:**
- Every tool schema ends with `.strict()` — consistent pattern, easy to audit
- Zod `infer` generates TypeScript types that exactly match the validated shape
- MCP Inspector's auto-generated UI respects Zod `.describe()` hints

**References:**
- Zod strict docs: https://zod.dev/?id=strict
- MCP SDK tool registration: https://github.com/modelcontextprotocol/typescript-sdk

---

### ADR-004: Config File + Env Var Auth Fallback Chain

**Status:** Accepted
**Context:** Where and how authentication tokens are stored and loaded.

**Options considered:**
1. **Environment variable only** — Simple, but poor DX for local development
2. **Config file only** — Persistent, but harder to inject in CI/CD
3. **OS keychain** — Most secure, but adds a native dependency and cross-platform complexity
4. **Config file + env var fallback chain** — Best of both worlds

**Decision:** Three-tier fallback: env var → config file → OAuth flow. Config stored in `~/.config/linkedin-mcp/config.json`.

**Rationale:**
- Environment variables are the standard for CI/CD, Docker, and server deployments — keep as highest priority
- A config file enables "authenticate once, use forever" for local development — critical for good DX
- The OAuth flow writes to the config file automatically, closing the loop
- Cross-platform path resolution uses `os.homedir()` + platform-aware separators
- Clearing a token is a single `rm ~/.config/linkedin-mcp/config.json` command
- OS keychain is overengineering for v1 — tracked for v2 if users request it

**Consequences:**
- `token-store.ts` handles the full fallback chain
- Config file format: `{ "accessToken": "...", "expiresAt": "ISO8601", "scopes": [...] }`
- Config file permissions: `0600` (user-read-write only) on Unix.
- Windows: stored in `%USERPROFILE%\.config\linkedin-mcp\config.json`
- MacOS keychain support deferred to v2 if user demand exists

**References:**
- Cross-platform config paths: XDG Base Directory Specification on Linux, `%APPDATA%` on Windows, `~/Library/Application Support` on macOS
- `os.homedir()`: https://nodejs.org/api/os.html#oshomedir

---

### ADR-005: Structured Error Codes Over Generic Error Messages

**Status:** Accepted
**Context:** Error return format for AI agent consumption.

**Options considered:**
1. **Generic error messages** — Simple strings like "Request failed"
2. **HTTP status codes only** — Standard but not descriptive enough
3. **Structured error codes** — Enumerated codes + human message + retryable flag

**Decision:** Use `LinkedInErrorCode` enum with structured error objects.

**Rationale:**
- AI agents need programmatic error handling, not just human-readable strings
- `retryable` flag lets the AI decide: "Should I retry this tool call?"
- Consistent error structure across all 12+ client methods
- The `LinkedInClient.createStructuredError()` static method ensures uniform creation
- Three output paths: `formatError()` (legacy string), `getStructuredError()` (AI-optimized object), `classifyError()` (HTTP→code mapping)

**Consequences:**
- 10 error codes: `TOKEN_INVALID`, `TOKEN_EXPIRED`, `TOKEN_EXPIRING_SOON`, `SCOPE_MISSING`, `RATE_LIMITED`, `NOT_FOUND`, `PARTNER_API_REQUIRED`, `TIMEOUT`, `NETWORK_ERROR`, `SERVER_ERROR`, `UNKNOWN`
- Error response from tool handlers includes `isError: true` and structured content
- MCP clients can render error-specific UI (e.g., "Re-authenticate" button for EXPIRED)

**References:**
- MCP error handling patterns: https://spec.modelcontextprotocol.io/docs/specification/basic/tools/#error-handling
- Structured vs string errors analysis in existing MCP servers

---

### ADR-006: Dual Response Format (Markdown + JSON)

**Status:** Accepted
**Context:** Output format for tool responses.

**Options considered:**
1. **JSON only** — Machine-optimal, but poor for human reading in CLI/Inspector
2. **Markdown only** — Human-optimal, but AI agents must parse text for structured data
3. **Both, switchable** — Universal approach

**Decision:** Every tool supports both `markdown` (default) and `json` output via `response_format` parameter.

**Rationale:**
- Human AI agent users see formatted Markdown in chat interfaces (Claude, ChatGPT, Copilot)
- AI agents processing the output programmatically can request JSON for direct parsing
- The `response_format` parameter is universal across all tools — consistent UX
- Markdown output includes emoji headers, structured sections, and clickable links

**Consequences:**
- Each tool handler has a `if response_format === JSON` branch
- Markdown output uses `# Heading` for tool name, `**key:**` for fields, `>` for content previews
- JSON output uses `JSON.stringify(output, null, 2)` with consistent key naming
- Error responses use the same pattern: structured JSON with `code`, `message`, `details`

---

### ADR-007: Cross-Platform Config Path Resolution

**Status:** Accepted
**Context:** Where to store auth config and tokens across platforms.

**Options considered:**
1. **Hardcoded path** — Simple but broken on Windows
2. **XDG Base Directory** — Linux/macOS standard, but Windows has no XDG
3. **Platform-aware resolution** — XDG on Linux/macOS, %APPDATA% on Windows

**Decision:** Use `os.homedir()/.config/linkedin-mcp/config.json` on all platforms, with `.config` consistent.

**Rationale:**
- `os.homedir()` works correctly on all three platforms
- `~/.config/` is the de facto standard on Linux and is widely recognized on macOS
- On Windows, `%USERPROFILE%\.config\` is functional and consistent — avoids `%APPDATA%` complexity
- Single config file pattern: simple to document, easy to backup/restore/delete
- File permissions: write `0600` on Unix (user-read-write). On Windows, NTFS permissions are respected.

**Consequences:**
- Config path: `path.join(os.homedir(), '.config', 'linkedin-mcp', 'config.json')`
- Config directory: `path.join(os.homedir(), '.config', 'linkedin-mcp')`
- `config.ts` is the single source of truth for path resolution
- `token-store.ts` imports `config.ts` for paths — no duplicated path logic
- `scripts/init-config.ts` creates the directory and file on first run

---

## 6. Security Considerations

### 6.1 Token Security

- **In-memory only**: The `LinkedInClient` stores the token in a JavaScript variable (`this.accessToken`), never on disk.
- **Config file permissions**: Written with `0600` (Unix) — owner read/write only.
- **Env var precedence**: Environment variables take highest priority for CI/CD — prevents accidental credential leaks in config files.
- **JWT expiry detection**: The client decodes token JWT (without verification) to warn about impending expiry.
- **No credential logging**: Access tokens are never printed to stdout/stderr. Health check logs only the user's name.

### 6.2 OAuth PKCE Security

- **Code Verifier**: Cryptographically random string (≥43 characters, ≤128), URL-safe base64 encoded.
- **Code Challenge**: SHA-256 hash of verifier, base64url-encoded (S256 method per RFC 7636).
- **State Parameter**: Random string to prevent CSRF attacks on the callback.
- **Redirect URI**: Must match exactly with LinkedIn app configuration. Defaults to `http://localhost:{port}` for local callback server.
- **Scope Minimization**: Only request scopes actually needed for the requested tools.

### 6.3 API Security

- **HTTPS only**: All traffic to `api.linkedin.com` is over HTTPS.
- **Rate limit respect**: `retryable` flag on `RATE_LIMITED` errors guides AI agents to back off.
- **No browser automation**: Explicitly avoids scraping/automation which violates LinkedIn ToS.

---

## 7. Testing Strategy

### 7.1 Test Layers

| Layer | Tool | Scope | CI |
|---|---|---|---|
| **Unit** | Vitest + nock | Individual module logic, error handling, edge cases | ✅ Always |
| **Integration** | Vitest + nock | Tool handler → client → formatted response pipeline | ✅ Always |
| **E2E** | Vitest + real token | Full round-trip with real LinkedIn API (if `LINKEDIN_ACCESS_TOKEN` set) | ⚠️ Manual |

### 7.2 Test Patterns

```
// Unit test pattern (linkedin-client.test.ts)
import nock from 'nock';

it('classifies 401 as TOKEN_EXPIRED when message contains "expired"', () => {
  const result = LinkedInClient.classifyError(401, { message: 'Token expired' });
  expect(result.code).toBe(LinkedInErrorCode.TOKEN_EXPIRED);
  expect(result.retryable).toBe(false);
});

it('classifies 429 as RATE_LIMITED', () => {
  const result = LinkedInClient.classifyError(429, {});
  expect(result.code).toBe(LinkedInErrorCode.RATE_LIMITED);
  expect(result.retryable).toBe(true);
});

// Integration test pattern (profile.test.ts)
it('formats getUserInfo as markdown by default', async () => {
  nock('https://api.linkedin.com')
    .get('/v2/userinfo')
    .reply(200, { sub: 'abc123', name: 'Test User' });

  const client = new LinkedInClient('fake-token');
  const tools = createProfileTools(client);
  const result = await tools.getUserInfo.handler({});
  expect(result.content[0].text).toContain('Test User');
  expect(result.content[0].text).toContain('# 👤');
});

it('formats getUserInfo as JSON when requested', async () => {
  nock('https://api.linkedin.com')
    .get('/v2/userinfo')
    .reply(200, { sub: 'abc123', name: 'Test User' });

  const client = new LinkedInClient('fake-token');
  const tools = createProfileTools(client);
  const result = await tools.getUserInfo.handler({ response_format: ResponseFormat.JSON });
  const parsed = JSON.parse(result.content[0].text);
  expect(parsed.sub).toBe('abc123');
});
```

### 7.3 Coverage Targets

- **Statements**: ≥80%
- **Branches**: ≥75%
- **Functions**: ≥85%
- **Lines**: ≥80%

### 7.4 What to Mock

| Scenario | Mock Strategy |
|---|---|
| Successful API call | nock returns 200 with fixture data |
| 401 error | nock returns 401 with error body |
| 429 rate limit | nock returns 429 with Retry-After |
| Timeout | nock delays then errors with ECONNABORTED |
| Network error | nock errors with ENOTFOUND |
| Empty response | nock returns 200 with empty array |
| Partner API error | Client method throws PARTNER_API_REQUIRED |

---

## 8. Future Roadmap

### v1.1 (Next)

- **Media upload pipeline** — Full implementation of 3-step image upload
- **OAuth PKCE login** — `linkedin_oauth_login` tool with browser-based auth
- **Token refresh** — Automatic refresh token handling (LinkedIn 60-day expiry)
- **Scripts/init-config.ts** — Interactive setup script

### v2.0 (Future)

- **Streamable HTTP transport** — Enable remote multi-user access
- **OS keychain integration** — Secure token storage (macOS Keychain, Windows Credential Manager)
- **Organization posting** — `/rest/posts` for organizations
- **Capability probe** — Runtime detection of which API features are available
- **Rate-limit aware retry** — Exponential backoff with Retry-After header parsing

### Out of Scope

- Browser automation (ToS violation risk)
- LinkedIn Partner API features (messaging, search, connections)
- Dashboard UI
- SaaS wrapper / commercial hosting

---

## Appendix A: Error Code Reference

| Code | HTTP | Cause | retryable | Action |
|---|---|---|---|---|
| `TOKEN_INVALID` | 401 | Bad token | No | Generate new token |
| `TOKEN_EXPIRED` | 401 | Token expired | No | Run OAuth flow again |
| `TOKEN_EXPIRING_SOON` | — | <7 days left | No | Warn user to refresh |
| `SCOPE_MISSING` | 403 | Wrong permissions | No | Re-authorize with correct scopes |
| `RATE_LIMITED` | 429 | Too many requests | Yes | Wait 60s, retry |
| `NOT_FOUND` | 404 | Bad ID/URN | No | Check identifier |
| `PARTNER_API_REQUIRED` | — | Partner-only endpoint | No | Use alternative |
| `TIMEOUT` | — | Request took >30s | Yes | Check network, retry |
| `NETWORK_ERROR` | — | DNS/connectivity fail | Yes | Check internet |
| `SERVER_ERROR` | 5xx | LinkedIn down | Yes | Wait, retry |
| `UNKNOWN` | Other | Unexpected | No | Report bug |

## Appendix B: LinkedIn API Endpoint Reference

| Endpoint | Method | Scope | Notes |
|---|---|---|---|
| `/v2/userinfo` | GET | `openid` | OpenID Connect standard |
| `/v2/me` | GET | `r_liteprofile` | Deprecated but functional |
| `/rest/posts` | POST | `w_member_social` | New API (2024+), preferred |
| `/rest/posts/{id}` | DELETE | `w_member_social` | Destructive |
| `/v2/shares` | GET | `r_member_social` | Legacy listing |
| `/rest/posts?author={urn}` | GET | `r_member_social` | New API listing |
| `/rest/images?action=initializeUpload` | POST | `w_member_social` | Media upload step 1 |
| `/rest/images/{id}` | GET | `w_member_social` | Media upload step 3 |
| `/v2/activities` | GET | `r_member_social` | Feed access (limited) |
| `/v2/connections/{id}` | GET | Partner | Requires Partner Program |
| `/v2/organizationalEntityAcls` | GET | `r_organization_social` | Org membership check |

---

*End of Technical Design Document*
