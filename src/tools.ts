import {
  McpServer as SdkMcpServer,
  type StandardSchemaWithJSON,
  type ToolCallback,
} from "@modelcontextprotocol/server";
import type {
  JsonObject,
  JsonValue,
  RegisterableTool,
  ToolDefinition,
  ToolInput,
} from "./types.js";

export class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolError";
  }
}

function toJsonSafe(value: unknown): JsonValue {
  if (value === null || value === undefined) return null;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return value.toString("base64");
  if (Array.isArray(value)) return value.map(toJsonSafe);
  if (typeof value === "object") {
    const out: JsonObject = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === "__proto__" || k === "constructor" || k === "prototype") {
        continue;
      }
      Reflect.set(out, k, toJsonSafe(v));
    }
    return out;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  return String(value);
}

export function defineTool<
  TInput extends StandardSchemaWithJSON,
  TResult extends JsonValue | void = JsonObject,
>(definition: ToolDefinition<TInput, TResult>): RegisterableTool {
  return definition;
}

function buildToolCallback<
  TInput extends StandardSchemaWithJSON,
  TResult extends JsonValue | void = JsonValue,
>(definition: ToolDefinition<TInput, TResult>) {
  const handler = definition.handler;

  return async function onCall(args: ToolInput<TInput>, _ctx: unknown) {
    try {
      const result = await handler(args);
      const hasOutputSchema = definition.outputSchema !== undefined;

      if (hasOutputSchema) {
        if (result == null) {
          throw new ToolError("Tool handler returned no result.");
        }
        const structured = toJsonSafe(result) as JsonObject;
        const text = JSON.stringify(structured, null, 2);
        return {
          content: [{ type: "text", text }],
          structuredContent: structured,
        };
      }

      const text =
        result == null
          ? "{}"
          : typeof result === "string"
            ? result
            : JSON.stringify(toJsonSafe(result), null, 2);
      return { content: [{ type: "text", text }] };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        isError: true,
        content: [{ type: "text", text: message }],
      };
    }
  };
}

/** Register a {@link defineTool} definition on any SDK v2 {@link SdkMcpServer}. */
export function registerTool<
  TInput extends StandardSchemaWithJSON,
  TResult extends JsonValue | void = JsonValue,
>(server: SdkMcpServer, definition: ToolDefinition<TInput, TResult>): void {
  const config = {
    title: definition.name,
    description: definition.description,
    inputSchema: definition.inputSchema,
    ...(definition.outputSchema !== undefined ? { outputSchema: definition.outputSchema } : {}),
  };

  server.registerTool(definition.name, config, buildToolCallback(definition) as ToolCallback<TInput>);
}

type ToolRegistrationTarget = SdkMcpServer | { readonly sdk: SdkMcpServer };

function getSdkServer(target: ToolRegistrationTarget): SdkMcpServer {
  return "sdk" in target ? target.sdk : target;
}

/** Register multiple tools on an {@link SdkMcpServer} or {@link McpApp} (via `.sdk`). */
export function registerTools(
  target: ToolRegistrationTarget,
  tools: readonly RegisterableTool[],
): void {
  const sdk = getSdkServer(target);

  for (const tool of tools) {
    registerTool(sdk, tool);
  }
}
