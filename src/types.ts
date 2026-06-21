import type { Express } from "express";
import type {
  CallToolResult,
  McpServer as SdkMcpServer,
  StandardSchemaWithJSON,
} from "@modelcontextprotocol/server";

export type { StandardSchemaWithJSON };

/** Parsed, validated tool args — equivalent to `z.infer<typeof inputSchema>`. */
export type ToolInput<S extends StandardSchemaWithJSON> =
  StandardSchemaWithJSON.InferOutput<S>;

export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/** How {@link runMcp} connects to clients: subprocess pipes (stdio) or HTTP endpoint. */
export type McpTransport = "stdio" | "http";

export interface McpAppConfig {
  name: string;
  version: string;
}

export type HttpTransportOptions = {
  /** URL path for MCP requests. Default: `/mcp`. */
  path?: string;
  /** Listen port. Falls back to env `PORT`, then `3001`. */
  port?: number;
  /** Host label printed in the startup log (not the bind address). Default: `127.0.0.1`. */
  listenLabel?: string;
  /** Allowed Host headers for DNS rebinding protection (passed to MCP Express app). */
  allowedHosts?: string[];
  /**
   * Mount extra Express routes before the MCP handler (health checks, favicon, …).
   * @example
   * ```ts
   * setupRoutes: (app) => app.get("/health", (_req, res) => res.json({ ok: true }))
   * ```
   */
  setupRoutes?: (app: Express) => void;
  /** Log each MCP request/response with timing. Default: `true`. */
  logRequests?: boolean;
  /** Attach SIGINT/SIGTERM handlers that close the server and exit. Default: `true`. */
  registerShutdownHandlers?: boolean;
};

/**
 * Full configuration for {@link runMcp}.
 *
 * `tools` are registered on every server instance. `setup` runs after tools and is
 * the place for resources, prompts, MCP Apps, or `server.registerTool(…)` with
 * direct SDK config (custom `_meta`, annotations, …). `transport` defaults to stdio;
 * use `"http"` for remote clients and inline UI.
 *
 * @example
 * ```ts
 * await runMcp({
 *   name: "My MCP",
 *   version: "1.0.0",
 *   tools: [queryTool],
 *   transport: "http",
 *   http: { port: 3001 },
 *   setup(server) {
 *     registerAppResource(server, "UI", UI_URI, { mimeType: RESOURCE_MIME_TYPE }, readHtml);
 *   },
 * });
 * ```
 */
export type RunMcpOptions = McpAppConfig & {
  tools: readonly RegisterableTool[];
  transport?: McpTransport;
  http?: HttpTransportOptions;
  /**
   * Called once per server instance with the SDK server. Use for MCP Apps, resources,
   * prompts, or tools that cannot go through {@link defineTool}.
   * @example
   * ```ts
   * setup(server) {
   *   registerAppResource(server, "UI", UI_URI, { mimeType: RESOURCE_MIME_TYPE }, readHtml);
   * }
   * ```
   */
  setup?: McpSetupHook;
};

type ToolHandlerResult<TResult extends JsonValue | void> = TResult | CallToolResult;

type BivariantHandler<
  TInput extends StandardSchemaWithJSON,
  TResult extends JsonValue | void,
> = {
  bivarianceHack(
    args: ToolInput<TInput>,
  ): Promise<ToolHandlerResult<TResult>> | ToolHandlerResult<TResult>;
}["bivarianceHack"];

/**
 * Shape of a tool passed to {@link defineTool}.
 *
 * `inputSchema` / `outputSchema` must implement Standard Schema (Zod 4, Valibot, …).
 * The handler receives validated input and may return plain JSON (auto-wrapped),
 * `CallToolResult` helpers (`ok`, `fail`, …), or throw `ToolError`.
 *
 * @example
 * ```ts
 * {
 *   name: "query",
 *   description: "Run SQL",
 *   inputSchema: z.object({ sql: z.string() }),
 *   handler: async ({ sql }) => ok({ rows: await db.query(sql) }),
 * }
 * ```
 */
export interface ToolDefinition<
  TInput extends StandardSchemaWithJSON = StandardSchemaWithJSON,
  TResult extends JsonValue | void = JsonObject,
> {
  name: string;
  description: string;
  inputSchema: TInput;
  outputSchema?: StandardSchemaWithJSON;
  handler: BivariantHandler<TInput, TResult>;
}

export type RegisterableTool = ToolDefinition<StandardSchemaWithJSON, JsonValue | void>;

/**
 * Callback invoked for each new SDK server (stdio session or HTTP request).
 *
 * Runs after the `tools` array is bound. Use for MCP Apps, resources, prompts,
 * or `server.registerTool` with SDK-native config. May be async.
 *
 * @example
 * ```ts
 * const setup: McpSetupHook = (server) => {
 *   registerAppResource(server, "UI", UI_URI, { mimeType: RESOURCE_MIME_TYPE }, readHtml);
 * };
 * ```
 */
export type McpSetupHook = (server: SdkMcpServer) => void | Promise<void>;

/** Same fields as {@link RunMcpOptions} except transport — used by {@link createMcpApp}. */
export type CreateMcpAppOptions = McpAppConfig & {
  tools: readonly RegisterableTool[];
  setup?: McpSetupHook;
};

/** Minimal surface used by transport modules. */
export type McpServerFactory = {
  createServer(): Promise<SdkMcpServer>;
  setActiveServer(server: SdkMcpServer): void;
};
