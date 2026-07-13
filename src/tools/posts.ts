/**
 * LinkedIn Posts tools — create, read, list posts
 */

import { z } from "zod";
import { LinkedInClient, ResponseFormat, ToolEntry } from "../types.js";

// ─── Schemas ────────────────────────────────────────────────────────────────

const CreatePostSchema = z.object({
  text: z
    .string()
    .min(1, "Post text is required")
    .max(3000, "Post text must not exceed 3000 characters")
    .describe("The text content of the LinkedIn post"),
  visibility: z
    .enum(["PUBLIC", "CONNECTIONS", "LOGGED_IN"])
    .default("PUBLIC")
    .describe("Post visibility: PUBLIC = everyone, CONNECTIONS = 1st-degree only, LOGGED_IN = logged-in members"),
  response_format: z
    .nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Output format: 'markdown' for human-readable or 'json' for machine-readable"),
}).strict();

type CreatePostInput = z.infer<typeof CreatePostSchema>;

const ListPostsSchema = z.object({
  member_id: z
    .string()
    .optional()
    .describe("LinkedIn member ID (sub) to fetch posts for. Defaults to authenticated user"),
  start: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe("Start index for pagination"),
  count: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10)
    .describe("Number of posts to return (max 50)"),
  response_format: z
    .nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Output format: 'markdown' for human-readable or 'json' for machine-readable"),
}).strict();

type ListPostsInput = z.infer<typeof ListPostsSchema>;

// ─── Formatting Helpers ─────────────────────────────────────────────────────

function formatTimestamp(ms?: number): string {
  if (!ms) return "Unknown date";
  const date = new Date(ms);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Handlers ───────────────────────────────────────────────────────────────

export function createPostsTools(client: LinkedInClient): {
  createPost: ToolEntry<CreatePostInput>;
  listPosts: ToolEntry<ListPostsInput>;
} {
  return {
    createPost: {
      schema: CreatePostSchema,
      handler: async (params: CreatePostInput) => {
        try {
          const result = await client.createPost({
            text: params.text,
            visibility: params.visibility,
          });

          const output = {
            postId: result.id,
            urn: result.urn,
            text: params.text.substring(0, 100) + (params.text.length > 100 ? "..." : ""),
            visibility: params.visibility,
            status: "PUBLISHED" as const,
            url: `https://www.linkedin.com/feed/update/${result.urn}`,
          };

          if (params.response_format === ResponseFormat.JSON) {
            return { content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }] };
          }

          const lines = [
            "# ✅ Post Published Successfully!",
            "",
            `**Post ID:** ${output.postId}`,
            `**Visibility:** ${output.visibility}`,
            `**URL:** ${output.url}`,
            "",
            "**Content Preview:**",
            `> ${params.text.substring(0, 200)}${params.text.length > 200 ? "..." : ""}`,
          ];

          return { content: [{ type: "text" as const, text: lines.join("\n") }] };
        } catch (error) {
          return {
            isError: true,
            content: [{ type: "text" as const, text: LinkedInClient.formatError(error) }],
          };
        }
      },
    },

    listPosts: {
      schema: ListPostsSchema,
      handler: async (params: ListPostsInput) => {
        try {
          const result = await client.getUserPosts({
            memberId: params.member_id,
            start: params.start,
            count: params.count,
          });

          const output = {
            total: result.total,
            count: result.posts.length,
            start: params.start,
            has_more: result.total > params.start + result.posts.length,
            next_offset: result.total > params.start + result.posts.length
              ? params.start + result.posts.length
              : undefined,
            posts: result.posts.map((p) => ({
              id: p.id,
              text: p.commentary || "",
              author: p.author,
              created: p.created?.time ? formatTimestamp(p.created.time) : null,
              created_timestamp: p.created?.time || null,
              visibility: p.visibility || null,
              feedDistribution: p.distribution?.feedDistribution || null,
              url: `https://www.linkedin.com/feed/update/urn:li:share:${p.id}`,
            })),
          };

          if (params.response_format === ResponseFormat.JSON) {
            return { content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }] };
          }

          if (output.posts.length === 0) {
            return {
              content: [{
                type: "text" as const,
                text: "📝 No posts found. Try adjusting your filters or posting something first!",
              }],
            };
          }

          const lines = ["# 📝 Your LinkedIn Posts", ""];
          lines.push(`Showing ${output.posts.length} of ${output.total} posts`);
          lines.push("");

          for (const post of output.posts) {
            lines.push(`## ${post.id}`);
            if (post.created) lines.push(`**📅 ${post.created}**`);
            if (post.visibility) lines.push(`**👁️ ${post.visibility}**`);
            if (post.text) {
              const preview = post.text.substring(0, 300);
              lines.push("");
              lines.push(`> ${preview}${post.text.length > 300 ? "..." : ""}`);
            }
            lines.push("");
            lines.push(`🔗 ${post.url}`);
            lines.push("---");
            lines.push("");
          }

          if (output.has_more) {
            lines.push(`*More posts available. Use start=${output.next_offset} to see next page.*`);
          }

          return { content: [{ type: "text" as const, text: lines.join("\n") }] };
        } catch (error) {
          return {
            isError: true,
            content: [{ type: "text" as const, text: LinkedInClient.formatError(error) }],
          };
        }
      },
    },
  };
}
