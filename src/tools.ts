import type { StandardSchemaWithJSON } from "@modelcontextprotocol/server";
import type {
  JsonObject,
  JsonValue,
  RegisterableTool,
  ToolDefinition,
} from "./types.js";

/**
 * Error class for expected, user-facing tool failures.
 *
 * Thrown from a {@link defineTool} handler, caught by the built-in wrapper, and
 * converted to {@link fail}. The MCP client sees `isError: true` with your message.
 * Do not use for unexpected bugs — those are also caught, but `return fail()` is
 * clearer for known validation errors.
 *
 * @example
 * ```ts
 * if (!parsed.success) throw new ToolError(parsed.error);
 * ```
 */
export class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolError";
  }
}

/**
 * Declare a typed MCP tool (name, schemas, handler). Identity at runtime — pass
 * the return value to {@link runMcp} via the `tools` array.
 *
 * The handler may return plain JSON (auto-wrapped), {@link CallToolResult} helpers
 * (`ok`, `fail`, …), or throw {@link ToolError}. Input/output types are inferred from
 * your Standard Schema objects (Zod, Valibot, etc.).
 *
 * For SDK-native tools (MCP Apps, custom `_meta`), use `setup` and
 * `server.registerTool` directly instead.
 *
 * @example
 * ```ts
 * const queryTool = defineTool({
 *   name: "query",
 *   description: "Run a read-only SQL query",
 *   inputSchema: z.object({ sql: z.string() }),
 *   outputSchema: z.object({ rows: z.array(z.unknown()) }),
 *   handler: async ({ sql }) => {
 *     const rows = await db.query(sql);
 *     return { rows }; // auto-wrapped as ok()
 *   },
 * });
 *
 * await runMcp({ name: "My MCP", version: "1.0.0", tools: [queryTool] });
 * ```
 */
export function defineTool<
  TInput extends StandardSchemaWithJSON,
  TResult extends JsonValue | void = JsonObject,
>(definition: ToolDefinition<TInput, TResult>): RegisterableTool {
  return definition;
}
