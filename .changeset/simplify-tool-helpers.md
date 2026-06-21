---
"@achmadya-dev/mcp-core": minor
---

Remove exported `text` and `call` tool result helpers. Use `ok()` for plain text and JSON success; keep `fail()`, `content()`, and `isCalled()` for errors, multi-block results, and type checks.
