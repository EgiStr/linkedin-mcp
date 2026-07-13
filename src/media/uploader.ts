/**
 * Media Uploader — LinkedIn's 3-step image upload flow.
 *
 * LinkedIn Image Upload:
 * 1. POST /rest/images?action=initializeUpload → uploadUrl + image URN
 * 2. PUT binary data to uploadUrl
 * 3. Return image URN for use in create_post
 *
 * Independent of LinkedInClient — uses axios directly.
 */

import axios, { AxiosInstance, AxiosError } from "axios";

// ─── Constants ──────────────────────────────────────────────────────────────

const API_BASE_URL = "https://api.linkedin.com";
const API_REST = `${API_BASE_URL}/rest`;
const LINKEDIN_API_VERSION = "202603";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_INIT_RETRIES = 1; // Retry init once on upload URL expiry

// ─── Error Codes ────────────────────────────────────────────────────────────

export enum MediaUploadErrorCode {
  /** Unsupported image format (must be JPEG, PNG, or static GIF) */
  MEDIA_FORMAT_ERROR = "MEDIA_FORMAT_ERROR",
  /** Image file exceeds LinkedIn's 10 MB limit */
  MEDIA_SIZE_ERROR = "MEDIA_SIZE_ERROR",
  /** Upload URL expired before binary upload completed */
  UPLOAD_URL_EXPIRED = "UPLOAD_URL_EXPIRED",
  /** Network failure during upload */
  NETWORK_ERROR = "NETWORK_ERROR",
}

export class MediaUploadError extends Error {
  code: MediaUploadErrorCode;
  retryable: boolean;

  constructor(code: MediaUploadErrorCode, message: string, retryable: boolean) {
    super(message);
    this.name = "MediaUploadError";
    this.code = code;
    this.retryable = retryable;
  }
}

// ─── MIME Support ───────────────────────────────────────────────────────────

const SUPPORTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
]);

const EXTENSION_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
};

// ─── Uploader ───────────────────────────────────────────────────────────────

export class MediaUploader {
  private api: AxiosInstance;

