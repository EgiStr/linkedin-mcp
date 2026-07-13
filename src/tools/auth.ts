/**
 * LinkedIn OAuth tool — `linkedin_oauth_login`
 *
 * Orchestrates the PKCE OAuth 2.0 authorization code flow:
 * 1. Starts a temporary HTTP server on localhost
 * 2. Generates PKCE code_verifier / code_challenge (S256)
 * 3. Opens the user's browser to LinkedIn's authorization page
 * 4. Captures the callback with the authorization code
 * 5. Exchanges the code for an access + refresh token
 * 6. Persists the token via TokenStore (config file)
 *
 * Follows the existing factory pattern from profile.ts / posts.ts.
 */

import { z } from "zod";
import type { ToolEntry } from "../types.js";
import { OAuthClient, OAuthError } from "../auth/oauth.js";
import { TokenStore } from "../auth/token-store.js";
import { ConfigManager } from "../auth/config.js";

// ─── Schema ──────────────────────────────────────────────────────────────────

const OAuthLoginSchema = z.object({
  port: z
    .number()
    .int()
    .min(1024)
    .max(65535)
    .default(8080)
    .describe("TCP port for the localhost callback server (default: 8080)"),
  open_browser: z
    .boolean()
    .default(true)
    .describe("Whether to automatically open the browser to LinkedIn (default: true). Set to false in headless environments."),
  timeout: z
    .number()
    .int()
    .min(30_000)
    .max(600_000)
    .default(120_000)
    .describe("Maximum time in ms to wait for the OAuth callback (default: 120000)"),
}).strict();

type OAuthLoginInput = z.infer<typeof OAuthLoginSchema>;

// ─── Tool Factory ────────────────────────────────────────────────────────────

/**
 * Create the `linkedin_oauth_login` tool entry.
 *
 * @param tokenStore  Optional TokenStore override (for testing / DI).
 * @returns A ToolEntry ready to be registered with the MCP server.
 */
export function createOAuthLoginTool(tokenStore?: TokenStore): ToolEntry<OAuthLoginInput> {
  return {
    schema: OAuthLoginSchema,
    handler: async (params: OAuthLoginInput) => {
      try {
        // Build OAuthClient — reads LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET
        // from the environment automatically.
        const oauth = new OAuthClient(undefined, undefined, tokenStore);

        console.error("[auth] Starting OAuth PKCE login flow...");
        console.error(`[auth] Callback server on port ${params.port}, timeout ${params.timeout}ms`);

        const tokenResult = await oauth.startAuthFlow({
          port: params.port,
          openBrowser: params.open_browser,
          timeoutMs: params.timeout,
        });

        // Build a user-friendly success output
        const expiresDate = new Date(tokenResult.expiresAt);
        const scopeList = tokenResult.scope.split(/[\s,]+/).filter(Boolean);

        const lines = [
          "# ✅ LinkedIn OAuth Login Successful!",
          "",
          "Your LinkedIn access token has been generated and saved to the config file.",
          "",
          "**Token Details:**",
          `- **Expires:** ${expiresDate.toLocaleString()}`,
          `- **Lifetime:** ${tokenResult.expiresIn}s (${Math.round(tokenResult.expiresIn / 3600)}h)`,
          `- **Scopes:** ${scopeList.join(", ") || "none"}`,
          "",
          "**What's Next:**",
          "- The token is already saved to the config file and ready to use.",
          "- Try `linkedin_get_user_info` to verify authentication.",
          "- Try `linkedin_get_my_profile` for your full profile.",
          "",
          "**Token Safety:**",
          "- The token is stored in your config file, not in environment variables.",
          "- If the token expires, run `linkedin_oauth_login` again to refresh it.",
        ];

        const tokenPreview = tokenResult.accessToken.substring(0, 20) + "...";

        return {
          content: [
            { type: "text" as const, text: lines.join("\n") },
            {
              type: "text" as const,
              text: `\n\`\`\`json\n${JSON.stringify({
                accessTokenPreview: tokenPreview,
                expiresAt: tokenResult.expiresAt,
                scope: tokenResult.scope,
              }, null, 2)}\n\`\`\``,
            },
          ],
        };
      } catch (error) {
        if (error instanceof OAuthError) {
          const helpMap: Record<string, string> = {
            USER_CANCEL: "The authorization was denied or cancelled. Try again and make sure to approve the request.",
            MISSING_CREDENTIALS:
              "Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in your environment. " +
              "Get them from https://www.linkedin.com/developers/apps",
            TIMEOUT:
              "The OAuth callback timed out. The authorization URL is still valid — " +
              "check your browser window and complete the authorization.",
            EXCHANGE_FAILED:
              "LinkedIn rejected the token exchange. Your client ID, secret, or authorization code may be invalid.",
            STATE_MISMATCH:
              "Security check failed. This may be a CSRF attempt. Please try again.",
            AUTHORIZATION_DENIED:
              "You denied the authorization request. Run the tool again if you change your mind.",
            PORT_UNAVAILABLE:
              "The callback port is not available. Use the `port` parameter to specify a different port.",
          };

          const hint = helpMap[error.code] || "An unexpected OAuth error occurred. Please try again.";

          return {
            isError: true,
            content: [{
              type: "text" as const,
              text: [
                `# ❌ OAuth Login Failed (${error.code})`,
                "",
                error.message,
                "",
                "**Suggestion:**",
                `> ${hint}`,
                ...(error.details ? ["", "**Details:**", `> ${error.details}`] : []),
              ].join("\n"),
            }],
          };
        }

        // Generic error
        return {
          isError: true,
          content: [{
            type: "text" as const,
            text: `# ❌ OAuth Login Failed\n\nUnexpected error: ${error instanceof Error ? error.message : String(error)}`,
          }],
        };
      }
    },
  };
}
