/**
 * LinkedIn Posts tools — create, read, list posts
 */

import { z } from "zod";
import { readFile } from "fs/promises";
import path from "path";
import { LinkedInClient, ResponseFormat, ToolEntry } from "../types.js";
import {
  MediaUploader,
  MediaUploadError,
} from "../media/uploader.js";

// ─── MIME Mapping ────────────────────────────────────────────────────────────

const EXTENSION_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
};

/** Guess MIME type from local file path extension. Falls back to octet-stream. */
function mimeFromPath(filePath: string): string {
  return EXTENSION_MIME[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

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
  media_url: z
    .string()
    .url("Invalid media URL")
    .optional()
    .describe("URL to an image file (JPEG/PNG/GIF) to attach to the post. Supported formats: JPEG, PNG, GIF. Max size: 10MB."),
  media_path: z
    .string()
    .optional()
    .describe("Local file path to an image file. Alternative to media_url. Supported formats: JPEG, PNG, GIF. Max size: 10MB."),
  alt_text: z
    .string()
    .max(200, "Alt text must not exceed 200 characters")
    .optional()
    .describe("Alt text for the attached image (max 200 characters). Defaults to 'Image'."),
})
  .strict()
  .superRefine((data, ctx) => {
    // Only one of media_url / media_path may be set
    if (data.media_url && data.media_path) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide either media_url or media_path, not both",
        path: ["media_url"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide either media_url or media_path, not both",
        path: ["media_path"],
      });
    }
  });

type CreatePostInput = z.infer<typeof CreatePostSchema>;

const DeletePostSchema = z.object({
  post_id: z
    .string()
    .min(1, "Post ID or URN is required")
    .describe("The ID or URN of the post to delete (e.g., 'post-123' or 'urn:li:share:post-123')"),
  response_format: z
    .nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Output format: 'markdown' for human-readable or 'json' for machine-readable"),
}).strict();

type DeletePostInput = z.infer<typeof DeletePostSchema>;

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
  deletePost: ToolEntry<DeletePostInput>;
} {
  return {
    createPost: {
      schema: CreatePostSchema,
      handler: async (params: CreatePostInput) => {
        try {
          // ── Media upload (if requested) ────────────────────────────────
          let imageUrn: string | undefined;
          let altText: string | undefined;

          if (params.media_url || params.media_path) {
            const accessToken = client.getAccessToken();
            const memberId = await client.getMemberId();
            const memberUrn = `urn:li:person:${memberId}`;
            const uploader = new MediaUploader(accessToken);
            altText = params.alt_text;

            if (params.media_url) {
              const result = await uploader.uploadImage(
                params.media_url,
                memberUrn,
              );
              imageUrn = result.imageUrn;
            } else if (params.media_path) {
              const buffer = await readFile(path.resolve(params.media_path));
              const mimeType = mimeFromPath(params.media_path);
              const result = await uploader.uploadImageFromBuffer(
                buffer,
                mimeType,
                memberUrn,
              );
              imageUrn = result.imageUrn;
            }
          }

          // ── Create the post ────────────────────────────────────────────
          const result = await client.createPost({
            text: params.text,
            visibility: params.visibility,
            imageUrn,
            altText,
          });

          const hasMedia = !!imageUrn;
          const output = {
            postId: result.id,
            urn: result.urn,
            text: params.text.substring(0, 100) + (params.text.length > 100 ? "..." : ""),
            visibility: params.visibility,
            status: "PUBLISHED" as const,
            url: `https://www.linkedin.com/feed/update/${result.urn}`,
            ...(hasMedia ? { has_media: true } : {}),
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
          ];

          if (hasMedia) {
            lines.push(`**Media:** ✅ Image attached`);
          }

          lines.push(
            "",
            "**Content Preview:**",
            `> ${params.text.substring(0, 200)}${params.text.length > 200 ? "..." : ""}`,
          );

          return { content: [{ type: "text" as const, text: lines.join("\n") }] };
        } catch (error) {
          // Structured media upload errors
          if (error instanceof MediaUploadError) {
            return {
              isError: true,
              content: [{
                type: "text" as const,
                text: `Media Upload Error [${error.code}]: ${error.message}${error.retryable ? " (retryable)" : ""}`,
              }],
            };
          }
          // Standard LinkedIn API errors
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
            total: result.total || result.items.length,
            count: result.items.length,
            start: params.start,
            has_more: result.hasMore,
            next_offset: result.hasMore
              ? params.start + result.items.length
              : undefined,
            posts: result.items.map((p) => ({
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

    deletePost: {
      schema: DeletePostSchema,
      handler: async (params: DeletePostInput) => {
        try {
          await client.deletePost(params.post_id);

          const output = {
            postId: params.post_id,
            status: "DELETED" as const,
            note: "This action cannot be undone.",
          };

          if (params.response_format === ResponseFormat.JSON) {
            return { content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }] };
          }

          const lines = [
            "# 🗑️ Post Deleted",
            "",
            `**Post ID:** ${params.post_id}`,
            `**Status:** DELETED`,
            "",
            "> ⚠️ This action cannot be undone. The post has been permanently removed.",
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
  };
}
