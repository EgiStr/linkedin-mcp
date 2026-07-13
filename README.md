# LinkedIn MCP Server

[![npm version](https://img.shields.io/npm/v/@eggisatriadev/linkedin-mcp)](https://www.npmjs.com/package/@eggisatriadev/linkedin-mcp)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![CI](https://github.com/eggisatriadev/linkedin-mcp-server/actions/workflows/ci.yml/badge.svg)](https://github.com/eggisatriadev/linkedin-mcp-server/actions/workflows/ci.yml)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](package.json)

MCP server for LinkedIn API integration — profiles, posts, feed, and connections.

Works with Claude Desktop, Cursor, Windsurf, Claude Code, OpenCode, and any MCP-compatible client.

## Features

| Tool | Description | Scope Required |
|---|---|---|
| `linkedin_get_user_info` | Get OpenID Connect user info | `openid` |
| `linkedin_get_my_profile` | Get full LinkedIn profile | `openid` + `r_liteprofile` |
| `linkedin_create_post` | Publish a LinkedIn post | `w_member_social` |
| `linkedin_list_posts` | List your/others' posts | `r_member_social` |
| `linkedin_delete_post` | Delete a LinkedIn post | `w_member_social` |
| `linkedin_get_feed` | Get your feed activity | `r_member_social` |
| `linkedin_get_connections` | Get your connections | Partner API |
| `linkedin_send_message` | Send a direct message | Partner API |
| `linkedin_search_people` | Search LinkedIn members | Partner API |
| `linkedin_oauth_login` | OAuth PKCE login flow | — |

## Quick Start

```bash
# Install from npm (recommended)
npx @eggisatriadev/linkedin-mcp

# Or install locally
npm install @eggisatriadev/linkedin-mcp

# Set your access token
export LINKEDIN_ACCESS_TOKEN=AQX_your_token_here

# Run the server
npx @eggisatriadev/linkedin-mcp
```

### For Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "linkedin": {
      "command": "npx",
      "args": ["-y", "@eggisatriadev/linkedin-mcp"],
      "env": {
        "LINKEDIN_ACCESS_TOKEN": "AQX_your_token_here"
      }
    }
  }
}
```

### For OpenCode

Add to your `opencode.json`:

```json
{
  "mcpServers": {
    "linkedin": {
      "command": "npx",
      "args": ["-y", "@eggisatriadev/linkedin-mcp"],
      "env": {
        "LINKEDIN_ACCESS_TOKEN": "AQX_your_token_here"
      }
    }
  }
}
```

## Setup

### 1. Create a LinkedIn Developer App

1. Go to https://www.linkedin.com/developers/apps
2. Create a new app
3. Add products:
   - **Sign In with LinkedIn using OpenID Connect** (auto-approved)
   - **Share on LinkedIn** (for posting capabilities)
4. Note your **Client ID** and **Client Secret**
5. Add `http://localhost:8080` as an OAuth redirect URL

### 2. Generate Access Token

The easiest way is to use the OAuth 2.0 token generator in the LinkedIn Developer Portal:

1. Go to your app → **Auth** tab
2. In **OAuth 2.0 settings**, find the access token section
3. Select scopes: `openid`, `profile`, `email`, `w_member_social`
4. Generate and copy the token

### 3. Run the Server

```bash
# Install dependencies
npm install

# Set your token
export LINKEDIN_ACCESS_TOKEN=AQX_your_token_here

# Build and run
npm run build
npm start
```

### 4. Connect to Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "linkedin": {
      "command": "node",
      "args": ["/absolute/path/to/linkedin-mcp-server/dist/index.js"],
      "env": {
        "LINKEDIN_ACCESS_TOKEN": "AQX_your_token_here"
      }
    }
  }
}
```

### 5. Connect to OpenCode

Add to your `opencode.json` (or use the MCP config):

```json
{
  "mcpServers": {
    "linkedin": {
      "command": "node",
      "args": ["/absolute/path/to/linkedin-mcp-server/dist/index.js"],
      "env": {
        "LINKEDIN_ACCESS_TOKEN": "AQX_your_token_here"
      }
    }
  }
}
```

## OAuth PKCE Login (No Token Required)

Skip step 2 — let the server handle authentication interactively:

```bash
# Required: set your LinkedIn app credentials
export LINKEDIN_CLIENT_ID=your_client_id
export LINKEDIN_CLIENT_SECRET=your_client_secret

