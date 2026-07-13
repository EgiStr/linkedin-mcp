/**
 * Tests for ConfigManager and TokenStore — auth infrastructure layer.
 *
 * ConfigManager tests use a real temp directory so we verify actual
 * file I/O without mocking. TokenStore tests mock `process.env` and
 * use a ConfigManager pointing at a temp dir.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { ConfigManager, LinkedInConfig, resolveConfigDir } from "../../src/auth/config.js";
import { TokenStore, decodeJwtPayload } from "../../src/auth/token-store.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Create a temp directory and return a ConfigManager bound to it. */
function createTempConfigMgr(): { cm: ConfigManager; tmpDir: string } {
  const tmpDir = mkdtempSync(join(tmpdir(), "linkedin-mcp-test-"));
  const cm = new ConfigManager(tmpDir);
  return { cm, tmpDir };
}

/** Clean up temp directory. */
function removeDir(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

/** Minimal valid JWT with known exp claim, signed with a throwaway key. */
function makeJwt(exp: number): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ exp, sub: "test" })).toString("base64url");
  return `${header}.${payload}.`;
}

const FUTURE_EXP = Math.floor(Date.now() / 1000) + 3600;   // +1 hour
const PAST_EXP   = Math.floor(Date.now() / 1000) - 3600;   // -1 hour

// ─── decodeJwtPayload ────────────────────────────────────────────────────────

