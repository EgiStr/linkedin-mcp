/**
 * PKCE OAuth 2.0 Authorization Code flow for LinkedIn.
 *
 * Implements RFC 7636 (PKCE S256) — SHA-256 code_verifier → base64url
 * code_challenge.  Handles browser launch, localhost callback server,
 * and token exchange.
 *
 * ## Flow
 * 1. generatePKCE()         → { codeVerifier, codeChallenge, state }
 * 2. buildAuthUrl(...)      → LinkedIn authorize URL with PKCE params
 * 3. User authorises in browser → LinkedIn redirects to localhost:{port}/callback?code=...
 * 4. exchangeCode(...)      → POST /accessToken → access_token + expires_in
 * 5. TokenStore.setToken()  → persisted to config file
 *
 * No hardcoded credentials — reads LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET
 * from environment.
 */

import { randomBytes, createHash } from "node:crypto";
import { createServer, type Server, type IncomingMessage, type ServerResponse } from "node:http";
import { exec } from "node:child_process";
import { TokenStore } from "./token-store.js";
import { ConfigManager } from "./config.js";

// ─── Constants ───────────────────────────────────────────────────────────────

/** LinkedIn OAuth 2.0 endpoints. */
const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";

/** Default OAuth scopes requested. */
const DEFAULT_SCOPE = "openid profile email w_member_social";

/** Timeout for the OAuth callback server (ms). */
const DEFAULT_TIMEOUT_MS = 120_000;

/** Length of the cryptographically random code verifier (per RFC 7636). */
const CODE_VERIFIER_LENGTH = 64;

/** Characters allowed in a code_verifier per RFC 7636 §4.1 — unreserved URL chars. */
const UNRESERVED_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PKCEChallenge {
  /** Cryptographically random string (43-128 chars, unreserved URL-safe chars). */
  codeVerifier: string;
  /** Base64url-encoded SHA-256 hash of the code verifier. */
  codeChallenge: string;
  /** Random string for CSRF protection, verified on callback. */
  state: string;
}

export interface TokenResult {
  /** The OAuth access token (JWT for LinkedIn). */
  accessToken: string;
  /** Lifetime in seconds (from LinkedIn's `expires_in` field). */
  expiresIn: number;
  /** Granted scopes (space-separated). */
  scope: string;
  /** Absolute timestamp (ms) when the token expires. */
  expiresAt: number;
}

/** Possible reasons for OAuth flow failure. */
export enum OAuthErrorCode {
  /** User denied authorization or closed the browser window. */
  USER_CANCEL = "USER_CANCEL",
  /** No LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET env var. */
  MISSING_CREDENTIALS = "MISSING_CREDENTIALS",
  /** Callback timed out without receiving an authorization code. */
  TIMEOUT = "TIMEOUT",
  /** Token exchange request to LinkedIn failed. */
  EXCHANGE_FAILED = "EXCHANGE_FAILED",
  /** State parameter mismatch (possible CSRF). */
  STATE_MISMATCH = "STATE_MISMATCH",
  /** LinkedIn returned an error parameter in the callback. */
  AUTHORIZATION_DENIED = "AUTHORIZATION_DENIED",
  /** All ports in range were busy. */
  PORT_UNAVAILABLE = "PORT_UNAVAILABLE",
}

export class OAuthError extends Error {
  public readonly code: OAuthErrorCode;
  public readonly details?: string;

  constructor(code: OAuthErrorCode, message: string, details?: string) {
    super(message);
    this.name = "OAuthError";
    this.code = code;
    this.details = details;
  }
}

// ─── PKCE Helpers ────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random code_verifier per RFC 7636 §4.1.
 *
 * Characters are limited to unreserved URL-safe chars: A-Z, a-z, 0-9, -, ., _, ~
 * Length is `CODE_VERIFIER_LENGTH` (64 chars — well within the 43-128 range).
 */
