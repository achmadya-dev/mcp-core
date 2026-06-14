# @achmadya-dev/mcp-core

Shared MCP SDK wrapper for `@achmadya-dev` servers: stdio transport, tool registration, JSON-safe responses, and env helpers.

Built on **MCP TypeScript SDK v2** (`@modelcontextprotocol/server`). Tool schemas use [Standard Schema](https://standardschema.dev/) — pick any compatible library in your package.

## Install

```bash
pnpm add @achmadya-dev/mcp-core
# plus a Standard Schema library in your MCP package, e.g. zod, valibot, arktype, …
```

Installed automatically as a dependency of `@achmadya-dev/mcp-*-query` servers.

## Usage

Pass a Standard Schema object to `inputSchema` / `outputSchema`. Examples below use the same tool shape; only the schema library differs.

### Zod

```bash
pnpm add zod
```

```typescript
import * as z from "zod";
import { defineTool, startMcpServer } from "@achmadya-dev/mcp-core";

const myTool = defineTool({
  name: "my_tool",
  description: "Does something",
  inputSchema: z.object({
    name: z.string().describe("Item name"),
  }),
  outputSchema: z.object({ ok: z.boolean() }),
  handler: async ({ name }) => ({ ok: true }),
});

await startMcpServer({ name: "My MCP", version: "1.0.0", tools: [myTool] });
```

### Valibot

```bash
pnpm add valibot @valibot/to-json-schema
```

```typescript
import * as v from "valibot";
import { toStandardJsonSchema } from "@valibot/to-json-schema";
import { defineTool, startMcpServer } from "@achmadya-dev/mcp-core";

const myTool = defineTool({
  name: "my_tool",
  description: "Does something",
  inputSchema: toStandardJsonSchema(
    v.object({ name: v.pipe(v.string(), v.description("Item name")) })
  ),
  outputSchema: toStandardJsonSchema(v.object({ ok: v.boolean() })),
  handler: async ({ name }) => ({ ok: true }),
});

await startMcpServer({ name: "My MCP", version: "1.0.0", tools: [myTool] });
```

### Other (ArkType, JSON Schema, …)

**ArkType** — Standard Schema native:

```bash
pnpm add arktype
```

```typescript
import { type } from "arktype";
import { defineTool, startMcpServer } from "@achmadya-dev/mcp-core";

defineTool({
  name: "my_tool",
  description: "Does something",
  inputSchema: type({ name: "string" }),
  outputSchema: type({ ok: "boolean" }),
  handler: async ({ name }) => ({ ok: true }),
});
```

**Raw JSON Schema** — via MCP SDK adapter:

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

**Remote prerequisites:** GitHub secret `NPM_TOKEN` (npm automation token with bypass 2FA for `@achmadya-dev`).
