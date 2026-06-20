import type { Express } from "express";
import type {
  McpServer as SdkMcpServer,
  StandardSchemaWithJSON,
} from "@modelcontextprotocol/server";

export type { StandardSchemaWithJSON };

/** Parsed tool handler args from a Standard Schema input. */
export type ToolInput<S extends StandardSchemaWithJSON> =
  StandardSchemaWithJSON.InferOutput<S>;

export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export type McpTransport = "stdio" | "http";

export interface McpAppConfig {
  name: string;
  version: string;
}

export type HttpTransportOptions = {
  /** MCP endpoint path (default `/mcp`). */
  path?: string;
  port?: number;
  /** Address shown in startup log (default `127.0.0.1`). */
  listenLabel?: string;
  allowedHosts?: string[];
  /** Optional extra Express routes (favicon, health, …). */
  setupRoutes?: (app: Express) => void;
  logRequests?: boolean;
  /** Register SIGINT/SIGTERM handlers that exit the process (default `true`). */
  registerShutdownHandlers?: boolean;
};

export type RunMcpOptions = McpAppConfig & {
  tools: readonly RegisterableTool[];
  transport?: McpTransport;
  http?: HttpTransportOptions;
  /** Register resources, prompts, MCP Apps (e.g. draw.io UI), or other SDK features. */
  setup?: McpSetupHook;
};

type BivariantHandler<
  TInput extends StandardSchemaWithJSON,
  TResult extends JsonValue | void,
> = {
  bivarianceHack(args: ToolInput<TInput>): Promise<TResult> | TResult;
}["bivarianceHack"];

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

/** Register resources, prompts, MCP Apps, or other SDK features on each server instance. */
export type McpSetupHook = (server: SdkMcpServer) => void | Promise<void>;

export type CreateMcpAppOptions = McpAppConfig & {
  tools: readonly RegisterableTool[];
  setup?: McpSetupHook;
};

/** Minimal surface used by transport modules. */
export type McpServerFactory = {
  createServer(): Promise<SdkMcpServer>;
  setActiveServer(server: SdkMcpServer): void;
};
