/**
 * LinkedIn API Client — handles auth, rate limiting, and all API calls.
 *
 * LinkedIn API v2 (2026):
 * - OpenID Connect: /v2/userinfo (openid scope)
 * - Profile: /v2/me (r_liteprofile — deprecated but works on old apps)
 * - Posts (new): /rest/posts (w_member_social)
 * - Posts (legacy): /v2/ugcPosts (w_member_social)
 * - Feed: /v2/socialActions/{id}
 * - Connections (limited via partner API)
 * - Images: /rest/images
 */

import axios, { AxiosInstance, AxiosError } from "axios";

// ─── Constants ──────────────────────────────────────────────────────────────

/** LinkedIn API version header value (YYYYMM format) */
export const LINKEDIN_API_VERSION = "202603";

/** Base URLs */
export const API_BASE_URL = "https://api.linkedin.com";
export const API_V2 = `${API_BASE_URL}/v2`;
export const API_REST = `${API_BASE_URL}/rest`;

/** Token expiry threshold: warn if token expires within 7 days */
export const TOKEN_EXPIRY_WARNING_DAYS = 7;

// ─── Error Codes ────────────────────────────────────────────────────────────

/**
 * Structured error codes for AI agent usability.
 * Every LinkedIn API error maps to one of these codes.
 */
export enum LinkedInErrorCode {
  /** Access token is invalid, expired, or missing */
  TOKEN_INVALID = "TOKEN_INVALID",
  /** Token has expired (detected via JWT expiry or API 401) */
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  /** Token has been revoked by the user (consent withdrawn) */
  TOKEN_REVOKED = "TOKEN_REVOKED",
  /** Token is about to expire (within 7 days) */
  TOKEN_EXPIRING_SOON = "TOKEN_EXPIRING_SOON",
  /** Missing required OAuth scope for this operation */
  SCOPE_MISSING = "SCOPE_MISSING",
  /** API rate limit exceeded */
  RATE_LIMITED = "RATE_LIMITED",
  /** Resource not found */
  NOT_FOUND = "NOT_FOUND",
  /** Partner-level API access required */
  PARTNER_API_REQUIRED = "PARTNER_API_REQUIRED",
  /** Request timed out */
  TIMEOUT = "TIMEOUT",
  /** Network connectivity error */
  NETWORK_ERROR = "NETWORK_ERROR",
  /** LinkedIn API internal error (5xx) */
  SERVER_ERROR = "SERVER_ERROR",
  /** Unknown or unexpected error */
  UNKNOWN = "UNKNOWN",
}

