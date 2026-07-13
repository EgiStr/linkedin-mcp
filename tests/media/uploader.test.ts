/**
 * Tests for MediaUploader — LinkedIn 3-step image upload flow.
 *
 * Uses nock to mock all external HTTP calls.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import nock from "nock";
import {
  MediaUploader,
  MediaUploadError,
  MediaUploadErrorCode,
} from "../../src/media/uploader.js";

// ─── Constants ──────────────────────────────────────────────────────────────

const API_BASE = "https://api.linkedin.com";
const FAKE_TOKEN = "test-access-token";
const MEMBER_URN = "urn:li:person:member-456";

// ─── Test Suite ─────────────────────────────────────────────────────────────

describe("MediaUploader", () => {
  let uploader: MediaUploader;

  beforeEach(() => {
    uploader = new MediaUploader(FAKE_TOKEN);
    nock.cleanAll();
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.enableNetConnect();
    nock.cleanAll();
  });

  // ─── uploadImageFromBuffer — Full Flow ──────────────────────────────────

  describe("uploadImageFromBuffer", () => {
    it("completes the 3-step flow and returns an image URN", async () => {
      const imageBuffer = createFakeImageBuffer("jpeg", 1024);
      const expectedUrn = "urn:li:image:C4E10AQFoyyAjHPMQuQ";

      // Step 1: Initialize upload
      nock(API_BASE)
        .post("/rest/images")
        .query({ action: "initializeUpload" })
        .reply(200, {
          value: {
            uploadUrlExpiresAt: Date.now() + 3600000,
            uploadUrl: "https://upload.linkedin.com/img/upload-abc",
            image: expectedUrn,
          },
        });

      // Step 2: Binary upload to pre-signed URL
      nock("https://upload.linkedin.com")
        .put("/img/upload-abc")
        .reply(201);

      const result = await uploader.uploadImageFromBuffer(
        imageBuffer,
        "image/jpeg",
        MEMBER_URN,
      );

      expect(result.imageUrn).toBe(expectedUrn);
    });

    it("rejects unsupported MIME types", async () => {
      const imageBuffer = createFakeImageBuffer("webp", 1024);

      await expect(
        uploader.uploadImageFromBuffer(imageBuffer, "image/webp", MEMBER_URN),
      ).rejects.toThrow(MediaUploadError);

      await expect(
        uploader.uploadImageFromBuffer(imageBuffer, "image/webp", MEMBER_URN),
      ).rejects.toMatchObject({
        code: MediaUploadErrorCode.MEDIA_FORMAT_ERROR,
        retryable: false,
      });
    });

    it("rejects image/svg+xml format", async () => {
      const imageBuffer = createFakeImageBuffer("svg", 1024);

      await expect(
        uploader.uploadImageFromBuffer(
          imageBuffer,
          "image/svg+xml",
          MEMBER_URN,
        ),
      ).rejects.toMatchObject({
        code: MediaUploadErrorCode.MEDIA_FORMAT_ERROR,
      });
    });

    it("rejects files larger than 10 MB", async () => {
      // 11 MB buffer
      const largeBuffer = createFakeImageBuffer("jpeg", 11 * 1024 * 1024);

      await expect(
        uploader.uploadImageFromBuffer(largeBuffer, "image/jpeg", MEMBER_URN),
      ).rejects.toMatchObject({
        code: MediaUploadErrorCode.MEDIA_SIZE_ERROR,
        retryable: false,
      });
    });

    it("retries initialization once when upload URL is expired (401)", async () => {
      const imageBuffer = createFakeImageBuffer("jpeg", 1024);
      const expectedUrn = "urn:li:image:retry-001";

      // First init
      nock(API_BASE)
        .post("/rest/images")
        .query({ action: "initializeUpload" })
        .reply(200, {
          value: {
            uploadUrlExpiresAt: Date.now() + 3600000,
            uploadUrl: "https://upload.linkedin.com/img/expired-url",
            image: "urn:li:image:expired",
          },
        });

      // First binary upload fails — URL expired
      nock("https://upload.linkedin.com")
        .put("/img/expired-url")
        .reply(401);

      // Second init (retry)
      nock(API_BASE)
        .post("/rest/images")
        .query({ action: "initializeUpload" })
        .reply(200, {
          value: {
            uploadUrlExpiresAt: Date.now() + 3600000,
            uploadUrl: "https://upload.linkedin.com/img/fresh-url",
            image: expectedUrn,
          },
        });

      // Second binary upload succeeds
      nock("https://upload.linkedin.com")
        .put("/img/fresh-url")
        .reply(201);

      const result = await uploader.uploadImageFromBuffer(
        imageBuffer,
        "image/jpeg",
        MEMBER_URN,
      );

      expect(result.imageUrn).toBe(expectedUrn);
    });

    it("retries initialization once when upload URL is expired (410 Gone)", async () => {
      const imageBuffer = createFakeImageBuffer("png", 2048);
      const expectedUrn = "urn:li:image:retry-410";

      nock(API_BASE)
        .post("/rest/images")
        .query({ action: "initializeUpload" })
        .reply(200, {
          value: {
            uploadUrl: "https://upload.linkedin.com/img/gone-url",
            image: "urn:li:image:gone",
          },
        });

      nock("https://upload.linkedin.com")
        .put("/img/gone-url")
        .reply(410);

      nock(API_BASE)
        .post("/rest/images")
        .query({ action: "initializeUpload" })
        .reply(200, {
          value: {
            uploadUrl: "https://upload.linkedin.com/img/fresh-url-2",
            image: expectedUrn,
          },
        });

      nock("https://upload.linkedin.com")
        .put("/img/fresh-url-2")
        .reply(201);

      const result = await uploader.uploadImageFromBuffer(
        imageBuffer,
        "image/png",
        MEMBER_URN,
      );

      expect(result.imageUrn).toBe(expectedUrn);
    });

    it("throws NETWORK_ERROR when retries exhausted", async () => {
      const imageBuffer = createFakeImageBuffer("jpeg", 1024);

      // First init
      nock(API_BASE)
        .post("/rest/images")
        .query({ action: "initializeUpload" })
        .reply(200, {
          value: {
            uploadUrl: "https://upload.linkedin.com/img/bad-url",
            image: "urn:li:image:bad",
          },
        });

      // First upload fails
      nock("https://upload.linkedin.com").put("/img/bad-url").reply(401);

      // Second init (retry)
      nock(API_BASE)
        .post("/rest/images")
        .query({ action: "initializeUpload" })
        .reply(200, {
          value: {
            uploadUrl: "https://upload.linkedin.com/img/bad-url-2",
            image: "urn:li:image:bad2",
          },
        });

      // Second upload also fails
      nock("https://upload.linkedin.com").put("/img/bad-url-2").reply(401);

      await expect(
        uploader.uploadImageFromBuffer(imageBuffer, "image/jpeg", MEMBER_URN),
      ).rejects.toMatchObject({
        code: MediaUploadErrorCode.UPLOAD_URL_EXPIRED,
        retryable: true,
      });
    });

    it("throws NETWORK_ERROR when init request times out", async () => {
      const imageBuffer = createFakeImageBuffer("jpeg", 1024);
      const timeoutErr = new Error("timeout");
      Object.defineProperty(timeoutErr, "code", { value: "ECONNABORTED" });

      nock(API_BASE)
        .post("/rest/images")
        .query({ action: "initializeUpload" })
        .replyWithError(timeoutErr);

      await expect(
        uploader.uploadImageFromBuffer(imageBuffer, "image/jpeg", MEMBER_URN),
      ).rejects.toMatchObject({
        code: MediaUploadErrorCode.NETWORK_ERROR,
        retryable: true,
      });
    });

    it("throws NETWORK_ERROR on DNS failure", async () => {
      const imageBuffer = createFakeImageBuffer("jpeg", 1024);
      const dnsErr = new Error("getaddrinfo ENOTFOUND");
      Object.defineProperty(dnsErr, "code", { value: "ENOTFOUND" });

      nock(API_BASE)
        .post("/rest/images")
        .query({ action: "initializeUpload" })
        .replyWithError(dnsErr);

      await expect(
        uploader.uploadImageFromBuffer(imageBuffer, "image/jpeg", MEMBER_URN),
      ).rejects.toMatchObject({
        code: MediaUploadErrorCode.NETWORK_ERROR,
        retryable: true,
      });
    });

    it("throws NETWORK_ERROR on LinkedIn 500 during init", async () => {
      const imageBuffer = createFakeImageBuffer("jpeg", 1024);

      nock(API_BASE)
        .post("/rest/images")
        .query({ action: "initializeUpload" })
        .reply(500, { message: "Internal Server Error" });

      await expect(
        uploader.uploadImageFromBuffer(imageBuffer, "image/jpeg", MEMBER_URN),
      ).rejects.toMatchObject({
        code: MediaUploadErrorCode.NETWORK_ERROR,
        retryable: true,
      });
    });
  });

  // ─── uploadImage — URL Input ────────────────────────────────────────────

  describe("uploadImage (from URL)", () => {
    it("fetches image from URL, detects MIME, and completes upload", async () => {
      const imageBuffer = createFakeImageBuffer("jpeg", 2048);
      const expectedUrn = "urn:li:image:from-url-001";

      // Mock image fetch
      nock("https://cdn.example.com")
        .get("/photos/header.jpg")
        .reply(200, imageBuffer, { "content-type": "image/jpeg" });

      // Step 1
      nock(API_BASE)
        .post("/rest/images")
        .query({ action: "initializeUpload" })
        .reply(200, {
          value: {
            uploadUrl: "https://upload.linkedin.com/img/url-upload",
            image: expectedUrn,
          },
        });

      // Step 2
      nock("https://upload.linkedin.com")
        .put("/img/url-upload")
        .reply(201);

      const result = await uploader.uploadImage(
        "https://cdn.example.com/photos/header.jpg",
        MEMBER_URN,
      );

      expect(result.imageUrn).toBe(expectedUrn);
    });

    it("detects MIME from URL extension when content-type is missing", async () => {
      const imageBuffer = createFakeImageBuffer("png", 512);

      // No content-type header in response
      nock("https://cdn.example.com")
        .get("/photos/logo.png")
        .reply(200, imageBuffer);

      nock(API_BASE)
        .post("/rest/images")
        .query({ action: "initializeUpload" })
        .reply(200, {
          value: {
            uploadUrl: "https://upload.linkedin.com/img/png-upload",
            image: "urn:li:image:png-test",
          },
        });

      nock("https://upload.linkedin.com")
        .put("/img/png-upload")
        .reply(201);

      const result = await uploader.uploadImage(
        "https://cdn.example.com/photos/logo.png",
        MEMBER_URN,
      );

      expect(result.imageUrn).toBe("urn:li:image:png-test");
    });

    it("detects MIME from .jpeg extension", async () => {
      const imageBuffer = createFakeImageBuffer("jpeg", 512);

      nock("https://cdn.example.com")
        .get("/photos/photo.jpeg")
        .reply(200, imageBuffer);

      nock(API_BASE)
        .post("/rest/images")
        .query({ action: "initializeUpload" })
        .reply(200, {
          value: {
            uploadUrl: "https://upload.linkedin.com/img/jpeg-upload",
            image: "urn:li:image:jpeg-test",
          },
        });

      nock("https://upload.linkedin.com")
        .put("/img/jpeg-upload")
        .reply(201);

      const result = await uploader.uploadImage(
        "https://cdn.example.com/photos/photo.jpeg",
        MEMBER_URN,
      );

      expect(result.imageUrn).toBe("urn:li:image:jpeg-test");
    });

    it("rejects unsupported URL extensions", async () => {
      const imageBuffer = createFakeImageBuffer("webp", 512);

      nock("https://cdn.example.com")
        .get("/photos/photo.webp")
        .reply(200, imageBuffer, { "content-type": "image/webp" });

      await expect(
        uploader.uploadImage(
          "https://cdn.example.com/photos/photo.webp",
          MEMBER_URN,
        ),
      ).rejects.toMatchObject({
        code: MediaUploadErrorCode.MEDIA_FORMAT_ERROR,
      });
    });

    it("rejects GIF files over 10MB from URL", async () => {
      const largeBuffer = createFakeImageBuffer("gif", 11 * 1024 * 1024);

      nock("https://cdn.example.com")
        .get("/photos/big.gif")
        .reply(200, largeBuffer, { "content-type": "image/gif" });

      await expect(
        uploader.uploadImage(
          "https://cdn.example.com/photos/big.gif",
          MEMBER_URN,
        ),
      ).rejects.toMatchObject({
        code: MediaUploadErrorCode.MEDIA_SIZE_ERROR,
      });
    });

    it("throws NETWORK_ERROR when image URL fetch fails", async () => {
      nock("https://cdn.example.com")
        .get("/photos/missing.jpg")
        .reply(404);

      await expect(
        uploader.uploadImage(
          "https://cdn.example.com/photos/missing.jpg",
          MEMBER_URN,
        ),
      ).rejects.toMatchObject({
        code: MediaUploadErrorCode.NETWORK_ERROR,
      });
    });
  });

  // ─── Constructor / Edge Cases ───────────────────────────────────────────

  describe("constructor and edge cases", () => {
    it("accepts any access token string", () => {
      const u = new MediaUploader("AQV_abc123");
      expect(u).toBeInstanceOf(MediaUploader);
    });
  });
});

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Create a deterministic fake image buffer of the requested size.
 *
 * This is NOT a valid image — just raw bytes of the requested size.
 * The uploader never inspects image validity, only size and MIME type.
 */
function createFakeImageBuffer(
  _format: "jpeg" | "png" | "gif" | "webp" | "svg",
  size: number,
): Buffer {
  const buf = Buffer.alloc(size);
  // Fill with a repeating pattern so it's not all zeros
  for (let i = 0; i < size; i++) {
    buf[i] = (i * 7 + 13) & 0xff;
  }
  return buf;
}
