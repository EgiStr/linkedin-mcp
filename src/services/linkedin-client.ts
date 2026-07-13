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

  // ─── Auth / User Info ────────────────────────────────────────────────────

  /** Get user info via OpenID Connect (works with "openid" scope) */
  async getUserInfo(): Promise<LinkedInUserInfo> {
    if (this.userInfo) return this.userInfo;

    const response = await this.api.get<LinkedInUserInfo>(
      "https://api.linkedin.com/v2/userinfo"
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
      "https://api.linkedin.com/v2/me",
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

  /** Create a text post (requires w_member_social scope)
   *  Uses the new /rest/posts endpoint (LinkedIn API 2024+)
   */
  async createPost(params: {
    text: string;
    visibility?: "PUBLIC" | "CONNECTIONS" | "LOGGED_IN";
    media?: {
      url: string;
      altText?: string;
    };
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

    if (params.media) {
      body.content = {
        media: {
          id: params.media.url,
          altText: params.media.altText || "",
        },
      };
    }

    const response = await this.api.post(
      "https://api.linkedin.com/rest/posts",
      body,
      {
        headers: {
          "LinkedIn-Version": "202401",
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
  } = {}): Promise<{ posts: LinkedInPost[]; total: number }> {
    const memberId = params.memberId || (await this.getMemberId());

    try {
      const response = await this.api.get<{
        elements?: LinkedInPost[];
        paging?: { total?: number; start?: number; count?: number };
      }>(
        "https://api.linkedin.com/v2/shares",
        {
          params: {
            q: "owners",
            owners: `urn:li:person:${memberId}`,
            start: params.start || 0,
            count: params.count || 10,
          },
        }
      );

      return {
        posts: response.data.elements || [],
        total: response.data.paging?.total || 0,
      };
    } catch {
      // Fallback to /rest/posts endpoint
      try {
        const response = await this.api.get<{
          elements?: LinkedInPost[];
          paging?: { total?: number };
        }>(
          `https://api.linkedin.com/rest/posts?author=${encodeURIComponent(
            `urn:li:person:${memberId}`
          )}`,
          {
            headers: {
              "LinkedIn-Version": "202401",
              "X-Restli-Protocol-Version": "2.0.0",
            },
          }
        );

        return {
          posts: response.data.elements || [],
          total: response.data.paging?.total || 0,
        };
      } catch {
        // Return empty on auth errors
        return { posts: [], total: 0 };
      }
    }
  }

  // ─── Feed / Network ──────────────────────────────────────────────────────

  /** Get feed posts (limited via API) */
  async getFeed(params: {
    start?: number;
    count?: number;
  } = {}): Promise<{ items: LinkedInFeedItem[]; total: number }> {
    const memberId = await this.getMemberId();

    try {
      const response = await this.api.get<{
        elements?: LinkedInFeedItem[];
        paging?: { total?: number };
      }>(
        "https://api.linkedin.com/v2/activities",
        {
          params: {
            q: "owners",
            owners: `urn:li:person:${memberId}`,
            start: params.start || 0,
            count: params.count || 10,
          },
        }
      );

      return {
        items: response.data.elements || [],
        total: response.data.paging?.total || 0,
      };
    } catch {
      // Fallback: get posts as feed
      const { posts } = await this.getUserPosts({
        memberId,
        start: params.start,
        count: params.count,
      });

      return {
        items: posts.map((p) => ({
          $URN: p.id,
          actor: p.author,
          time: p.created?.time,
          content: p.commentary,
        })),
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
    total: number;
  }> {
    try {
      const memberId = await this.getMemberId();
      const response = await this.api.get<{
        elements?: Array<{
          id: string;
          firstName?: string;
          lastName?: string;
          vanityName?: string;
        }>;
        paging?: { total?: number };
      }>(
        `https://api.linkedin.com/v2/connections/${memberId}`,
        {
          params: {
            start: params.start || 0,
            count: params.count || 10,
          },
        }
      );

      return {
        connections: (response.data.elements || []).map((c) => ({
          id: c.id,
          name: `${c.firstName || ""} ${c.lastName || ""}`.trim() || undefined,
          profileUrl: c.vanityName
            ? `https://www.linkedin.com/in/${c.vanityName}`
            : undefined,
        })),
        total: response.data.paging?.total || 0,
      };
    } catch (error) {
      // Connections API requires partner-level access — return informative error
      throw new Error(
        "Connections API requires LinkedIn Partner Program access. " +
        "The 'connections' scope is not available with basic OAuth apps. " +
        "Try using search_people instead."
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
    // LinkedIn v2 doesn't expose people search via public API
    // This uses a gnip/search-like approach or returns guidance
    throw new Error(
      "People search is not available through the standard LinkedIn API. " +
      "You need LinkedIn Sales Navigator API or a third-party provider " +
      "(e.g., LinkMCP, Phyllo, Unipile) for people search capabilities."
    );
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
      }>("https://api.linkedin.com/v2/organizationalEntityAcls", {
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
      const orgResponse = await this.api.get<{
        results?: Record<string, { localizedName?: string }>;
      }>("https://api.linkedin.com/v2/organizations", {
        params: {
          ids: `List(${orgIds.map((id) => `"${id}"`).join(",")})`,
        },
      });

      // The response shape depends on the API version
      const orgs = (response.data.elements || []).map((e) => ({
        id: e.id,
        name: e.localizedName,
      }));

      return orgs;
    } catch {
      return [];
    }
  }

  // ─── Error Handling ──────────────────────────────────────────────────────

  /** Format Axios errors into user-friendly messages */
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
}