# Run the server (it will detect no token and guide you)
npm run build
npm start

# Or from npm package:
npx @eggisatriadev/linkedin-mcp
```

Then call the `linkedin_oauth_login` tool from your MCP client:

1. **port** (optional): Callback server port (default: `8080`)
2. **open_browser** (optional): Auto-open browser (default: `true`)
3. **timeout** (optional): Max wait in ms (default: `120000`)

The flow:
1. Server starts a local HTTP server on port 8080
2. Opens your browser to LinkedIn's authorization page
3. You approve the request
4. LinkedIn redirects to localhost — server captures the code
5. Server exchanges the code for an access token via PKCE S256
6. Token is saved to `~/.config/linkedin-mcp/config.json`
7. All tools immediately work without further setup

## Media Upload

LinkedIn supports image upload via a 3-step `/rest/images` flow:

1. **Initialize**: `POST /rest/images?action=initializeUpload` → returns `uploadUrl` + `image` URN
2. **Upload binary**: `PUT {uploadUrl}` with image data
3. **Attach to post**: Use the image URN as `media.id` in `createPost()`

**Supported formats:** JPEG, PNG, GIF (static)
**Max file size:** 10 MB
**Recommended dimensions:** 2048×2048px

Image upload happens automatically when you pass a `media_url` parameter
to `linkedin_create_post`. The MediaUploader handles retries on expired
upload URLs and validates format/size before uploading.

## Development

```bash
# Watch mode (auto-reload)
npm run dev

# Build
npm run build

# Test with MCP Inspector
npm run inspector
```

## Architecture

The server follows a layered architecture with four bounded contexts:

```
linkedin-mcp-server/
├── src/
│   ├── index.ts                 # Entry point: server init, tool registration, health check
│   ├── types.ts                 # Shared types and enums
│   ├── services/
│   │   └── linkedin-client.ts   # LinkedIn API client (14+ methods, error classification)
│   ├── tools/
│   │   ├── profile.ts           # Profile tools: getMyProfile, getUserInfo
│   │   ├── posts.ts             # Posts tools: createPost, listPosts, deletePost
│   │   ├── network.ts           # Network tools: getFeed, getConnections, sendMessage, searchPeople
│   │   └── auth.ts              # Auth tool: oauthLogin
│   ├── auth/
│   │   ├── oauth.ts             # PKCE OAuth 2.0 flow (RFC 7636)
│   │   ├── config.ts            # Config file management
│   │   └── token-store.ts       # Token persistence (env var → config file fallback)
│   └── media/
│       └── uploader.ts          # 3-step image upload: init → binary → URN
├── tests/
│   ├── linkedin-client.test.ts
│   ├── tools/
│   ├── auth/
│   └── media/
├── docs/
│   └── pocket/arch/*/tech-design.md   # Full technical design document
├── package.json
├── tsconfig.json
└── README.md
```

### Token Resolution Chain

1. `LINKEDIN_ACCESS_TOKEN` env var (highest priority)
2. `~/.config/linkedin-mcp/config.json` (persistent local token)
3. OAuth PKCE flow (if `LINKEDIN_CLIENT_ID` + `LINKEDIN_CLIENT_SECRET` are set)

See [tech-design.md](docs/pocket/arch/2026-07-13-linkedin-mcp-server/tech-design.md) for the full architecture, API contracts, data flow diagrams, and ADRs.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Bug reports & feature requests (GitHub Issues)
- Development setup guide
- Coding standards & test requirements
- Pull request guidelines

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md).

## Limitations

- **Connections API**: Requires LinkedIn Partner Program (not available on free tier)
- **People Search**: Not available via public API (needs Sales Navigator)
- **Messaging API**: Requires LinkedIn Messaging API (partner program)
- **Feed**: Limited by API restrictions
- **Rate Limits**: 100-500 requests/day per app on free tier

## License

MIT — see [LICENSE](LICENSE) for details.
