import type { McpTransport } from "./types.js";

/**
 * Parse a boolean environment variable.
 *
 * Truthy values (case-insensitive): `1`, `true`, `yes`, `on`. Anything else or
 * missing → `defaultVal`.
 *
 * @example
 * ```ts
 * const debug = envBool("DEBUG"); // default false
 * ```
 */
export function envBool(name: string, defaultVal = false): boolean {
  const v = Reflect.get(process.env, name);
  if (v === undefined) return defaultVal;
  return ["1", "true", "yes", "on"].includes(v.trim().toLowerCase());
}

/**
 * Parse an integer environment variable with a floor.
 *
 * Non-numeric values or values below `min` return `defaultVal`. Used internally
 * for `PORT` in HTTP transport.
 *
 * @example
 * ```ts
 * const port = envInt("PORT", 3001); // PORT=abc → 3001
 * ```
 */
export function envInt(name: string, defaultVal: number, min = 1): number {
  const raw = Reflect.get(process.env, name);
  if (raw === undefined) return defaultVal;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) || n < min ? defaultVal : n;
}

/**
 * Read a trimmed string from the environment.
 *
 * Empty or whitespace-only values fall back to `defaultVal`.
 *
 * @example
 * ```ts
 * const host = envStr("DB_HOST", "localhost");
 * ```
 */
export function envStr(name: string, defaultVal = ""): string {
  const raw = Reflect.get(process.env, name);
  if (raw === undefined) return defaultVal;
  const v = raw.trim();
  return v || defaultVal;
}

/**
 * Resolve MCP transport mode.
 *
 * An explicit argument (from {@link runMcp} options) always wins. Otherwise reads
 * env `TRANSPORT` — only `"http"` selects HTTP; anything else → `"stdio"`.
 *
 * @example
 * ```ts
 * envTrans();              // TRANSPORT=http → "http"
 * envTrans("stdio");       // always "stdio"
 * ```
 */
export function envTrans(explicit?: McpTransport): McpTransport {
  if (explicit) return explicit;
  const raw = envStr("TRANSPORT", "stdio").toLowerCase();
  return raw === "http" ? "http" : "stdio";
}
