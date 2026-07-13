/**
 * LinkedIn Network tools — feed, connections, search
 */

import { z } from "zod";
import { LinkedInClient, ResponseFormat, ToolEntry } from "../types.js";

// ─── Schemas ────────────────────────────────────────────────────────────────

const GetFeedSchema = z.object({
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
    .describe("Number of feed items to return (max 50)"),
  response_format: z
    .nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Output format: 'markdown' for human-readable or 'json' for machine-readable"),
}).strict();

type GetFeedInput = z.infer<typeof GetFeedSchema>;

const GetConnectionsSchema = z.object({
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
    .describe("Number of connections to return (max 50)"),
  response_format: z
    .nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Output format: 'markdown' for human-readable or 'json' for machine-readable"),
}).strict();

type GetConnectionsInput = z.infer<typeof GetConnectionsSchema>;

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

export function createNetworkTools(client: LinkedInClient): {
  getFeed: ToolEntry<GetFeedInput>;
  getConnections: ToolEntry<GetConnectionsInput>;
} {
  return {
    getFeed: {
      schema: GetFeedSchema,
      handler: async (params: GetFeedInput) => {
        try {
          const result = await client.getFeed({
            start: params.start,
            count: params.count,
          });

          const output = {
            total: result.total,
            count: result.items.length,
            start: params.start,
            has_more: result.total > params.start + result.items.length,
            items: result.items.map((item) => ({
              id: item.$URN,
              actor: item.actor,
              time: item.time ? formatTimestamp(item.time) : null,
              timestamp: item.time || null,
              content: item.content?.substring(0, 500) || null,
            })),
          };

          if (params.response_format === ResponseFormat.JSON) {
            return { content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }] };
          }

          if (output.items.length === 0) {
            return {
              content: [{
                type: "text" as const,
                text: "📰 Feed is empty. Connect with more people or check back later.",
              }],
            };
          }

          const lines = ["# 📰 LinkedIn Feed", ""];
          lines.push(`Showing ${output.count} items`);
          lines.push("");

          for (const item of output.items) {
            lines.push(`### ${item.id}`);
            if (item.time) lines.push(`📅 ${item.time}`);
            if (item.content) {
              lines.push("");
              lines.push(`> ${item.content}`);
            }
            lines.push("");
            lines.push("---");
            lines.push("");
          }

          if (output.has_more) {
            lines.push(`*More items available. Use start=${params.start + params.count} to see next page.*`);
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

    getConnections: {
      schema: GetConnectionsSchema,
      handler: async (params: GetConnectionsInput) => {
        try {
          const result = await client.getConnections({
            start: params.start,
            count: params.count,
          });

          const output = {
            total: result.total,
            count: result.connections.length,
            start: params.start,
            has_more: result.total > params.start + result.connections.length,
            connections: result.connections,
          };

          if (params.response_format === ResponseFormat.JSON) {
            return { content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }] };
          }

          if (output.connections.length === 0) {
            return {
              content: [{
                type: "text" as const,
                text: "🔗 No connections found.",
              }],
            };
          }

          const lines = ["# 🔗 Your LinkedIn Connections", ""];
          lines.push(`Showing ${output.count} of ${output.total} connections`);
          lines.push("");

          for (const conn of output.connections) {
            lines.push(`- **${conn.name || conn.id}**`);
            if (conn.profileUrl) lines.push(`  🔗 ${conn.profileUrl}`);
            lines.push("");
          }

          if (output.has_more) {
            lines.push(`*More connections available. Use start=${params.start + params.count} to see next page.*`);
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
