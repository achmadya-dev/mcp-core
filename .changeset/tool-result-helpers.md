---
"@achmadya-dev/mcp-core": minor
---

Add tool result helpers (`ok`, `fail`, `text`, `content`, `call`, `isCalled`) and `CallToolResult` type export. Remove exported `registerTool` / `registerTools` — register standard tools via the `tools` array; use `setup(server)` with `server.registerTool` for SDK-native tools. Add unit tests and architecture docs.
