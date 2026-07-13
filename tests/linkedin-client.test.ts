/**
 * Tests for LinkedInClient — mocking API calls via nock.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import nock from "nock";
import { LinkedInClient } from "../src/services/linkedin-client.js";

const API_BASE = "https://api.linkedin.com";

describe("LinkedInClient", () => {
  let client: LinkedInClient;

  beforeEach(() => {
    client = new LinkedInClient("test-token");
    nock.cleanAll();
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.enableNetConnect();
    nock.cleanAll();
  });

  describe("getUserInfo", () => {
    it("returns user info from OpenID Connect endpoint", async () => {
      nock(API_BASE)
        .get("/v2/userinfo")
        .reply(200, {
          sub: "abc123",
          name: "John Doe",
          given_name: "John",
          family_name: "Doe",
          email: "john@example.com",
          email_verified: true,
          picture: "https://example.com/pic.jpg",
          locale: "en-US",
        });

      const result = await client.getUserInfo();

      expect(result.sub).toBe("abc123");
      expect(result.name).toBe("John Doe");
      expect(result.email).toBe("john@example.com");
    });

    it("caches user info after first call", async () => {
      nock(API_BASE)
        .get("/v2/userinfo")
        .reply(200, { sub: "abc123", name: "John" });

      const first = await client.getUserInfo();
      // Second call should use cache — no new nock scope needed
      const second = await client.getUserInfo();

      expect(first).toEqual(second);
      expect(first.sub).toBe("abc123");
    });
  });

  describe("getMemberId", () => {
    it("returns the sub from userinfo", async () => {
      nock(API_BASE)
        .get("/v2/userinfo")
        .reply(200, { sub: "member-456" });

      const id = await client.getMemberId();
      expect(id).toBe("member-456");
    });
  });

  describe("getMyProfile", () => {
    it("returns LinkedIn profile data", async () => {
      // getMyProfile calls getUserInfo internally for member ID
      nock(API_BASE)
        .get("/v2/userinfo")
        .reply(200, { sub: "profile-789", name: "John Doe" });

      nock(API_BASE)
        .get("/v2/me")
        .query(true)
        .reply(200, {
          id: "profile-789",
          localizedFirstName: "John",
          localizedLastName: "Doe",
          vanityName: "johndoe",
          headline: "Software Engineer at Acme",
        });

      const profile = await client.getMyProfile();

      expect(profile.id).toBe("profile-789");
      expect(profile.localizedFirstName).toBe("John");
      expect(profile.vanityName).toBe("johndoe");
    });
  });

  describe("getFullProfile", () => {
    it("returns combined profile + userinfo", async () => {
      nock(API_BASE)
        .get("/v2/userinfo")
        .reply(200, { sub: "u-1", name: "John Doe", email: "john@test.com" });

      nock(API_BASE)
        .get("/v2/me")
        .query(true)
        .reply(200, { id: "u-1", localizedFirstName: "John", headline: "Engineer" });

      const result = await client.getFullProfile();

      expect(result.profile.id).toBe("u-1");
      expect(result.userInfo.email).toBe("john@test.com");
    });
  });

  describe("createPost", () => {
    it("creates a post and returns URN", async () => {
      nock(API_BASE)
        .get("/v2/userinfo")
        .reply(200, { sub: "member-456" });

      nock(API_BASE)
        .post("/rest/posts", (body) => {
          return body.commentary === "Hello World!" && body.lifecycleState === "PUBLISHED";
        })
        .reply(201, "", {
          "x-restli-id": "urn:li:share:post-001",
        });

      const result = await client.createPost({ text: "Hello World!" });

      expect(result.id).toBe("post-001");
      expect(result.urn).toBe("urn:li:share:post-001");
    });

    it("supports visibility options", async () => {
      nock(API_BASE)
        .get("/v2/userinfo")
        .reply(200, { sub: "member-456" });

      nock(API_BASE)
        .post("/rest/posts", (body) => body.visibility === "CONNECTIONS")
        .reply(201, "", { "x-restli-id": "urn:li:share:post-002" });

      await client.createPost({
        text: "Connections only",
        visibility: "CONNECTIONS",
      });
    });

    it("supports LOGGED_IN visibility", async () => {
      nock(API_BASE)
        .get("/v2/userinfo")
        .reply(200, { sub: "member-456" });

      nock(API_BASE)
        .post("/rest/posts", (body) => body.visibility === "LOGGED_IN")
        .reply(201, "", { "x-restli-id": "urn:li:share:post-003" });

      await client.createPost({ text: "Logged in only", visibility: "LOGGED_IN" });
    });
  });

  describe("getUserPosts", () => {
    it("returns posts list (v2/shares endpoint)", async () => {
      nock(API_BASE)
        .get("/v2/userinfo")
        .reply(200, { sub: "member-456" });

      nock(API_BASE)
        .get("/v2/shares")
        .query(true)
        .reply(200, {
          elements: [
            {
              id: "post-001",
              commentary: "My first post",
              created: { time: 1700000000000 },
              distribution: { feedDistribution: "MAIN_FEED" },
              visibility: "PUBLIC",
              author: "urn:li:person:member-456",
            },
          ],
          paging: { total: 1, start: 0, count: 10 },
        });

      const result = await client.getUserPosts({ start: 0, count: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe("post-001");
      expect(result.total).toBe(1);
    });

    it("falls back to /rest/posts on v2 failure", async () => {
      nock(API_BASE)
        .get("/v2/userinfo")
        .reply(200, { sub: "member-456" });

      // Fail on v2
      nock(API_BASE)
        .get("/v2/shares")
        .query(true)
        .reply(403);

      // Succeed on rest
      nock(API_BASE)
        .get("/rest/posts")
        .query(true)
        .reply(200, {
          elements: [{ id: "rest-post-1", commentary: "From REST API" }],
          paging: { total: 1 },
        });

      const result = await client.getUserPosts();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe("rest-post-1");
    });

    it("returns empty on both endpoints failing", async () => {
      nock(API_BASE)
        .get("/v2/userinfo")
        .reply(200, { sub: "member-456" });

      nock(API_BASE)
        .get("/v2/shares")
        .query(true)
        .reply(403);

      nock(API_BASE)
        .get("/rest/posts")
        .query(true)
        .reply(403);

      const result = await client.getUserPosts();

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("getFeed", () => {
    it("returns feed items from /v2/activities", async () => {
      nock(API_BASE)
        .get("/v2/userinfo")
        .reply(200, { sub: "member-456" });

      nock(API_BASE)
        .get("/v2/activities")
        .query(true)
        .reply(200, {
          elements: [
            {
              $URN: "urn:li:activity:act-001",
              actor: "urn:li:person:member-456",
              time: 1700000000000,
              content: "Activity content",
            },
          ],
          paging: { total: 1 },
        });

      const result = await client.getFeed();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].$URN).toBe("urn:li:activity:act-001");
    });

    it("falls back to getUserPosts on activity endpoint failure", async () => {
      nock(API_BASE)
        .get("/v2/userinfo")
        .reply(200, { sub: "member-456" });

      nock(API_BASE)
        .get("/v2/activities")
        .query(true)
        .reply(403);

      // Fallback calls getUserPosts which tries /v2/shares then /rest/posts
      nock(API_BASE)
        .get("/v2/shares")
        .query(true)
        .reply(200, {
          elements: [
            {
              id: "post-fallback",
              commentary: "Fallback post",
              created: { time: 1700000000000 },
            },
          ],
          paging: { total: 1 },
        });

      const result = await client.getFeed();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].content).toBe("Fallback post");
    });
  });

  describe("getConnections", () => {
    it("returns connections list when partner API works", async () => {
      nock(API_BASE)
        .get("/v2/userinfo")
        .reply(200, { sub: "member-456" });

      nock(API_BASE)
        .get("/v2/connections/member-456")
        .query(true)
        .reply(200, {
          elements: [
            { id: "conn-1", firstName: "Jane", lastName: "Smith", vanityName: "janesmith" },
            { id: "conn-2", firstName: "Bob" },
          ],
          paging: { total: 2 },
        });

      const result = await client.getConnections();

      expect(result.connections).toHaveLength(2);
      expect(result.connections[0].name).toBe("Jane Smith");
      expect(result.connections[0].profileUrl).toBe("https://www.linkedin.com/in/janesmith");
      expect(result.connections[1].profileUrl).toBeUndefined();
      expect(result.total).toBe(2);
    });

    it("throws helpful error for non-partner apps", async () => {
      nock(API_BASE)
        .get("/v2/userinfo")
        .reply(200, { sub: "member-456" });

      nock(API_BASE)
        .get("/v2/connections/member-456")
        .query(true)
        .reply(403);

      await expect(client.getConnections()).rejects.toThrow("Partner Program");
    });
  });

  describe("searchPeople", () => {
    it("throws informative error", async () => {
      await expect(client.searchPeople({ keywords: "engineer" })).rejects.toThrow(
        "not available"
      );
    });
  });

  describe("getOrganizations", () => {
    it("returns organizations list", async () => {
      nock(API_BASE)
        .get("/v2/userinfo")
        .reply(200, { sub: "member-456" });

      nock(API_BASE)
        .get("/v2/organizationalEntityAcls")
        .query(true)
        .reply(200, {
          elements: [
            { id: "org-1", localizedName: "Acme Corp", vanityName: "acme" },
          ],
        });

      // Second call to fetch org names
      nock(API_BASE)
        .get("/v2/organizations")
        .query(true)
        .reply(200, {
          results: { "urn:li:organization:org-1": { localizedName: "Acme Corp" } },
        });

      const result = await client.getOrganizations();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("org-1");
    });

    it("returns empty when no admin orgs", async () => {
      nock(API_BASE)
        .get("/v2/userinfo")
        .reply(200, { sub: "member-456" });

      nock(API_BASE)
        .get("/v2/organizationalEntityAcls")
        .query(true)
        .reply(200, { elements: [] });

      const result = await client.getOrganizations();

      expect(result).toHaveLength(0);
    });
  });
});
