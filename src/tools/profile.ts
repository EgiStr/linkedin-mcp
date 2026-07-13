/**
 * LinkedIn Profile tools — get own profile, user info, full profile
 */

import { z } from "zod";
import { LinkedInClient, ResponseFormat, ToolEntry } from "../types.js";

// ─── Schemas ────────────────────────────────────────────────────────────────

const GetMyProfileSchema = z.object({
  response_format: z
    .nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Output format: 'markdown' for human-readable or 'json' for machine-readable"),
}).strict();

type GetMyProfileInput = z.infer<typeof GetMyProfileSchema>;

const GetUserInfoSchema = z.object({
  response_format: z
    .nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Output format: 'markdown' for human-readable or 'json' for machine-readable"),
}).strict();

type GetUserInfoInput = z.infer<typeof GetUserInfoSchema>;

// ─── Handlers ───────────────────────────────────────────────────────────────

export function createProfileTools(client: LinkedInClient): {
  getMyProfile: ToolEntry<GetMyProfileInput>;
  getUserInfo: ToolEntry<GetUserInfoInput>;
} {
  return {
    getMyProfile: {
      schema: GetMyProfileSchema,
      handler: async (params: GetMyProfileInput) => {
        try {
          const profile = await client.getMyProfile();
          const userInfo = await client.getUserInfo();

          const output = {
            id: profile.id,
            firstName: profile.localizedFirstName || userInfo.given_name,
            lastName: profile.localizedLastName || userInfo.family_name,
            fullName: userInfo.name || `${profile.localizedFirstName || ""} ${profile.localizedLastName || ""}`.trim(),
            headline: profile.headline || null,
            vanityName: profile.vanityName || null,
            profileUrl: profile.vanityName
              ? `https://www.linkedin.com/in/${profile.vanityName}`
              : null,
            email: userInfo.email || null,
            pictureUrl: userInfo.picture || null,
            locale: userInfo.locale || null,
          };

          if (params.response_format === ResponseFormat.JSON) {
            return { content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }] };
          }

          const lines = [
            `# 👤 ${output.fullName || "LinkedIn Profile"}`,
            "",
          ];
          if (output.headline) lines.push(`**Headline:** ${output.headline}`);
          if (output.vanityName) lines.push(`**LinkedIn:** ${output.profileUrl}`);
          if (output.email) lines.push(`**Email:** ${output.email}`);
          if (output.locale) lines.push(`**Locale:** ${output.locale}`);
          if (output.pictureUrl) lines.push(`**Profile Picture:** ${output.pictureUrl}`);
          lines.push("", `**Profile ID:** ${output.id}`);

          return { content: [{ type: "text" as const, text: lines.join("\n") }] };
        } catch (error) {
          return {
            isError: true,
            content: [{ type: "text" as const, text: LinkedInClient.formatError(error) }],
          };
        }
      },
    },

    getUserInfo: {
      schema: GetUserInfoSchema,
      handler: async (params: GetUserInfoInput) => {
        try {
          const userInfo = await client.getUserInfo();

          const output = {
            sub: userInfo.sub,
            name: userInfo.name || null,
            givenName: userInfo.given_name || null,
            familyName: userInfo.family_name || null,
            email: userInfo.email || null,
            emailVerified: userInfo.email_verified || false,
            picture: userInfo.picture || null,
            locale: userInfo.locale || null,
          };

          if (params.response_format === ResponseFormat.JSON) {
            return { content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }] };
          }

          const lines = [
            `# 👤 ${output.name || "LinkedIn User Info"}`,
            "",
            `**Name:** ${output.name || `${output.givenName || ""} ${output.familyName || ""}`.trim() || "N/A"}`,
          ];
          if (output.email) lines.push(`**Email:** ${output.email}${output.emailVerified ? " ✅" : ""}`);
          if (output.picture) lines.push(`**Picture:** ${output.picture}`);
          if (output.locale) lines.push(`**Locale:** ${output.locale}`);
          lines.push("", `**Subject (sub):** ${output.sub}`);

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
