# LinkedIn MCP Server

MCP server for LinkedIn API integration — profiles, posts, feed, and connections.

Works with Claude Desktop, Cursor, Windsurf, Claude Code, and any MCP-compatible client.

## Features

| Tool | Description | Scope Required |
|---|---|---|
| `linkedin_get_user_info` | Get OpenID Connect user info | `openid` |
| `linkedin_get_my_profile` | Get full LinkedIn profile | `openid` + `r_liteprofile` |
| `linkedin_create_post` | Publish a LinkedIn post | `w_member_social` |
| `linkedin_list_posts` | List your/others' posts | `r_member_social` |
| `linkedin_get_feed` | Get your feed activity | `r_member_social` |
| `linkedin_get_connections` | Get your connections | Partner API |

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
cd linkedin-mcp-server
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

## Development

```bash
# Watch mode (auto-reload)
npm run dev

# Build
npm run build

# Test with MCP Inspector
npm run inspector
```

## Limitations

- **Connections API**: Requires LinkedIn Partner Program (not available on free tier)
- **People Search**: Not available via public API (needs Sales Navigator)
- **Feed**: Limited by API restrictions
- **Rate Limits**: 100-500 requests/day per app on free tier

## Architecture

```
linkedin-mcp-server/
├── src/
│   ├── index.ts                 # Main entry point, tool registration
│   ├── types.ts                 # Shared types and enums
│   ├── services/
│   │   └── linkedin-client.ts   # LinkedIn API client
│   └── tools/
│       ├── profile.ts           # Profile tools
│       ├── posts.ts             # Posts tools
│       └── network.ts           # Network/feed tools
├── package.json
├── tsconfig.json
└── README.md
```

## License

MIT
