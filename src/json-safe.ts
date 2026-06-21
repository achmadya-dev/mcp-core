import type { JsonObject, JsonValue } from "./types.js";

/**
 * Deep-convert a value into JSON-serializable data before tool responses.
 *
 * Handles types `JSON.stringify` cannot encode: `Date` → ISO string, `BigInt` →
 * string, `Buffer` → base64. Skips dangerous prototype keys. Called automatically
 * by {@link defineTool} handlers; export is available for custom serialization.
 *
 * @example
 * ```ts
 * toJsonSafe({ at: new Date(), id: 1n });
 * // { at: "2026-06-20T...", id: "1" }
 * ```
 */
export function toJsonSafe(value: unknown): JsonValue {
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
