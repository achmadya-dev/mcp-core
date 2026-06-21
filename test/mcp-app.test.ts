import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isHealthCheckActive } from "../src/mcp-app.js";

describe("isHealthCheckActive", () => {
  it("returns true when healthCheck succeeds", async () => {
    const active = await isHealthCheckActive(async () => {}, "test");
    assert.equal(active, true);
  });

  it("returns false when healthCheck fails", async () => {
    const active = await isHealthCheckActive(
      async () => {
        throw new Error("connection refused");
      },
      "test",
    );
    assert.equal(active, false);
  });
});
