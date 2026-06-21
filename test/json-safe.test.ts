import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toJsonSafe } from "../src/json-safe.js";

describe("toJsonSafe", () => {
  it("converts Date and BigInt", () => {
    const date = new Date("2026-06-20T00:00:00.000Z");
    assert.deepEqual(toJsonSafe({ at: date, id: 1n }), {
      at: "2026-06-20T00:00:00.000Z",
      id: "1",
    });
  });

  it("skips prototype pollution keys", () => {
    const input = Object.assign(Object.create(null), {
      ok: true,
      __proto__: { polluted: true },
    });
    assert.deepEqual(toJsonSafe(input), { ok: true });
  });

  it("maps arrays recursively", () => {
    assert.deepEqual(toJsonSafe([1n, "a"]), ["1", "a"]);
  });
});
