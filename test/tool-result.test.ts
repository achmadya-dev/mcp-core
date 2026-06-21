import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { call, content, fail, isCalled, ok, text } from "../src/tool-result.js";

describe("isCalled", () => {
  it("detects CallToolResult", () => {
    assert.equal(isCalled(ok({ a: 1 })), true);
    assert.equal(isCalled(fail("x")), true);
  });

  it("rejects plain values", () => {
    assert.equal(isCalled({ a: 1 }), false);
    assert.equal(isCalled(null), false);
    assert.equal(isCalled({ content: "not-array" }), false);
  });
});

describe("ok", () => {
  it("wraps objects with structuredContent", () => {
    const result = ok({ rows: [1], count: 1 });
    assert.equal(result.content[0]?.type, "text");
    assert.deepEqual(result.structuredContent, { rows: [1], count: 1 });
  });

  it("skips structuredContent when structured: false", () => {
    const result = ok("hello", { structured: false });
    assert.equal(result.content[0]?.type, "text");
    assert.equal((result.content[0] as { text: string }).text, "hello");
    assert.equal(result.structuredContent, undefined);
  });
});

describe("fail", () => {
  it("sets isError from string", () => {
    const result = fail("bad input");
    assert.equal(result.isError, true);
    assert.equal((result.content[0] as { text: string }).text, "bad input");
  });

  it("extracts message from Error", () => {
    const result = fail(new Error("boom"));
    assert.equal((result.content[0] as { text: string }).text, "boom");
  });
});

describe("text", () => {
  it("returns a single text block", () => {
    const result = text("done");
    assert.deepEqual(result, { content: [{ type: "text", text: "done" }] });
  });
});

describe("content", () => {
  it("passes through blocks and structured metadata", () => {
    const result = content([{ type: "text", text: "a" }], {
      structured: { id: "1" },
    });
    assert.deepEqual(result.content, [{ type: "text", text: "a" }]);
    assert.deepEqual(result.structuredContent, { id: "1" });
  });

  it("supports isError", () => {
    const result = content([{ type: "text", text: "nope" }], { isError: true });
    assert.equal(result.isError, true);
  });
});

describe("call", () => {
  it("passes through CallToolResult", () => {
    const failed = fail("err");
    assert.equal(call(failed), failed);
  });

  it("wraps plain JSON", () => {
    const result = call({ x: 1 });
    assert.deepEqual(result.structuredContent, { x: 1 });
  });

  it("wraps null as empty object", () => {
    const result = call(null);
    assert.deepEqual(result.structuredContent, {});
  });
});