export interface StructuredError {
  code: LinkedInErrorCode;
  message: string;
  status?: number;
  retryable: boolean;
  details?: string;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LinkedInUserInfo {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
  locale?: string;
}

export interface LinkedInProfile {
  id: string;
  localizedFirstName?: string;
  localizedLastName?: string;
  profilePicture?: {
    displayImage?: string;
    "displayImage~"?: {
      elements?: Array<{
        identifiers?: Array<{
          identifier: string;
        }>;
      }>;
    };
  };
  vanityName?: string;
  headline?: string;
}

export interface LinkedInPost {
  id: string;
  author?: string;
  content?: {
    article?: {
      title?: string;
      description?: string;
    };
  };
  commentary?: string;
  created?: {
    time?: number;
  };
  distribution?: {
    feedDistribution?: string;
  };
  lifecycleState?: string;
  visibility?: string;
}

export interface LinkedInFeedItem {
  $URN: string;
  actor?: string;
  verb?: string;
  object?: string;
  time?: number;
  content?: string;
}

export interface LinkedInConversation {
  id: string;
  participants?: Array<{
    entityUrn: string;
    message?: {
      body?: string;
      created?: number;
    };
  }>;
  firstMessage?: {
    body?: string;
    created?: number;
  };
}

// ─── Pagination Helper ──────────────────────────────────────────────────────

export interface PaginationResult<T> {
  items: T[];
  hasMore: boolean;
  /** Total from upstream — may be unreliable. Use hasMore for pagination. */
  total?: number;
}

/**
 * Detect if more results are available based on LinkedIn's pagination quirks.
 *
 * LinkedIn's `paging.total` field is often inaccurate or absent.
 * We use a safer heuristic: if the number of returned elements meets or exceeds
 * the requested count, assume there are more results.
 *
 * When `upstreamTotal` is present, account for the current offset so we don't
 * claim hasMore when we've already consumed everything (e.g. total=10, offset=10).
 */
export function hasMoreElements(
  elements: unknown[],
  requestedCount: number,
  upstreamTotal?: number,
  currentOffset?: number
): boolean {
  // If no elements and count is 0, there's nothing more
  if (requestedCount <= 0) return elements.length > 0;

  // If upstream provides a reliable-looking total, account for current offset
  if (typeof upstreamTotal === "number" && upstreamTotal >= 0) {
    const offset = currentOffset ?? 0;
    return upstreamTotal > offset + elements.length;
  }
  // Otherwise use the heuristic: got as many as we asked for → likely more
  return elements.length >= requestedCount;
}

// ─── Client ──────────────────────────────────────────────────────────────────

export class LinkedInClient {
  private api: AxiosInstance;
  private accessToken: string;
  private userInfo: LinkedInUserInfo | null = null;

