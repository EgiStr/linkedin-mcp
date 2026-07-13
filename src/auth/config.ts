/**
 * Config file management for LinkedIn MCP auth.
 *
 * Resolves config paths cross-platform and manages token persistence
 * as a config-file alternative to the LINKEDIN_ACCESS_TOKEN env var.
 *
 * Path resolution:
 *   - Windows: %APPDATA%/linkedin-mcp/config.json
 *   - macOS/Linux: ~/.config/linkedin-mcp/config.json
 */

import { mkdir, writeFile, readFile, unlink, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import os from "node:os";

/**
 * Persistent config values for LinkedIn API authentication.
 * Stored as JSON on disk; fields are optional to support partial saves.
 */
export interface LinkedInConfig {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  clientId?: string;
  clientSecret?: string;
}

/**
 * Resolves the platform-appropriate config directory root.
 *
 * Windows:  %APPDATA%/linkedin-mcp
 * Other:    ~/.config/linkedin-mcp
 */
export function resolveConfigDir(): string {
  const baseDir = process.env.APPDATA
    ? process.env.APPDATA
    : path.join(os.homedir(), ".config");
  return path.join(baseDir, "linkedin-mcp");
}

/**
 * Manages reading, writing, and clearing the LinkedIn config file.
 *
 * Accepts an optional `configDir` override for testing; when omitted
 * the platform default is used (see `resolveConfigDir`).
 */
export class ConfigManager {
  private readonly configDir: string;
  private readonly configPath: string;

  /**
   * @param configDir  Optional override — when set, the config file is
   *                   stored at `<configDir>/config.json`. Intended for
   *                   tests and custom installations.
   */
  constructor(configDir?: string) {
    this.configDir = configDir ?? resolveConfigDir();
    this.configPath = path.join(this.configDir, "config.json");
  }

  /** Full path to the config file on disk. */
  get path(): string {
    return this.configPath;
  }

  /** Config directory (parent of the config file). */
  get dir(): string {
    return this.configDir;
  }

  /**
   * Load config from disk.
   * @returns The parsed config, or `null` if the file doesn't exist
   *          or can't be read/parsed.
   */
  async load(): Promise<LinkedInConfig | null> {
    try {
      await access(this.configPath, constants.R_OK);
      const raw = await readFile(this.configPath, "utf-8");
      return JSON.parse(raw) as LinkedInConfig;
    } catch {
      // File missing, unreadable, or malformed JSON — treat as absent
      return null;
    }
  }

  /**
   * Persist config to disk. Creates the config directory (recursively)
   * if it doesn't exist.
   *
   * @throws {Error}  If the directory can't be created or the file
   *                  can't be written (e.g. permission denied).
   */
  async save(config: LinkedInConfig): Promise<void> {
    // ponytail: mkdir on every save; the OS caches the dir existence so
    // the cost is negligible vs. a stat check for the common case.
    await mkdir(this.configDir, { recursive: true });
    await writeFile(this.configPath, JSON.stringify(config, null, 2), "utf-8");
  }

  /**
   * Convenience: read only the access token from the config file.
   * @returns The stored token or `null`.
   */
  async getToken(): Promise<string | null> {
    const config = await this.load();
    return config?.accessToken ?? null;
  }

  /**
   * Convenience: write (or update) the access token and optional expiry.
   * Merges with any existing config so other fields are preserved.
   */
  async saveToken(token: string, expiresAt?: number): Promise<void> {
    const config = (await this.load()) ?? {};
    config.accessToken = token;
    if (expiresAt !== undefined) {
      config.expiresAt = expiresAt;
    }
    await this.save(config);
  }

  /**
   * Delete the config file from disk. Succeeds silently if the file
   * doesn't exist.
   */
  async clear(): Promise<void> {
    try {
      await unlink(this.configPath);
    } catch {
      // File already absent — nothing to do
    }
  }
}
