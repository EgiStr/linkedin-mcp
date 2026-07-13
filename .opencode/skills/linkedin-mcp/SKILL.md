# LinkedIn MCP Server Skill

Use this skill when the user wants to interact with LinkedIn, post content, view their profile, manage their LinkedIn feed, or integrate LinkedIn with AI agents like Claude Code, OpenCode, or Cursor.

**Trigger phrases:** "linkedin", "linkedin mcp", "posting linkedin", "buat postingan linkedin", "linkedin profile", "social media", "koneksi linkedin"

---

## Overview

LinkedIn MCP Server is an open-source MCP (Model Context Protocol) server that connects AI agents to LinkedIn through the official LinkedIn REST API. It provides tools for profiles, posts (with image upload), feed, and OAuth PKCE authentication.

**GitHub:** https://github.com/EgiStr/linkedin-mcp
**npm:** `@EgiStr/linkedin-mcp`

## Prerequisites

1. **Node.js >= 18** — verify with `node --version`
2. **LinkedIn Developer App** — create at https://www.linkedin.com/developers/apps
   - Add product: **Sign In with LinkedIn using OpenID Connect**
   - Add product: **Share on LinkedIn** (untuk fitur posting)
   - Note: Client ID dan Client Secret

## Installation

### Option A: Quick Run (npx)
```bash
LINKEDIN_ACCESS_TOKEN=AQX_... npx @EgiStr/linkedin-mcp
```

### Option B: Install from GitHub
```bash
git clone https://github.com/EgiStr/linkedin-mcp.git
cd linkedin-mcp
npm install
npm run build
LINKEDIN_ACCESS_TOKEN=AQX_... node dist/index.js
```

### Option C: Claude Desktop
Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "linkedin": {
      "command": "npx",
      "args": ["-y", "@EgiStr/linkedin-mcp"],
      "env": {
        "LINKEDIN_ACCESS_TOKEN": "AQX_..."
      }
    }
  }
}
```

### Option D: OpenCode
Add to `opencode.json`:
```json
{
  "mcpServers": {
    "linkedin": {
      "command": "node",
      "args": ["path/to/linkedin-mcp/dist/index.js"],
      "env": {
        "LINKEDIN_ACCESS_TOKEN": "AQX_..."
      }
    }
  }
}
```

## Authentication

### Method 1: Access Token (Quick)
1. Buka https://www.linkedin.com/developers/tools/oauth/token-generator
2. Pilih app → centang scopes: `openid`, `profile`, `email`, `w_member_social`
3. Generate → copy token
4. Set sebagai `LINKEDIN_ACCESS_TOKEN` env var

### Method 2: OAuth PKCE (Interactive)
1. Set env var:
   ```
   LINKEDIN_CLIENT_ID=86tq77edegqra1
   LINKEDIN_CLIENT_SECRET=WPL_AP1.xxx
   ```
2. Panggil tool `linkedin_oauth_login`
3. Browser akan terbuka → login LinkedIn → authorize
4. Token otomatis tersimpan di config file

## Tools Reference

| Tool | Required Scope | Description |
|------|---------------|-------------|
| `linkedin_get_user_info` | `openid` | Get OpenID Connect user info |
| `linkedin_get_my_profile` | `profile` | Get full LinkedIn profile |
| `linkedin_create_post` | `w_member_social` | Create post (text + image) |
| `linkedin_list_posts` | `r_member_social` | List posts with pagination |
| `linkedin_delete_post` | `w_member_social` | Delete a post |
| `linkedin_get_feed` | `r_member_social` | Get feed activity |
| `linkedin_oauth_login` | - | Interactive PKCE OAuth login |
| `linkedin_get_connections` | Partner API | Get connections (partner only) |
| `linkedin_send_message` | Partner API | Send message (partner only) |
| `linkedin_search_people` | Partner API | Search people (partner only) |

## Common Workflows

### 1. Lihat Profile
```
linkedin_get_user_info response_format: "markdown"
```

### 2. Buat Postingan
```
linkedin_create_post text: "Halo LinkedIn!" visibility: "PUBLIC"
```

### 3. Buat Postingan dengan Gambar
```
linkedin_create_post text: "Coba image upload" media_url: "https://example.com/image.jpg" visibility: "PUBLIC"
```

### 4. List Postingan Terakhir
```
linkedin_list_posts count: 5 response_format: "markdown"
```

### 5. Hapus Postingan
```
linkedin_delete_post post_id: "urn:li:share:7482334903989096448"
```

## Error Handling

Semua tool mengembalikan structured error codes yang bisa diparsing oleh AI agents:

| Error Code | Arti | Action |
|------------|------|--------|
| `TOKEN_INVALID` | Token tidak valid | Generate token baru |
| `TOKEN_EXPIRED` | Token expired | Re-auth via OAuth |
| `TOKEN_REVOKED` | Token dicabut | Re-authorize di LinkedIn |
| `SCOPE_MISSING` | Scope tidak cukup | Tambah scope di developer app |
| `RATE_LIMITED` | Rate limit exceeded | Tunggu beberapa saat |
| `NOT_FOUND` | Resource tidak ditemukan | Cek ID/URN |
| `PARTNER_API_REQUIRED` | Butuh partner access | Fitur tidak tersedia |

## Response Format

Semua tool mendukung dual format:
- **`response_format: "markdown"`** — untuk human-readable (default)
- **`response_format: "json"`** — untuk AI agent programmatic parsing

## Architecture

```
Client (Claude/OpenCode/Cursor)
       │ MCP Protocol (stdio)
       ▼
linkedin-mcp-server
  ├── Tool Layer (10 tools)
  ├── Auth Layer (PKCE + Config + TokenStore)
  ├── Media Uploader (3-step /rest/images)
  └── LinkedIn API Client
       │ HTTPS
       ▼
LinkedIn REST API (v2 + /rest/)
```

## Tips

- **Image upload**: Support JPEG, PNG, GIF (max 10MB). URL atau file path.
- **Token expiry**: LinkedIn token berlaku 60 hari. Gunakan `linkedin_oauth_login` untuk re-auth.
- **Rate limits**: ~100-500 requests/day untuk free tier.
- **Pagination**: Set `count` parameter (max 50). `has_more` flag menandakan ada halaman berikutnya.

## Related Resources

- **LinkedIn Developer Portal:** https://www.linkedin.com/developers/apps
- **MCP Specification:** https://modelcontextprotocol.io
- **GitHub Issues:** https://github.com/EgiStr/linkedin-mcp/issues
