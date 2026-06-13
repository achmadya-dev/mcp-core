# @achmadya-dev/mcp-core

Shared MCP SDK wrapper for `@achmadya-dev` servers: stdio transport, tool registration, JSON-safe responses, and env helpers.

## Install

```bash
pnpm add @achmadya-dev/mcp-core
```

Installed automatically as a dependency of `@achmadya-dev/mcp-*-query` servers.

## Usage

```typescript
import { defineTool, schema, startMcpServer, envStr, type ToolDefinition } from "@achmadya-dev/mcp-core";

const myTool = defineTool({
  name: "my_tool",
  description: "Does something",
  inputSchema: {
    name: schema.string().describe("Item name"),
  },
  outputSchema: {
    ok: schema.boolean(),
  },
  handler: async (args) => ({ ok: true }),
});

await startMcpServer({
  name: "My MCP",
  version: "1.0.0",
  tools: [myTool],
});
```

## Exports

- `Server`, `defineTool`, `ToolError`, `startMcpServer`
- `envStr`, `envInt`, `envBool`
- `schema`, `safeParse` — validation abstraction (Zod-backed today; consumers do not import Zod)
- Types: `Schema`, `InferSchema`, `RawShape`, `ParseResult`, `ToolDefinition`, `JsonValue`, `RegisterableTool`, `ServerConfig`, …

SQL schemas, query validation, and database drivers stay in each `@achmadya-dev/mcp-*-query` package.

## Release

Uses [Changesets](https://github.com/changesets/changesets) — same flow as [`achmadya-dev/mcp`](https://github.com/achmadya-dev/mcp).

1. Add a changeset when you ship user-facing changes:

   ```bash
   pnpm changeset
   ```

2. Push to `main`. GitHub Actions opens a **Version packages** PR (version bump + `CHANGELOG.md`).

3. Merge that PR. Next push to `main` publishes to npm (`@achmadya-dev/mcp-core`).

**Remote prerequisites:** GitHub secret `NPM_TOKEN` (npm automation token with publish access to `@achmadya-dev`).

