# @achmadya-dev/mcp-core

Shared MCP SDK wrapper for `@achmadya-dev` servers: stdio and Streamable HTTP transport, tool registration, JSON-safe responses, and env helpers.

Built on **MCP TypeScript SDK v2** (`@modelcontextprotocol/server`). Tool schemas use [Standard Schema](https://standardschema.dev/) — pick any compatible library in your package.

## Install

```bash
pnpm add @achmadya-dev/mcp-core
# plus a Standard Schema library in your MCP package, e.g. zod, valibot, arktype, …
```

Installed automatically as a dependency of `@achmadya-dev/mcp-*-query` servers.

## Quick start (stdio)

Pass a Standard Schema object to `inputSchema` / `outputSchema`. Examples below use Zod; other libraries work the same way.

```bash
pnpm add zod
```

```typescript
import * as z from "zod";
import { defineTool, runMcp } from "@achmadya-dev/mcp-core";

const myTool = defineTool({
  name: "my_tool",
  description: "Does something",
  inputSchema: z.object({
    name: z.string().describe("Item name"),
  }),
  outputSchema: z.object({ ok: z.boolean() }),
  handler: async ({ name }) => ({ ok: true }),
});

await runMcp({ name: "My MCP", version: "1.0.0", tools: [myTool] });
```

Configure in Cursor (stdio — client spawns the process):

```json
{
  "mcpServers": {
    "my-mcp": {
      "command": "npx",
      "args": ["-y", "@achmadya-dev/mcp-my-service"]
    }
  }
}
```

## Architecture

One `runMcp()` call = one MCP instance (one process, one transport).

```mermaid
flowchart TB
  subgraph runMcp["runMcp(options)"]
    tools["tools: defineTool[]"]
    setup["setup(server)"]
    http["http.setupRoutes(app)"]
  end

  tools --> bindTools["bindTools → server.registerTool + handler wrap"]
  setup --> sdk["SDK native: MCP Apps, resources, custom _meta"]
  http --> express["Express routes: /health, /api/…"]

  bindTools --> mcp["MCP protocol /mcp"]
  sdk --> mcp

  transport{{"transport?"}}
  transport -->|stdio| pipe["stdin/stdout — Cursor spawns process"]
  transport -->|http| port["HTTP :PORT/mcp — remote + MCP Apps"]
```

| Hook | Use for |
|------|---------|
| `tools` | Standard tools from `defineTool` (auto-wrap JSON, `ToolError` → `fail`) |
| `setup(server)` | SDK-native MCP features (`registerAppTool`, resources, custom `_meta`) |
| `http.setupRoutes(app)` | Extra HTTP endpoints on the same port (health, webhooks) |

Need **both stdio and HTTP**? Run **two separate instances** (two processes) — not one `runMcp` with dual transport.

## HTTP transport

Same tools and config — set `transport: "http"` or env `TRANSPORT=http`:

```typescript
await runMcp({
  name: "My MCP",
  version: "1.0.0",
  tools: [myTool],
  transport: "http",
  http: {
    port: 3001,
    path: "/mcp",
    setupRoutes: (app) => {
      app.get("/health", (_req, res) => res.json({ ok: true }));
    },
  },
});
```

Or rely on env (default port `3001` via `PORT`):

```bash
TRANSPORT=http PORT=3001 node dist/index.js
```

Configure in Cursor (remote HTTP):

```json
{
  "mcpServers": {
    "my-mcp": {
      "url": "http://127.0.0.1:3001/mcp"
    }
  }
}
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `TRANSPORT` | `stdio` | `stdio` or `http` when `runMcp` has no explicit `transport` |
| `PORT` | `3001` | HTTP listen port (when `transport=http`) |

`runMcp` reads `TRANSPORT` and `PORT` internally when not set in options. For tool-specific config in your package, use `envStr`, `envInt`, `envBool`, `envTrans`.

## Schema libraries

### Valibot

```bash
pnpm add valibot @valibot/to-json-schema
```

```typescript
import * as v from "valibot";
import { toStandardJsonSchema } from "@valibot/to-json-schema";
import { defineTool, runMcp } from "@achmadya-dev/mcp-core";

const myTool = defineTool({
  name: "my_tool",
  description: "Does something",
  inputSchema: toStandardJsonSchema(
    v.object({ name: v.pipe(v.string(), v.description("Item name")) })
  ),
  outputSchema: toStandardJsonSchema(v.object({ ok: v.boolean() })),
  handler: async ({ name }) => ({ ok: true }),
});

await runMcp({ name: "My MCP", version: "1.0.0", tools: [myTool] });
```

### ArkType

```bash
pnpm add arktype
```

```typescript
import { type } from "arktype";
import { defineTool } from "@achmadya-dev/mcp-core";

defineTool({
  name: "my_tool",
  description: "Does something",
  inputSchema: type({ name: "string" }),
  outputSchema: type({ ok: "boolean" }),
  handler: async ({ name }) => ({ ok: true }),
});
```

### Raw JSON Schema

```typescript
import { fromJsonSchema } from "@modelcontextprotocol/server";
import { defineTool } from "@achmadya-dev/mcp-core";

defineTool({
  name: "my_tool",
  description: "Does something",
  inputSchema: fromJsonSchema({
    type: "object",
    properties: { name: { type: "string", description: "Item name" } },
    required: ["name"],
  }),
  handler: async ({ name }) => ({ ok: true }),
});
```

Tools with no parameters: use an empty object schema from your library (e.g. `z.object({})`, `toStandardJsonSchema(v.object({}))`, `type({})`).

## Advanced: resources, prompts, MCP Apps

Use `setup` to register SDK features beyond tools — parameter `server` is already typed via `McpSetupHook`, no SDK import needed for typical cases.

### Resources & prompts

```typescript
import * as z from "zod";
import { defineTool, runMcp } from "@achmadya-dev/mcp-core";

await runMcp({
  name: "My MCP",
  version: "1.0.0",
  tools: [myTool],
  setup(server) {
    server.registerResource(
      "config",
      "config://app",
      { title: "App Config", mimeType: "application/json" },
      async (uri) => ({
        contents: [{ uri: uri.href, text: JSON.stringify({ ok: true }) }],
      }),
    );

    server.registerPrompt(
      "review",
      {
        title: "Code Review",
        argsSchema: z.object({ code: z.string() }),
      },
      ({ code }) => ({
        messages: [{ role: "user", content: { type: "text", text: `Review:\n${code}` } }],
      }),
    );
  },
});
```

`createMcpApp` + `await app.createServer()` works the same way for manual SDK wiring.

## Tool results

MCP tools respond with a `CallToolResult` (`content` array + optional `structuredContent` / `isError`).
With `defineTool`, return plain JSON (auto-wrapped), the helpers below, or throw `ToolError` → `fail()`.

### `ok(data)` — success

Object values become formatted JSON text **and** `structuredContent`. Strings become a single text block.

```typescript
import { defineTool, ok } from "@achmadya-dev/mcp-core";

defineTool({
  name: "query",
  description: "Run SQL",
  inputSchema: z.object({ sql: z.string() }),
  handler: async ({ sql }) => {
    const rows = await db.query(sql);
    return ok({ rows, count: rows.length });
  },
});

return ok("Migration applied.");
```

Equivalent to returning `{ rows, count }` directly from the handler (auto-wrapped).

### `fail(msg)` — expected error

Sets `isError: true`. Same outcome as `throw new ToolError(msg)`.

```typescript
import { defineTool, fail } from "@achmadya-dev/mcp-core";

if (!sql.trim()) return fail("SQL is required");
return fail(new Error("Connection refused"));
```

### `content(blocks)` — custom blocks

Multiple content blocks (text, image, …). Optional `structured` metadata or `isError: true`.

```typescript
import { defineTool, content } from "@achmadya-dev/mcp-core";

defineTool({
  name: "screenshot",
  description: "Capture screen",
  inputSchema: z.object({}),
  handler: async () => {
    const base64 = await captureScreen();
    return content(
      [
        { type: "text", text: "Screenshot:" },
        { type: "image", data: base64, mimeType: "image/png" },
      ],
      { structured: { capturedAt: new Date().toISOString() } },
    );
  },
});

return content([{ type: "text", text: "Invalid input" }], { isError: true });
```

| Helper | When to use |
|--------|-------------|
| `ok(data)` | Success — object → JSON + `structuredContent`, string → text |
| `fail(msg)` | Expected error; sets `isError: true` |
| `content(blocks)` | Multiple blocks (text, image, …) |

## Exports

- `runMcp`, `createMcpApp`, `McpApp`
- `defineTool`, `ToolError`
- `ok`, `fail`, `content`, `isCalled` — tool result helpers
- `envStr`, `envInt`, `envBool`, `envTrans`
- `@achmadya-dev/mcp-core/ext-apps` — `registerAppResource`, `registerAppTool`, `RESOURCE_MIME_TYPE` (requires peer `@modelcontextprotocol/ext-apps`)
- Types: `RunMcpOptions`, `McpSetupHook`, `McpTransport`, `HttpTransportOptions`, `McpAppConfig`, …

Schema builders and runtime validation stay in each `@achmadya-dev/mcp-*` package.

## Development

```bash
pnpm install
pnpm run build
pnpm test        # 22 unit tests (also runs on pre-commit)
pnpm changeset   # before shipping user-facing changes
```

## Release

Uses [Changesets](https://github.com/changesets/changesets) — same flow as [`achmadya-dev/mcp`](https://github.com/achmadya-dev/mcp).

1. Add a changeset when you ship user-facing changes:

   ```bash
   pnpm changeset
   ```

2. Push to `main`. GitHub Actions opens a **Version packages** PR (version bump + `CHANGELOG.md`).

3. Merge that PR. Next push to `main` publishes to npm (`@achmadya-dev/mcp-core`).

**Remote prerequisites:** GitHub secret `NPM_TOKEN` (npm automation token with bypass 2FA for `@achmadya-dev`).
