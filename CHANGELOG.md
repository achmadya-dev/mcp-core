# @achmadya-dev/mcp-core

## 0.5.0

### Minor Changes

- Unify stdio and Streamable HTTP transport behind `runMcp()`. **Breaking:** remove `startMcpServer`, `startStreamableHttpMcp`, and `Server`; replace with `runMcp`, `createMcpApp`, and `McpApp`. Rename `ServerConfig` → `McpAppConfig`, `StreamableHttpMcpOptions` → `HttpTransportOptions`. Add `TRANSPORT` / `PORT` env support, `setup` hook for resources/prompts/MCP Apps, and `@achmadya-dev/mcp-core/ext-apps` subpath. Rename `registerToolOnServer` → `registerTool`.

## 0.5.0

### Minor Changes

- **Breaking:** Unify stdio and HTTP transport behind `runMcp()`.
- **Breaking:** Replace `Server` with `McpApp` and `createMcpApp()`.
- **Breaking:** Remove `startMcpServer()` and `startStreamableHttpMcp()` — use `runMcp({ transport: "stdio" | "http" })` instead.
- **Breaking:** Rename `ServerConfig` → `McpAppConfig`, `StreamableHttpMcpOptions` → `HttpTransportOptions`.
- `TRANSPORT` and `PORT` env support (read internally by `runMcp`).
- Add `setup` hook on `runMcp` / `createMcpApp` for resources, prompts, and MCP Apps registration.
- Add `@achmadya-dev/mcp-core/ext-apps` subpath (`registerAppResource`, `registerAppTool`).
- `createServer()` is now async (runs `setup` before returning).

### Migration

```typescript
// 0.4.x
await startMcpServer({ name, version, tools });

// 0.5.x
await runMcp({ name, version, tools });
```

```typescript
// 0.4.x HTTP
await startStreamableHttpMcp({
  createMcpServer: () => {
    /* ... */
  },
});

// 0.5.x HTTP
await runMcp({ name, version, tools, transport: "http", http: { port: 3001 } });
```

## 0.4.0

### Minor Changes

- Add `registerTools()` and `registerTool()` to register `defineTool` definitions on any SDK v2 server.
- Add `Server.sdk` getter for the underlying `@modelcontextprotocol/server` instance.
- Add `startStreamableHttpMcp()` for stateless Streamable HTTP transport (SDK v2).

## 0.3.3

### Patch Changes

- Bundle `@cfworker/json-schema` as a direct dependency so MCP server consumers do not need to install it themselves.

## 0.3.1

### Patch Changes

- Update README with Zod, Valibot, and other Standard Schema examples.

## 0.3.0

### Minor Changes

- Migrate to MCP TypeScript SDK v2 (`@modelcontextprotocol/server`).
- Remove `schema` / `safeParse` exports; consumers use Zod (or any Standard Schema library) directly.
- Tool `inputSchema` / `outputSchema` must be Standard Schema objects (e.g. `z.object({ ... })`).

## 0.2.0

### Minor Changes

- d251c3c: Add schema abstraction (`schema`, `safeParse`) so consumers no longer import Zod directly. `defineTool` returns `RegisterableTool` for portable declaration emit.
