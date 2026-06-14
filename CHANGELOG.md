# @achmadya-dev/mcp-core

## 0.3.0

### Minor Changes

- Migrate to MCP TypeScript SDK v2 (`@modelcontextprotocol/server`).
- Remove `schema` / `safeParse` exports; consumers use Zod (or any Standard Schema library) directly.
- Tool `inputSchema` / `outputSchema` must be Standard Schema objects (e.g. `z.object({ ... })`).

## 0.2.0

### Minor Changes

- d251c3c: Add schema abstraction (`schema`, `safeParse`) so consumers no longer import Zod directly. `defineTool` returns `RegisterableTool` for portable declaration emit.
