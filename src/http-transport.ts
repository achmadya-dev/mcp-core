import { createMcpExpressApp } from "@modelcontextprotocol/express";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import type { Express } from "express";
import type { Server as HttpServer } from "node:http";
import { envInt } from "./env.js";
import type { HttpTransportOptions, McpServerFactory } from "./types.js";

/**
 * Low-level Streamable HTTP server for MCP.
 *
 * Creates an Express app, handles `POST`/`GET` on the MCP path, and spins up a
 * **new** {@link SdkMcpServer} per request (stateless — no session stickiness).
 * {@link runMcp} with `transport: "http"` calls this internally; use directly
 * only when you need custom HTTP wiring.
 *
 * @example
 * ```ts
 * const app = createMcpApp({ name: "My MCP", version: "1.0.0", tools: [myTool] });
 * const http = await startHttpTransport(app, { port: 3001, path: "/mcp" });
 * // Cursor: { "url": "http://127.0.0.1:3001/mcp" }
 * ```
 */
export async function startHttpTransport(
  app: McpServerFactory,
  options: HttpTransportOptions = {},
): Promise<HttpServer> {
  const mcpPath = options.path ?? "/mcp";
  const port = options.port ?? envInt("PORT", 3001);
  const listenLabel = options.listenLabel ?? "127.0.0.1";
  const logRequests = options.logRequests !== false;
  const registerShutdownHandlers = options.registerShutdownHandlers !== false;
  const expressApp = createMcpExpressApp({ host: "0.0.0.0", allowedHosts: options.allowedHosts });

  if (options.setupRoutes) {
    options.setupRoutes(expressApp);
  }

  expressApp.all(mcpPath, async function (req, res) {
    const method = req.body && req.body.method;
    const sessionId = String(req.headers["mcp-session-id"] || "").slice(0, 8);
    const start = Date.now();

    if (logRequests) {
      console.log(
        `[req] ${req.method} method=${method || "(none)"} session=${sessionId} accept=${req.headers["accept"] || ""}`,
      );
    }

    res.on("finish", function () {
      if (!logRequests) {
        return;
      }

      const elapsed = Date.now() - start;
      console.log(
        `[res] method=${method || "(none)"} session=${sessionId} status=${res.statusCode} ${elapsed}ms`,
      );
    });

    const server = await app.createServer();
    const transport = new NodeStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on("close", function () {
      transport.close().catch(function () {});
      server.close().catch(function () {});
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("MCP error:", error);

      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  const httpServer = expressApp.listen(port, function () {
    console.log(`MCP server listening on http://${listenLabel}:${port}${mcpPath}`);
  });

  if (registerShutdownHandlers) {
    const shutdown = function () {
      console.log("\nShutting down...");
      httpServer.close(function () {
        process.exit(0);
      });
      setTimeout(function () {
        process.exit(0);
      }, 1000).unref();
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }

  return httpServer;
}
