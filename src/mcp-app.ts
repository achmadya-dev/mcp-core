import {
  McpServer as SdkMcpServer,
  StdioServerTransport,
  type Transport,
} from "@modelcontextprotocol/server";
import type { Server as HttpServer } from "node:http";
import { envTrans } from "./env.js";
import { bindTools } from "./bind-tools.js";
import { startHttpTransport } from "./http-transport.js";
import type {
  CreateMcpAppOptions,
  McpAppConfig,
  McpSetupHook,
  RegisterableTool,
  RunMcpOptions,
} from "./types.js";

/**
 * Holds MCP server config, the tool list, and an optional setup hook.
 *
 * One `McpApp` can spawn many SDK server instances — stdio uses one long-lived
 * session; HTTP creates a fresh server per request (stateless). Use
 * {@link createMcpApp} or {@link runMcp} rather than constructing directly.
 *
 * @example
 * ```ts
 * const app = createMcpApp({ name: "My MCP", version: "1.0.0", tools: [myTool] });
 * const server = await app.createServer();
 * await server.connect(new StdioServerTransport());
 * ```
 */
export class McpApp {
  private readonly config: McpAppConfig;
  private readonly tools: RegisterableTool[];
  private readonly setup?: McpSetupHook;
  private activeServer: SdkMcpServer | null = null;

  constructor(
    config: McpAppConfig,
    tools: readonly RegisterableTool[] = [],
    setup?: McpSetupHook,
  ) {
    this.config = config;
    this.tools = [...tools];
    this.setup = setup;
  }

  /**
   * The active SDK v2 server instance.
   *
   * Set after {@link createServer} or {@link connect}. Throws if no server is active yet.
   *
   * @example
   * ```ts
   * await app.createServer();
   * app.sdk.registerTool("extra", config, handler);
   * ```
   */
  get sdk(): SdkMcpServer {
    if (!this.activeServer) {
      throw new Error("McpApp.sdk is available after createServer() or connect()");
    }
    return this.activeServer;
  }

  /**
   * Build a new SDK server, register `tools`, then run {@link McpSetupHook} if set.
   *
   * HTTP transport calls this on every incoming request so each client gets an
   * isolated server with no shared session state. For stdio, call once and
   * {@link connect} a transport.
   *
   * @example
   * ```ts
   * const server = await app.createServer();
   * app.setActiveServer(server);
   * ```
   */
  async createServer(): Promise<SdkMcpServer> {
    const server = new SdkMcpServer({
      name: this.config.name,
      version: this.config.version,
    });
    bindTools(server, this.tools);
    if (this.setup) await this.setup(server);
    return server;
  }

  /** Track the server returned by the latest {@link createServer} (needed for `.sdk`). */
  setActiveServer(server: SdkMcpServer): void {
    this.activeServer = server;
  }

  /** Convenience: {@link createServer} then {@link SdkMcpServer.connect} in one step. */
  async connect(transport: Transport): Promise<void> {
    const server = await this.createServer();
    this.activeServer = server;
    await server.connect(transport);
  }

  /** Close the active server and clear `.sdk`. */
  async close(): Promise<void> {
    if (this.activeServer) {
      await this.activeServer.close();
      this.activeServer = null;
    }
  }
}

/**
 * Factory for {@link McpApp}. Same options as {@link RunMcpOptions} minus transport.
 * Use when you need manual control over transports or multiple server lifecycles.
 *
 * @example
 * ```ts
 * const app = createMcpApp({
 *   name: "My MCP",
 *   version: "1.0.0",
 *   tools: [myTool],
 *   setup(server) {
 *     server.registerTool("custom", config, handler);
 *   },
 * });
 * ```
 */
export function createMcpApp(options: CreateMcpAppOptions): McpApp {
  return new McpApp(
    { name: options.name, version: options.version },
    options.tools,
    options.setup,
  );
}

/**
 * One-call entry point: create app, register tools, start transport.
 *
 * - **stdio** (default): blocks on stdin/stdout; Cursor spawns the process.
 * - **http**: listens on `http://host:port/mcp`; returns the Node HTTP server.
 *   Required for MCP Apps (inline UI). Transport resolves from `options.transport`
 *   or env `TRANSPORT`.
 *
 * Standard tools go in `tools`. SDK-native registration (MCP Apps, custom `_meta`)
 * belongs in `setup`.
 *
 * @example
 * ```ts
 * // stdio
 * await runMcp({ name: "My MCP", version: "1.0.0", tools: [myTool] });
 *
 * // http — returns Node HTTP server
 * const http = await runMcp({
 *   name: "My MCP",
 *   version: "1.0.0",
 *   tools: [myTool],
 *   transport: "http",
 *   http: { port: 3001 },
 * });
 * ```
 */
export async function runMcp(
  options: RunMcpOptions & { transport: "stdio" },
): Promise<void>;
export async function runMcp(
  options: RunMcpOptions & { transport: "http" },
): Promise<HttpServer>;
export async function runMcp(options: RunMcpOptions): Promise<void | HttpServer>;
export async function runMcp(options: RunMcpOptions): Promise<void | HttpServer> {
  const transport = envTrans(options.transport);
  const app = createMcpApp({
    name: options.name,
    version: options.version,
    tools: options.tools,
    setup: options.setup,
  });

  if (transport === "http") {
    return startHttpTransport(app, options.http);
  }

  const server = await app.createServer();
  app.setActiveServer(server);
  await server.connect(new StdioServerTransport());
}