  constructor(private accessToken: string) {
    this.api = axios.create({
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Upload an image from a public URL.
   *
   * Fetches the image, detects MIME type, validates, then runs the 3-step
   * LinkedIn upload flow.
   *
   * @param imageUrl - Public URL of the image to upload
   * @param memberUrn - LinkedIn member URN (e.g., "urn:li:person:abc123")
   * @returns The LinkedIn image URN to use in create_post
   */
  async uploadImage(
    imageUrl: string,
    memberUrn: string,
  ): Promise<{ imageUrn: string }> {
    let response;
    try {
      response = await axios.get<ArrayBuffer>(imageUrl, {
        responseType: "arraybuffer",
        timeout: 30000,
        // Don't send auth headers to arbitrary URLs
        headers: {},
      });
    } catch (error) {
      throw classifyError(error, "Failed to fetch image from URL");
    }

    const buffer = Buffer.from(response.data);
    const contentType = response.headers["content-type"];
    const mimeType =
      typeof contentType === "string"
        ? contentType
        : this.detectMimeTypeFromUrl(imageUrl);

    this.validateMedia(buffer, mimeType);
    return this.executeUpload(buffer, mimeType, memberUrn);
  }

  /**
   * Upload an image from a Buffer (e.g., for local files).
   *
   * @param buffer - Raw image data
   * @param mimeType - MIME type (image/jpeg, image/png, image/gif)
   * @param memberUrn - LinkedIn member URN
   * @returns The LinkedIn image URN
   */
  async uploadImageFromBuffer(
    buffer: Buffer,
    mimeType: string,
    memberUrn: string,
  ): Promise<{ imageUrn: string }> {
    this.validateMedia(buffer, mimeType);
    return this.executeUpload(buffer, mimeType, memberUrn);
  }

  // ─── Internal: 3-Step Flow ──────────────────────────────────────────────

  /**
   * Orchestrate init → binary upload → return URN.
   * Retries initialization once if the upload URL expires.
   */
  private async executeUpload(
    buffer: Buffer,
    mimeType: string,
    memberUrn: string,
  ): Promise<{ imageUrn: string }> {
    for (let attempt = 0; attempt <= MAX_INIT_RETRIES; attempt++) {
      // Step 1: Initialize upload — get a pre-signed upload URL and image URN
      const { uploadUrl, imageUrn } = await this.initializeUpload(
        mimeType,
        memberUrn,
      );

      try {
        // Step 2: Upload binary to the pre-signed URL
        await this.uploadBinary(uploadUrl, buffer, mimeType);
        return { imageUrn };
      } catch (error) {
        if (isUploadUrlExpired(error) && attempt < MAX_INIT_RETRIES) {
          // Upload URL expired — loop to re-initialize with a fresh URL
          continue;
        }
        // Retries exhausted or non-expiry error — classify and throw
        throw classifyError(error, "Failed to upload image binary");
      }
    }

    // Unreachable: loop always returns or throws
    throw new MediaUploadError(
      MediaUploadErrorCode.NETWORK_ERROR,
      "Upload failed after retries",
      true,
    );
  }

  /**
   * Step 1: Initialize image upload with LinkedIn.
   *
   * POST /rest/images?action=initializeUpload
   */
  private async initializeUpload(
    _mimeType: string,
    memberUrn: string,
  ): Promise<{ uploadUrl: string; imageUrn: string }> {
    try {
      const response = await this.api.post<{
        value: {
          uploadUrlExpiresAt?: number;
          uploadUrl: string;
          image: string;
        };
      }>(
        `${API_REST}/images?action=initializeUpload`,
        {
          initializeUploadRequest: {
            owner: memberUrn,
          },
        },
        {
          headers: {
            "LinkedIn-Version": LINKEDIN_API_VERSION,
          },
        },
      );

      const { uploadUrl, image: imageUrn } = response.data.value;
      return { uploadUrl, imageUrn };
    } catch (error) {
      throw classifyError(error, "Failed to initialize image upload");
    }
  }

  /**
   * Step 2: Upload binary image data to the pre-signed upload URL.
   *
   * PUT {uploadUrl} with Content-Type: image/...
   */
  private async uploadBinary(
    uploadUrl: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<void> {
    try {
      await axios.put(uploadUrl, buffer, {
        headers: {
          "Content-Type": mimeType,
        },
        timeout: 60000, // Binary uploads can be slow
        // Accept any 2xx; pre-signed URLs may return 201
        validateStatus: (status) => status >= 200 && status < 300,
      });
    } catch (error) {
      if (isUploadUrlExpired(error)) {
        throw error; // Let executeUpload handle retry
      }
      throw classifyError(error, "Failed to upload image binary");
    }
  }

  // ─── Validation ──────────────────────────────────────────────────────────

  private validateMedia(buffer: Buffer, mimeType: string): void {
    if (!SUPPORTED_MIME_TYPES.has(mimeType)) {
      throw new MediaUploadError(
        MediaUploadErrorCode.MEDIA_FORMAT_ERROR,
        `Unsupported image format: "${mimeType}". ` +
          `Supported formats: ${[...SUPPORTED_MIME_TYPES].join(", ")}`,
        false,
      );
    }

    if (buffer.length > MAX_FILE_SIZE) {
      const sizeMB = (buffer.length / (1024 * 1024)).toFixed(1);
      throw new MediaUploadError(
        MediaUploadErrorCode.MEDIA_SIZE_ERROR,
        `Image file size (${sizeMB} MB) exceeds LinkedIn's 10 MB limit`,
        false,
      );
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private detectMimeTypeFromUrl(url: string): string {
    try {
      const pathname = new URL(url).pathname.toLowerCase();
      for (const [ext, mime] of Object.entries(EXTENSION_TO_MIME)) {
        if (pathname.endsWith(ext)) return mime;
      }
    } catch {
      // Invalid URL — fall through to default
    }
    return "application/octet-stream";
  }
}

// ─── Module-Level Helpers ───────────────────────────────────────────────────

/**
 * Check if an error indicates the upload URL has expired.
 *
 * Pre-signed URLs return 401, 403, or 410 when expired.
 */
function isUploadUrlExpired(error: unknown): boolean {
  if (error instanceof MediaUploadError) {
    return error.code === MediaUploadErrorCode.UPLOAD_URL_EXPIRED;
  }
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    return status === 401 || status === 403 || status === 410;
  }
  return false;
}

/**
 * Classify an error into a structured MediaUploadError.
 */
function classifyError(error: unknown, context: string): MediaUploadError {
  if (error instanceof MediaUploadError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;

    // Network-level errors
    if (axiosError.code === "ECONNABORTED") {
      return new MediaUploadError(
        MediaUploadErrorCode.NETWORK_ERROR,
        `Request timed out — ${context}`,
        true,
      );
    }
    if (
      axiosError.code === "ENOTFOUND" ||
      axiosError.code === "ERR_NETWORK"
    ) {
      return new MediaUploadError(
        MediaUploadErrorCode.NETWORK_ERROR,
        `Network error — ${context}`,
        true,
      );
    }

    const status = axiosError.response?.status;
    const message = axiosError.response?.data?.message ?? axiosError.message;

    if (status === 401 || status === 403 || status === 410) {
      return new MediaUploadError(
        MediaUploadErrorCode.UPLOAD_URL_EXPIRED,
        `Upload URL expired — ${message}`,
        true,
      );
    }

    // General network/API error
    return new MediaUploadError(
      MediaUploadErrorCode.NETWORK_ERROR,
      `LinkedIn API error (${status ?? "unknown"}): ${message} — ${context}`,
      status !== undefined ? status >= 500 : true,
    );
  }

  // Generic error
  return new MediaUploadError(
    MediaUploadErrorCode.NETWORK_ERROR,
    `Unexpected error: ${error instanceof Error ? error.message : String(error)} — ${context}`,
    false,
  );
}
