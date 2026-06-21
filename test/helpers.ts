import type { StandardSchemaWithJSON } from "@modelcontextprotocol/server";

/** Minimal Standard Schema stub for tests (pass-through validation). */
export function passthroughSchema<T>(): StandardSchemaWithJSON {
  return {
    "~standard": {
      version: 1,
      vendor: "mcp-core-test",
      validate(value: unknown) {
        return { value: value as T };
      },
    },
  } as StandardSchemaWithJSON;
}