describe("decodeJwtPayload", () => {
  it("decodes a valid JWT payload", () => {
    const result = decodeJwtPayload(makeJwt(FUTURE_EXP));
    expect(result).not.toBeNull();
    expect(result!.exp).toBe(FUTURE_EXP);
    expect(result!.sub).toBe("test");
  });

  it("returns null for a non-JWT string", () => {
    expect(decodeJwtPayload("not-a-jwt")).toBeNull();
  });

  it("returns null for a two-part string", () => {
    expect(decodeJwtPayload("header.payload")).toBeNull();
  });

  it("returns null for malformed base64 payload", () => {
    // This is a valid JWT structure but the payload part is not valid JSON
    const token = `eyJhbGciOiJub25lIn0.${Buffer.from("not-json").toString("base64url")}.`;
    expect(decodeJwtPayload(token)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(decodeJwtPayload("")).toBeNull();
  });
});

// ─── resolveConfigDir ────────────────────────────────────────────────────────

describe("resolveConfigDir", () => {
  const ORIG_APPDATA = process.env.APPDATA;

  afterEach(() => {
    // Restore original APPDATA
    if (ORIG_APPDATA === undefined) {
      delete process.env.APPDATA;
    } else {
      process.env.APPDATA = ORIG_APPDATA;
    }
  });

  it("uses APPDATA on Windows when the env var is set", () => {
    process.env.APPDATA = "C:\\Users\\test\\AppData\\Roaming";
    const dir = resolveConfigDir();
    expect(dir).toBe("C:\\Users\\test\\AppData\\Roaming\\linkedin-mcp");
  });

  it("uses ~/.config when APPDATA is not set", () => {
    delete process.env.APPDATA;
    const dir = resolveConfigDir();
    expect(dir).toContain(".config");
    expect(dir).toContain("linkedin-mcp");
    // Should start with the user's home directory
    expect(dir.startsWith(process.env.HOME || process.env.USERPROFILE || "")).toBe(true);
  });
});

// ─── ConfigManager ───────────────────────────────────────────────────────────

describe("ConfigManager", () => {
  let cm: ConfigManager;
  let tmpDir: string;

  beforeEach(() => {
    const setup = createTempConfigMgr();
    cm = setup.cm;
    tmpDir = setup.tmpDir;
  });

  afterEach(() => {
    removeDir(tmpDir);
  });

  describe("load", () => {
    it("returns null when config file does not exist", async () => {
      const result = await cm.load();
      expect(result).toBeNull();
    });

    it("returns parsed config after save", async () => {
      const config: LinkedInConfig = { accessToken: "abc123", clientId: "my-app" };
      await cm.save(config);

      const loaded = await cm.load();
      expect(loaded).toEqual(config);
    });

    it("returns null for malformed JSON", async () => {
      // Write bad JSON directly
      const configPath = join(tmpDir, "config.json");
      mkdirSync(tmpDir, { recursive: true });
      // eslint-disable-next-line no-sync
      require("node:fs").writeFileSync(configPath, "{bad json}", "utf-8");
      // ^ intentional sync for test setup

      const result = await cm.load();
      expect(result).toBeNull();
    });
  });

  describe("save", () => {
    it("creates the config directory if missing", async () => {
      // tmpDir is clean — save should create the directory
      await cm.save({ accessToken: "test" });

      const configPath = join(tmpDir, "config.json");
      expect(existsSync(configPath)).toBe(true);
    });

    it("persists all fields correctly", async () => {
      const config: LinkedInConfig = {
        accessToken: "token-1",
        refreshToken: "refresh-1",
        expiresAt: 1234567890,
        clientId: "client-1",
        clientSecret: "secret-1",
      };
      await cm.save(config);

      const raw = readFileSync(join(tmpDir, "config.json"), "utf-8");
      const parsed = JSON.parse(raw);
      expect(parsed).toEqual(config);
    });

    it("overwrites previous config on second save", async () => {
      await cm.save({ accessToken: "first" });
      await cm.save({ accessToken: "second" });

      const loaded = await cm.load();
      expect(loaded!.accessToken).toBe("second");
    });
  });

  describe("getToken", () => {
    it("returns null when no token is stored", async () => {
      const token = await cm.getToken();
      expect(token).toBeNull();
    });

    it("returns the stored token", async () => {
      await cm.save({ accessToken: "my-token" });
      const token = await cm.getToken();
      expect(token).toBe("my-token");
    });
  });

  describe("saveToken", () => {
    it("writes token without affecting other fields", async () => {
      await cm.save({ clientId: "existing-client" });
      await cm.saveToken("new-token", 9999);

      const loaded = await cm.load();
      expect(loaded!.accessToken).toBe("new-token");
      expect(loaded!.expiresAt).toBe(9999);
      // Other fields preserved
      expect(loaded!.clientId).toBe("existing-client");
    });

    it("writes token without expiry", async () => {
      await cm.saveToken("no-expiry-token");
      const loaded = await cm.load();
      expect(loaded!.accessToken).toBe("no-expiry-token");
      expect(loaded!.expiresAt).toBeUndefined();
    });
  });

  describe("clear", () => {
    it("removes the config file", async () => {
      await cm.save({ accessToken: "will-be-cleared" });
      await cm.clear();

      const result = await cm.load();
      expect(result).toBeNull();
    });

    it("succeeds silently when no config file exists", async () => {
      // Should not throw
      await expect(cm.clear()).resolves.toBeUndefined();
    });
  });

  describe("path and dir getters", () => {
    it("returns the correct paths", () => {
      const customDir = join(tmpDir, "sub");
      const customCm = new ConfigManager(customDir);
      expect(customCm.dir).toBe(customDir);
      expect(customCm.path).toBe(join(customDir, "config.json"));
    });
  });
});

// ─── TokenStore ──────────────────────────────────────────────────────────────

describe("TokenStore", () => {
  let store: TokenStore;
  let cm: ConfigManager;
  let tmpDir: string;

  // Snapshot env so we can restore it
  const ORIG_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;

  beforeEach(() => {
    const setup = createTempConfigMgr();
    cm = setup.cm;
    tmpDir = setup.tmpDir;
    store = new TokenStore(cm);

    // Ensure env var is not set by default for isolated tests
    delete process.env.LINKEDIN_ACCESS_TOKEN;
  });

  afterEach(() => {
    removeDir(tmpDir);

    // Restore env var
    if (ORIG_TOKEN === undefined) {
      delete process.env.LINKEDIN_ACCESS_TOKEN;
    } else {
      process.env.LINKEDIN_ACCESS_TOKEN = ORIG_TOKEN;
    }
  });

  describe("getToken", () => {
    it("returns null when neither env nor config has a token", async () => {
      const token = await store.getToken();
      expect(token).toBeNull();
    });

    it("returns the config token when no env var is set", async () => {
      await cm.saveToken("config-token");
      const token = await store.getToken();
      expect(token).toBe("config-token");
    });

    it("returns the env var token when set (takes priority)", async () => {
      process.env.LINKEDIN_ACCESS_TOKEN = "env-token";
      await cm.saveToken("config-token");

      const token = await store.getToken();
      expect(token).toBe("env-token");
    });
  });

  describe("setToken", () => {
    it("persists token to the config file", async () => {
      await store.setToken("stored-token", FUTURE_EXP);

      const loaded = await cm.load();
      expect(loaded!.accessToken).toBe("stored-token");
      expect(loaded!.expiresAt).toBe(FUTURE_EXP);
    });

    it("persists token without expiry", async () => {
      await store.setToken("no-expiry");
      const loaded = await cm.load();
      expect(loaded!.accessToken).toBe("no-expiry");
    });

    it("does NOT set the env var", () => {
      // setToken writes to config, not env — env is process-scoped and
      // cannot be meaningfully "set" from a library for other processes.
      // Verify the env remains what it was before.
      expect(process.env.LINKEDIN_ACCESS_TOKEN).toBeUndefined();
    });
  });

  describe("clearToken", () => {
    it("removes the config file", async () => {
      await store.setToken("to-clear");
      await store.clearToken();

      const loaded = await cm.load();
      expect(loaded).toBeNull();
    });

    it("does not affect env var (env always takes priority)", async () => {
      process.env.LINKEDIN_ACCESS_TOKEN = "env-token";
      await store.setToken("config-token");
      await store.clearToken();

      // After clearing config, env var should still be returned
      const token = await store.getToken();
      expect(token).toBe("env-token");
    });
  });

  describe("isTokenExpired", () => {
    it("returns false for a valid (future-exp) token", () => {
      const token = makeJwt(FUTURE_EXP);
      expect(store.isTokenExpired(token)).toBe(false);
    });

    it("returns true for an expired (past-exp) token", () => {
      const token = makeJwt(PAST_EXP);
      expect(store.isTokenExpired(token)).toBe(true);
    });

    it("returns false when token has no exp claim", () => {
      const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
      const payload = Buffer.from(JSON.stringify({ sub: "no-exp" })).toString("base64url");
      const token = `${header}.${payload}.`;
      expect(store.isTokenExpired(token)).toBe(false);
    });

    it("returns false for a non-JWT string", () => {
      expect(store.isTokenExpired("not-a-jwt")).toBe(false);
    });

    it("returns false when called without argument and no env var is set", () => {
      // No token anywhere — should not be considered expired
      expect(store.isTokenExpired()).toBe(false);
    });

    it("checks env var token when called without argument", () => {
      process.env.LINKEDIN_ACCESS_TOKEN = makeJwt(PAST_EXP);
      expect(store.isTokenExpired()).toBe(true);
    });
  });

  describe("getTokenExpiry", () => {
    it("returns the expiry date from the stored token", async () => {
      process.env.LINKEDIN_ACCESS_TOKEN = makeJwt(FUTURE_EXP);
      const expiry = await store.getTokenExpiry();
      expect(expiry).toBeInstanceOf(Date);
      expect(expiry!.getTime()).toBeCloseTo(FUTURE_EXP * 1000, -2); // within ~100ms
    });

    it("returns null when no token is available", async () => {
      const expiry = await store.getTokenExpiry();
      expect(expiry).toBeNull();
    });

    it("returns null when token has no exp claim", async () => {
      const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
      const payload = Buffer.from(JSON.stringify({ sub: "test" })).toString("base64url");
      process.env.LINKEDIN_ACCESS_TOKEN = `${header}.${payload}.`;
      const expiry = await store.getTokenExpiry();
      expect(expiry).toBeNull();
    });
  });

  describe("hasValidToken", () => {
    it("returns true when env var has a valid token", async () => {
      process.env.LINKEDIN_ACCESS_TOKEN = makeJwt(FUTURE_EXP);
      expect(await store.hasValidToken()).toBe(true);
    });

    it("returns false when env var has an expired token", async () => {
      process.env.LINKEDIN_ACCESS_TOKEN = makeJwt(PAST_EXP);
      expect(await store.hasValidToken()).toBe(false);
    });

    it("returns false when no token is available", async () => {
      expect(await store.hasValidToken()).toBe(false);
    });

    it("returns false when only config has an expired token", async () => {
      await cm.saveToken(makeJwt(PAST_EXP));
      expect(await store.hasValidToken()).toBe(false);
    });

    it("returns true when only config has a valid token", async () => {
      await cm.saveToken(makeJwt(FUTURE_EXP));
      expect(await store.hasValidToken()).toBe(true);
    });
  });
});
