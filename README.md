# @achmadya-dev/mcp-core

Shared MCP SDK wrapper for `@achmadya-dev` servers: stdio transport, tool registration, JSON-safe responses, and env helpers.

Built on **MCP TypeScript SDK v2** (`@modelcontextprotocol/server`). Tool schemas use [Standard Schema](https://standardschema.dev/) — Zod v4 works natively with MCP.

## Install

```bash
pnpm add @achmadya-dev/mcp-core zod
```

Installed automatically as a dependency of `@achmadya-dev/mcp-*-query` servers.

## Usage

Zod v4 implements Standard Schema natively — pass `z.object(...)` directly to `inputSchema` / `outputSchema`:

```typescript
import * as z from "zod";
import { defineTool, startMcpServer, envStr, type ToolDefinition } from "@achmadya-dev/mcp-core";

const myTool = defineTool({
  name: "my_tool",
  description: "Does something",
  inputSchema: z.object({
    name: z.string().describe("Item name"),
  }),
  outputSchema: z.object({
    ok: z.boolean(),
  }),
  handler: async ({ name }) => ({ ok: true }),
});

await startMcpServer({
  name: "My MCP",
  version: "1.0.0",
  tools: [myTool],
});
```

Tools with no parameters:

```typescript
defineTool({
  name: "ping",
  description: "Health check",
  inputSchema: z.object({}),
  handler: async () => ({ status: "ok" }),
});
```

## Exports

- `Server`, `defineTool`, `ToolError`, `startMcpServer`
- `envStr`, `envInt`, `envBool`
- Types: `ToolDefinition`, `ToolInput`, `JsonValue`, `RegisterableTool`, `ServerConfig`, `StandardSchemaWithJSON`, …

Schema builders and runtime validation stay in each `@achmadya-dev/mcp-*` package.

## Release

Uses [Changesets](https://github.com/changesets/changesets) — same flow as [`achmadya-dev/mcp`](https://github.com/achmadya-dev/mcp).

1. Add a changeset when you ship user-facing changes:

   ```bash
   pnpm changeset
   ```

2. Push to `main`. GitHub Actions opens a **Version packages** PR (version bump + `CHANGELOG.md`).

3. Merge that PR. Next push to `main` publishes to npm (`@achmadya-dev/mcp-core`).

**Remote prerequisites:** GitHub secret `NPM_TOKEN` (npm automation token with publish access to `@achmadya-dev`).
