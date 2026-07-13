/**
 * Token persistence layer with env-var fallback and JWT expiry inspection.
 *
 * Priority: `LINKEDIN_ACCESS_TOKEN` env var → config file on disk.
 * The env var always wins when set, making it suitable for ephemeral
 * CI / container environments; the config file serves persistent local dev.
 *
 * JWT decoding is done without external libraries — only the `exp` claim
 * is extracted from the base64url-encoded payload.
 */

import { ConfigManager } from "./config.js";

/**
 * Decode the payload segment of a JWT without verification.
 *
 * This is intentionally narrow: only the `exp` claim is extracted.
 * The token is NOT validated for signature — that's the OAuth / resource
 * server's job.
 *
 * @param token  A JWT string (three dot-separated base64url segments).
 * @returns The decoded payload object, or `null` if parsing fails.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Base64url → standard base64
    const base64 = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Token store that reads from the env var first, then falls back to
 * the on-disk config file managed by `ConfigManager`.
 */
export class TokenStore {
  private readonly config: ConfigManager;

  /**
   * @param config  An optional `ConfigManager` instance. When omitted one
   *                is created with default platform paths.
   */
  constructor(config?: ConfigManager) {
    this.config = config ?? new ConfigManager();
  }

  /**
   * Resolve the current access token.
   *
   * Priority:
   *   1. `LINKEDIN_ACCESS_TOKEN` environment variable
   *   2. Config file on disk (via ConfigManager)
   *
   * @returns The token string, or `null` if neither source has one.
   */
  async getToken(): Promise<string | null> {
    const envToken = process.env.LINKEDIN_ACCESS_TOKEN;
    if (envToken) return envToken;

    return this.config.getToken();
  }

  /**
   * Persist a token to the config file.
   *
   * NOTE: This does NOT set the env var (which is process-scoped and
   * cannot be written back).  The env var always takes priority on reads.
   */
  async setToken(token: string, expiresAt?: number): Promise<void> {
    await this.config.saveToken(token, expiresAt);
  }

  /**
   * Remove the token from the config file.  If `LINKEDIN_ACCESS_TOKEN`
   * is set in the environment it will continue to be returned by
   * `getToken()` until unset.
   */
  async clearToken(): Promise<void> {
    await this.config.clear();
  }

  /**
   * Check whether a token is expired by inspecting its JWT `exp` claim.
   *
   * A token with no `exp` claim, or one that can't be decoded, is
   * considered **not expired** (the caller should try to use it and
   * handle the API error).
   *
   * @param token  Optional token to inspect. When omitted the stored
   *               token (env or config) is used.
   */
  isTokenExpired(token?: string): boolean {
    const raw = token ?? process.env.LINKEDIN_ACCESS_TOKEN;
    if (!raw) return false;

    const payload = decodeJwtPayload(raw);
    if (!payload) return false;

    const exp = payload.exp;
    if (typeof exp !== "number") return false;

    // `exp` is in seconds; Date.now() is in milliseconds
    return Date.now() >= exp * 1000;
  }

  /**
   * Return the expiry date stored in the current token's JWT payload.
   *
   * @returns A `Date` when the token expires, or `null` if unknown.
   */
  async getTokenExpiry(): Promise<Date | null> {
    const token = await this.getToken();
    if (!token) return null;

    const payload = decodeJwtPayload(token);
    if (!payload) return null;

    const exp = payload.exp;
    if (typeof exp !== "number") return null;

    return new Date(exp * 1000);
  }

  /**
   * Convenience check: do we have a token that is both present and
   * not (demonstrably) expired?
   */
  async hasValidToken(): Promise<boolean> {
    const token = await this.getToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }
}
