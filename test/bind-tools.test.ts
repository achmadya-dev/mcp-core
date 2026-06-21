import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { McpServer as SdkMcpServer } from "@modelcontextprotocol/server";
import { bindTools } from "../src/bind-tools.js";
import { fail, ok } from "../src/tool-result.js";
import { defineTool, ToolError } from "../src/tools.js";
import { passthroughSchema } from "./helpers.js";

type ToolCallback = (args: unknown, ctx: unknown) => Promise<unknown>;

function captureTool(tools: Parameters<typeof bindTools>[1]): ToolCallback {
  let callback: ToolCallback | undefined;
  const server = {
    registerTool(_name: string, _config: unknown, cb: ToolCallback) {
      callback = cb;
    },
  } as unknown as SdkMcpServer;

  bindTools(server, tools);
  assert.ok(callback, "expected registerTool callback");
  return callback!;
}

describe("bindTools", () => {
  it("wraps plain JSON as ok", async () => {
    const cb = captureTool([
      defineTool({
        name: "t",
        description: "test",
        inputSchema: passthroughSchema<Record<string, never>>(),
        handler: async () => ({ ok: true }),
      }),
    ]);

    const result = (await cb({}, {})) as ReturnType<typeof ok>;
    assert.deepEqual(result.structuredContent, { ok: true });
  });

  it("converts ToolError to fail", async () => {
    const cb = captureTool([
      defineTool({
        name: "t",
        description: "test",
        inputSchema: passthroughSchema<Record<string, never>>(),
        handler: async () => {
          throw new ToolError("nope");
        },
      }),
    ]);

    const result = (await cb({}, {})) as ReturnType<typeof fail>;
    assert.equal(result.isError, true);
    assert.equal((result.content[0] as { text: string }).text, "nope");
  });

  it("passes through CallToolResult from handler", async () => {
    const cb = captureTool([
      defineTool({
        name: "t",
        description: "test",
        inputSchema: passthroughSchema<Record<string, never>>(),
        handler: async () => fail("expected"),
      }),
    ]);

    const result = (await cb({}, {})) as ReturnType<typeof fail>;
    assert.equal(result.isError, true);
    assert.equal((result.content[0] as { text: string }).text, "expected");
  });
});
