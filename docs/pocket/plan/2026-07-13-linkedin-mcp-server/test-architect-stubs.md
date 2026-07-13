# Test-Architect: Test Stubs

**Date:** 2026-07-13
**Plan:** docs/pocket/plan/2026-07-13-linkedin-mcp-server/

---

## Test Stub: T1 — Auth Infrastructure

### File: `tests/auth/config.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";

// Stub: will import from src/auth/config.ts after creation
// import { getConfigPath, readConfig, writeConfig, clearConfig } from "../../src/auth/config.js";

describe("Config Module", () => {
  const testDir = path.join(os.tmpdir(), "linkedin-mcp-test");

  beforeEach(() => {
    // Clean test directory
    try { fs.rmSync(testDir, { recursive: true }); } catch { /* ok */ }
  });

  afterEach(() => {
    try { fs.rmSync(testDir, { recursive: true }); } catch { /* ok */ }
  });

  it("getConfigPath returns correct path with .config/linkedin-mcp/config.json");
  it("readConfig returns null when config file doesn't exist");
  it("readConfig returns parsed JSON when config file exists");
  it("readConfig returns null on corrupt JSON without crashing");
  it("writeConfig creates directory and writes valid JSON");
  it("writeConfig overwrites existing config file");
  it("writeConfig handles permission errors gracefully");
  it("clearConfig removes config file if it exists");
  it("clearConfig does not throw if config file doesn't exist");
  it("config path uses os.homedir() cross-platform");
});
```

### File: `tests/auth/token-store.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";

// Stub: will import from src/auth/token-store.ts after creation
// import { getAccessToken, saveToken, loadToken, clearToken } from "../../src/auth/token-store.js";

describe("Token Store", () => {
  beforeEach(() => {
    delete process.env.LINKEDIN_ACCESS_TOKEN;
  });

  afterEach(() => {
    delete process.env.LINKEDIN_ACCESS_TOKEN;
  });

  it("getAccessToken returns env var when set", () => {
    process.env.LINKEDIN_ACCESS_TOKEN = "env-token-123";
    // expect(getAccessToken()).toBe("env-token-123");
  });

  it("getAccessToken falls back to config file when env not set");
  it("getAccessToken returns null when no token available");

  it("saveToken writes token to config file");
  it("saveToken stores accessToken, expiresAt, and scopes");

  it("loadToken returns token from config file");
  it("loadToken returns null when no token configured");

  it("clearToken removes token from config file");
  it("env var takes priority over config file token");
  it("expired token is still returned (expiry is client's concern)");
});
```

---

## Test Stub: T2 — PKCE OAuth Tool

### File: `tests/auth/oauth.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import nock from "nock";

// Stub: will import from src/auth/oauth.ts after creation
// import { generatePKCE, buildAuthUrl, exchangeCode } from "../../src/auth/oauth.js";

const LINKEDIN_AUTH = "https://www.linkedin.com";
const CLIENT_ID = "test-client-id";

describe("PKCE OAuth Module", () => {
  describe("generatePKCE", () => {
    it("generates codeVerifier of 43-128 characters");
    it("generates codeChallenge as base64url-encoded SHA-256 hash");
    it("generates state parameter as random string");
    it("codeVerifier contains only unreserved URL-safe characters");
  });

  describe("buildAuthUrl", () => {
    it("returns LinkedIn authorize URL with all required params", () => {
      const url = buildAuthUrl({
        clientId: CLIENT_ID,
        redirectUri: "http://localhost:8080/callback",
        scopes: ["openid", "profile", "w_member_social"],
        codeChallenge: "test-challenge",
        state: "test-state",
      });
      expect(url).toContain("https://www.linkedin.com/oauth/v2/authorization");
      expect(url).toContain("response_type=code");
      expect(url).toContain(`client_id=${encodeURIComponent(CLIENT_ID)}`);
      expect(url).toContain("code_challenge=test-challenge");
      expect(url).toContain("code_challenge_method=S256");
      expect(url).toContain("state=test-state");
      expect(url).toContain("scope=");
      expect(url).toContain("redirect_uri=");
    });
  });

  describe("exchangeCode", () => {
    it("POSTs to LinkedIn token endpoint and returns access token", async () => {
      nock(LINKEDIN_AUTH)
        .post("/oauth/v2/accessToken", body => {
          return body.includes("grant_type=authorization_code")
            && body.includes("code=test-auth-code")
            && body.includes("code_verifier=test-verifier");
        })
        .reply(200, {
          access_token: "AQX_mock_token",
          expires_in: 5184000,
          scope: "openid profile w_member_social",
        });

      const result = await exchangeCode({
        clientId: CLIENT_ID,
        clientSecret: "test-secret",
        code: "test-auth-code",
        codeVerifier: "test-verifier",
        redirectUri: "http://localhost:8080/callback",
      });

      expect(result.accessToken).toBe("AQX_mock_token");
      expect(result.expiresIn).toBe(5184000);
    });

    it("handles invalid client_id error");
    it("handles network failure during exchange");
    it("handles expired authorization code");
  });
});
```

---

## Test Stub: T3 — Media Upload Infrastructure

### File: `tests/media/uploader.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import nock from "nock";
import fs from "fs";
import path from "path";
import os from "os";

// Stub: will import from src/media/uploader.ts after creation
// import { initializeUpload, uploadBinary, getImageUrn, uploadImage } from "../../src/media/uploader.js";

const API_BASE = "https://api.linkedin.com";
const TEST_TOKEN = "test-token";