  constructor(accessToken: string) {
    this.accessToken = accessToken;

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

  /** Get the current access token (for OAuth refresh flows) */
  getAccessToken(): string {
    return this.accessToken;
  }

  /** Check if token looks expired by JWT structure (if it's a JWT) */
  isTokenExpired(): { expired: boolean; expiresAt?: Date } {
    try {
      // LinkedIn tokens are JWTs — decode the payload without verification
      const parts = this.accessToken.split(".");
      if (parts.length !== 3) return { expired: false }; // Not a JWT

      const payload = JSON.parse(
        Buffer.from(parts[1], "base64url").toString("utf-8")
      );
      const exp = payload.exp as number | undefined;

      if (!exp) return { expired: false };

      const expiresAt = new Date(exp * 1000);
      const now = new Date();

      return {
        expired: now >= expiresAt,
        expiresAt,
      };
    } catch {
      return { expired: false };
    }
  }

  /** Get remaining token lifetime info */
  getTokenLifetime(): { expiresAt?: Date; daysRemaining?: number; expired: boolean } {
    const { expired, expiresAt } = this.isTokenExpired();
    if (!expiresAt) return { expired };

    const daysRemaining = Math.floor(
      (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return { expiresAt, daysRemaining, expired };
  }

  // ─── Auth / User Info ────────────────────────────────────────────────────

  /** Get user info via OpenID Connect (works with "openid" scope) */
  async getUserInfo(): Promise<LinkedInUserInfo> {
    if (this.userInfo) return this.userInfo;

    const response = await this.api.get<LinkedInUserInfo>(
      `${API_V2}/userinfo`
    );
    this.userInfo = response.data;
    return response.data;
  }

  /** Get member ID from userinfo (works with minimal scopes) */
  async getMemberId(): Promise<string> {
    const info = await this.getUserInfo();
    return info.sub;
  }

  // ─── Profile ─────────────────────────────────────────────────────────────

  /** Get own profile (requires r_liteprofile or r_basicprofile) */
  async getMyProfile(): Promise<LinkedInProfile> {
    const response = await this.api.get<LinkedInProfile>(
      `${API_V2}/me`,
      {
        params: {
          projection:
            "(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams),vanityName,headline)",
        },
      }
    );
    return response.data;
  }

  /** Get full profile including email */
  async getFullProfile(): Promise<{
    profile: LinkedInProfile;
    userInfo: LinkedInUserInfo;
  }> {
    const [profile, userInfo] = await Promise.all([
      this.getMyProfile(),
      this.getUserInfo(),
    ]);
    return { profile, userInfo };
  }

  // ─── Posts ───────────────────────────────────────────────────────────────

  /** Create a text or image post (requires w_member_social scope)
   *  Uses the new /rest/posts endpoint (LinkedIn API 2024+)
   */
  async createPost(params: {
    text: string;
    visibility?: "PUBLIC" | "CONNECTIONS" | "LOGGED_IN";
    /** LinkedIn image URN from MediaUploader (3-step upload flow) */
    imageUrn?: string;
    /** Alt text for the attached image (defaults to "Image") */
    altText?: string;
  }): Promise<{ id: string; urn: string }> {
    const authorUrn = `urn:li:person:${await this.getMemberId()}`;

    // Build the post body per LinkedIn REST API spec
    const body: Record<string, unknown> = {
      author: authorUrn,
      commentary: params.text,
      visibility: params.visibility || "PUBLIC",
      lifecycleState: "PUBLISHED",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
    };

    if (params.imageUrn) {
      body.content = {
        media: {
          id: params.imageUrn,
          altText: params.altText || "Image",
        },
      };
    }

    const response = await this.api.post(
      `${API_REST}/posts`,
      body,
      {
        headers: {
          "LinkedIn-Version": LINKEDIN_API_VERSION,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    // The new API returns the URN in the x-restli-id header or Location
    const location = response.headers["x-restli-id"] || response.headers["location"] || "";
    const urn = typeof location === "string" ? location : "";
    const id = urn.replace("urn:li:share:", "").replace("urn:li:post:", "");

    return { id, urn };
  }

  /** Get posts for a user (requires r_member_social or r_organization_social) */
  async getUserPosts(params: {
    memberId?: string;
    start?: number;
    count?: number;
  } = {}): Promise<PaginationResult<LinkedInPost>> {
    const memberId = params.memberId || (await this.getMemberId());
    const count = params.count || 10;

    try {
      const response = await this.api.get<{
        elements?: LinkedInPost[];
        paging?: { total?: number; start?: number; count?: number };
      }>(
        `${API_V2}/shares`,
        {
          params: {
            q: "owners",
            owners: `urn:li:person:${memberId}`,
            start: params.start || 0,
            count,
          },
        }
      );

      const elements = response.data.elements || [];
      return {
        items: elements,
        hasMore: hasMoreElements(elements, count, response.data.paging?.total, params.start || 0),
        total: response.data.paging?.total,
      };
    } catch {
      // Fallback to /rest/posts endpoint
      try {
        const response = await this.api.get<{
          elements?: LinkedInPost[];
          paging?: { total?: number };
        }>(
          `${API_REST}/posts?author=${encodeURIComponent(
            `urn:li:person:${memberId}`
          )}`,
          {
            headers: {
              "LinkedIn-Version": LINKEDIN_API_VERSION,
              "X-Restli-Protocol-Version": "2.0.0",
            },
          }
        );

        const elements = response.data.elements || [];
        return {
          items: elements,
          hasMore: hasMoreElements(elements, count, response.data.paging?.total, params.start || 0),
          total: response.data.paging?.total,
        };
      } catch {
        // Return empty on auth errors
        return { items: [], hasMore: false, total: 0 };
      }
    }
  }

  // ─── Feed / Network ──────────────────────────────────────────────────────

  /** Get feed posts (limited via API) */
  async getFeed(params: {
    start?: number;
    count?: number;
  } = {}): Promise<PaginationResult<LinkedInFeedItem>> {
    const memberId = await this.getMemberId();
    const count = params.count || 10;

    try {
      const response = await this.api.get<{
        elements?: LinkedInFeedItem[];
        paging?: { total?: number };
      }>(
        `${API_V2}/activities`,
        {
          params: {
            q: "owners",
            owners: `urn:li:person:${memberId}`,
            start: params.start || 0,
            count,
          },
        }
      );

      const elements = response.data.elements || [];
      return {
        items: elements,
        hasMore: hasMoreElements(elements, count, response.data.paging?.total, params.start || 0),
        total: response.data.paging?.total,
      };
    } catch {
      // Fallback: get posts as feed
      const { items: posts } = await this.getUserPosts({
        memberId,
        start: params.start,
        count,
      });

      return {
        items: posts.map((p) => ({
          $URN: p.id,
          actor: p.author,
          time: p.created?.time,
          content: p.commentary,
        })),
        hasMore: false,
        total: posts.length,
      };
    }
  }

  // ─── Connections ─────────────────────────────────────────────────────────

  /** Get connections list (requires partner-level API access) */
  async getConnections(params: {
    start?: number;
    count?: number;
  } = {}): Promise<{
    connections: Array<{ id: string; name?: string; profileUrl?: string }>;
    hasMore: boolean;
    total: number;
  }> {
    try {
      const memberId = await this.getMemberId();
      const count = params.count || 10;

      const response = await this.api.get<{
        elements?: Array<{
          id: string;
          firstName?: string;
          lastName?: string;
          vanityName?: string;
        }>;
        paging?: { total?: number };
      }>(
        `${API_V2}/connections/${memberId}`,
        {
          params: {
            start: params.start || 0,
            count,
          },
        }
      );

      const elements = response.data.elements || [];
      return {
        connections: elements.map((c) => ({
          id: c.id,
          name: `${c.firstName || ""} ${c.lastName || ""}`.trim() || undefined,
          profileUrl: c.vanityName
            ? `https://www.linkedin.com/in/${c.vanityName}`
            : undefined,
        })),
        hasMore: hasMoreElements(elements, count, response.data.paging?.total, params.start || 0),
        total: response.data.paging?.total || 0,
      };
    } catch (error) {
      // Connections API requires partner-level access — return informative error
      throw LinkedInClient.createStructuredError(
        LinkedInErrorCode.PARTNER_API_REQUIRED,
        "Connections API requires LinkedIn Partner Program access. " +
        "The 'connections' scope is not available with basic OAuth apps. " +
        "Try using search_people instead.",
        403,
        error
      );
    }
  }

  /** Search people (very limited on free API tier) */
  async searchPeople(params: {
    keywords?: string;
    start?: number;
    count?: number;
  } = {}): Promise<{
    people: Array<{
      id: string;
      name?: string;
      headline?: string;
      publicIdentifier?: string;
    }>;
    total: number;
  }> {
    throw LinkedInClient.createStructuredError(
      LinkedInErrorCode.PARTNER_API_REQUIRED,
      "People search is not available through the standard LinkedIn API. " +
      "You need LinkedIn Sales Navigator API or a third-party provider " +
      "(e.g., LinkMCP, Phyllo, Unipile) for people search capabilities.",
      undefined
    );
  }

  // ─── Messaging ──────────────────────────────────────────────────────────

  /** Send a direct message (requires partner-level API or Messaging API product)
   *  Note: LinkedIn's free API tier does not support programmatic messaging.
   *  This requires either:
   *   - LinkedIn Messaging API (partner program)
   *   - Sales Navigator API
   */
  async sendMessage(params: {
    recipientId: string;
    text: string;
  }): Promise<{ id: string }> {
    throw LinkedInClient.createStructuredError(
      LinkedInErrorCode.PARTNER_API_REQUIRED,
      "Direct messaging is not available through the standard LinkedIn API. " +
      "You need LinkedIn Messaging API (partner program) or Sales Navigator. " +
      "Alternative: use the LinkedIn website or app to send messages.",
      undefined
    );
  }

  // ─── Delete Post ────────────────────────────────────────────────────────

  /** Delete a post by its ID or URN (requires w_member_social scope)
   *
   * Uses DELETE /rest/posts/{postId}
   * This is a destructive operation — there is no undo.
   */
  async deletePost(postId: string): Promise<void> {
    // Normalize: if it's a full URN, extract just the ID
    const id = postId
      .replace("urn:li:share:", "")
      .replace("urn:li:post:", "")
      .replace("urn:li:activity:", "")
      .replace(/^.*[:\/]/, ""); // Strip any remaining URN prefix

    await this.api.delete(`${API_REST}/posts/${encodeURIComponent(id)}`, {
      headers: {
        "LinkedIn-Version": LINKEDIN_API_VERSION,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });
  }

  /** Get user's organizations (if any) */
  async getOrganizations(): Promise<Array<{ id: string; name?: string }>> {
    try {
      const memberId = await this.getMemberId();
      const response = await this.api.get<{
        elements?: Array<{
          id: string;
          localizedName?: string;
          vanityName?: string;
        }>;
      }>(`${API_V2}/organizationalEntityAcls`, {
        params: {
          q: "roleAssignee",
          role: "ADMINISTRATOR",
          start: 0,
          count: 10,
        },
      });

      const orgIds = (response.data.elements || []).map(
        (e) => `urn:li:organization:${e.id}`
      );
      if (orgIds.length === 0) return [];

      // Fetch org names
      await this.api.get<{
        results?: Record<string, { localizedName?: string }>;
      }>(`${API_V2}/organizations`, {
        params: {
          ids: `List(${orgIds.map((id) => `"${id}"`).join(",")})`,
        },
      });

      // Use the ACL response for org names
      return (response.data.elements || []).map((e) => ({
        id: e.id,
        name: e.localizedName,
      }));
    } catch {
      return [];
    }
  }

  // ─── Error Handling ──────────────────────────────────────────────────────

  /** Create a structured error */
  static createStructuredError(
    code: LinkedInErrorCode,
    message: string,
    status?: number,
    original?: unknown
  ): StructuredError & Error {
    const err = new Error(message) as StructuredError & Error;
    err.code = code;
    err.message = message;
    err.status = status;
    err.retryable = isRetryable(code);
    err.details = original instanceof Error ? original.message : undefined;
    return err;
  }

  /** Map HTTP status + error data to a structured error */
  static classifyError(
    status: number,
    data?: { message?: string; code?: string }
  ): StructuredError {
    switch (status) {
      case 401: {
        const message = (data?.message || "").toLowerCase();
        // Check if token was revoked (consent withdrawn by user)
        if (message.includes("revoked") || message.includes("consent")) {
          return {
            code: LinkedInErrorCode.TOKEN_REVOKED,
            message: "LinkedIn access token has been revoked by the user. " +
              "Generate a new one at https://www.linkedin.com/developers/apps",
            status,
            retryable: false,
          };
        }
        // Check if specifically token expired
        if (message.includes("expired")) {
          return {
            code: LinkedInErrorCode.TOKEN_EXPIRED,
            message: "LinkedIn access token has expired. Generate a new one at https://www.linkedin.com/developers/apps",
            status,
            retryable: false,
          };
        }
        return {
          code: LinkedInErrorCode.TOKEN_INVALID,
          message: "LinkedIn API: Authentication failed. Your access token is invalid or expired. Generate a new one at https://www.linkedin.com/developers/apps",
          status,
          retryable: false,
        };
      }
      case 403: {
        const scope = data?.message || "ACCESS_DENIED";
        return {
          code: LinkedInErrorCode.SCOPE_MISSING,
          message:
            `LinkedIn API: Permission denied (${scope}). ` +
            "Your token doesn't have the required scope for this operation. " +
            "Check your LinkedIn app's OAuth 2.0 scopes in the developer portal.",
          status,
          retryable: false,
        };
      }
      case 404:
        return {
          code: LinkedInErrorCode.NOT_FOUND,
          message: "LinkedIn API: Resource not found. Check the ID or URN.",
          status,
          retryable: false,
        };
      case 429:
        return {
          code: LinkedInErrorCode.RATE_LIMITED,
          message: "LinkedIn API: Rate limit exceeded. Please wait before making more requests.",
          status,
          retryable: true,
        };
      default:
        if (status >= 500) {
          return {
            code: LinkedInErrorCode.SERVER_ERROR,
            message:
              `LinkedIn API: Server error (${status}) — ` +
              `${data?.message || data?.code || "Please try again later"}`,
            status,
            retryable: true,
          };
        }
        return {
          code: LinkedInErrorCode.UNKNOWN,
          message:
            `LinkedIn API: Request failed with status ${status} — ` +
            `${data?.message || data?.code || "Unknown error"}`,
          status,
          retryable: false,
        };
    }
  }

  /** Format errors into user-friendly messages (legacy API) */
  static formatError(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{
        message?: string;
        code?: string;
        status?: number;
      }>;

      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data;

        switch (status) {
          case 401:
            return "LinkedIn API: Authentication failed. Your access token is invalid or expired. Generate a new one at https://www.linkedin.com/developers/apps";
          case 403: {
            const scope = data?.message || "ACCESS_DENIED";
            return (
              `LinkedIn API: Permission denied (${scope}). ` +
              "Your token doesn't have the required scope for this operation. " +
              "Check your LinkedIn app's OAuth 2.0 scopes in the developer portal."
            );
          }
          case 404:
            return "LinkedIn API: Resource not found. Check the ID or URN.";
          case 429:
            return "LinkedIn API: Rate limit exceeded. Please wait before making more requests.";
          default:
            return (
              `LinkedIn API: Request failed with status ${status} — ` +
              `${data?.message || data?.code || "Unknown error"}`
            );
        }
      }

      if (axiosError.code === "ECONNABORTED") {
        return "LinkedIn API: Request timed out. Please try again.";
      }
      if (axiosError.code === "ENOTFOUND") {
        return "LinkedIn API: Network error — could not reach api.linkedin.com. Check your internet connection.";
      }
    }

    if (error instanceof Error) {
      return `LinkedIn API Error: ${error.message}`;
    }

    return `LinkedIn API: Unexpected error: ${String(error)}`;
  }

  /** Get structured error object (new API for AI agents) */
  static getStructuredError(error: unknown): StructuredError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{
        message?: string;
        code?: string;
        status?: number;
      }>;

      if (axiosError.response) {
        return this.classifyError(
          axiosError.response.status,
          axiosError.response.data
        );
      }

      if (axiosError.code === "ECONNABORTED") {
        return {
          code: LinkedInErrorCode.TIMEOUT,
          message: "LinkedIn API: Request timed out. Please try again.",
          retryable: true,
        };
      }
      if (axiosError.code === "ENOTFOUND") {
        return {
          code: LinkedInErrorCode.NETWORK_ERROR,
          message: "LinkedIn API: Network error — could not reach api.linkedin.com. Check your internet connection.",
          retryable: true,
        };
      }
    }

    if (error instanceof Error && "code" in error) {
      const structured = error as unknown as StructuredError;
      if (structured.code && Object.values(LinkedInErrorCode).includes(structured.code as LinkedInErrorCode)) {
        return structured;
      }
    }

    if (error instanceof Error) {
      return {
        code: LinkedInErrorCode.UNKNOWN,
        message: `LinkedIn API Error: ${error.message}`,
        retryable: false,
      };
    }

    return {
      code: LinkedInErrorCode.UNKNOWN,
      message: `LinkedIn API: Unexpected error: ${String(error)}`,
      retryable: false,
    };
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Determine if an error code is retryable */
function isRetryable(code: LinkedInErrorCode): boolean {
  switch (code) {
    case LinkedInErrorCode.RATE_LIMITED:
    case LinkedInErrorCode.TIMEOUT:
    case LinkedInErrorCode.NETWORK_ERROR:
    case LinkedInErrorCode.SERVER_ERROR:
      return true;
    default:
      return false;
  }
}
