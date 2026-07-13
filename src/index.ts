#!/usr/bin/env node
/**
 * LinkedIn MCP Server
 *
 * MCP server that provides tools to interact with the LinkedIn API.
 * Supports profile retrieval, post creation/listing, feed access,
 * and network management.
 *
 * Setup:
 *   1. Create a LinkedIn Developer App at https://www.linkedin.com/developers/apps
 *   2. Add the "Sign In with LinkedIn using OpenID Connect" product
 *   3. Add "Share on LinkedIn" product (for posting)
 *   4. Generate an access token with scopes: openid, profile, email, w_member_social
 *   5. Set LINKEDIN_ACCESS_TOKEN environment variable
 *
 * Usage:
 *   export LINKEDIN_ACCESS_TOKEN=your_token_here
 *   npx tsx src/index.ts
 *   # or after build:
 *   npm run build && node dist/index.js
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { LinkedInClient } from "./services/linkedin-client.js";
import { createProfileTools } from "./tools/profile.js";
import { createPostsTools } from "./tools/posts.js";
import { createNetworkTools } from "./tools/network.js";

// ─── Configuration ──────────────────────────────────────────────────────────

const ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
if (!ACCESS_TOKEN) {
  console.error("❌ ERROR: LINKEDIN_ACCESS_TOKEN environment variable is required");
  console.error("");
  console.error("  Get your token from: https://www.linkedin.com/developers/apps");
  console.error("  Then run:");
  console.error("    export LINKEDIN_ACCESS_TOKEN=AQX_...");
  console.error("    npm start");
  process.exit(1);
}

// ─── Initialize ─────────────────────────────────────────────────────────────

const client = new LinkedInClient(ACCESS_TOKEN);

const server = new McpServer({
  name: "linkedin-mcp-server",
  version: "1.0.0",
  description: "MCP server for LinkedIn API — profiles, posts, feed, and connections",
});

// ─── Register Profile Tools ─────────────────────────────────────────────────

const profileTools = createProfileTools(client);

server.registerTool(
  "linkedin_get_my_profile",
  {
    title: "Get My LinkedIn Profile",
    description: `Get the authenticated user's LinkedIn profile information.

Returns your full profile details including name, headline, vanity URL,
profile picture, email, and locale. Combines both the OpenID Connect userinfo
endpoint and the LinkedIn profile API.

Args:
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns (JSON format):
  {
    "id": string,          // LinkedIn member ID
    "firstName": string,   // First name
    "lastName": string,    // Last name
    "fullName": string,    // Full display name
    "headline": string,    // Professional headline
    "vanityName": string,  // Custom URL identifier
    "profileUrl": string,  // Full LinkedIn URL
    "email": string,       // Email address (if available)
    "pictureUrl": string,  // Profile picture URL
    "locale": string       // Locale setting
  }

Requires scope: openid + r_liteprofile (or r_basicprofile)
`,
    inputSchema: profileTools.getMyProfile.schema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  profileTools.getMyProfile.handler
);

server.registerTool(
  "linkedin_get_user_info",
  {
    title: "Get LinkedIn User Info (OpenID Connect)",
    description: `Get basic user identity information via OpenID Connect.

This works with the minimal "openid" scope and returns:
- sub (unique member ID for your app)
- name, given_name, family_name
- email (if "email" scope is granted)
- picture
- locale

Unlike getMyProfile, this always works even with minimal scopes.

Args:
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns (JSON format):
  {
    "sub": string,           // Unique member ID
    "name": string,          // Full name
    "givenName": string,     // First name
    "familyName": string,    // Last name
    "email": string,         // Email address
    "emailVerified": boolean // Whether email is verified
    "picture": string,       // Profile picture URL
    "locale": string         // Locale
  }

Requires scope: openid (always available with Sign In with LinkedIn)
`,
    inputSchema: profileTools.getUserInfo.schema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  profileTools.getUserInfo.handler
);

// ─── Register Posts Tools ───────────────────────────────────────────────────

const postsTools = createPostsTools(client);

server.registerTool(
  "linkedin_create_post",
  {
    title: "Create a LinkedIn Post",
    description: `Create and publish a new LinkedIn post.

Publishes a text post to your LinkedIn feed. Supports PUBLIC, CONNECTIONS-only,
or LOGGED_IN visibility settings.

Args:
  - text (string, required): Post content (1-3000 chars)
  - visibility ("PUBLIC" | "CONNECTIONS" | "LOGGED_IN"): Who can see the post (default: "PUBLIC")
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns (JSON format):
  {
    "postId": string,         // Post ID
    "urn": string,            // LinkedIn URN
    "text": string,           // Text preview (first 100 chars)
    "visibility": string,     // Visibility setting used
    "status": string,         // Always "PUBLISHED"
    "url": string             // Direct link to the post
  }

Requires scope: w_member_social (Share on LinkedIn product)
`,
    inputSchema: postsTools.createPost.schema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  postsTools.createPost.handler
);

server.registerTool(
  "linkedin_list_posts",
  {
    title: "List LinkedIn Posts",
    description: `List LinkedIn posts for a member.

Returns posts published by the specified member (or the authenticated user
by default). Posts are returned newest-first with pagination support.

Args:
  - member_id (string, optional): LinkedIn member ID (sub) to fetch posts for
  - start (number): Start index for pagination (default: 0)
  - count (number): Number of posts to return, max 50 (default: 10)
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns (JSON format):
  {
    "total": number,       // Total posts available
    "count": number,       // Posts in this response
    "start": number,       // Current offset
    "has_more": boolean,   // Whether more pages exist
    "next_offset": number, // Offset for next page
    "posts": [{
      "id": string,        // Post ID
      "text": string,      // Post commentary/text
      "author": string,    // Author URN
      "created": string,   // Human-readable date
      "created_timestamp": number, // Unix timestamp ms
      "visibility": string,// Visibility setting
      "url": string        // Direct link
    }]
  }

Requires scope: r_member_social or r_organization_social
`,
    inputSchema: postsTools.listPosts.schema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  postsTools.listPosts.handler
);

// ─── Register Network Tools ─────────────────────────────────────────────────

const networkTools = createNetworkTools(client);

server.registerTool(
  "linkedin_get_feed",
  {
    title: "Get LinkedIn Feed",
    description: `Get recent activity from the authenticated user's LinkedIn feed.

Returns recent posts and activities from your network.

Args:
  - start (number): Start index for pagination (default: 0)
  - count (number): Number of items to return, max 50 (default: 10)
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns (JSON format):
  {
    "total": number,
    "count": number,
    "start": number,
    "has_more": boolean,
    "items": [{
      "id": string,       // Activity URN
      "actor": string,    // Actor URN
      "time": string,     // Human-readable timestamp
      "timestamp": number,// Unix timestamp ms
      "content": string   // Content preview
    }]
  }

Note: LinkedIn's public API has limited feed access.
`,
    inputSchema: networkTools.getFeed.schema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  networkTools.getFeed.handler
);

server.registerTool(
  "linkedin_get_connections",
  {
    title: "Get LinkedIn Connections",
    description: `Get the authenticated user's LinkedIn connections.

Lists your 1st-degree connections with pagination support.

Args:
  - start (number): Start index for pagination (default: 0)
  - count (number): Number of connections to return, max 50 (default: 10)
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns (JSON format):
  {
    "total": number,
    "count": number,
    "start": number,
    "has_more": boolean,
    "connections": [{
      "id": string,            // Member ID
      "name": string,          // Display name
      "profileUrl": string     // LinkedIn profile URL
    }]
  }

⚠️ NOTE: Connections API requires LinkedIn Partner Program access.
Standard OAuth apps will receive an error message explaining the limitation.
`,
    inputSchema: networkTools.getConnections.schema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  networkTools.getConnections.handler
);

// ─── Health check (stderr-only, never stdout) ───────────────────────────────

async function verifyAuth(): Promise<boolean> {
  try {
    const info = await client.getUserInfo();
    console.error(`✅ LinkedIn MCP Server — Authenticated as ${info.name || info.sub}`);
    return true;
  } catch (error) {
    console.error(`❌ LinkedIn MCP Server — Auth failed: ${LinkedInClient.formatError(error)}`);
    return false;
  }
}

// ─── Start ──────────────────────────────────────────────────────────────────

async function main() {
  // Verify auth on startup
  const authOk = await verifyAuth();

  // Connect via stdio (for use with Claude Desktop, Cursor, etc.)
  const transport = new StdioServerTransport();

  await server.connect(transport);

  if (authOk) {
    console.error("🚀 LinkedIn MCP Server running via stdio");
    console.error("   Available tools:");
    console.error("   • linkedin_get_user_info     — Get OpenID Connect user info");
    console.error("   • linkedin_get_my_profile    — Get full LinkedIn profile");
    console.error("   • linkedin_create_post       — Create a LinkedIn post");
    console.error("   • linkedin_list_posts        — List your LinkedIn posts");
    console.error("   • linkedin_get_feed          — Get your LinkedIn feed");
    console.error("   • linkedin_get_connections   — Get your connections (partner API)");
  } else {
    console.error("⚠️  LinkedIn MCP Server running but auth failed. Tools will return errors.");
    console.error("   Set LINKEDIN_ACCESS_TOKEN to a valid token and restart.");
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
