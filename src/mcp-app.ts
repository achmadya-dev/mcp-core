import {
  McpServer as SdkMcpServer,
  StdioServerTransport,
  type StandardSchemaWithJSON,
  type Transport,
} from "@modelcontextprotocol/server";
import type { Server as HttpServer } from "node:http";
import { envTrans } from "./env.js";
import { registerTool, registerTools } from "./tools.js";
import { startHttpTransport } from "./http-transport.js";
import type {
  CreateMcpAppOptions,
  JsonValue,
  McpAppConfig,
  McpSetupHook,
  RegisterableTool,
  RunMcpOptions,
  ToolDefinition,
} from "./types.js";

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
   * Underlying SDK v2 server for the active session.
   * Available after {@link createServer} or {@link connect}.
   */
  get sdk(): SdkMcpServer {
    if (!this.activeServer) {
      throw new Error("McpApp.sdk is available after createServer() or connect()");
    }
    return this.activeServer;
  }

  registerTool<
    TInput extends StandardSchemaWithJSON,
    TResult extends JsonValue | void = JsonValue,
  >(definition: ToolDefinition<TInput, TResult>): void {
    this.tools.push(definition);
    if (this.activeServer) {
      registerTool(this.activeServer, definition);
    }
  }

  /** Create a fresh SDK server with tools and optional {@link setup} (stateless HTTP per request). */
  async createServer(): Promise<SdkMcpServer> {
    const server = new SdkMcpServer({
      name: this.config.name,
      version: this.config.version,
    });
    registerTools(server, this.tools);
    if (this.setup) {
      await this.setup(server);
    }
    return server;
  }

  setActiveServer(server: SdkMcpServer): void {
    this.activeServer = server;
  }

  async connect(transport: Transport): Promise<void> {
    const server = await this.createServer();
    this.activeServer = server;
    await server.connect(transport);
  }

  async close(): Promise<void> {
    if (this.activeServer) {
      await this.activeServer.close();
      this.activeServer = null;
    }
  }
}

export function createMcpApp(options: CreateMcpAppOptions): McpApp {
  return new McpApp(
    { name: options.name, version: options.version },
    options.tools,
    options.setup,
  );
}

export async function runMcp(
  options: RunMcpOptions & { transport: "stdio" },
): Promise<void>;
export async function runMcp(
  options: RunMcpOptions & { transport: "http" },
): Promise<HttpServer>;
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