export function generateCodeVerifier(): string {
  const bytes = randomBytes(CODE_VERIFIER_LENGTH);
  let verifier = "";
  for (let i = 0; i < CODE_VERIFIER_LENGTH; i++) {
    verifier += UNRESERVED_CHARS[bytes[i]! % UNRESERVED_CHARS.length];
  }
  return verifier;
}

/**
 * Compute the S256 code_challenge per RFC 7636 §4.2.
 *
 * challenge = base64url(SHA-256(verifier))
 */
export function computeCodeChallenge(verifier: string): string {
  const hash = createHash("sha256").update(verifier).digest();
  return hash
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Generate a random state string for CSRF protection.
 */
export function generateState(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Full PKCE challenge generation.
 *
 * Convenience wrapper that returns all three values needed for the
 * authorization request.
 */
export function generatePKCE(): PKCEChallenge {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = computeCodeChallenge(codeVerifier);
  const state = generateState();
  return { codeVerifier, codeChallenge, state };
}

// ─── URL Builder ─────────────────────────────────────────────────────────────

/**
 * Build the LinkedIn authorization URL with PKCE parameters.
 *
 * @param clientId      LinkedIn OAuth client ID.
 * @param codeChallenge  S256 code_challenge (from generatePKCE).
 * @param state          CSRF state parameter (from generatePKCE).
 * @param redirectUri    Callback URI (e.g. http://localhost:8080/callback).
 * @param scope          Comma- or space-separated OAuth scopes.
 */
export function buildAuthUrl(
  clientId: string,
  codeChallenge: string,
  state: string,
  redirectUri: string,
  scope: string = DEFAULT_SCOPE,
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

// ─── Token Exchange ──────────────────────────────────────────────────────────

/**
 * Exchange an authorization code for an access token.
 *
 * POSTs to LinkedIn's /accessToken endpoint with the code + code_verifier.
 *
 * @param clientId      LinkedIn OAuth client ID.
 * @param clientSecret  LinkedIn OAuth client secret.
 * @param code          The authorization code from the callback.
 * @param codeVerifier  The PKCE code_verifier used during authorization.
 * @param redirectUri   The same redirect_uri used in the auth request.
 * @returns Parsed token result.
 * @throws {OAuthError}  On HTTP or parsing failure.
 */
export async function exchangeCode(
  clientId: string,
  clientSecret: string,
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<TokenResult> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
    code_verifier: codeVerifier,
  });

  let response: Response;
  try {
    response = await fetch(LINKEDIN_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
    });
  } catch (err) {
    throw new OAuthError(
      OAuthErrorCode.EXCHANGE_FAILED,
      "Network error during token exchange with LinkedIn",
      err instanceof Error ? err.message : String(err),
    );
  }

  // LinkedIn may return 200 with an error body
  const data = await response.json().catch(() => ({})) as Record<string, unknown>;

  if (!response.ok || data.error) {
    const errorDesc = (data.error_description as string) || (data.error as string) || "Unknown error";
    throw new OAuthError(
      OAuthErrorCode.EXCHANGE_FAILED,
      `LinkedIn token exchange failed: ${errorDesc}`,
      JSON.stringify(data),
    );
  }

  const accessToken = data.access_token as string | undefined;
  const expiresIn = data.expires_in as number | undefined;
  const scope = (data.scope as string) || "";

  if (!accessToken || typeof expiresIn !== "number") {
    throw new OAuthError(
      OAuthErrorCode.EXCHANGE_FAILED,
      "LinkedIN returned unexpected response format — missing access_token or expires_in",
      JSON.stringify(data),
    );
  }

  return {
    accessToken,
    expiresIn,
    scope,
    expiresAt: Date.now() + expiresIn * 1000,
  };
}

// ─── Port Discovery ──────────────────────────────────────────────────────────

/**
 * Find an available port starting from `preferred`.
 *
 * Tries the preferred port first, then increments until an available port
 * is found or `maxAttempts` is exhausted.
 *
 * @param preferred    Starting port.
 * @param maxAttempts  Maximum number of ports to try (default 10).
 * @returns The available port number.
 * @throws {OAuthError}  If no port in range is available.
 */
