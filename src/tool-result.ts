/**
 * Helpers to build MCP {@link CallToolResult} values from tool handlers.
 *
 * Every tool call must eventually produce a `CallToolResult` with a `content` array.
 * With {@link defineTool}, plain JSON returns are auto-wrapped — use these helpers when
 * you want explicit control (errors, plain text, images, or mixed helper return types).
 */
import type { CallToolResult, ContentBlock } from "@modelcontextprotocol/server";
import type { JsonObject, JsonValue } from "./types.js";
import { toJsonSafe } from "./json-safe.js";

export type { CallToolResult };

/**
 * Type guard: checks whether a value is already a complete MCP tool result.
 *
 * Use when an internal helper may return either plain data or a result from
 * {@link fail} / {@link ok} / {@link content} — avoid wrapping twice.
 *
 * @example
 * ```ts
 * const result = await runQuery(sql);
 * if (isCalled(result)) return result;
 * return ok(result);
 * ```
 */
export function isCalled(value: unknown): value is CallToolResult {
  if (value == null || typeof value !== "object") {
    return false;
  }
  return "content" in value && Array.isArray((value as CallToolResult).content);
}

/**
 * Build a successful tool result from JSON-serializable data.
 *
 * By default, object values are sent twice: as formatted JSON text (for the model to read)
 * and as `structuredContent` (for MCP clients that consume typed output). Pass
 * `{ structured: false }` for strings or when you only need the text block.
 *
 * @example
 * ```ts
 * return ok({ rows: data, count: data.length });
 * return ok("Migration applied.");
 * return ok("plain string", { structured: false });
 * ```
 */
export function ok(data: JsonValue, options?: { structured?: boolean }): CallToolResult {
  const structured = options?.structured !== false;
  const safe = toJsonSafe(data);
  if (structured && safe !== null && typeof safe === "object" && !Array.isArray(safe)) {
    return {
      content: [{ type: "text", text: JSON.stringify(safe, null, 2) }],
      structuredContent: safe as JsonObject,
    };
  }
  return {
    content: [
      {
        type: "text",
        text: typeof safe === "string" ? safe : JSON.stringify(safe, null, 2),
      },
    ],
  };
}

/**
 * Build a failed tool result. Sets `isError: true` so MCP clients treat it as an error.
 *
 * Accepts a string, `Error`, or unknown value (unknown falls back to `"Unknown error"`).
 * Equivalent to `throw new ToolError(msg)` inside a {@link defineTool} handler — both
 * end up as `{ isError: true, content: [...] }`. Prefer `return fail(...)` when the
 * error is expected; use `throw` when unwinding nested logic.
 *
 * @example
 * ```ts
 * if (!user) return fail("User not found");
 * return fail(new Error("Connection refused"));
 * throw new ToolError("..."); // also works — caught and converted to fail()
 * ```
 */
export function fail(error: string | Error | unknown): CallToolResult {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown error";
  return {
    isError: true,
    content: [{ type: "text", text: message }],
  };
}

/**
 * Build a result from one or more MCP content blocks.
 *
 * Use when a single text string is not enough — e.g. a caption plus an image,
 * or multiple text sections. Optional `structured` attaches metadata; `isError: true`
 * marks the whole result as failed (similar to {@link fail} but with custom blocks).
 *
 * @example
 * ```ts
 * return content(
 *   [
 *     { type: "text", text: "Screenshot:" },
 *     { type: "image", data: base64, mimeType: "image/png" },
 *   ],
 *   { structured: { capturedAt: new Date().toISOString() } },
 * );
 *
 * return content([{ type: "text", text: "Invalid input" }], { isError: true });
 * ```
 */
export function content(
  blocks: ContentBlock[],
  options?: { structured?: JsonObject; isError?: boolean },
): CallToolResult {
  return {
    ...(options?.isError ? { isError: true } : {}),
    content: blocks,
    ...(options?.structured !== undefined ? { structuredContent: options.structured } : {}),
  };
}
