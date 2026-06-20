/**
 * Re-exports MCP Apps server helpers for inline UI (e.g. draw.io diagrams).
 *
 * Install `@modelcontextprotocol/ext-apps` in your MCP package alongside mcp-core.
 */
export {
  RESOURCE_MIME_TYPE,
  RESOURCE_URI_META_KEY,
  registerAppResource,
  registerAppTool,
} from "@modelcontextprotocol/ext-apps/server";
export type {
  McpUiAppResourceConfig,
  McpUiAppToolConfig,
  McpUiReadResourceCallback,
} from "@modelcontextprotocol/ext-apps/server";