export async function findAvailablePort(preferred: number, maxAttempts = 10): Promise<number> {
  for (let port = preferred; port < preferred + maxAttempts; port++) {
    const available = await isPortAvailable(port);
    if (available) return port;
  }
  throw new OAuthError(
    OAuthErrorCode.PORT_UNAVAILABLE,
    `Could not find an available port in range ${preferred}-${preferred + maxAttempts - 1}. ` +
    "Specify a different port or free up ports and try again.",
  );
}

/**
 * Check if a TCP port is available for listening.
 *
 * Tries to create a quick TCP server on the port and immediately closes it.
 */
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close();
      resolve(true);
    });
    server.listen(port, "127.0.0.1");
  });
}

// ─── Browser Launch ──────────────────────────────────────────────────────────

/**
 * Open a URL in the user's default browser (cross-platform).
 *
 * - Windows: `start "" "{url}"`
 * - macOS:   `open "{url}"`
 * - Linux:   `xdg-open "{url}"`
 */
export function openBrowser(url: string): void {
  const platform = process.platform;
  const cmd =
    platform === "win32"
      ? `start "" "${url}"`
      : platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;

  exec(cmd, (err) => {
    // Browser launch is best-effort — don't fail the flow if it errors
    if (err) {
      console.error(`[oauth] Failed to open browser: ${err.message}`);
      console.error(`[oauth] Open this URL manually: ${url}`);
    }
  });
}

// ─── Callback Server ─────────────────────────────────────────────────────────

export interface CallbackResult {
  /** The authorization code from LinkedIn. */
  code: string;
  /** The state parameter (for CSRF verification). */
  state: string;
}

/**
 * Start a temporary HTTP server on the given port and wait for the OAuth
 * callback from LinkedIn.
 *
 * The server handles exactly one `GET /callback` request, then shuts down.
 *
 * @param port       Port to listen on.
 * @param timeoutMs  Maximum wait time in ms before rejecting.
 * @returns The parsed callback query parameters.
 * @throws {OAuthError}  On timeout, error params, or missing code.
 */
export function waitForCallback(port: number, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<CallbackResult> {
  return new Promise((resolve, reject) => {
    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      if (!req.url || !req.url.startsWith("/callback")) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const url = new URL(req.url, `http://localhost:${port}`);
      const error = url.searchParams.get("error");
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state") || "";

      if (error) {
        const errorDesc = url.searchParams.get("error_description") || error;
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end(`<h2>Authorization denied</h2><p>${escapeHtml(errorDesc)}</p><p>You can close this window.</p>`);
        server.close();
        reject(new OAuthError(OAuthErrorCode.AUTHORIZATION_DENIED, `LinkedIn returned: ${errorDesc}`));
        return;
      }

      if (!code) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end("<h2>Missing authorization code</h2><p>You can close this window.</p>");
        server.close();
        reject(new OAuthError(OAuthErrorCode.USER_CANCEL, "No authorization code received in callback"));
        return;
      }

      // Show success page
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`<h2>Authorization successful!</h2><p>You may close this window and return to the terminal.</p>`);
      server.close();
      resolve({ code, state });
    });

    // Handle server errors
    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        reject(new OAuthError(OAuthErrorCode.PORT_UNAVAILABLE, `Port ${port} is already in use`));
      } else {
        reject(new OAuthError(OAuthErrorCode.EXCHANGE_FAILED, `Callback server error: ${err.message}`));
      }
    });

    server.listen(port, "127.0.0.1", () => {
      console.error(`[oauth] Callback server listening on http://127.0.0.1:${port}/callback`);
    });

    // Timeout
    if (timeoutMs > 0) {
      setTimeout(() => {
        server.close();
        reject(
          new OAuthError(
            OAuthErrorCode.TIMEOUT,
            `OAuth callback timed out after ${timeoutMs / 1000}s. ` +
            "The authorization URL is still valid — try again or open it manually.",
          ),
        );
      }, timeoutMs);
    }
  });
}

// ─── OAuthClient ─────────────────────────────────────────────────────────────

