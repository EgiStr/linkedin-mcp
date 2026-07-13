/**
 * Tests for LinkedInClient.formatError()
 *
 * Tests every status code branch to ensure AI-agent-friendly error messages.
 */

import { describe, it, expect } from "vitest";
import { LinkedInClient } from "../src/services/linkedin-client.js";

describe("LinkedInClient.formatError", () => {
  it("handles 401 Unauthorized", () => {
    const error = createAxiosError(401);
    const msg = LinkedInClient.formatError(error);
    expect(msg).toContain("Authentication failed");
    expect(msg).toContain("invalid or expired");
  });

  it("handles 403 Forbidden with message", () => {
    const error = createAxiosError(403, { message: "SCOPE_MISSING" });
    const msg = LinkedInClient.formatError(error);
    expect(msg).toContain("Permission denied");
    expect(msg).toContain("SCOPE_MISSING");
  });

  it("handles 403 Forbidden without message", () => {
    const error = createAxiosError(403, {});
    const msg = LinkedInClient.formatError(error);
    expect(msg).toContain("Permission denied");
  });

  it("handles 404 Not Found", () => {
    const error = createAxiosError(404);
    const msg = LinkedInClient.formatError(error);
    expect(msg).toContain("Resource not found");
  });

  it("handles 429 Rate Limited", () => {
    const error = createAxiosError(429);
    const msg = LinkedInClient.formatError(error);
    expect(msg).toContain("Rate limit exceeded");
  });

  it("handles 500 Server Error", () => {
    const error = createAxiosError(500, { message: "Internal Server Error" });
    const msg = LinkedInClient.formatError(error);
    expect(msg).toContain("status 500");
    expect(msg).toContain("Internal Server Error");
  });

  it("handles 503 Service Unavailable", () => {
    const error = createAxiosError(503);
    const msg = LinkedInClient.formatError(error);
    expect(msg).toContain("status 503");
  });

  it("handles timeout (ECONNABORTED)", () => {
    const error = createAxiosError(undefined, undefined, "ECONNABORTED");
    const msg = LinkedInClient.formatError(error);
    expect(msg).toContain("timed out");
  });

  it("handles network error (ENOTFOUND)", () => {
    const error = createAxiosError(undefined, undefined, "ENOTFOUND");
    const msg = LinkedInClient.formatError(error);
    expect(msg).toContain("Network error");
  });

  it("handles generic Error objects", () => {
    const error = new Error("Something went wrong");
    const msg = LinkedInClient.formatError(error);
    expect(msg).toContain("Something went wrong");
  });

  it("handles non-Error throwables", () => {
    const error = "just a string";
    const msg = LinkedInClient.formatError(error);
    expect(msg).toContain("just a string");
  });

  it("handles null/undefined", () => {
    const msg = LinkedInClient.formatError(null);
    expect(msg).toContain("Unexpected error");
  });
});

// ─── Helper ────────────────────────────────────────────────────────────────

function createAxiosError(
  status?: number,
  data?: Record<string, unknown>,
  code?: string
): unknown {
  // Build a minimal Axios-like error object
  const error: Record<string, unknown> = {
    isAxiosError: true,
    response:
      status !== undefined
        ? {
            status,
            data: data || { message: "Error" },
            headers: {},
          }
        : undefined,
    code,
    message: data?.message || "Request failed",
  };

  return error;
}
