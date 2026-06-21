import {
  McpServer as SdkMcpServer,
  type StandardSchemaWithJSON,
  type ToolCallback,
} from "@modelcontextprotocol/server";
import { toJsonSafe } from "./json-safe.js";
import { fail, isCalled, ok } from "./tool-result.js";
import { ToolError } from "./tools.js";
import type { JsonValue, RegisterableTool } from "./types.js";

/** Wire {@link defineTool} definitions onto an SDK server (used by {@link McpApp.createServer}). */
export function bindTools(server: SdkMcpServer, tools: readonly RegisterableTool[]): void {
  for (const definition of tools) {
    const config = {
      title: definition.name,
      description: definition.description,
      inputSchema: definition.inputSchema,
      ...(definition.outputSchema !== undefined ? { outputSchema: definition.outputSchema } : {}),
    };

    const handler = definition.handler;
    const hasOutputSchema = definition.outputSchema !== undefined;

    server.registerTool(
      definition.name,
      config,
      (async (args: unknown, _ctx: unknown) => {
        try {
          const result = await handler(args as Parameters<typeof handler>[0]);

          if (isCalled(result)) {
            return result;
          }

          if (hasOutputSchema) {
            if (result == null) {
              throw new ToolError("Tool handler returned no result.");
            }
            return ok(toJsonSafe(result) as JsonValue);
          }

          if (result == null) {
            return ok({});
          }

          if (typeof result === "string") {
            return ok(result, { structured: false });
          }

          return ok(toJsonSafe(result) as JsonValue);
        } catch (error) {
          return fail(error);
        }
      }) as ToolCallback<StandardSchemaWithJSON>,
    );
  }
}