/**
 * High-level OAuth client that orchestrates the PKCE flow.
 *
 * Reads credentials from environment variables:
 *   - `LINKEDIN_CLIENT_ID`     (required)
 *   - `LINKEDIN_CLIENT_SECRET` (required)
 *
 * Token persistence is delegated to TokenStore (config file, not env vars).
 */
export class OAuthClient {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly tokenStore: TokenStore;

  /** PKCE challenge state — stored in memory, never written to disk. */
  private pendingPKCE: PKCEChallenge | null = null;

  /**
   * @param clientId     LinkedIn OAuth client ID (falls back to env var).
   * @param clientSecret LinkedIn OAuth client secret (falls back to env var).
   * @param tokenStore   TokenStore instance for persistence.
   */
  constructor(clientId?: string, clientSecret?: string, tokenStore?: TokenStore) {
    this.clientId = clientId || process.env.LINKEDIN_CLIENT_ID || "";
    this.clientSecret = clientSecret || process.env.LINKEDIN_CLIENT_SECRET || "";
    this.tokenStore = tokenStore || new TokenStore();

    if (!this.clientId) {
      throw new OAuthError(
        OAuthErrorCode.MISSING_CREDENTIALS,
        "LINKEDIN_CLIENT_ID is not set. Set it as an environment variable or pass it to the constructor.",
      );
    }
    if (!this.clientSecret) {
      throw new OAuthError(
        OAuthErrorCode.MISSING_CREDENTIALS,
        "LINKEDIN_CLIENT_SECRET is not set. Set it as an environment variable or pass it to the constructor.",
      );
    }
  }

  /** The stored PKCE challenge (for callback verification). */
  get pendingChallenge(): PKCEChallenge | null {
    return this.pendingPKCE;
  }

  /**
   * Start the OAuth PKCE authorization flow.
   *
   * 1. Find an available port
   * 2. Generate PKCE challenge
   * 3. Build authorization URL
   * 4. Open browser (if requested)
   * 5. Wait for callback
   * 6. Verify state
   * 7. Exchange code for token
   * 8. Save token to config
   *
   * @param options.port         Preferred port (default 8080).
   * @param options.openBrowser  Whether to auto-open the browser (default true).
   * @param options.timeoutMs    Max wait for callback (default 120s).
   * @returns The saved token result.
   */
  async startAuthFlow(
    options: { port?: number; openBrowser?: boolean; timeoutMs?: number } = {},
  ): Promise<TokenResult> {
    const port = await findAvailablePort(options.port ?? 8080);
    const redirectUri = `http://localhost:${port}/callback`;
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    // 1. Generate PKCE challenge
    const pkce = generatePKCE();
    this.pendingPKCE = pkce;

    // 2. Build auth URL
    const authUrl = buildAuthUrl(this.clientId, pkce.codeChallenge, pkce.state, redirectUri);

    // 3. Open browser
    if (options.openBrowser !== false) {
      console.error("[oauth] Opening browser for LinkedIn authorization...");
      openBrowser(authUrl);
    } else {
      console.error(`[oauth] Open this URL in your browser:\n${authUrl}`);
    }

    // 4. Wait for callback
    const callback = await waitForCallback(port, timeoutMs);

    // 5. Verify state (CSRF protection)
    if (callback.state !== pkce.state) {
      throw new OAuthError(
        OAuthErrorCode.STATE_MISMATCH,
        "State parameter mismatch — possible CSRF attack. Please try again.",
      );
    }

    // 6. Exchange code for token
    const tokenResult = await exchangeCode(
      this.clientId,
      this.clientSecret,
      callback.code,
      pkce.codeVerifier,
      redirectUri,
    );

    // 7. Save token
    await this.tokenStore.setToken(tokenResult.accessToken, tokenResult.expiresAt);

    console.error("[oauth] Token saved successfully.");

    return tokenResult;
  }

  /** Clear the pending PKCE challenge (e.g. on error or completion). */
  clearPendingChallenge(): void {
    this.pendingPKCE = null;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Minimal HTML-entity escape for the success/error pages. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
