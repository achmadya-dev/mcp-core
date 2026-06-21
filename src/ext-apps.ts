/**
 * MCP Apps — inline UI in MCP clients (e.g. draw.io diagrams in Cursor chat).
 *
 * Import from `@achmadya-dev/mcp-core/ext-apps` (not the main entry). Requires
 * peer `@modelcontextprotocol/ext-apps` and **HTTP transport** — MCP Apps do not
 * work over stdio.
 *
 * Typical flow: register an HTML resource with {@link registerAppResource}, then
 * register a tool with {@link registerAppTool} pointing at that resource via
 * `_meta.ui.resourceUri`. Both go inside {@link McpSetupHook}.
 *
 * @example
 * ```ts
 * import { runMcp } from "@achmadya-dev/mcp-core";
 * import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@achmadya-dev/mcp-core/ext-apps";
 *
 * const UI_URI = "ui://my-app/view.html";
 *
 * await runMcp({
 *   name: "My App MCP",
 *   version: "1.0.0",
 *   tools: [],
 *   transport: "http",
 *   setup(server) {
 *     registerAppResource(server, "View", UI_URI, { mimeType: RESOURCE_MIME_TYPE }, async () => ({
 *       contents: [{ uri: UI_URI, mimeType: RESOURCE_MIME_TYPE, text: "<html>...</html>" }],
 *     }));
 *     registerAppTool(server, "show_ui", { inputSchema: z.object({}), _meta: { ui: { resourceUri: UI_URI } } }, handler);
 *   },
 * });
 * ```
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
