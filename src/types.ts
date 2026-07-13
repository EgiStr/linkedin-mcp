/**
 * Shared types and enums for LinkedIn MCP Server
 */

import { z } from "zod";
import { LinkedInClient } from "./services/linkedin-client.js";

export { LinkedInClient };

export enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json",
}

export interface ToolEntry<T = unknown> {
  schema: z.ZodTypeAny;
  handler: (params: T) => Promise<{
    content: Array<{ type: "text"; text: string; }>;
    isError?: boolean;
  }>;
}