describe("Media Uploader", () => {
  let testImageDir: string;
  let validJpegPath: string;
  let validPngPath: string;
  let largeImagePath: string;
  let invalidFilePath: string;

  beforeEach(() => {
    testImageDir = fs.mkdtempSync(path.join(os.tmpdir(), "uploader-test-"));
    validJpegPath = path.join(testImageDir, "test.jpg");
    validPngPath = path.join(testImageDir, "test.png");
    largeImagePath = path.join(testImageDir, "large.jpg");
    invalidFilePath = path.join(testImageDir, "script.exe");

    // Create test files
    fs.writeFileSync(validJpegPath, Buffer.alloc(1024)); // 1KB valid JPEG
    fs.writeFileSync(validPngPath, Buffer.alloc(2048));  // 2KB valid PNG
    fs.writeFileSync(largeImagePath, Buffer.alloc(11 * 1024 * 1024)); // 11MB (exceeds limit)
    fs.writeFileSync(invalidFilePath, Buffer.alloc(100));

    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
    try { fs.rmSync(testImageDir, { recursive: true }); } catch { /* ok */ }
  });

  describe("initializeUpload", () => {
    it("POSTs /rest/images and returns uploadUrl and image URN", async () => {
      nock(API_BASE)
        .post("/rest/images?action=initializeUpload")
        .reply(200, {
          value: {
            uploadUrl: "https://example.com/upload",
            image: "urn:li:image:img-001",
          },
        });

      const result = await initializeUpload(TEST_TOKEN, "urn:li:person:member-456");
      expect(result.uploadUrl).toBe("https://example.com/upload");
      expect(result.imageUrn).toBe("urn:li:image:img-001");
    });
  });

  describe("uploadBinary", () => {
    it("PUTs binary data to uploadUrl with correct Content-Type");
    it("handles upload failure with retryable error");
  });

  describe("getImageUrn", () => {
    it("GETs /rest/images/{id} and returns confirmed image URN");
  });

  describe("uploadImage (orchestration)", () => {
    it("runs all 3 steps in sequence and returns final URN", async () => {
      nock(API_BASE)
        .post("/rest/images?action=initializeUpload")
        .reply(200, {
          value: {
            uploadUrl: "https://example.com/upload",
            image: "urn:li:image:img-001",
          },
        });

      nock("https://example.com")
        .put("/upload")
        .reply(201);

      nock(API_BASE)
        .get("/rest/images/img-001")
        .reply(200, { id: "img-001", urn: "urn:li:image:img-001" });

      const result = await uploadImage(TEST_TOKEN, validJpegPath, "urn:li:person:member-456");
      expect(result.imageUrn).toBe("urn:li:image:img-001");
    });

    it("rejects unsupported file types (.exe, .txt)");
    it("rejects files larger than 10MB");
    it("handles missing file path gracefully");
  });
});
```

---

## Test Stub: T4 — Media Upload Integration

### File: `tests/tools/posts.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import nock from "nock";
import fs from "fs";
import path from "path";
import os from "os";

// Stub: will import after T4 implementation
// import { createPostsTools } from "../../src/tools/posts.js";
// import { LinkedInClient, ResponseFormat } from "../../src/types.js";

const API_BASE = "https://api.linkedin.com";

describe("Posts Tools — Media Integration", () => {
  let testImageDir: string;
  let testImagePath: string;

  beforeEach(() => {
    testImageDir = fs.mkdtempSync(path.join(os.tmpdir(), "posts-test-"));
    testImagePath = path.join(testImageDir, "test.jpg");
    fs.writeFileSync(testImagePath, Buffer.alloc(1024));
  });

  afterEach(() => {
    try { fs.rmSync(testImageDir, { recursive: true }); } catch { /* ok */ }
  });

  describe("createPost with media_url", () => {
    it("uploads image then creates post with image URN");
    it("returns error for invalid media_url");
    it("returns error when upload fails");
    it("preserves text-only post behavior when no media_url");
    it("formats response as markdown by default with image info");
    it("formats response as JSON when requested");
  });
});
```

---

## Test Stub: T5 — Cross-Platform Fixes

### Additions to `tests/core-enhancements.test.ts`

```typescript
describe("Node.js Version Check", () => {
  it("passes when Node >= 18");
  it("fails with clear message when Node < 18");
});

describe("LinkedInClient.setAccessToken", () => {
  it("updates the access token");
  it("updates the Authorization header");
  it("preserves other Axios config");
});
```

### Additions to `tests/auth/config.test.ts`

```typescript
describe("Config Module — Cross-Platform", () => {
  it("resolves path with forward slashes on Unix (mocked)");
  it("resolves path with backslashes on Windows (mocked)");
  it("handles spaces in home directory path");
});
```

---

## Test Stub: T6 — npm Publish Setup (manual verification)

```bash
# Command-based tests — no new test file needed
npm pack --dry-run  # Verify file list
node -e "const p = require('./package.json'); assert(p.name); assert(p.version);"
```

---

## Summary

| Test File | New/Existing | Tests |
|-----------|-------------|-------|
| `tests/auth/config.test.ts` | NEW | 10 unit tests |
| `tests/auth/token-store.test.ts` | NEW | 10 unit tests |
| `tests/auth/oauth.test.ts` | NEW | 9 unit tests (3 for generatePKCE, 1 for buildAuthUrl, 5 for exchangeCode) |
| `tests/media/uploader.test.ts` | NEW | 10 unit tests (2 init, 1 binary, 1 getUrn, 4 uploadImage, 2 validation) |
| `tests/tools/posts.test.ts` | NEW | 6 integration tests |
| `tests/core-enhancements.test.ts` | MODIFY | +5 tests (2 version check, 3 setAccessToken) |
| **Total** | **6 files** | **50 new test cases** |
