/**
 * Tests for create_post tool with media upload integration (T4).
 *
 * Tests the end-to-end flow:
 * - media_url → fetches image → 3-step LinkedIn upload → creates post with image
 * - media_path → reads local file → 3-step upload → creates post with image
 * - Invalid media → structured error codes
 * - No media → backward-compatible text-only posts
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import nock from "nock";
import { writeFileSync, unlinkSync, mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { LinkedInClient } from "../../src/services/linkedin-client.js";
import { createPostsTools } from "../../src/tools/posts.js";
import { ResponseFormat } from "../../src/types.js";

// ─── Constants ──────────────────────────────────────────────────────────────

const API_BASE = "https://api.linkedin.com";
const FAKE_TOKEN = "test-media-post-token";

// ─── Test Suite ─────────────────────────────────────────────────────────────

describe("create_post with media upload", () => {
  let client: LinkedInClient;

  beforeEach(() => {
    client = new LinkedInClient(FAKE_TOKEN);
    nock.cleanAll();
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.enableNetConnect();
    nock.cleanAll();
  });

  // ─── media_url Flow ──────────────────────────────────────────────────────

  describe("media_url parameter", () => {
    it("uploads image from URL and creates post with image attached", async () => {
      const tools = createPostsTools(client);

      // Member ID lookup
      nock(API_BASE)
        .get("/v2/userinfo")
        .reply(200, { sub: "member-media-456" });

      // Image fetch from URL
      const fakeImage = createFakeBuffer(2048);
      nock("https://cdn.example.com")
        .get("/photos/banner.jpg")
        .reply(200, fakeImage, { "content-type": "image/jpeg" });

      // Step 1: Initialize upload
      nock(API_BASE)
        .post("/rest/images")
        .query({ action: "initializeUpload" })
        .reply(200, {
          value: {
            uploadUrl: "https://upload.linkedin.com/img/t4-url-test",
            image: "urn:li:image:C4E10AQFoyyAjHPMQuQ",
          },
        });

      // Step 2: Binary upload
      nock("https://upload.linkedin.com")
        .put("/img/t4-url-test")
        .reply(201);

      // Create post — validates body includes content.media.id
      nock(API_BASE)
        .post("/rest/posts", (body) => {
          return (
            body.commentary === "Check out my new banner!" &&
            body.content?.media?.id === "urn:li:image:C4E10AQFoyyAjHPMQuQ" &&
            body.content?.media?.altText === "Company banner" &&
            body.lifecycleState === "PUBLISHED"
          );
        })
        .reply(201, "", {
          "x-restli-id": "urn:li:share:post-media-001",
        });

      const result = await tools.createPost.handler({
        text: "Check out my new banner!",
        media_url: "https://cdn.example.com/photos/banner.jpg",
        alt_text: "Company banner",
        response_format: ResponseFormat.JSON,
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.postId).toBe("post-media-001");
      expect(data.has_media).toBe(true);
      expect(data.text).toContain("Check out my new banner!");
    });

    it("creates post with media_url and no alt_text (defaults to Image)", async () => {
      const tools = createPostsTools(client);

      nock(API_BASE)
        .get("/v2/userinfo")
        .reply(200, { sub: "member-media-456" });

      const fakeImage = createFakeBuffer(1024);
      nock("https://cdn.example.com")
        .get("/photos/photo.jpg")
        .reply(200, fakeImage, { "content-type": "image/jpeg" });

      nock(API_BASE)
        .post("/rest/images")
        .query({ action: "initializeUpload" })
        .reply(200, {
          value: {
            uploadUrl: "https://upload.linkedin.com/img/no-alt",
            image: "urn:li:image:no-alt-test",
          },
        });

      nock("https://upload.linkedin.com")
        .put("/img/no-alt")
        .reply(201);

      nock(API_BASE)
        .post("/rest/posts", (body) => {
          return (
            body.content?.media?.altText === "Image" &&
            body.content?.media?.id === "urn:li:image:no-alt-test"
          );
        })
        .reply(201, "", {
          "x-restli-id": "urn:li:share:post-no-alt",
        });

      const result = await tools.createPost.handler({
        text: "Photo without alt text",
        media_url: "https://cdn.example.com/photos/photo.jpg",
        response_format: ResponseFormat.JSON,
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.postId).toBe("post-no-alt");
      expect(data.has_media).toBe(true);
    });
  });

  // ─── media_path Flow ─────────────────────────────────────────────────────

  describe("media_path parameter", () => {
    it("uploads image from local file and creates post with image", async () => {
      // Create a temp image file
      const tmpDir = mkdtempSync(join(tmpdir(), "linkedin-test-"));
      const imagePath = join(tmpDir, "test-image.png");
      writeFileSync(imagePath, createFakeBuffer(3072));

      try {
        const tools = createPostsTools(client);

        nock(API_BASE)
          .get("/v2/userinfo")
          .reply(200, { sub: "member-path-789" });

        nock(API_BASE)
          .post("/rest/images")
          .query({ action: "initializeUpload" })
          .reply(200, {
            value: {
              uploadUrl: "https://upload.linkedin.com/img/path-upload",
              image: "urn:li:image:from-path",
            },
          });

        nock("https://upload.linkedin.com")
          .put("/img/path-upload")
          .reply(201);

        nock(API_BASE)
          .post("/rest/posts", (body) => {
            return (
              body.commentary === "Uploaded from local file" &&
              body.content?.media?.id === "urn:li:image:from-path"
            );
          })
          .reply(201, "", {
            "x-restli-id": "urn:li:share:post-path-001",
          });

        const result = await tools.createPost.handler({
          text: "Uploaded from local file",
          media_path: imagePath,
          alt_text: "Local image",
          response_format: ResponseFormat.JSON,
        });

        expect(result.isError).toBeUndefined();
        const data = JSON.parse(result.content[0].text);
        expect(data.postId).toBe("post-path-001");
        expect(data.has_media).toBe(true);
      } finally {
        unlinkSync(imagePath);
        // Clean up the temp dir too
        try {
          const { rmdirSync } = await import("fs");
          rmdirSync(tmpDir);
        } catch {
          // Ignore cleanup errors
        }
      }
    });
  });

  // ─── Backward Compatibility ──────────────────────────────────────────────

  describe("backward compatibility", () => {
    it("creates text-only post without media (unchanged behavior)", async () => {
      const tools = createPostsTools(client);

      nock(API_BASE)
        .get("/v2/userinfo")
        .reply(200, { sub: "member-no-media" });

      nock(API_BASE)
        .post("/rest/posts", (body) => {
          return (
            body.commentary === "Just text, no image" &&
            body.content === undefined &&
            body.lifecycleState === "PUBLISHED"
          );
        })
        .reply(201, "", {
          "x-restli-id": "urn:li:share:post-text-only",
        });

      const result = await tools.createPost.handler({
        text: "Just text, no image",
        response_format: ResponseFormat.JSON,
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.postId).toBe("post-text-only");
      expect(data.has_media).toBeUndefined();
    });

    it("supports visibility options in text-only posts", async () => {
      const tools = createPostsTools(client);

      nock(API_BASE)
        .get("/v2/userinfo")
        .reply(200, { sub: "member-visibility" });

      nock(API_BASE)
        .post("/rest/posts", (body) => body.visibility === "CONNECTIONS")
        .reply(201, "", {
          "x-restli-id": "urn:li:share:post-vis",
        });

      const result = await tools.createPost.handler({
        text: "Connections only text",
        visibility: "CONNECTIONS",
        response_format: ResponseFormat.JSON,
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.visibility).toBe("CONNECTIONS");
    });
  });

  // ─── Error Handling ──────────────────────────────────────────────────────

  describe("error handling", () => {
    it("returns MEDIA_FORMAT_ERROR for unsupported image format from URL", async () => {
      const tools = createPostsTools(client);

      nock(API_BASE)
        .get("/v2/userinfo")
        .reply(200, { sub: "member-err-001" });

      // Mock the image fetch returning WebP (unsupported)
      const webpImage = createFakeBuffer(1024);
      nock("https://cdn.example.com")
        .get("/photos/photo.webp")
        .reply(200, webpImage, { "content-type": "image/webp" });

      const result = await tools.createPost.handler({
        text: "This should fail",
        media_url: "https://cdn.example.com/photos/photo.webp",
        response_format: ResponseFormat.JSON,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("MEDIA_FORMAT_ERROR");
      expect(result.content[0].text).toContain("Unsupported image format");
    });

    it("returns MEDIA_SIZE_ERROR for images over 10MB", async () => {
      const tools = createPostsTools(client);

      nock(API_BASE)
        .get("/v2/userinfo")
        .reply(200, { sub: "member-err-002" });

      // 11 MB file
      const hugeImage = createFakeBuffer(11 * 1024 * 1024);
      nock("https://cdn.example.com")
        .get("/photos/huge.jpg")
        .reply(200, hugeImage, { "content-type": "image/jpeg" });

      const result = await tools.createPost.handler({
        text: "Huge image",
        media_url: "https://cdn.example.com/photos/huge.jpg",
        response_format: ResponseFormat.JSON,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("MEDIA_SIZE_ERROR");
      expect(result.content[0].text).toContain("10 MB limit");
    });

    it("returns MEDIA_FORMAT_ERROR for unsupported local file extension", async () => {
      const tools = createPostsTools(client);

      // Create a temp file with unsupported extension
      const tmpDir = mkdtempSync(join(tmpdir(), "linkedin-err-"));
      const badPath = join(tmpDir, "image.webp");
      writeFileSync(badPath, createFakeBuffer(1024));

      try {
        nock(API_BASE)
          .get("/v2/userinfo")
          .reply(200, { sub: "member-err-003" });

        const result = await tools.createPost.handler({
          text: "Bad format",
          media_path: badPath,
          response_format: ResponseFormat.JSON,
        });

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("MEDIA_FORMAT_ERROR");
      } finally {
        unlinkSync(badPath);
        try {
          const { rmdirSync } = await import("fs");
          rmdirSync(tmpDir);
        } catch {
          // Ignore cleanup errors
        }
      }
    });

    it("returns MEDIA_SIZE_ERROR for local file over 10MB", async () => {
      const tools = createPostsTools(client);

      const tmpDir = mkdtempSync(join(tmpdir(), "linkedin-err-big-"));
      const bigPath = join(tmpDir, "large.jpg");
      writeFileSync(bigPath, createFakeBuffer(11 * 1024 * 1024));

      try {
        nock(API_BASE)
          .get("/v2/userinfo")
          .reply(200, { sub: "member-err-004" });

        const result = await tools.createPost.handler({
          text: "Too large",
          media_path: bigPath,
          response_format: ResponseFormat.JSON,
        });

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain("MEDIA_SIZE_ERROR");
      } finally {
        unlinkSync(bigPath);
        try {
          const { rmdirSync } = await import("fs");
          rmdirSync(tmpDir);
        } catch {
          // Ignore cleanup errors
        }
      }
    });
  });

  // ─── Markdown Output ─────────────────────────────────────────────────────

  describe("markdown output format", () => {
    it("includes media line in markdown output when image attached", async () => {
      const tools = createPostsTools(client);

      nock(API_BASE)
        .get("/v2/userinfo")
        .reply(200, { sub: "member-md-001" });

      const fakeImage = createFakeBuffer(1024);
      nock("https://cdn.example.com")
        .get("/photos/md-test.jpg")
        .reply(200, fakeImage, { "content-type": "image/jpeg" });

      nock(API_BASE)
        .post("/rest/images")
        .query({ action: "initializeUpload" })
        .reply(200, {
          value: {
            uploadUrl: "https://upload.linkedin.com/img/md-upload",
            image: "urn:li:image:md-test",
          },
        });

      nock("https://upload.linkedin.com")
        .put("/img/md-upload")
        .reply(201);

      nock(API_BASE)
        .post("/rest/posts")
        .reply(201, "", {
          "x-restli-id": "urn:li:share:post-md",
        });

      const result = await tools.createPost.handler({
        text: "Markdown test with image",
        media_url: "https://cdn.example.com/photos/md-test.jpg",
        response_format: ResponseFormat.MARKDOWN,
      });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("✅ Post Published");
      expect(result.content[0].text).toContain("✅ Image attached");
    });

    it("omits media line in markdown output for text-only posts", async () => {
      const tools = createPostsTools(client);

      nock(API_BASE)
        .get("/v2/userinfo")
        .reply(200, { sub: "member-md-002" });

      nock(API_BASE)
        .post("/rest/posts")
        .reply(201, "", {
          "x-restli-id": "urn:li:share:post-md-text",
        });

      const result = await tools.createPost.handler({
        text: "Just text in markdown",
        response_format: ResponseFormat.MARKDOWN,
      });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("✅ Post Published");
      expect(result.content[0].text).not.toContain("Image attached");
    });
  });
});

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Create a deterministic fake buffer of the requested size */
function createFakeBuffer(size: number): Buffer {
  const buf = Buffer.alloc(size);
  for (let i = 0; i < size; i++) {
    buf[i] = (i * 7 + 13) & 0xff;
  }
  return buf;
}
